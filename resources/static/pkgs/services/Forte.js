// Forte for Encore Karaoke
import {
  Synthetizer,
  Sequencer,
} from "https://cdn.jsdelivr.net/npm/spessasynth_lib@3.27.8/+esm";
import Html from "/libs/html.js"; // Import the Html library
// --- START: SCORING ENGINE ---
import { PitchDetector } from "https://cdn.jsdelivr.net/npm/pitchy@4.1.0/+esm";
// --- END: SCORING ENGINE ---

// --- START: Added for PeerJS Mic ---
// Helper to dynamically load a script
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

let peer = null; // PeerJS instance
const micConnections = new Map(); // To store active mic connections and their audio nodes
// --- END: Added for PeerJS Mic ---

let socket;
let root;

// --- UI Elements managed by the service ---
let toastElement = null;
let toastStyleElement = null;
let toastTimeout = null;
// --- START: Added for Piano Roll ---
let pianoRollContainer = null;
let pianoRollTrack = null;
let pianoRollPlayhead = null;
let pianoRollUserPitch = null;
let lastHitNoteElement = null; // To track the currently highlighted note
let scoreReasonDisplay = null; // --- Added for Score Reasons ---
let scoreReasonTimeout = null; // --- Added for Score Reasons ---
// --- END: Added for Piano Roll ---

// --- Web Audio API State for Karaoke Track Playback ---
let audioContext;
let masterGain;
let masterCompressor; // Added Mastering Compressor
let sourceNode = null;
let animationFrameId = null;

// --- START: Added for Sound Effects ---
let sfxAudioContext;
let sfxGain;
const sfxCache = new Map();
// --- END: Added for Sound Effects ---

// --- Combined Service State ---
const state = {
  scoring: {
    enabled: false,
    micStream: null,
    micSourceNode: null,
    micAnalyser: null,
    vocalGuideAnalyser: null,
    pitchDetector: null,
    guideVocalDelayNode: null,

    // --- NEW: Multi-Criteria Scoring State ---
    finalScore: 0,
    details: {
      pitchAndRhythm: 0, // %
      vibrato: 0, // %
      upband: 0, // %
      downband: 0, // %
    },
    // --- NEW: Latency ---
    measuredLatencyS: 0.15, // A sensible default (150ms) before calibration

    // --- NEW: Internal trackers for the criteria ---
    // Pitch & Rhythm
    totalScorableNotes: 0,
    notesHit: 0,
    // Vibrato
    vibratoOpportunities: 0,
    vibratoNotesHit: 0,
    // Transitions (Upband/Downband)
    upbandOpportunities: 0,
    upbandsHit: 0,
    downbandOpportunities: 0,
    downbandsHit: 0,
    lastGuidePitch: 0,
    hasScoredCurrentTransition: false,
    hasScoredCurrentNoteStyle: false, // --- Added for Score Reasons ---

    // Real-time state
    pitchHistory: [],
    isVocalGuideNoteActive: false,
    hasHitCurrentNote: false,
    isHoldingNote: false,
    noteHoldStartTime: 0,

    micDevices: [],
    currentMicDeviceId: "default",
  },
  // --- END: SCORING ENGINE ---
  playback: {
    status: "stopped",
    buffer: null,
    synthesizer: null,
    sequencer: null,
    isMidi: false,
    isMultiplexed: false,
    decodedLyrics: [],
    guideNotes: [], // --- Changed for Piano Roll ---
    isAnalyzing: false, // --- Added for Piano Roll ---
    startTime: 0,
    pauseTime: 0,
    devices: [],
    currentDeviceId: "default",
    transpose: 0,
    multiplexPan: -1, // Default pan to left (instrumental)
    leftPannerGain: null,
    rightPannerGain: null,
    volume: 1,
  },
  // --- NEW: Recording Pipeline State ---
  recording: {
    destinationNode: null, // The MediaStreamAudioDestinationNode
    audioStream: null, // The final, exposed MediaStream
    trackDelayNode: null, // The DelayNode for latency-compensating the track
  },
  mic: {
    peerId: null,
    connectedMics: 0,
  },
  ui: {
    pianoRollVisible: true,
  },
};

function createEmptyAudioTrack() {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  const track = dst.stream.getAudioTracks()[0];
  return Object.assign(track, { enabled: false });
}

function dispatchPlaybackUpdate() {
  document.dispatchEvent(
    new CustomEvent("CherryTree.Forte.Playback.Update", {
      detail: pkg.data.getPlaybackState(),
    }),
  );
}

// --- START: SCORING ENGINE ---
// Create reusable buffers for performance.
let guideAnalyserBuffer = null;
let micAnalyserBuffer = null;

// --- NEW SCORING CONSTANTS ---
const GUIDE_CLARITY_THRESHOLD = 0.5;
const MIC_CLARITY_THRESHOLD = 0.85;
const PITCH_HISTORY_LENGTH = 60;
const VIBRATO_HOLD_DURATION_MS = 200;
const VIBRATO_STD_DEV_MIN = 0.4;
const VIBRATO_STD_DEV_MAX = 8.0;
const TRANSITION_ANALYSIS_WINDOW_MS = 100;

// --- Added for Score Reasons ---
function showScoreReason(text, type = "pitch") {
  if (scoreReasonTimeout) clearTimeout(scoreReasonTimeout);
  if (!state.ui.pianoRollVisible) return;
  scoreReasonDisplay
    .classOff("type-pitch", "type-vibrato", "type-transition")
    .classOn(`type-${type}`)
    .text(text)
    .classOn("visible");

  scoreReasonTimeout = setTimeout(() => {
    scoreReasonDisplay.classOff("visible");
  }, 1200);
}

/**
 * Calculates a multi-faceted score based on pitch, rhythm, vibrato, and transitions.
 */
