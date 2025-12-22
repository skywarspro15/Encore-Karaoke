import Html from "/libs/html.js";

export class RecorderModule {
  constructor(forteSvc, bgvModule, infoBarModule) {
    this.forteSvc = forteSvc;
    this.bgvPlayer = bgvModule;
    this.infoBar = infoBarModule;
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;
    this.currentSongInfo = null;
    this.uiRefs = null;
    this.parentContainer = null;

    // Track the active stream
    this.currentStream = null;

    // 720p 30fps configuration
    this.outputResolution = { width: 1280, height: 720 };
    console.log("[RECORDER] Video Recording feature initialized.");
  }

  mount(container) {
    // Lazy load container ref
    this.parentContainer = container;
  }

  _initCanvas() {
    if (this.canvas) return;

    this.canvas = new Html("canvas")
      .attr({
        width: this.outputResolution.width,
        height: this.outputResolution.height,
      })
      .styleJs({ display: "none" })
      .appendTo(this.parentContainer).elm;

    this.ctx = this.canvas.getContext("2d", { alpha: false });
  }

  setUiRefs(refs) {
    this.uiRefs = refs;
  }

  setSongInfo(song) {
    if (song) this.currentSongInfo = { title: song.title, artist: song.artist };
  }

  clearSongInfo() {
    this.currentSongInfo = null;
  }

  toggle() {
    this.isRecording ? this.stop() : this.start();
  }

  start() {
    if (this.isRecording || !this.forteSvc || !this.bgvPlayer) return;

    this._initCanvas();

    let audioStream;

    try {
      audioStream = this.forteSvc.getRecordingAudioStream();
      if (!audioStream || audioStream.getAudioTracks().length === 0) {
        this.infoBar.showTemp(
          "RECORDING",
          "Error: No audio stream found.",
          4000,
        );
        return;
      }
    } catch (e) {
      this.infoBar.showTemp("RECORDING", e, 4000);
      return;
    }

    // Capture the canvas stream
    const videoStream = this.canvas.captureStream(30);

    // Combine streams
    // NOTE: We take the audio track from Forte, but we must NOT stop it later
    this.currentStream = new MediaStream([
      videoStream.getVideoTracks()[0],
      audioStream.getAudioTracks()[0],
    ]);

    this.recordedChunks = [];
    try {
      this.mediaRecorder = new MediaRecorder(this.currentStream, {
        mimeType: "video/webm; codecs=vp9,opus",
        videoBitsPerSecond: 2500000, // 2.5 Mbps for 720p
      });
    } catch (e) {
      console.error("Failed to create MediaRecorder:", e);
      this.infoBar.showTemp(
        "RECORDING",
        "Error: Could not start recorder.",
        4000,
      );
      return;
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.recordedChunks.push(event.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: "video/webm" });
      this.recordedChunks = [];

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      a.href = url;
      a.download = `Encore-Recording-${new Date()
        .toISOString()
        .replace(/:/g, "-")}.webm`;
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      this.infoBar.showTemp(
        "RECORDING",
        "Recording saved to Downloads folder.",
        5000,
      );
    };

