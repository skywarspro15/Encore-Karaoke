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
    this.parentContainer = null; // Container to hold canvas

    // Track the active stream so we can kill it later
    this.currentStream = null;

    // OPTIMIZATION: Lowered from 1080p to 720p for CPU saving
    this.outputResolution = { width: 1280, height: 720 };
    console.log("[RECORDER] Video Recording feature initialized.");
  }

  mount(container) {
    // OPTIMIZATION: Don't create canvas yet. Just save the container.
    this.parentContainer = container;
  }

  // Helper to init canvas only when needed
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

    // LAZY LOAD: Create canvas now
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

    // Capture the stream at 30 FPS for performance
    const videoStream = this.canvas.captureStream(30);

    // Create the combined stream and SAVE REFERENCE to this.currentStream
    this.currentStream = new MediaStream([
      videoStream.getVideoTracks()[0],
      audioStream.getAudioTracks()[0],
    ]);

    this.recordedChunks = [];
    try {
      this.mediaRecorder = new MediaRecorder(this.currentStream, {
        mimeType: "video/webm; codecs=vp9,opus",
        videoBitsPerSecond: 2500000, // Reduced bitrate for 720p
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

      // Clear chunks from memory immediately after blob creation
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

    // Stop the MediaStreamTracks to release CPU/Memory
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.currentStream = null;
    }

    this.mediaRecorder = null; // Help Garbage Collector
    this.infoBar.showDefault();
  }

  drawFrame() {
    if (!this.isRecording) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Performance: Use clearRect only if necessary, or rely on full draw
    this.ctx.clearRect(0, 0, w, h);

    // Draw BGV
    let sourceVideo = this.bgvPlayer.isManualMode
      ? this.bgvPlayer.activeManualPlayer
      : this.bgvPlayer.videoElements[this.bgvPlayer.activePlayerIndex];

    if (sourceVideo && sourceVideo.readyState >= 2 && !sourceVideo.paused) {
      this.ctx.drawImage(sourceVideo, 0, 0, w, h);
    } else {
      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, w, h);
    }

    // Draw UI
    if (this.uiRefs && !this.uiRefs.playerUi.elm.classList.contains("hidden")) {
      const gradient = this.ctx.createLinearGradient(0, h * 0.5, 0, h);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.9)");
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, h * 0.5, w, h * 0.5);

      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "bottom";

      // Relative positioning (percentages) instead of fixed pixels
      // to support the switch to 720p seamlessly
      const line1BaseY = h * 0.85; // ~ h - 162px (1080p), ~ h - 108px (720p)
      const line2BaseY = h * 0.93; // ~ h - 75px (1080p), ~ h - 50px (720p)

      const line1HasRomanized = this.uiRefs.lrcLineDisplay1.elm.querySelector(
        ".lyric-line-romanized",
      )?.textContent;
      const line2HasRomanized = this.uiRefs.lrcLineDisplay2.elm.querySelector(
        ".lyric-line-romanized",
      )?.textContent;

      // Adjust for romanized height (approx 4% of screen height)
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
        // Scaled fonts
        const bigFont = `${Math.floor(h * 0.04)}px`; // ~43px at 1080p
        const smallFont = `${Math.floor(h * 0.015)}px`; // ~16px at 1080p

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

      const boxHeight = h * 0.11; // ~120px at 1080p

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

      // Scaled Fonts
      const titleSize = `${Math.floor(h * 0.044)}px`; // ~48px
      const artistSize = `${Math.floor(h * 0.03)}px`; // ~32px

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

    // Use pixel font sizes relative to height (h) to maintain look on 720p
    // 4.5rem ~ 72px on standard 16px base -> 72/1080 ~ 0.066
    const mainFontSize = `${Math.floor(h * 0.066)}px`;
    const subFontSize = `${Math.floor(h * 0.022)}px`;

    this.ctx.font = `bold ${mainFontSize} Rajdhani, sans-serif`;
    this.ctx.fillStyle = isActive
      ? "#FFFFFF"
      : `rgba(255, 255, 255, ${defaultOpacity})`;
    if (isActive) {
      this.ctx.strokeStyle = "#010141";
      this.ctx.lineWidth = h * 0.01; // Scale outline width
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