function updateScore() {
  if (
    !state.scoring.enabled ||
    !state.scoring.pitchDetector ||
    !state.scoring.vocalGuideAnalyser ||
    !state.scoring.micAnalyser
  ) {
    return;
  }
  // --- 1. DATA ACQUISITION ---
  const {
    pitchDetector,
    vocalGuideAnalyser: guideAnalyser,
    micAnalyser,
  } = state.scoring;
  if (!guideAnalyserBuffer)
    guideAnalyserBuffer = new Float32Array(guideAnalyser.fftSize);
  if (!micAnalyserBuffer)
    micAnalyserBuffer = new Float32Array(micAnalyser.fftSize);
  guideAnalyser.getFloatTimeDomainData(guideAnalyserBuffer);
  micAnalyser.getFloatTimeDomainData(micAnalyserBuffer);

  const [guidePitch, guideClarity] = pitchDetector.findPitch(
    guideAnalyserBuffer,
    audioContext.sampleRate,
  );
  const [micPitch, micClarity] = pitchDetector.findPitch(
    micAnalyserBuffer,
    audioContext.sampleRate,
  );

  state.scoring.pitchHistory.push({
    pitch: micPitch,
    clarity: micClarity,
    time: performance.now(),
  });
  if (state.scoring.pitchHistory.length > PITCH_HISTORY_LENGTH)
    state.scoring.pitchHistory.shift();

  // --- 2. GUIDE NOTE STATE MACHINE & OPPORTUNITY TRACKING ---
  const wasGuideNoteActive = state.scoring.isVocalGuideNoteActive;
  const isGuideNoteActive = guideClarity >= GUIDE_CLARITY_THRESHOLD;
  state.scoring.isVocalGuideNoteActive = isGuideNoteActive;

  // Rising edge: A new guide note has just started.
  if (isGuideNoteActive && !wasGuideNoteActive) {
    state.scoring.totalScorableNotes++;
    state.scoring.hasHitCurrentNote = false;
    state.scoring.hasScoredCurrentTransition = false;
    state.scoring.hasScoredCurrentNoteStyle = false; // --- Added for Score Reasons ---

    // Transition opportunity detection
    if (state.scoring.lastGuidePitch > 0) {
      if (guidePitch > state.scoring.lastGuidePitch * 1.05) {
        // More than ~a semitone higher
        state.scoring.upbandOpportunities++;
      } else if (guidePitch < state.scoring.lastGuidePitch * 0.95) {
        // More than ~a semitone lower
        state.scoring.downbandOpportunities++;
      }
    }
  }

  // Falling edge: A guide note has just ended.
  if (!isGuideNoteActive && wasGuideNoteActive) {
    if (state.scoring.isHoldingNote) {
      // If user was singing when the note ended
      const holdDuration = performance.now() - state.scoring.noteHoldStartTime;
      if (holdDuration > VIBRATO_HOLD_DURATION_MS) {
        state.scoring.vibratoOpportunities++;
      }
    }
    state.scoring.isHoldingNote = false;
    state.scoring.lastGuidePitch = guidePitch; // Store the pitch of the note that just ended
  }

  // --- 3. USER SCORING & STYLE ANALYSIS ---
  const isSinging = micClarity > MIC_CLARITY_THRESHOLD && micPitch > 50;
  let isCorrectPitch = false;
  if (isGuideNoteActive && isSinging) {
    let normalizedMicPitch = micPitch;
    while (normalizedMicPitch < guidePitch * 0.75) normalizedMicPitch *= 2;
    while (normalizedMicPitch > guidePitch * 1.5) normalizedMicPitch /= 2;
    const centsDifference = 1200 * Math.log2(normalizedMicPitch / guidePitch);
    // REVISION: Make pitch detection more sensitive
    if (Math.abs(centsDifference) < 35) isCorrectPitch = true;
  }

  if (isCorrectPitch) {
    if (!state.scoring.isHoldingNote) {
      // Just started holding a correct note
      state.scoring.isHoldingNote = true;
      state.scoring.noteHoldStartTime = performance.now();
    }
    if (!state.scoring.hasHitCurrentNote) {
      // First time hitting this note
      state.scoring.notesHit++;
      state.scoring.hasHitCurrentNote = true;
      // --- Added for Score Reasons ---
      if (!state.scoring.hasScoredCurrentNoteStyle) {
        showScoreReason("PERFECT", "pitch");
      }
    }

    // Transition Scoring (only happens once at the start of a note)
    if (
      !state.scoring.hasScoredCurrentTransition &&
      state.scoring.lastGuidePitch > 0
    ) {
      const analysisStartTime =
        performance.now() - TRANSITION_ANALYSIS_WINDOW_MS;
      const recentPitches = state.scoring.pitchHistory
        .filter(
          (p) =>
            p.time >= analysisStartTime && p.clarity > MIC_CLARITY_THRESHOLD,
        )
        .map((p) => p.pitch);

      if (recentPitches.length > 5) {
        const startPitch = recentPitches[0];
        const endPitch = recentPitches[recentPitches.length - 1];
        // Upband hit
        if (
          guidePitch > state.scoring.lastGuidePitch * 1.05 &&
          endPitch > startPitch
        ) {
          state.scoring.upbandsHit++;
          state.scoring.hasScoredCurrentTransition = true;
          // --- Added for Score Reasons ---
          // showScoreReason("UPBAND!", "transition");
          state.scoring.hasScoredCurrentNoteStyle = true;
        }
        // Downband hit
        else if (
          guidePitch < state.scoring.lastGuidePitch * 0.95 &&
          endPitch < startPitch
        ) {
          state.scoring.downbandsHit++;
          state.scoring.hasScoredCurrentTransition = true;
          // --- Added for Score Reasons ---
          // showScoreReason("DOWNBAND!", "transition");
          state.scoring.hasScoredCurrentNoteStyle = true;
        }
      }
    }

    // Vibrato detection
    const holdDuration = performance.now() - state.scoring.noteHoldStartTime;
    if (holdDuration > VIBRATO_HOLD_DURATION_MS) {
      const recentPitches = state.scoring.pitchHistory
        .filter((p) => p.clarity > MIC_CLARITY_THRESHOLD)
        .map((p) => p.pitch);
      if (recentPitches.length > 10) {
        const mean =
          recentPitches.reduce((a, b) => a + b, 0) / recentPitches.length;
        const stdDev = Math.sqrt(
          recentPitches
            .map((x) => Math.pow(x - mean, 2))
            .reduce((a, b) => a + b) / recentPitches.length,
        );
        if (stdDev >= VIBRATO_STD_DEV_MIN && stdDev <= VIBRATO_STD_DEV_MAX) {
          state.scoring.vibratoNotesHit++;
          // Credit opportunity here and stop checking for this note
          state.scoring.vibratoOpportunities++;
          state.scoring.isHoldingNote = false; // Prevents re-triggering
          // --- Added for Score Reasons ---
          if (!state.scoring.hasScoredCurrentNoteStyle) {
            showScoreReason("VIBRATO!", "vibrato");
            state.scoring.hasScoredCurrentNoteStyle = true;
          }
        }
      }
    }
  } else {
    // Not correct pitch
    if (state.scoring.isHoldingNote) {
      // Just fell off a note
      const holdDuration = performance.now() - state.scoring.noteHoldStartTime;
      if (holdDuration > VIBRATO_HOLD_DURATION_MS) {
        state.scoring.vibratoOpportunities++;
      }
    }
    state.scoring.isHoldingNote = false;
  }

  // --- START: Added for Piano Roll ---
  if (
    pianoRollContainer &&
    pianoRollContainer.elm.classList.contains("visible")
  ) {
    const pitchToY = (pitch) => {
      const minMidi = 48; // C3
      const maxMidi = 84; // C6
      const rollHeight = 150; // In pixels, from CSS
      if (!isFinite(pitch) || pitch < minMidi) return rollHeight;
      if (pitch > maxMidi) return 0;
      const pitchRange = maxMidi - minMidi;
      const normalizedPitch = (pitch - minMidi) / pitchRange;
      return rollHeight - normalizedPitch * rollHeight;
    };

    // Update user pitch trace
    const midiMicPitch = 12 * Math.log2(micPitch / 440) + 69;
    if (micClarity > MIC_CLARITY_THRESHOLD && midiMicPitch > 0) {
      pianoRollUserPitch.styleJs({
        top: `${pitchToY(midiMicPitch) - 2}px`,
        opacity: "1",
      });
    } else {
      pianoRollUserPitch.styleJs({ opacity: "0" });
    }

    // Update note highlighting
    const currentTime = pkg.data.getPlaybackState().currentTime;
    const notes = state.playback.guideNotes;
    if (notes) {
      if (lastHitNoteElement) {
        lastHitNoteElement.classOff("hit");
        lastHitNoteElement = null;
      }

      const currentNote = notes.find(
        (n) =>
          currentTime >= n.startTime && currentTime < n.startTime + n.duration,
      );
      if (currentNote && isCorrectPitch) {
        const noteEl = pianoRollTrack.qs(`#forte-note-${currentNote.id}`);
        if (noteEl) {
          noteEl.classOn("hit");
          lastHitNoteElement = noteEl;
        }
      }
    }
  }
  // --- END: Added for Piano Roll ---

  // --- 4. FINAL SCORE COMPOSITION ---
  const s = state.scoring;
  const pitchAndRhythm =
    s.totalScorableNotes > 0 ? (s.notesHit / s.totalScorableNotes) * 100 : 0;
  const vibrato =
    s.vibratoOpportunities > 0
      ? (s.vibratoNotesHit / s.vibratoOpportunities) * 100
      : 0;
  const upband =
    s.upbandOpportunities > 0
      ? (s.upbandsHit / s.upbandOpportunities) * 100
      : 0;
  const downband =
    s.downbandOpportunities > 0
      ? (s.downbandsHit / s.downbandOpportunities) * 100
      : 0;

  // Update state, ensuring scores never dip and are capped at 100
  s.details.pitchAndRhythm = Math.max(
    s.details.pitchAndRhythm,
    Math.min(100, pitchAndRhythm),
  );
  s.details.vibrato = Math.max(s.details.vibrato, Math.min(100, vibrato));
  s.details.upband = Math.max(s.details.upband, Math.min(100, upband));
  s.details.downband = Math.max(s.details.downband, Math.min(100, downband));

  // Final score is a weighted average of the four criteria (25% each)
  s.finalScore =
    (s.details.pitchAndRhythm +
      s.details.vibrato +
      s.details.upband +
      s.details.downband) /
    4;

  // --- 5. DISPATCH UPDATE ---
  document.dispatchEvent(
    new CustomEvent("CherryTree.Forte.Scoring.Update", {
      detail: pkg.data.getScoringState(),
    }),
  );
}
// --- END: SCORING ENGINE ---