    this.mediaRecorder.start();
    this.isRecording = true;
    this.drawFrame();
    this.infoBar.showDefault();
  }

  stop() {
    if (!this.isRecording || !this.mediaRecorder) return;

    this.mediaRecorder.stop();
    this.isRecording = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Cleanup Streams
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => {
        // CRITICAL FIX: Only stop video tracks (canvas capture).
        // Do NOT stop audio tracks, as they belong to the persistent Forte engine.
        // Stopping the audio track kills audio output for the rest of the app session.
        if (track.kind === "video") {
          track.stop();
        }
      });
      this.currentStream = null;
    }

    this.mediaRecorder = null;
    this.infoBar.showDefault();
  }

  drawFrame() {
    if (!this.isRecording) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    // FIX: Adapt to Single Buffer BGV Player
    // The new BGV module exposes a single `videoElement`
    const sourceVideo = this.bgvPlayer.videoElement;

    if (sourceVideo && sourceVideo.readyState >= 2 && !sourceVideo.paused) {
      // Draw video
      this.ctx.drawImage(sourceVideo, 0, 0, w, h);
    } else {
      // Draw black background if buffering or stopped
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, w, h);
    }

    // Draw UI Overlay
    if (this.uiRefs && !this.uiRefs.playerUi.elm.classList.contains("hidden")) {
      const gradient = this.ctx.createLinearGradient(0, h * 0.5, 0, h);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.9)");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, h * 0.5, w, h * 0.5);

      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "bottom";

      // Relative positioning logic (720p compatible)
      const line1BaseY = h * 0.85;
      const line2BaseY = h * 0.93;

      const line1HasRomanized = this.uiRefs.lrcLineDisplay1.elm.querySelector(
        ".lyric-line-romanized",
      )?.textContent;
      const line2HasRomanized = this.uiRefs.lrcLineDisplay2.elm.querySelector(
        ".lyric-line-romanized",
      )?.textContent;

      const romOffset = h * 0.04;

      const line1Y = line1HasRomanized
        ? line2HasRomanized
          ? line1BaseY - romOffset * 2
          : line1BaseY - romOffset
        : line1BaseY;
      const line2Y = line2HasRomanized ? line2BaseY - romOffset : line2BaseY;

      this.drawLyricLine(this.uiRefs.lrcLineDisplay1.elm, line1Y, h);
      this.drawLyricLine(this.uiRefs.lrcLineDisplay2.elm, line2Y, h);

      if (
        this.uiRefs.scoreDisplay.elm.parentElement.classList.contains("visible")
      ) {
        const bigFont = `${Math.floor(h * 0.04)}px`;
        const smallFont = `${Math.floor(h * 0.015)}px`;

        this.ctx.font = `bold ${bigFont} Rajdhani, sans-serif`;
        this.ctx.fillStyle = "#89CFF0";
        this.ctx.textAlign = "right";
        this.ctx.fillText(this.uiRefs.scoreDisplay.getText(), w - 50, h - 80);
        this.ctx.font = `bold ${smallFont} Rajdhani, sans-serif`;
        this.ctx.fillStyle = "#FFD700";
        this.ctx.fillText("SCORE", w - 150, h - 85);
      }
    }

    // Song Info Overlay
    if (this.currentSongInfo) {
      const x = 50,
        y = 50,
        maxWidth = w * 0.4,
        padding = 25;

      const boxHeight = h * 0.11;

      this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      this.ctx.beginPath();
      this.ctx.roundRect(
        x - padding,
        y - padding,
        maxWidth + padding * 2,
        boxHeight + padding,
        15,
      );
      this.ctx.fill();

      const titleSize = `${Math.floor(h * 0.044)}px`;
      const artistSize = `${Math.floor(h * 0.03)}px`;

      this.ctx.font = `bold ${titleSize} Rajdhani, sans-serif`;
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "left";
      this.ctx.textBaseline = "top";
      this.ctx.shadowColor = "black";
      this.ctx.shadowBlur = 5;
      this.ctx.fillText(this.currentSongInfo.title, x, y, maxWidth);

      this.ctx.font = `${artistSize} Rajdhani, sans-serif`;
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.fillText(this.currentSongInfo.artist, x, y + h * 0.06, maxWidth);
      this.ctx.shadowBlur = 0;
    }

    this.animationFrameId = requestAnimationFrame(() => this.drawFrame());
  }

  drawLyricLine(element, y, h) {
    const originalEl = element.querySelector(".lyric-line-original");
    const romanizedEl = element.querySelector(".lyric-line-romanized");
    if (!originalEl || !originalEl.textContent) return;

    const isActive = element.classList.contains("active");
    const defaultOpacity = element.classList.contains("next") ? 0.5 : 0.4;

    const mainFontSize = `${Math.floor(h * 0.066)}px`;
    const subFontSize = `${Math.floor(h * 0.022)}px`;

    this.ctx.font = `bold ${mainFontSize} Rajdhani, sans-serif`;
    this.ctx.fillStyle = isActive
      ? "#FFFFFF"
      : `rgba(255, 255, 255, ${defaultOpacity})`;
    if (isActive) {
      this.ctx.strokeStyle = "#010141";
      this.ctx.lineWidth = h * 0.01;
      this.ctx.lineJoin = "round";
      this.ctx.strokeText(originalEl.textContent, this.canvas.width / 2, y);
    }
    this.ctx.fillText(originalEl.textContent, this.canvas.width / 2, y);

    if (romanizedEl && romanizedEl.textContent) {
      this.ctx.font = `500 ${subFontSize} Rajdhani, sans-serif`;
      this.ctx.fillStyle = isActive
        ? "#FFFFFF"
        : `rgba(255, 255, 255, ${defaultOpacity + 0.1})`;
      this.ctx.fillText(
        romanizedEl.textContent,
        this.canvas.width / 2,
        y + h * 0.04,
      );
    }
  }
}
