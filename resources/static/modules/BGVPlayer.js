import Html from "/libs/html.js";

export class BGVModule {
  constructor() {
    this.videoElement = null; // Single video element
    this.playlist = [];
    this.currentIndex = 0;
    this.container = null;
    this.categories = [];
    this.selectedCategory = "Auto";
    this.isManualMode = false;
    this.activeManualPlayer = null;
    this.PORT = 9864;

    // Performance settings
    this.transitionTimeout = null;
    console.log(
      "[BGV] BGV Player initialized (Single Buffer / Performance Mode).",
    );
  }

  mount(container) {
    this.container = container;

    // Set container background to black to hide loading glitches
    this.container.styleJs({
      backgroundColor: "#000",
      overflow: "hidden",
    });

    // Create ONLY ONE video element
    this.videoElement = new Html("video")
      .attr({
        muted: true,
        autoplay: false,
        playsInline: true,
        defaultMuted: true,
        preload: "auto",
      })
      .styleJs({
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: "0", // Start hidden until ready
        transition: "opacity 0.5s ease-in-out", // Smooth entry
        willChange: "opacity", // Optimize compositing
        transform: "translateZ(0)", // Force GPU layer
      })
      .appendTo(this.container).elm;

    // Ensure volume is always 0
    this.videoElement.volume = 0;
    this.videoElement.addEventListener(
      "volumechange",
      () => (this.videoElement.volume = 0),
    );

    // Handle Video End -> Next
    this.videoElement.onended = () => this.playNext();

    // Handle Errors (skip corrupt files)
    this.videoElement.onerror = (e) => {
      console.warn("[BGV] Video error, skipping:", e);
      this.playNext();
    };
  }

  async loadManifestCategories() {
    try {
      const response = await fetch(
        `http://127.0.0.1:${this.PORT}/assets/video/bgv/manifest.json`,
      );
      this.categories = await response.json();
    } catch (error) {
      console.error("[BGV] Failed to load video manifest:", error);
      this.container.text("Could not load background videos.");
      this.categories = [];
    }
  }

  addDynamicCategory(category) {
    if (category && category.BGV_LIST && category.BGV_LIST.length > 0) {
      this.categories.push(category);
    }
  }

  async updatePlaylistForCategory() {
    const assetBaseUrl = `http://127.0.0.1:${this.PORT}/assets/video/bgv/`;
    this.playlist = [];
    let allVideos = [];
    const isAuto = this.selectedCategory === "Auto";

    const catList = isAuto
      ? this.categories
      : this.categories.filter((c) => c.BGV_CATEGORY === this.selectedCategory);

    for (const cat of catList) {
      if (cat.isAbsolute) {
        allVideos.push(
          ...cat.BGV_LIST.map((path) => {
            const url = new URL(`http://127.0.0.1:${this.PORT}/getFile`);
            url.searchParams.append("path", path);
            return url.href;
          }),
        );
      } else {
        allVideos.push(...cat.BGV_LIST.map((path) => assetBaseUrl + path));
      }
    }

    this.playlist = allVideos;
    // Fisher-Yates Shuffle
    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [
        this.playlist[j],
        this.playlist[i],
      ];
    }

    this.stop();
    this.currentIndex = 0;
    this.start();
  }

  cycleCategory(direction) {
    if (this.isManualMode) return;
    const allCategoryNames = [
      "Auto",
      ...this.categories.map((c) => c.BGV_CATEGORY),
    ];
    let currentIndex = allCategoryNames.indexOf(this.selectedCategory);
    currentIndex =
      (currentIndex + direction + allCategoryNames.length) %
      allCategoryNames.length;
    this.selectedCategory = allCategoryNames[currentIndex];
    this.updatePlaylistForCategory();
  }

  start() {
    if (this.isManualMode || this.playlist.length === 0) return;
    this._playUrl(this.playlist[this.currentIndex]);
  }

  playNext() {
    if (this.isManualMode || this.playlist.length === 0) return;

    // Move index
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;

    // Simple fade out - switch - fade in logic
    // This allows the decoder to fully stop the previous file before starting the next
    this.videoElement.style.opacity = "0";

    if (this.transitionTimeout) clearTimeout(this.transitionTimeout);

    this.transitionTimeout = setTimeout(() => {
      this._playUrl(this.playlist[this.currentIndex]);
    }, 500); // 500ms black gap to ensure buffer flush
  }

  _playUrl(url) {
    const v = this.videoElement;

    // One-time listener for when data is ready
    const onCanPlay = () => {
      v.play()
        .then(() => {
          v.style.opacity = "1";
        })
        .catch((e) => console.error("[BGV] Play failed", e));
      v.removeEventListener("canplay", onCanPlay);
    };

    v.addEventListener("canplay", onCanPlay);
    v.src = url;
    v.load();
  }

  async playSingleVideo(url) {
    this.isManualMode = true;
    this.activeManualPlayer = this.videoElement;
    this.videoElement.onended = null; // Stop looping playlist

    // For manual mode (MTV), we want immediate playback
    this.videoElement.style.opacity = "0";
    this.videoElement.src = url;
    this.videoElement.load();

    await new Promise((resolve) => {
      const onCanPlay = () => {
        this.videoElement.style.opacity = "1";
        this.videoElement.removeEventListener("canplay", onCanPlay);
        resolve();
      };
      this.videoElement.addEventListener("canplay", onCanPlay);
    });

    return this.videoElement;
  }

  async resumePlaylist() {
    if (!this.isManualMode) return;
    this.isManualMode = false;
    this.activeManualPlayer = null;
    this.videoElement.onended = () => this.playNext();

    // Resume current index
    this.start();
  }

  stop() {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.removeAttribute("src");
      this.videoElement.load(); // Force buffer flush
      this.videoElement.style.opacity = "0";
    }
    if (this.transitionTimeout) clearTimeout(this.transitionTimeout);
  }
}