function timingLoop() {
  if (state.playback.status !== "playing") {
    animationFrameId = null;
    return;
  }
  const { currentTime, duration } = pkg.data.getPlaybackState();
  document.dispatchEvent(
    new CustomEvent("CherryTree.Forte.Playback.TimeUpdate", {
      detail: { currentTime, duration },
    }),
  );

  // --- START: Added for Piano Roll ---
  if (
    pianoRollContainer &&
    pianoRollContainer.elm.classList.contains("visible")
  ) {
    const PIXELS_PER_SECOND = 150; // Adjust for desired scroll speed
    pianoRollTrack.styleJs({
      transform: `translateX(-${currentTime * PIXELS_PER_SECOND}px)`,
    });
  }
  // --- END: Added for Piano Roll ---

  if (state.scoring.enabled) {
    updateScore();
  }

  if (currentTime >= duration && duration > 0) {
    animationFrameId = null;
    return;
  }
  animationFrameId = requestAnimationFrame(timingLoop);
}

// --- START: Added for Piano Roll ---
/**
 * Renders a batch of notes to the piano roll track.
 * @param {Array<{id: number, pitch: number, startTime: number, duration: number}>} notes An array of note objects.
 */
function renderPianoRollNotes(notes) {
  if (!pianoRollTrack) return;
  const PIXELS_PER_SECOND = 150;
  const pitchToY = (pitch) => {
    const minMidi = 48; // C3
    const maxMidi = 84; // C6
    const rollHeight = 150; // In pixels, from CSS
    if (pitch < minMidi) return rollHeight;
    if (pitch > maxMidi) return 0;
    const pitchRange = maxMidi - minMidi;
    const normalizedPitch = (pitch - minMidi) / pitchRange;
    return rollHeight - normalizedPitch * rollHeight;
  };

  for (const note of notes) {
    new Html("div")
      .class("forte-piano-note")
      .id(`forte-note-${note.id}`)
      .styleJs({
        left: `${note.startTime * PIXELS_PER_SECOND}px`,
        width: `${note.duration * PIXELS_PER_SECOND}px`,
        top: `${pitchToY(note.pitch)}px`,
      })
      .appendTo(pianoRollTrack);
  }
}

/**
 * Starts a non-blocking, incremental analysis of the guide vocal track.
 * @param {AudioBuffer} audioBuffer The decoded audio buffer.
 */
function startIncrementalGuideAnalysis(audioBuffer) {
  console.log("[FORTE SVC] Starting incremental analysis for piano roll...");
  state.playback.isAnalyzing = true;
  const channelData = audioBuffer.getChannelData(1);
  const sampleRate = audioBuffer.sampleRate;
  const detector = PitchDetector.forFloat32Array(2048);
  const minNoteDuration = 0.08;
  const chunkSize = 2048;
  const stepSize = 512;
  let noteIdCounter = state.playback.guideNotes.length;

  let analysisPosition = 0;
  const analysisChunkDurationS = 2; // Process 2 seconds of audio at a time
  const analysisChunkSamples = analysisChunkDurationS * sampleRate;

  // --- FIX START: Persist currentNote across chunks ---
  // This variable holds the note being tracked. It MUST be outside `processChunk`
  // so that its state is remembered between processing intervals.
  let currentNote = null;

  function processChunk() {
    if (!state.playback.isAnalyzing) {
      console.log("[FORTE SVC] Incremental analysis stopped.");
      return;
    }

    const chunkEndPosition = Math.min(
      analysisPosition + analysisChunkSamples,
      channelData.length - chunkSize,
    );
    // REMOVED: `let currentNote = null;` was here, which caused the bug.
    const foundNotes = [];

    for (let i = analysisPosition; i < chunkEndPosition; i += stepSize) {
      const chunk = channelData.slice(i, i + chunkSize);
      const [pitch, clarity] = detector.findPitch(chunk, sampleRate);
      const time = i / sampleRate;
      const midiPitch = 12 * Math.log2(pitch / 440) + 69;
      const isNoteActive =
        clarity > GUIDE_CLARITY_THRESHOLD && pitch > 50 && isFinite(midiPitch);

      if (isNoteActive) {
        if (!currentNote) {
          currentNote = {
            midi: midiPitch,
            startTime: time,
            pitches: [midiPitch],
          };
        } else {
          currentNote.pitches.push(midiPitch);
        }
      } else if (currentNote) {
        const duration = time - currentNote.startTime;
        if (duration > minNoteDuration) {
          const avgPitch =
            currentNote.pitches.reduce((a, b) => a + b, 0) /
            currentNote.pitches.length;
          foundNotes.push({
            id: noteIdCounter++,
            pitch: avgPitch,
            startTime: currentNote.startTime,
            duration: duration,
          });
        }
        currentNote = null;
      }
    }

    // Post-process and render the notes found in this chunk
    if (foundNotes.length > 0) {
      // Simple merge logic for notes spanning chunks
      const lastGlobalNote =
        state.playback.guideNotes[state.playback.guideNotes.length - 1];
      const firstChunkNote = foundNotes[0];
      if (
        lastGlobalNote &&
        firstChunkNote.startTime -
          (lastGlobalNote.startTime + lastGlobalNote.duration) <
          0.05 &&
        Math.abs(firstChunkNote.pitch - lastGlobalNote.pitch) < 1.0
      ) {
        lastGlobalNote.duration =
          firstChunkNote.startTime +
          firstChunkNote.duration -
          lastGlobalNote.startTime;
        const noteEl = pianoRollTrack.qs(`#forte-note-${lastGlobalNote.id}`);
        if (noteEl)
          noteEl.styleJs({
            width: `${lastGlobalNote.duration * 150}px`,
          });
        foundNotes.shift();
      }

      state.playback.guideNotes.push(...foundNotes);
      renderPianoRollNotes(foundNotes);
    }

    analysisPosition = chunkEndPosition;
    if (analysisPosition < channelData.length - chunkSize) {
      setTimeout(processChunk, 10); // Yield to main thread
    } else {
      if (currentNote) {
        const time = (channelData.length - 1) / sampleRate;
        const duration = time - currentNote.startTime;
        if (duration > minNoteDuration) {
          const avgPitch =
            currentNote.pitches.reduce((a, b) => a + b, 0) /
            currentNote.pitches.length;
          const finalNote = {
            id: noteIdCounter++,
            pitch: avgPitch,
            startTime: currentNote.startTime,
            duration: duration,
          };
          state.playback.guideNotes.push(finalNote);
          renderPianoRollNotes([finalNote]); // Render this last note
        }
      }
      // --- FIX END ---
      state.playback.isAnalyzing = false;
      console.log("[FORTE SVC] Incremental analysis complete.");
    }
  }

  setTimeout(processChunk, 10); // Start the process
}
// --- END: Added for Piano Roll ---

