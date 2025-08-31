// Forte for Encore Karaoke
import {
  Synthetizer,
  Sequencer,
} from "https://cdn.jsdelivr.net/npm/spessasynth_lib@3.27.8/+esm";
import Html from "/libs/html.js"; // Import the Html library

let socket;
let root;

// --- UI Elements managed by the service ---
let toastElement = null;
let toastStyleElement = null;
let toastTimeout = null;

// --- Web Audio API State for Karaoke Track Playback ---
let audioContext;
let masterGain;
let sourceNode = null;
let animationFrameId = null;

// --- Combined Service State ---
const state = {
  vocalEngine: {
    connected: false,
    running: false,
    config: { input_device: null, output_device: null, buffer_size: 1024 },
    devices: { inputs: [], outputs: [] },
  },
  playback: {
    status: "stopped",
    buffer: null,
    synthesizer: null,
    sequencer: null,
    isMidi: false,
    decodedLyrics: [],
    startTime: 0,
    pauseTime: 0,
    devices: [],
    currentDeviceId: "default",
    transpose: 0,
  },
};

function dispatchPlaybackUpdate() {
  document.dispatchEvent(
    new CustomEvent("CherryTree.Forte.Playback.Update", {
      detail: pkg.data.getPlaybackState(),
    }),
  );
}

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
  if (currentTime >= duration && duration > 0) {
    animationFrameId = null;
    return;
  }
  animationFrameId = requestAnimationFrame(timingLoop);
}

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
    `,
      )
      .appendTo("head");

    toastElement = new Html("div").classOn("forte-toast").appendTo("body");
    // --- End Toast UI ---

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      state.playback.currentDeviceId = audioContext.sinkId || "default";
      console.log("[FORTE SVC] Web Audio API context initialized.");
      pkg.data.getPlaybackDevices();

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

    socket = io("ws://localhost:8765");
    socket.on("connect", () => {
      state.vocalEngine.connected = true;
      console.log("[FORTE SVC] Connected to vocal engine server.");
      document.dispatchEvent(
        new CustomEvent("CherryTree.Forte.Connection.Update", {
          detail: { connected: true },
        }),
      );
    });
    socket.on("disconnect", () => {
      state.vocalEngine.connected = false;
      state.vocalEngine.running = false;
      console.warn("[FORTE SVC] Disconnected from vocal engine server.");
      document.dispatchEvent(
        new CustomEvent("CherryTree.Forte.Connection.Update", {
          detail: { connected: false },
        }),
      );
    });
    socket.on("engine_status", (data) => {
      state.vocalEngine.running = data.running;
      state.vocalEngine.config = data.config || state.vocalEngine.config;
      document.dispatchEvent(
        new CustomEvent("CherryTree.Forte.Status.Update", {
          detail: state.vocalEngine,
        }),
      );
    });
    socket.on("audio_devices", (data) => {
      state.vocalEngine.devices = data;
      document.dispatchEvent(
        new CustomEvent("CherryTree.Forte.Devices.Update", { detail: data }),
      );
    });
    socket.on("error", (data) => {
      console.error("[FORTE SVC] Error from vocal engine:", data.message);
      document.dispatchEvent(
        new CustomEvent("CherryTree.Forte.Error", { detail: data }),
      );
    });
  },

  data: {
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
      state.playback.transpose = 0; // Reset transpose when loading new track

      const isMidi =
        url.toLowerCase().endsWith(".mid") ||
        url.toLowerCase().endsWith(".midi") ||
        url.toLowerCase().endsWith(".kar"); // KAR is also MIDI
      state.playback.isMidi = isMidi;

      // Update toast text on load
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
        return false;
      }
    },

    playTrack: () => {
      // Show toast on play
      if (toastElement) {
        if (toastTimeout) clearTimeout(toastTimeout);
        toastElement.classOn("visible");
        toastTimeout = setTimeout(() => {
          toastElement.classOff("visible");
        }, 3000); // Hide after 3 seconds
      }

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      if (state.playback.isMidi) {
        if (!state.playback.sequencer || state.playback.status === "playing")
          return;
        state.playback.sequencer.play();
        state.playback.status = "playing";
      } else {
        if (!state.playback.buffer || state.playback.status === "playing")
          return;
        sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = state.playback.buffer;

        // Set playback rate for transposition
        const rate = Math.pow(2, state.playback.transpose / 12);
        sourceNode.playbackRate.value = rate;

        sourceNode.connect(masterGain);
        sourceNode.onended = () => {
          if (state.playback.status === "playing") {
            state.playback.status = "stopped";
            state.playback.pauseTime = 0;
            sourceNode = null;
            dispatchPlaybackUpdate();
          }
        };
        const offset = state.playback.pauseTime;
        sourceNode.start(0, offset);
        // Store the real time when this playback segment started
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

      if (state.playback.isMidi) {
        state.playback.sequencer.pause();
        state.playback.status = "paused";
      } else {
        if (!sourceNode) return;

        // Calculate current position in the buffer before stopping
        const rate = sourceNode.playbackRate.value;
        const elapsedRealTime =
          audioContext.currentTime - state.playback.startTime;
        state.playback.pauseTime += elapsedRealTime * rate;

        sourceNode.stop();
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
      // Hide toast on stop
      if (toastElement) {
        if (toastTimeout) clearTimeout(toastTimeout);
        toastElement.classOff("visible");
      }

      if (state.playback.status === "stopped") return;

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
    },

    setTranspose: (semitones) => {
      const clampedSemitones = Math.max(
        -24,
        Math.min(24, Math.round(semitones)),
      );

      // If playing audio, update time tracking before changing the rate
      if (
        !state.playback.isMidi &&
        state.playback.status === "playing" &&
        sourceNode
      ) {
        const currentRate = sourceNode.playbackRate.value;
        const elapsedRealTime =
          audioContext.currentTime - state.playback.startTime;
        state.playback.pauseTime += elapsedRealTime * currentRate;
        state.playback.startTime = audioContext.currentTime; // Reset startTime for the next calculation
      }

      state.playback.transpose = clampedSemitones;

      if (state.playback.isMidi && state.playback.synthesizer) {
        state.playback.synthesizer.transpose(clampedSemitones);
      } else if (!state.playback.isMidi && sourceNode) {
        // Apply transposition to audio via playbackRate
        const newRate = Math.pow(2, clampedSemitones / 12);
        sourceNode.playbackRate.setValueAtTime(
          newRate,
          audioContext.currentTime,
        );
      }

      dispatchPlaybackUpdate();
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
        // --- FIX STARTS HERE ---
        // The intrinsic duration of the audio buffer is constant. It does not change with playback rate.
        // Reporting a dynamic duration was causing the UI to jump and end the song prematurely.
        duration = state.playback.buffer.duration;
        // --- FIX ENDS HERE ---

        if (state.playback.status === "playing" && sourceNode) {
          const currentRate = sourceNode.playbackRate.value;
          const elapsedRealTime =
            audioContext.currentTime - state.playback.startTime;
          // Current position is the last paused position plus progress made in this segment, scaled by the rate.
          currentTime =
            state.playback.pauseTime + elapsedRealTime * currentRate;
        } else {
          // When paused or stopped, the position is simply the stored pauseTime.
          currentTime = state.playback.pauseTime;
        }
      }

      return {
        status: state.playback.status,
        // Clamp currentTime to duration to prevent it from overshooting at the very end
        currentTime: Math.min(currentTime, duration),
        duration,
        currentDeviceId: state.playback.currentDeviceId,
        isMidi: state.playback.isMidi,
        decodedLyrics: state.playback.decodedLyrics,
        transpose: state.playback.transpose,
      };
    },

    getVocalEngineStatus: () => state.vocalEngine,
    getVocalDevices: () => state.vocalEngine.devices,
    startVocalEngine: (settings) => {
      if (socket?.connected) {
        socket.emit("change_settings", settings);
        setTimeout(() => socket.emit("start_engine", {}), 100);
      }
    },
    stopVocalEngine: () => {
      if (socket?.connected) {
        socket.emit("stop_engine", {});
      }
    },
    applyVocalEngineSettings: (settings) => {
      if (socket?.connected) {
        socket.emit("change_settings", settings);
      }
    },
    setVocalEffects: (effects) => {
      if (socket?.connected) {
        socket.emit("set_effects", effects);
      }
    },
    clearVocalEffects: () => {
      if (socket?.connected) {
        socket.emit("set_effects", []);
      }
    },
    updateVocalEffect: (updatePayload) => {
      if (socket?.connected) {
        socket.emit("update_effect", updatePayload);
      }
    },
  },

  end: async function () {
    console.log("[FORTE SVC] Shutting down service.");
    // --- Clean up Toast UI ---
    if (toastElement) toastElement.cleanup();
    if (toastStyleElement) toastStyleElement.cleanup();
    toastElement = null;
    toastStyleElement = null;
    if (toastTimeout) clearTimeout(toastTimeout);
    // --- End Cleanup ---

    if (socket?.connected) {
      socket.disconnect();
    }
    if (audioContext && audioContext.state !== "closed") {
      audioContext.close();
    }
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (state.playback.synthesizer) {
      state.playback.synthesizer.close();
    }
    console.log("[FORTE SVC] Shutdown complete.");
  },
};

export default pkg;