const pkg = {
  name: "Forte Sound Engine Service",
  svcName: "ForteSvc",
  type: "svc",
  privs: 0,
  start: async function (Root) {
    console.log("Starting Forte Sound Engine Service for Encore.");
    root = Root;

    // --- Create and inject the Toast UI ---
    toastStyleElement = new Html("style")
      .text(
        `
        .forte-toast {
            position: fixed;
            top: 2rem;
            left: 2rem;
            background: rgba(0,0,0,0.7);
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 0.5rem;
            padding: 0.6rem 1.2rem;
            color: #FFD700;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 700;
            font-size: 1rem;
            letter-spacing: 0.1rem;
            z-index: 200000;
            opacity: 0;
            transform: translateX(-20px);
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
        }
        .forte-toast.visible {
            opacity: 1;
            transform: translateX(0);
        }
        /* --- START: Added for Piano Roll --- */
        .forte-piano-roll-container {
            position: fixed;
            /* REVISION: Repositioned to be higher */
            bottom: 65%;
            left: 0;
            width: 100%;
            height: 150px;
            background: rgba(0, 0, 0, 0.4);
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
            overflow: hidden;
            z-index: 14; /* Below player UI but above BGV */
            opacity: 0;
            transition: opacity 0.5s ease;
            pointer-events: none;
        }
        .forte-piano-roll-container.visible {
            opacity: 1;
        }
        .forte-piano-roll-playhead {
            position: absolute;
            left: 50%;
            top: 0;
            bottom: 0;
            width: 3px;
            background: #FFD700;
            box-shadow: 0 0 10px #FFD700;
            transform: translateX(-50%);
            z-index: 3;
        }
        .forte-piano-roll-track {
            position: absolute;
            top: 0;
            left: 50%; /* Start notes scrolling from the center */
            height: 100%;
            will-change: transform;
            z-index: 1;
        }
        .forte-piano-note {
            position: absolute;
            height: 8px;
            background-color: #89CFF0; /* Encore theme blue */
            border-radius: 4px;
            border: 1px solid rgba(1,1,65,0.8);
            box-sizing: border-box;
            transition: background-color 0.1s linear;
            transform: translateY(-50%); /* Center vertically on pitch line */
        }
        .forte-piano-note.hit {
            background-color: #39FF14; /* Neon green for hit */
            box-shadow: 0 0 8px #39FF14;
        }
        .forte-piano-roll-user-pitch {
            position: absolute;
            left: 45%;
            width: 10%;
            height: 4px;
            background: #f7b733; /* Orange from countdown timer */
            border-radius: 2px;
            box-shadow: 0 0 8px #f7b733;
            z-index: 2;
            opacity: 0;
            transition: top 0.05s linear, opacity 0.1s linear;
            transform: translateY(-50%);
        }
        /* --- END: Added for Piano Roll --- */
        /* --- START: Added for Score Reasons --- */
        .forte-score-reason {
            position: fixed;
            /* REVISION: Repositioned above new piano roll location */
            bottom: calc(65% + 150px);
            left: 50%;
            transform: translate(-50%, 20px); /* Start slightly lower */
            font-family: 'Rajdhani', sans-serif;
            font-size: 2.5rem;
            font-weight: 900;
            letter-spacing: 0.1em;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
            -webkit-text-stroke: 1px #000;
            paint-order: stroke fill;
            z-index: 20;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
        }
        .forte-score-reason.visible {
            opacity: 1;
            transform: translate(-50%, 0); /* Animate upwards to final spot */
        }
        .forte-score-reason.type-pitch { color: #89CFF0; }
        .forte-score-reason.type-vibrato { color: #22c55e; }
        .forte-score-reason.type-transition { color: #f59e0b; }
        /* --- END: Added for Score Reasons --- */
    `,
      )
      .appendTo("head");
    toastElement = new Html("div").classOn("forte-toast").appendTo("body");

    // --- START: Added for Piano Roll ---
    pianoRollContainer = new Html("div")
      .classOn("forte-piano-roll-container")
      .appendTo("body");
    pianoRollTrack = new Html("div")
      .classOn("forte-piano-roll-track")
      .appendTo(pianoRollContainer);
    pianoRollPlayhead = new Html("div")
      .classOn("forte-piano-roll-playhead")
      .appendTo(pianoRollContainer);
    pianoRollUserPitch = new Html("div")
      .classOn("forte-piano-roll-user-pitch")
      .appendTo(pianoRollContainer);
    // --- END: Added for Piano Roll ---
    // --- START: Added for Score Reasons ---
    scoreReasonDisplay = new Html("div")
      .classOn("forte-score-reason")
      .appendTo("body");
    // --- END: Added for Score Reasons ---

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: "interactive",
        sampleRate: 44100, // Standard sample rate
      });
      masterGain = audioContext.createGain();

      masterCompressor = audioContext.createDynamicsCompressor();

      masterCompressor.threshold.setValueAtTime(-18, audioContext.currentTime); // dB: Don't compress quiet parts. -18dB is a good starting point.
      masterCompressor.knee.setValueAtTime(30, audioContext.currentTime); // dB: A soft knee for a more gradual, musical compression.
      masterCompressor.ratio.setValueAtTime(12, audioContext.currentTime); // Ratio: A 12:1 ratio is strong, acting like a soft limiter.
      masterCompressor.attack.setValueAtTime(0.003, audioContext.currentTime); // Seconds: Fast attack to catch peaks quickly.
      masterCompressor.release.setValueAtTime(0.25, audioContext.currentTime); // Seconds: A moderate release to avoid "pumping".

      // Reroute the audio chain: masterGain -> compressor -> destination
      masterGain.connect(masterCompressor);
      masterCompressor.connect(audioContext.destination);

      // --- NEW: Initialize the persistent recording pipeline here ---
      state.recording.destinationNode =
        audioContext.createMediaStreamDestination();
      state.recording.audioStream = state.recording.destinationNode.stream;
      console.log("[FORTE SVC] Recording audio pipeline initialized.");
      // --- END NEW ---

      state.playback.currentDeviceId = audioContext.sinkId || "default";
      console.log("[FORTE SVC] Web Audio API context initialized.");
      pkg.data.getPlaybackDevices();

      // Initialize microphone input for scoring
      await pkg.data.initializeScoringEngine();

      try {
        await audioContext.audioWorklet.addModule(
          "/libs/spessasynth_lib/synthetizer/worklet_processor.min.js",
        );
        const soundFontUrl = "/libs/soundfonts/GeneralUser-GS.sf2";
        const soundFontBuffer = await (await fetch(soundFontUrl)).arrayBuffer();
        state.playback.synthesizer = new Synthetizer(
          masterGain,
          soundFontBuffer,
        );
        console.log("[FORTE SVC] MIDI Synthesizer initialized successfully.");
      } catch (synthError) {
        console.error(
          "[FORTE SVC] FATAL: Could not initialize MIDI Synthesizer.",
          synthError,
        );
        state.playback.synthesizer = null;
      }
    } catch (e) {
      console.error("[FORTE SVC] FATAL: Web Audio API is not supported.", e);
    }

    // --- START: Added for Sound Effects ---
    try {
      sfxAudioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      sfxGain = sfxAudioContext.createGain();
      sfxGain.connect(sfxAudioContext.destination);
      sfxGain.gain.value = state.playback.volume; // Default volume for SFX
      console.log("[FORTE SVC] SFX Audio context initialized.");
    } catch (e) {
      console.error(
        "[FORTE SVC] FATAL: Could not create SFX Audio context.",
        e,
      );
    }
    // --- END: Added for Sound Effects ---

    // --- START: Added for PeerJS Mic ---
    try {
      await loadScript("https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js");
      console.log("[FORTE SVC] PeerJS library loaded.");

      const peerId = await window.desktopIntegration.ipc.invoke(
        "mic-get-peer-id",
      );
      if (!peerId) {
        throw new Error("Could not get a Peer ID from the main process.");
      }
      state.mic.peerId = peerId;

      peer = new Peer(peerId, {
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
        },
      });

      peer.on("open", (id) => {
        console.log(`[FORTE SVC] PeerJS client ready. My ID is: ${id}`);
        document.dispatchEvent(
          new CustomEvent("CherryTree.Forte.Mic.Ready", {
            detail: { peerId: id },
          }),
        );
      });

      peer.on("call", async (call) => {
        const sessionCode = call.metadata?.code;
        console.log(`[FORTE SVC] Incoming mic call with code: ${sessionCode}`);

        if (
          !sessionCode ||
          !(await window.desktopIntegration.ipc.invoke(
            "mic-validate-code",
            sessionCode,
          ))
        ) {
          console.warn(
            `[FORTE SVC] Rejecting incoming call with invalid code.`,
          );
          call.close(); // Reject the call
          return;
        }

        console.log(`[FORTE SVC] Accepting call from Peer ID: ${call.peer}`);
        call.answer(new MediaStream([createEmptyAudioTrack()])); // Answer the call, we don't send any stream back

        call.on("stream", (remoteStream) => {
          console.log(
            `[FORTE SVC] Received microphone stream from ${call.peer}`,
          );
          const a = new Audio();
          a.muted = true;
          a.srcObject = remoteStream;
          a.autoplay = true;

          if (audioContext.state === "suspended") {
            audioContext.resume();
          }
          const micSourceNode =
            audioContext.createMediaStreamSource(remoteStream);
          micSourceNode.connect(masterGain); // Connect mic audio to the main output

          micConnections.set(call.peer, { call, node: micSourceNode });
          state.mic.connectedMics = micConnections.size;
        });

        call.on("close", () => {
          console.log(`[FORTE SVC] Microphone call from ${call.peer} closed.`);
          const connection = micConnections.get(call.peer);
          if (connection) {
            connection.node.disconnect(); // Disconnect the audio node to stop playback
            micConnections.delete(call.peer);
            state.mic.connectedMics = micConnections.size;
          }
        });

        call.on("error", (err) => {
          console.error(
            `[FORTE SVC] PeerJS call error with ${call.peer}:`,
            err,
          );
        });
      });

      peer.on("error", (err) => {
        console.error("[FORTE SVC] PeerJS main error:", err);
      });
    } catch (err) {
      console.error(
        "[FORTE SVC] FATAL: Could not initialize PeerJS for microphone.",
        err,
      );
    }
    // --- END: Added for PeerJS Mic ---
  },

  data: {
    // --- NEW: Public function to access the recording stream ---
    /**
     * Returns the persistent, mixed, and latency-compensated audio stream for recording.
     * @returns {MediaStream | null} The audio stream ready for recording.
     */
    getRecordingAudioStream: () => {
      return state.recording.audioStream;
    },
    // --- END NEW ---

    // --- START: Added for Sound Effects ---
    loadSfx: async (url) => {
      if (!sfxAudioContext) return false;
      if (sfxCache.has(url)) return true; // Already loaded

      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await sfxAudioContext.decodeAudioData(arrayBuffer);
        sfxCache.set(url, audioBuffer);
        return true;
      } catch (e) {
        console.error(`[FORTE SVC] Failed to load SFX: ${url}`, e);
        return false;
      }
    },

    playSfx: async (url) => {
      if (!sfxAudioContext) return;

      if (sfxAudioContext.state === "suspended") {
        await sfxAudioContext.resume();
      }

      let audioBuffer = sfxCache.get(url);
      if (!audioBuffer) {
        console.warn(
          `[FORTE SVC] SFX not preloaded, loading on demand: ${url}`,
        );
        const success = await pkg.data.loadSfx(url);
        if (!success) return;
        audioBuffer = sfxCache.get(url);
      }

      if (audioBuffer) {
        const source = sfxAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(sfxGain);
        source.start(0);
      }
    },
    // --- END: Added for Sound Effects ---

    getPlaybackDevices: async () => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        console.warn("[FORTE SVC] enumerateDevices not supported.");
        return [];
      }
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = allDevices
          .filter((device) => device.kind === "audiooutput")
          .map((device) => ({
            deviceId: device.deviceId,
            label:
              device.label ||
              `Output Device ${device.deviceId.substring(0, 8)}`,
          }));
        state.playback.devices = audioOutputs;
        return audioOutputs;
      } catch (e) {
        console.error("[FORTE SVC] Could not enumerate playback devices:", e);
        return [];
      }
    },

    setPlaybackDevice: async (deviceId) => {
      if (!audioContext || typeof audioContext.setSinkId !== "function") {
        console.error(
          "[FORTE SVC] Audio output switching is not supported by this browser.",
        );
        return false;
      }
      try {
        await audioContext.setSinkId(deviceId);
        state.playback.currentDeviceId = deviceId;
        console.log(`[FORTE SVC] Playback device switched to: ${deviceId}`);
        dispatchPlaybackUpdate();
        return true;
      } catch (e) {
        console.error(
          `[FORTE SVC] Failed to set playback device to ${deviceId}:`,
          e,
        );
        return false;
      }
    },

    togglePianoRollVisibility: async (bool) => {
      state.ui.pianoRollVisible = bool;
      if (bool) {
        if (pianoRollContainer) pianoRollContainer.classOn("visible");
        if (scoreReasonDisplay) scoreReasonDisplay.classOn("visible");
      } else {
        if (pianoRollContainer) pianoRollContainer.classOff("visible");
        if (scoreReasonDisplay) scoreReasonDisplay.classOff("visible");
      }
    },

    loadSoundFont: async (url) => {
      if (!state.playback.synthesizer) {
        console.error(
          "[FORTE SVC] Synthesizer not initialized, cannot load SoundFont.",
        );
        return false;
      }
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        state.playback.synthesizer.loadSoundFont(arrayBuffer);
        console.log(`[FORTE SVC] SoundFont loaded successfully from: ${url}`);
        return true;
      } catch (e) {
        console.error(`[FORTE SVC] Failed to load SoundFont: ${url}`, e);
        return false;
      }
    },

    loadTrack: async (url) => {
      if (!audioContext) return false;
      if (state.playback.status !== "stopped") pkg.data.stopTrack();

      if (state.playback.sequencer) {
        state.playback.sequencer.stop();
        state.playback.sequencer = null;
      }
      state.playback.decodedLyrics = [];
      state.playback.transpose = 0;
      state.playback.isMultiplexed = false;
      state.playback.multiplexPan = -1; // Default pan to left (instrumental)
      state.playback.guideNotes = []; // --- Changed for Piano Roll ---
      state.playback.isAnalyzing = false; // --- Added for Piano Roll ---

      const isMidi =
        url.toLowerCase().endsWith(".mid") ||
        url.toLowerCase().endsWith(".midi") ||
        url.toLowerCase().endsWith(".kar");
      state.playback.isMidi = isMidi;

      if (!isMidi && url.toLowerCase().includes(".multiplexed.")) {
        state.playback.isMultiplexed = true;
        console.log("[FORTE SVC] Multiplexed audio track detected.");
      }

      if (toastElement) {
        toastElement.text(isMidi ? "Classic Karaoke" : "Real Sound");
      }

      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        if (isMidi) {
          if (!state.playback.synthesizer) {
            throw new Error("MIDI Synthesizer is not initialized.");
          }
          state.playback.sequencer = new Sequencer(
            [{ binary: arrayBuffer }],
            state.playback.synthesizer,
          );
          state.playback.sequencer.loop = false;

          state.playback.sequencer.addOnSongEndedEvent(() => {
            if (state.playback.status !== "stopped") {
              pkg.data.stopTrack();
            }
          }, "forte-song-end");

          await new Promise((resolve) => {
            state.playback.sequencer.addOnSongChangeEvent(() => {
              const rawLyrics = state.playback.sequencer.midiData.lyrics;

              if (rawLyrics && rawLyrics.length > 0) {
                const decoder = new TextDecoder();
                state.playback.decodedLyrics = rawLyrics.map((lyricBuffer) =>
                  decoder.decode(lyricBuffer),
                );
                console.log(
                  `[FORTE SVC] Decoded ${state.playback.decodedLyrics.length} lyric events.`,
                );
              }
              resolve();
            }, "forte-loader");
          });

          let displayableLyricIndex = 0;
          state.playback.sequencer.onTextEvent = (messageData, messageType) => {
            if (messageType === 5) {
              const text = new TextDecoder().decode(messageData.buffer);
              const cleanText = text.replace(/[\r\n\/\\]/g, "");
              if (cleanText) {
                document.dispatchEvent(
                  new CustomEvent("CherryTree.Forte.Playback.LyricEvent", {
                    detail: { index: displayableLyricIndex },
                  }),
                );
                displayableLyricIndex++;
              }
            }
          };

          state.playback.buffer = null;
        } else {
          state.playback.buffer = await audioContext.decodeAudioData(
            arrayBuffer,
          );
          // --- START: Changed for Piano Roll ---
          if (state.playback.isMultiplexed) {
            // Don't await. Let it run in the background.
            startIncrementalGuideAnalysis(state.playback.buffer);
          }
          // --- END: Changed for Piano Roll ---
        }

        state.playback.status = "stopped";
        state.playback.pauseTime = 0;
        console.log(
          `[FORTE SVC] Track loaded successfully (${
            isMidi ? "MIDI" : "Audio"
          }): ${url}`,
        );
        dispatchPlaybackUpdate();
        return true;
      } catch (e) {
        console.error(`[FORTE SVC] Failed to load or decode track: ${url}`, e);
        state.playback.buffer = null;
        state.playback.sequencer = null;
        state.playback.isMidi = false;
        state.playback.isMultiplexed = false;
        return false;
      }
    },

    playTrack: () => {
      // if (toastElement) { ... }
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      // --- NEW: Setup the recording path for the track audio ---
      if (state.recording.destinationNode) {
        // Create a new delay node for this playback instance
        state.recording.trackDelayNode = audioContext.createDelay();
        // Use the same latency value calculated for scoring for perfect sync
        state.recording.trackDelayNode.delayTime.value =
          state.scoring.measuredLatencyS;
        // Connect the delayed path to our final recording destination
        state.recording.trackDelayNode.connect(state.recording.destinationNode);
      }
      // --- END NEW ---

      if (state.playback.isMidi) {
        if (!state.playback.sequencer || state.playback.status === "playing")
          return;
        state.playback.sequencer.play();
        state.playback.status = "playing";

        // --- NEW: Connect MIDI synth to recording pipeline ---
        if (state.recording.trackDelayNode && state.playback.synthesizer) {
          // The synthesizer is the source of MIDI audio
          state.playback.synthesizer.connect(state.recording.trackDelayNode);
        }
        // --- END NEW ---
      } else {
        if (!state.playback.buffer || state.playback.status === "playing")
          return;
        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = state.playback.buffer;

        const rate = Math.pow(2, state.playback.transpose / 12);
        sourceNode.playbackRate.value = rate;

        if (state.playback.isMultiplexed) {
          // ... (existing piano roll, scoring setup)
          if (state.playback.guideNotes) {
            pianoRollTrack.clear(); // Clear any previous notes
            renderPianoRollNotes(state.playback.guideNotes); // Re-render existing notes
            if (state.ui.pianoRollVisible) {
              pianoRollContainer.classOn("visible");
            }
          }
          state.scoring.enabled = true;
          // ... (reset scoring variables) ...
          state.scoring.finalScore = 0;
          state.scoring.details = {
            pitchAndRhythm: 0,
            vibrato: 0,
            upband: 0,
            downband: 0,
          };
          state.scoring.totalScorableNotes = 0;
          state.scoring.notesHit = 0;
          state.scoring.vibratoOpportunities = 0;
          state.scoring.vibratoNotesHit = 0;
          state.scoring.upbandOpportunities = 0;
          state.scoring.upbandsHit = 0;
          state.scoring.downbandOpportunities = 0;
          state.scoring.downbandsHit = 0;
          state.scoring.lastGuidePitch = 0;
          state.scoring.pitchHistory = [];
          state.scoring.isVocalGuideNoteActive = false;
          state.scoring.hasHitCurrentNote = false;
          state.scoring.isHoldingNote = false;

          const vocalGuideAnalyser = audioContext.createAnalyser();
          vocalGuideAnalyser.fftSize = 2048;
          state.scoring.vocalGuideAnalyser = vocalGuideAnalyser;
          const delayNode = audioContext.createDelay();
          delayNode.delayTime.value = state.scoring.measuredLatencyS;
          state.scoring.guideVocalDelayNode = delayNode;

          const splitter = audioContext.createChannelSplitter(2);
          const leftGain = audioContext.createGain();
          const rightGain = audioContext.createGain();
          const monoMixer = audioContext.createGain();

          state.playback.leftPannerGain = leftGain;
          state.playback.rightPannerGain = rightGain;

          sourceNode.connect(splitter);
          splitter.connect(leftGain, 0); // Instrumental (Left channel) to playback
          splitter.connect(rightGain, 1); // Vocal Guide (Right channel) to playback

          splitter.connect(delayNode, 1);
          delayNode.connect(vocalGuideAnalyser);

          leftGain.connect(monoMixer);
          rightGain.connect(monoMixer);
          monoMixer.connect(masterGain);

          // --- NEW: Connect INSTRUMENTAL ONLY to the recording pipeline ---
          if (state.recording.trackDelayNode) {
            // Connect channel 0 (left, instrumental) to the delay node for recording
            splitter.connect(state.recording.trackDelayNode, 0);
          }
          // --- END NEW ---

          pkg.data.setMultiplexPan(state.playback.multiplexPan);
          console.log("[FORTE SVC] Playing track in multiplexed panner mode.");
        } else {
          // Standard non-multiplexed audio track
          sourceNode.connect(masterGain);

          // --- NEW: Connect standard audio to the recording pipeline ---
          if (state.recording.trackDelayNode) {
            sourceNode.connect(state.recording.trackDelayNode);
          }
          // --- END NEW ---
        }

        sourceNode.onended = () => {
          if (state.playback.status === "playing") {
            pkg.data.stopTrack();
          }
        };
        const offset = state.playback.pauseTime;
        sourceNode.start(0, offset);
        state.playback.startTime = audioContext.currentTime;
        state.playback.status = "playing";
      }

      dispatchPlaybackUpdate();
      if (animationFrameId === null) {
        timingLoop();
      }
    },

    pauseTrack: () => {
      if (state.playback.status !== "playing") return;

      // Disable scoring and clean up analysis nodes
      state.scoring.enabled = false;
      // ... (existing cleanup)
      pianoRollContainer.classOff("visible");

      // --- NEW: Tear down the track's recording path on pause ---
      if (state.recording.trackDelayNode) {
        state.recording.trackDelayNode.disconnect();
        if (state.playback.isMidi && state.playback.synthesizer) {
          try {
            state.playback.synthesizer.disconnect(
              state.recording.trackDelayNode,
            );
          } catch (e) {
            /* ignore if already disconnected */
          }
        }
        state.recording.trackDelayNode = null;
      }
      // --- END NEW ---

      if (state.playback.isMidi) {
        state.playback.sequencer.pause();
        state.playback.status = "paused";
      } else {
        if (!sourceNode) return;

        const rate = sourceNode.playbackRate.value;
        const elapsedRealTime =
          audioContext.currentTime - state.playback.startTime;
        state.playback.pauseTime += elapsedRealTime * rate;

        sourceNode.stop();
        state.playback.leftPannerGain = null;
        state.playback.rightPannerGain = null;
        state.playback.status = "paused";
        sourceNode = null;
      }

      dispatchPlaybackUpdate();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },

    stopTrack: () => {
      if (toastElement) {
        if (toastTimeout) clearTimeout(toastTimeout);
        toastElement.classOff("visible");
      }

      if (state.playback.status === "stopped") return;

      // ... (existing piano roll and score reason cleanup)

      // --- NEW: Tear down the track's recording path on stop ---
      if (state.recording.trackDelayNode) {
        state.recording.trackDelayNode.disconnect();
        if (state.playback.isMidi && state.playback.synthesizer) {
          try {
            state.playback.synthesizer.disconnect(
              state.recording.trackDelayNode,
            );
          } catch (e) {
            /* ignore if already disconnected */
          }
        }
        state.recording.trackDelayNode = null;
      }
      // --- END NEW ---

      // ... (existing scoring node cleanup)

      if (state.playback.isMidi) {
        if (state.playback.sequencer) {
          state.playback.sequencer.stop();
        }
      } else {
        if (sourceNode) {
          sourceNode.onended = null;
          sourceNode.stop();
          sourceNode = null;
        }
      }

      state.playback.leftPannerGain = null;
      state.playback.rightPannerGain = null;
      state.playback.multiplexPan = -1; // Also reset to default on stop
      state.playback.status = "stopped";
      state.playback.pauseTime = 0;
      dispatchPlaybackUpdate();

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },

    setTrackVolume: (level) => {
      if (!masterGain) return;
      const clampedLevel = Math.max(0, Math.min(1, level));
      masterGain.gain.setValueAtTime(clampedLevel, audioContext.currentTime);
      sfxGain.gain.setValueAtTime(clampedLevel, audioContext.currentTime);
      state.playback.volume = clampedLevel;
    },

    setMultiplexPan: (panValue) => {
      const pan = Math.max(-1, Math.min(1, panValue));
      state.playback.multiplexPan = pan;

      const { leftPannerGain, rightPannerGain } = state.playback;

      if (leftPannerGain && rightPannerGain) {
        const leftGainValue = (1 - pan) / 2;
        const rightGainValue = (1 + pan) / 2;

        leftPannerGain.gain.setValueAtTime(
          leftGainValue,
          audioContext.currentTime,
        );
        rightPannerGain.gain.setValueAtTime(
          rightGainValue,
          audioContext.currentTime,
        );
      }
      dispatchPlaybackUpdate();
    },

    setTranspose: (semitones) => {
      const clampedSemitones = Math.max(
        -24,
        Math.min(24, Math.round(semitones)),
      );

      if (
        !state.playback.isMidi &&
        state.playback.status === "playing" &&
        sourceNode
      ) {
        const currentRate = sourceNode.playbackRate.value;
        const elapsedRealTime =
          audioContext.currentTime - state.playback.startTime;
        state.playback.pauseTime += elapsedRealTime * currentRate;
        state.playback.startTime = audioContext.currentTime;
      }

      state.playback.transpose = clampedSemitones;

      if (state.playback.isMidi && state.playback.synthesizer) {
        state.playback.synthesizer.transpose(clampedSemitones);
      } else if (!state.playback.isMidi && sourceNode) {
        const newRate = Math.pow(2, clampedSemitones / 12);
        sourceNode.playbackRate.setValueAtTime(
          newRate,
          audioContext.currentTime,
        );
      }

      dispatchPlaybackUpdate();
    },

    getScoringState: () => {
      return {
        finalScore: state.scoring.finalScore,
        details: state.scoring.details,
      };
    },

    getPlaybackState: () => {
      let duration = 0;
      let currentTime = 0;

      if (state.playback.isMidi && state.playback.sequencer) {
        if (state.playback.sequencer.midiData) {
          duration = state.playback.sequencer.duration;
          currentTime = state.playback.sequencer.currentTime;
        }
      } else if (state.playback.buffer) {
        duration = state.playback.buffer.duration;

        if (state.playback.status === "playing" && sourceNode) {
          const currentRate = sourceNode.playbackRate.value;
          const elapsedRealTime =
            audioContext.currentTime - state.playback.startTime;
          currentTime =
            state.playback.pauseTime + elapsedRealTime * currentRate;
        } else {
          currentTime = state.playback.pauseTime;
        }
      }

      return {
        status: state.playback.status,
        currentTime: Math.min(currentTime, duration),
        duration,
        currentDeviceId: state.playback.currentDeviceId,
        isMidi: state.playback.isMidi,
        isMultiplexed: state.playback.isMultiplexed,
        decodedLyrics: state.playback.decodedLyrics,
        transpose: state.playback.transpose,
        multiplexPan: state.playback.multiplexPan,
        score: pkg.data.getScoringState(), // Report the detailed score object
      };
    },

    initializeScoringEngine: async () => {
      if (!audioContext) return;
      console.log("[FORTE SVC] Initializing Scoring Engine...");
      await pkg.data.getMicDevices();
      await pkg.data.startMicInput(state.scoring.currentMicDeviceId);
    },

    // --- NEW: LATENCY CALIBRATION FUNCTION ---
    /**
     * Performs a sophisticated, automated audio latency test using pitch detection.
     * @returns {Promise<number>} The measured latency in seconds.
     */
    runLatencyTest: async () => {
      if (
        !audioContext ||
        !state.scoring.micAnalyser ||
        !state.scoring.pitchDetector
      ) {
        throw new Error("Audio context or mic not ready for test.");
      }
      console.log("[FORTE SVC] Starting latency calibration test...");

      // Constants for the test
      const NTESTS = 8;
      const TEST_INTERVAL_S = 0.5;
      const TEST_TONE_DURATION_S = 0.1;
      const TEST_FREQ_HZ = 880.0; // A5, easier to distinguish from noise
      const TEST_PITCH_MIDI = 81; // MIDI note for A5
      const WARMUP_S = 1.0;
      const TIMEOUT_S = WARMUP_S + NTESTS * TEST_INTERVAL_S + 2.0;

      const analyser = state.scoring.micAnalyser;
      const pitchDetector = state.scoring.pitchDetector;
      const buffer = new Float32Array(analyser.fftSize);
      let animationFrameId;

      const testPromise = new Promise((resolve, reject) => {
        let latencies = [];
        let detectedBeeps = new Set(); // To avoid detecting the same beep multiple times

        // 1. Schedule test tones
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.frequency.value = TEST_FREQ_HZ;
        gain.gain.value = 0;
        osc.connect(gain).connect(masterGain); // Connect to master gain to be audible
        osc.start();

        const baseTime = audioContext.currentTime + WARMUP_S;
        for (let i = 0; i < NTESTS; i++) {
          const toneStartTime = baseTime + i * TEST_INTERVAL_S;
          gain.gain.setValueAtTime(1.0, toneStartTime);
          gain.gain.setValueAtTime(0, toneStartTime + TEST_TONE_DURATION_S);
        }

        // 2. Start listening loop
        const listenLoop = () => {
          if (
            audioContext.currentTime >
            baseTime + NTESTS * TEST_INTERVAL_S + 1.0
          ) {
            return; // Stop requesting frames, test window is over
          }

          analyser.getFloatTimeDomainData(buffer);
          const [pitch, clarity] = pitchDetector.findPitch(
            buffer,
            audioContext.sampleRate,
          );
          const detectedMidi = 12 * Math.log2(pitch / 440) + 69;

          if (clarity > 0.9 && Math.abs(detectedMidi - TEST_PITCH_MIDI) < 1.0) {
            const inputTime = audioContext.currentTime;
            const timeSinceBase = inputTime - baseTime;
            const closestBeepIndex = Math.floor(
              timeSinceBase / TEST_INTERVAL_S,
            );

            if (
              closestBeepIndex >= 0 &&
              closestBeepIndex < NTESTS &&
              !detectedBeeps.has(closestBeepIndex)
            ) {
              const scheduledTime =
                baseTime + closestBeepIndex * TEST_INTERVAL_S;
              const latency = inputTime - scheduledTime;

              if (latency > 0.01 && latency < 0.5) {
                // Sanity check
                latencies.push(latency);
                detectedBeeps.add(closestBeepIndex);
              }
            }
          }
          animationFrameId = requestAnimationFrame(listenLoop);
        };
        animationFrameId = requestAnimationFrame(listenLoop);

        // 3. Set a timeout to end the test and analyze results
        setTimeout(() => {
          cancelAnimationFrame(animationFrameId);
          osc.stop();
          gain.disconnect();
          osc.disconnect();

          if (latencies.length < NTESTS / 2) {
            reject(
              new Error(
                `Calibration failed: Only detected ${latencies.length}/${NTESTS} beeps. Check mic/speaker volume.`,
              ),
            );
            return;
          }

          const mean = latencies.reduce((a, b) => a + b) / latencies.length;
          const std = Math.sqrt(
            latencies
              .map((x) => Math.pow(x - mean, 2))
              .reduce((a, b) => a + b) / latencies.length,
          );

          console.log(
            `[FORTE SVC] Calibration results: Mean=${(mean * 1000).toFixed(
              2,
            )}ms, StdDev=${(std * 1000).toFixed(2)}ms`,
          );

          if (std > 0.05) {
            reject(
              new Error(
                `Calibration failed: Inconsistent results (StdDev > 50ms). Try reducing background noise.`,
              ),
            );
            return;
          }

          state.scoring.measuredLatencyS = mean;
          resolve(mean);
        }, TIMEOUT_S * 1000);
      });

      return await testPromise;
    },

    setLatency: (latencySeconds) => {
      if (typeof latencySeconds !== "number" || isNaN(latencySeconds)) return;
      const clampedLatency = Math.max(0, Math.min(1, latencySeconds));
      state.scoring.measuredLatencyS = clampedLatency;
      console.log(
        `[FORTE SVC] Audio latency set to ${clampedLatency * 1000} ms.`,
      );
    },

    getMicDevices: async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        state.scoring.micDevices = devices
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({ label: d.label, deviceId: d.deviceId }));
        return state.scoring.micDevices;
      } catch (e) {
        console.error("[FORTE SVC] Could not enumerate mic devices:", e);
        return [];
      }
    },

    setMicDevice: async (deviceId) => {
      console.log(`[FORTE SVC] Setting mic device to: ${deviceId}`);
      await pkg.data.startMicInput(deviceId);
      state.scoring.currentMicDeviceId = deviceId;
    },

    startMicInput: async (deviceId = "default") => {
      if (state.scoring.micStream) {
        state.scoring.micStream.getTracks().forEach((track) => track.stop());
        state.scoring.micStream = null;
      }
      if (state.scoring.micSourceNode) {
        state.scoring.micSourceNode.disconnect();
        state.scoring.micSourceNode = null;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: deviceId },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });

        state.scoring.micStream = stream;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        // Route mic to the SCORING analyser
        source.connect(analyser);

        // --- MODIFIED: Also route mic to the RECORDING destination ---
        if (state.recording.destinationNode) {
          // Connect the raw mic source directly to the recording destination.
          // This happens only once and persists.
          source.connect(state.recording.destinationNode);
        }
        // --- END MODIFIED ---

        state.scoring.micSourceNode = source;
        state.scoring.micAnalyser = analyser;

        if (!state.scoring.pitchDetector) {
          state.scoring.pitchDetector = PitchDetector.forFloat32Array(
            analyser.fftSize,
          );
        }
        console.log("[FORTE SVC] Microphone input started for scoring.");
      } catch (e) {
        console.error("[FORTE SVC] Failed to get microphone input:", e);
      }
    },
  },

  end: async function () {
    console.log("[FORTE SVC] Shutting down service.");
    if (toastElement) toastElement.cleanup();
    if (toastStyleElement) toastStyleElement.cleanup();
    toastElement = null;
    toastStyleElement = null;
    if (toastTimeout) clearTimeout(toastTimeout);
    // --- START: Added for Piano Roll ---
    if (pianoRollContainer) pianoRollContainer.cleanup();
    if (scoreReasonDisplay) scoreReasonDisplay.cleanup(); // --- Added for Score Reasons ---
    pianoRollContainer = null;
    pianoRollTrack = null;
    pianoRollPlayhead = null;
    pianoRollUserPitch = null;
    scoreReasonDisplay = null; // --- Added for Score Reasons ---
    // --- END: Added for Piano Roll ---

    if (state.scoring.micStream) {
      // Stop mic track
      state.scoring.micStream.getTracks().forEach((track) => track.stop());
    }

    if (audioContext && audioContext.state !== "closed") {
      if (masterCompressor) masterCompressor.disconnect();
      // --- NEW: Disconnect recording node on shutdown ---
      if (state.recording.destinationNode) {
        state.recording.destinationNode.disconnect();
      }
      // --- END NEW ---
      audioContext.close();
    }
    if (sfxAudioContext && sfxAudioContext.state !== "closed") {
      sfxAudioContext.close();
    }
    sfxCache.clear();
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (state.playback.synthesizer) {
      state.playback.synthesizer.close();
    }
    if (peer) {
      peer.destroy();
      console.log("[FORTE SVC] PeerJS client destroyed.");
    }
    micConnections.forEach((conn) => {
      conn.node.disconnect();
      conn.call.close();
    });
    micConnections.clear();
    console.log("[FORTE SVC] Shutdown complete.");
  },
};

export default pkg;
