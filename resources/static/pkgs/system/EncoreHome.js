import Html from "/libs/html.js";

let wrapper, Ui, Pid, Sfx, FsSvc, Forte;

// We need to store event listeners so we can remove them later.
let keydownHandler = null;
let timeUpdateHandler = null;
let playbackUpdateHandler = null;
let lyricEventHandler = null; // Listener for our custom lyric events
let lastPlaybackStatus = null;
let tokenizer = null;

kuromoji.builder({ dicPath: "/libs/dict/" }).build(function (err, t) {
  if (err) {
    console.log(err);
  }
  console.log(t);
  tokenizer = t;
});

const config = await window.desktopIntegration.ipc.invoke("getConfig");

// --- BGVPlayer Module ---
const BGVPlayer = {
  videoElements: [],
  playlist: [],
  currentIndex: 0,
  activePlayerIndex: 0,
  bgvContainer: null,
  FADE_DURATION: 1200, // ms
  PRELOAD_DELAY: 500, // ms
  categories: [], // Store available categories
  selectedCategory: "Auto", // Default to Auto mode
  osdTimeout: null,
  osdVisible: false,

  async init(container) {
    this.bgvContainer = container;
    for (let i = 0; i < 2; i++) {
      const videoEl = new Html("video")
        .attr({
          muted: true,
          autoplay: false,
          playsInline: true, // Better mobile support
          defaultMuted: true, // Extra safety for muting
        })
        .styleJs({
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: i === 0 ? "1" : "0",
          transform: "scale(1.01)", // Prevent edge flickering during fade
          transition: `opacity ${this.FADE_DURATION}ms ease-in-out`,
          willChange: "opacity", // Optimize for animations
        })
        .appendTo(this.bgvContainer);

      const elm = videoEl.elm;
      elm.volume = 0; // Triple-ensure muting
      elm.addEventListener("volumechange", () => (elm.volume = 0));
      this.videoElements.push(elm);
    }

    // Create BGV OSD - moved outside of bgvContainer
    const osd = new Html("div")
      .styleJs({
        position: "absolute",
        left: "2rem",
        bottom: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: "700",
        opacity: "0",
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
        zIndex: 100000,
      })
      .appendTo(wrapper); // Changed from this.bgvContainer to wrapper

    this.osdBox = new Html("div")
      .styleJs({
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: "0.5rem",
        padding: "0.6rem 1.2rem",
        minWidth: "240px",
        zIndex: 2147483647, // Maximum possible z-index
      })
      .appendTo(osd);

    new Html("div")
      .styleJs({
        color: "#FFD700",
        fontSize: "1rem",
        letterSpacing: "0.1rem",
        marginBottom: "0.25rem",
      })
      .text("BGV MODE")
      .appendTo(this.osdBox);

    this.categoryDisplay = new Html("div")
      .styleJs({
        color: "#89CFF0",
        fontSize: "2rem",
        letterSpacing: "0.2rem",
        textAlign: "center",
      })
      .appendTo(this.osdBox);

    this.osd = osd;
    await this.fetchAndPreparePlaylist();
  },

  showOSD() {
    if (this.osdTimeout) clearTimeout(this.osdTimeout);
    this.osd.styleJs({ opacity: "1" });
    this.osdVisible = true;
    this.osdTimeout = setTimeout(() => {
      this.osd.styleJs({ opacity: "0" });
      this.osdVisible = false;
    }, 3000);
  },

  async fetchAndPreparePlaylist() {
    const manifestUrl = "http://127.0.0.1:9864/assets/video/bgv/manifest.json";
    const baseUrl = "http://127.0.0.1:9864/assets/video/bgv/";
    try {
      const response = await fetch(manifestUrl);
      const categories = await response.json();
      this.categories = categories;

      this.categoryDisplay.text(this.selectedCategory);
      await this.updatePlaylistForCategory();
    } catch (error) {
      console.error("[BGV] Failed to load video manifest:", error);
      this.bgvContainer.text("Could not load background videos.");
    }
  },

  async updatePlaylistForCategory() {
    const baseUrl = "http://127.0.0.1:9864/assets/video/bgv/";
    this.playlist = [];

    if (this.selectedCategory === "Auto") {
      this.playlist = this.categories.flatMap((cat) =>
        cat.BGV_LIST.map((videoPath) => baseUrl + videoPath),
      );
    } else {
      const category = this.categories.find(
        (c) => c.BGV_CATEGORY === this.selectedCategory,
      );
      if (category) {
        this.playlist = category.BGV_LIST.map(
          (videoPath) => baseUrl + videoPath,
        );
      }
    }

    for (let i = this.playlist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.playlist[i], this.playlist[j]] = [
        this.playlist[j],
        this.playlist[i],
      ];
    }

    console.log(
      `[BGV] Loaded ${this.playlist.length} videos for category: ${this.selectedCategory}`,
    );

    await this.cleanStop();
    this.currentIndex = 0;
    this.start();
  },

  async cleanStop() {
    this.videoElements.forEach((vid) => {
      vid.onended = null;
      vid.pause();
    });
    await new Promise((resolve) => setTimeout(resolve, this.FADE_DURATION));
    this.videoElements.forEach((vid) => {
      vid.removeAttribute("src");
      vid.load();
      vid.style.opacity =
        vid === this.videoElements[this.activePlayerIndex] ? "1" : "0";
    });
  },

  cycleCategory(direction) {
    const allCategories = [
      "Auto",
      ...this.categories.map((c) => c.BGV_CATEGORY),
    ];
    let currentIndex = allCategories.indexOf(this.selectedCategory);
    currentIndex =
      (currentIndex + direction + allCategories.length) % allCategories.length;
    this.selectedCategory = allCategories[currentIndex];
    this.categoryDisplay.text(this.selectedCategory);
    this.showOSD();
    this.updatePlaylistForCategory();
  },

  start() {
    if (this.playlist.length === 0) return;
    const activePlayer = this.videoElements[this.activePlayerIndex];
    const preloadPlayer = this.videoElements[1 - this.activePlayerIndex];
    activePlayer.loop = false;
    preloadPlayer.loop = false;
    activePlayer.src = this.playlist[this.currentIndex];
    activePlayer.play().catch(console.error);
    activePlayer.onended = () => this.playNext();
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    setTimeout(() => {
      preloadPlayer.src = this.playlist[this.currentIndex];
      preloadPlayer.load();
    }, this.PRELOAD_DELAY);
  },

  playNext() {
    const currentPlayer = this.videoElements[this.activePlayerIndex];
    const nextPlayer = this.videoElements[1 - this.activePlayerIndex];
    nextPlayer.play().catch(console.error);
    setTimeout(() => {
      currentPlayer.style.opacity = "0";
      nextPlayer.style.opacity = "1";
    }, 50);
    this.activePlayerIndex = 1 - this.activePlayerIndex;
    nextPlayer.onended = () => this.playNext();
    setTimeout(() => {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      currentPlayer.src = this.playlist[this.currentIndex];
      currentPlayer.load();
    }, this.FADE_DURATION + this.PRELOAD_DELAY);
  },

  stop() {
    this.cleanStop().catch(console.error);
  },
};

// --- Romanizer Module ---
const Romanizer = {
  isReady: false,

  async init() {
    if (this.isReady) return;
    this.isReady = true;
    console.log("[Romanizer] Ready.");
  },
  getPlaceholder(text, placeholderChar) {
    return text.replace(/\S/g, placeholderChar);
  },
  romanize(text) {
    if (!text || !this.isReady || !text.trim()) return null;
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(text)) {
      if (tokenizer) {
        let tokenized = tokenizer.tokenize(text);
        let tokenizedText = "";
        tokenized.forEach((token) => {
          if (token.word_type == "KNOWN") {
            tokenizedText = tokenizedText + token.pronunciation;
          }
        });
        return wanakana.toRomaji(tokenizedText);
      }
    }
    if (/[\uac00-\ud7af]/.test(text)) {
      return Aromanize.romanize(text);
    }
    return null;
  },
};

const pkg = {
  name: "Encore Home",
  type: "app",
  privs: 0,
  start: async function (Root) {
    Pid = Root.Pid;
    Ui = Root.Processes.getService("UiLib").data;
    Sfx = Root.Processes.getService("SfxLib").data;
    FsSvc = Root.Processes.getService("FsSvc").data;
    Forte = Root.Processes.getService("ForteSvc").data;

    wrapper = new Html("div").class("full-ui").appendTo("body");
    Ui.becomeTopUi(Pid, wrapper);

    const songList = FsSvc.getSongList();
    const songMap = new Map(songList.map((song) => [song.code, song]));
    let songItemElements = [];
    let state = {
      mode: "menu", // 'menu', 'player', 'yt-search'
      songNumber: "",
      highlightedIndex: -1,
      reservationNumber: "",
      reservationQueue: [],
      volume: config.audioConfig.mix.instrumental.volume,
      volumeOsdTimeout: null,
      searchResults: [],
      highlightedSearchIndex: -1,
      isSearching: false,
      currentSongIsYouTube: false,
    };
    const maxLength = 5;

    window.desktopIntegration.ipc.send("setRPC", {
      details: `Browsing ${songList.length} Songs...`,
      state: `Main Menu`,
    });

    await Forte.setVocalEffects(config.audioConfig.mix.vocal.effects);
    await Forte.setTrackVolume(config.audioConfig.mix.instrumental.volume);

    const bgvContainer = new Html("div")
      .class("bgv-container")
      .appendTo(wrapper);
    const youtubePlayerContainer = new Html("div")
      .class("youtube-player-container", "hidden")
      .appendTo(wrapper);
    const youtubeIframe = new Html("iframe").appendTo(youtubePlayerContainer);

    const overlay = new Html("div").class("overlay-ui").appendTo(wrapper);
    const searchUi = new Html("div")
      .class("search-ui", "hidden")
      .appendTo(wrapper);
    const playerUi = new Html("div")
      .class("player-ui", "hidden")
      .appendTo(wrapper);

    VolumeOSD.init(wrapper);
    TransposeOSD.init(wrapper);

    new Html("style")
      .text(
        `
        .loading * { opacity: 0 !important; }
        .bgv-container { position: absolute; inset: 0; background-color: #000; overflow: hidden; z-index: 1; }
        .youtube-player-container { position: absolute; inset: 0; z-index: 2; background: #000; }
        .youtube-player-container iframe { width: 100%; height: 100%; border: none; }

        .overlay-ui { display: flex; align-items: stretch; gap: 3rem; position: relative; width: 100%; height: 100%; padding: 2rem 3rem; background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 20%, transparent 50%, rgba(0,0,0,0.9) 100%); transition: opacity 0.3s ease-out; z-index: 10; }
        .hidden { opacity: 0; pointer-events: none; }
        .left-panel { flex: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.3s ease-out; }
        .right-panel { flex: 3; display: flex; flex-direction: column; background: rgba(10,10,20,0.7); border: 1px solid rgba(255,255,255,0.2); border-radius: 0.5rem; padding: 1.5rem; overflow: hidden; transition: opacity 0.3s ease-out; }
        .main-content { text-align: center; color: white; text-shadow: 2px 2px 8px rgba(0,0,0,0.8); }
        .main-content h1 { font-size: 2rem; font-weight: 500; margin-bottom: 0.5rem; }
        .number-display { font-family: 'Rajdhani', sans-serif; font-size: 10rem; line-height: 1; font-weight: 700; border: 2px solid rgba(255,255,255,0.3); border-radius: 0.5rem; padding: 1rem 2rem; letter-spacing: 0.5rem; transition: all 0.2s ease; }
        .number-display.active { transform: scale(1.02); border-color: #89CFF0; box-shadow: 0 0 20px #89CFF066; }
        .song-info { margin-top: 1.5rem; height: 100px; } .song-title { font-size: 2.5rem; font-weight: bold; } .song-artist { font-size: 1.5rem; opacity: 0.8; }
        .search-hint { margin-top: 1rem; font-size: 1.2rem; opacity: 0.5; font-family: 'Rajdhani', sans-serif; }
        .right-panel h2 { margin: 0 0 1rem 0; text-align: center; }
        .song-list-container { flex-grow: 1; overflow-y: auto; }
        .song-item { display: flex; padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); transition: background-color 0.2s; } .song-item.highlighted { background-color: #89CFF044; }
        .song-item-code { font-family: 'Rajdhani', sans-serif; font-weight: 700; width: 80px; color: #89CFF0; } .song-item-title { flex-grow: 1; } .song-item-artist { width: 30%; text-align: right; opacity: 0.7; }
        
        .search-ui { position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; transition: opacity 0.3s ease-out; z-index: 20; }
        .search-window { width: 90%; max-width: 1200px; height: 80vh; background: rgba(10,10,20,0.8); border: 1px solid rgba(255,255,255,0.2); border-radius: 0.5rem; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .search-input { font-family: 'Rajdhani', sans-serif; font-size: 2rem; background: rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.3); border-radius: 0.5rem; color: white; padding: 0.8rem 1.2rem; width: 100%; text-align: center; outline: none; transition: all 0.2s ease; flex-shrink: 0; }
        .search-input:focus { border-color: #89CFF0; box-shadow: 0 0 20px #89CFF066; }
        .search-results-container { flex-grow: 1; overflow-y: auto; }
        .search-result-item { display: flex; align-items: center; gap: 1rem; padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); transition: background-color 0.2s; }
        .search-result-item.highlighted { background-color: #89CFF044; }
        .search-thumbnail-wrapper { position: relative; }
        .search-thumbnail { width: 120px; height: 68px; object-fit: cover; border-radius: 0.25rem; flex-shrink: 0; }
        .search-duration { position: absolute; bottom: 0.2rem; right: 0.2rem; background: rgba(0,0,0,0.8); color: white; font-size: 0.8rem; padding: 0.1rem 0.3rem; border-radius: 0.2rem; }
        .search-info { display: flex; flex-direction: column; overflow: hidden; }
        .search-title { font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .search-channel { font-size: 0.9rem; opacity: 0.7; }

        .player-ui { position: absolute; inset: 0; padding: 2rem; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; transition: opacity 0.3s ease-out; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%); z-index: 15; }
        .lyrics-container, .midi-lyrics-container { width: 100%; max-width: 1200px; height: 350px; position: relative; }
        .lyrics-container { overflow: hidden; }
        .midi-lyrics-container { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 1rem; }
        .lyrics-scroller { position: relative; width: 100%; transition: transform 0.4s ease-in-out; }
        .lyric-line { margin: 0; text-align: center; font-size: 3rem; font-weight: bold; text-shadow: 2px 2px 6px #000; transition: all 0.3s ease; }
        .lyric-line.lrc { margin-bottom: 1rem; color: rgba(255, 255, 255, 0.4); }
        .lyric-line.past { opacity: 0.5; font-size: 2.7rem; }
        .lyric-line.active { color: #89CFF0; fontSize: 3.3rem; }
        .lyric-line-original { line-height: 1.2; }
        .lyric-line-romanized { font-size: 1.5rem; color: rgba(255, 255, 255, 0.5); line-height: 1.1; font-weight: 500; letter-spacing: 0.05em; }
        .lyric-line.active .lyric-line-romanized { color: #89CFF0; }
        .midi-lyric-line { display: flex; justify-content: center; flex-wrap: nowrap; white-space: pre; color: rgba(255, 255, 255, 0.4); }
        .midi-lyric-line.next { opacity: 0.5; }
        .lyric-syllable-container { display: inline-flex; flex-direction: column; align-items: center; margin: 0 0.1em; transition: transform 0.1s ease; }
        .lyric-syllable-original { font-size: inherit; color: rgba(255, 255, 255, 0.4); transition: color 0.1s linear; }
        .lyric-syllable-romanized { font-size: 1rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.25rem; line-height: 1; font-weight: 500; transition: color 0.1s linear; }
        .lyric-syllable-container.active { transform: scale(1.1); }
        .lyric-syllable-container.active .lyric-syllable-original,
        .lyric-syllable-container.active .lyric-syllable-romanized { color: #89CFF0; }
        .player-progress { width: 100%; max-width: 1200px; height: 10px; background: rgba(255,255,255,0.2); border-radius: 5px; margin-top: 2rem; }
        .progress-bar { width: 0%; height: 100%; background-color: #89CFF0; border-radius: 5px; transition: width 0.1s linear; }
        .karaoke-hud { position: absolute; top: 2rem; right: 2rem; display: flex; flex-direction: column; gap: 0.75rem; font-family: 'Rajdhani', sans-serif; font-weight: 700; z-index: 25; }
        .hud-box { background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.3); border-radius: 0.5rem; padding: 0.6rem 1.2rem; min-width: 280px; }
        .hud-label { color: #FFD700; font-size: 1rem; letter-spacing: 0.1rem; margin-bottom: 0.25rem; }
        .reservation-code { color: #89CFF0; font-size: 2.5rem; letter-spacing: 0.2rem; text-align: center; }
        .up-next-title { font-size: 1.4rem; color: #fff; text-shadow: 1px 1px 3px #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .up-next-artist { font-size: 1rem; color: #fff; opacity: 0.7; }
        .mode-menu .karaoke-hud, .mode-yt-search .karaoke-hud { display: none; }
    `,
      )
      .appendTo(wrapper);

    // --- Main Menu UI ---
    wrapper.classOn("loading");
    const leftPanel = new Html("div").class("left-panel").appendTo(overlay);
    const rightPanel = new Html("div").class("right-panel").appendTo(overlay);
    const mainContent = new Html("div")
      .class("main-content")
      .appendTo(leftPanel);
    new Html("h1").text("Enter Song Number").appendTo(mainContent);
    const numberDisplay = new Html("div")
      .class("number-display")
      .appendTo(mainContent);
    const songInfo = new Html("div").class("song-info").appendTo(mainContent);
    const songTitle = new Html("h2").class("song-title").appendTo(songInfo);
    const songArtist = new Html("p").class("song-artist").appendTo(songInfo);
    new Html("p")
      .class("search-hint")
      .text("Press 'Y' to Search YouTube")
      .appendTo(mainContent);
    new Html("h2").text("Song List").appendTo(rightPanel);
    const songListContainer = new Html("div")
      .class("song-list-container")
      .appendTo(rightPanel);
    songList.forEach((song) => {
      const item = new Html("div")
        .class("song-item")
        .appendTo(songListContainer);
      new Html("div").class("song-item-code").text(song.code).appendTo(item);
      new Html("div").class("song-item-title").text(song.title).appendTo(item);
      new Html("div")
        .class("song-item-artist")
        .text(song.artist)
        .appendTo(item);
      songItemElements.push(item);
    });

    // --- YouTube Search UI ---
    const searchWindow = new Html("div")
      .class("search-window")
      .appendTo(searchUi);
    const searchInput = new Html("input")
      .class("search-input")
      .attr({
        type: "text",
        placeholder: "Type here and press Enter to search...",
      })
      .appendTo(searchWindow);
    const searchResultsContainer = new Html("div")
      .class("search-results-container")
      .appendTo(searchWindow);

    // --- Player UI ---
    const lrcLyricsContainer = new Html("div")
      .class("lyrics-container")
      .appendTo(playerUi);
    const lyricsScroller = new Html("div")
      .class("lyrics-scroller")
      .appendTo(lrcLyricsContainer);
    const midiLyricsContainer = new Html("div")
      .class("midi-lyrics-container")
      .appendTo(playerUi);
    const midiLineDisplay1 = new Html("div")
      .class("lyric-line", "midi-lyric-line")
      .appendTo(midiLyricsContainer);
    const midiLineDisplay2 = new Html("div")
      .class("lyric-line", "midi-lyric-line", "next")
      .appendTo(midiLyricsContainer);
    const playerProgress = new Html("div")
      .class("player-progress")
      .appendTo(playerUi);
    const progressBar = new Html("div")
      .class("progress-bar")
      .appendTo(playerProgress);

    // --- HUD UI ---
    const karaokeHud = new Html("div").class("karaoke-hud").appendTo(wrapper);
    const reservationBox = new Html("div")
      .class("hud-box")
      .appendTo(karaokeHud);
    new Html("div").class("hud-label").text("RESERVE").appendTo(reservationBox);
    const reservationCodeEl = new Html("div")
      .class("reservation-code")
      .appendTo(reservationBox);
    const upNextBox = new Html("div").class("hud-box").appendTo(karaokeHud);
    new Html("div").class("hud-label").text("UP NEXT").appendTo(upNextBox);
    const upNextTitleEl = new Html("div")
      .class("up-next-title")
      .appendTo(upNextBox);
    const upNextArtistEl = new Html("div")
      .class("up-next-artist")
      .appendTo(upNextBox);

    const updateReservationUI = () => {
      const placeholder = "-----";
      const codeText = state.reservationNumber
        ? state.reservationNumber.padEnd(maxLength, "-")
        : placeholder;
      reservationCodeEl.text(codeText);
    };
    const updateUpNextUI = () => {
      if (state.reservationQueue.length === 0) {
        upNextTitleEl.text("—");
        upNextArtistEl.text("");
        return;
      }
      const nextCode = state.reservationQueue[0];
      const nextSong = songMap.get(nextCode);
      const extra =
        state.reservationQueue.length > 1
          ? ` (+${state.reservationQueue.length - 1} more)`
          : "";
      if (nextSong) {
        upNextTitleEl.text(nextSong.title);
        upNextArtistEl.text(nextSong.artist + extra);
      } else {
        upNextTitleEl.text(`Song ${nextCode}`);
        upNextArtistEl.text("Unknown Artist" + extra);
      }
    };
    const updateHud = () => {
      updateReservationUI();
      updateUpNextUI();
    };

    const setMode = (newMode) => {
      state.mode = newMode;
      wrapper.classOff("mode-menu", "mode-player", "mode-yt-search");
      wrapper.classOn(`mode-${newMode}`);

      overlay.classOn("hidden");
      playerUi.classOn("hidden");
      searchUi.classOn("hidden");

      if (newMode === "menu") {
        overlay.classOff("hidden");
        searchInput.elm.blur(); // Explicitly remove focus
        updateMenuUI();
      } else if (newMode === "player") {
        playerUi.classOff("hidden");
        updateHud();
      } else if (newMode === "yt-search") {
        searchUi.classOff("hidden");
        searchInput.elm.focus();
        searchInput.elm.select();
      }
    };

    const updateMenuUI = () => {
      let activeSong = null;
      let displayCode = "".padStart(maxLength, "0");
      if (state.songNumber.length > 0) {
        state.highlightedIndex = -1;
        displayCode = state.songNumber.padStart(maxLength, "0");
        activeSong = songMap.get(displayCode);
      } else if (state.highlightedIndex >= 0) {
        activeSong = songList[state.highlightedIndex];
        if (activeSong) displayCode = activeSong.code;
      }
      numberDisplay.text(displayCode);
      if (activeSong) {
        numberDisplay.classOn("active");
        songTitle.text(activeSong.title);
        songArtist.text(activeSong.artist);
      } else {
        numberDisplay.classOff("active");
        songTitle.text(
          state.songNumber.length === maxLength ? "Song Not Found" : "",
        );
        songArtist.text("");
      }
      songItemElements.forEach((item, index) => {
        if (index === state.highlightedIndex) {
          item.classOn("highlighted");
          item.elm.scrollIntoView({ block: "nearest" });
        } else {
          item.classOff("highlighted");
        }
      });
    };

    const updateSearchHighlight = () => {
      const items = searchResultsContainer.qsa(".search-result-item");
      if (!items) return;
      items.forEach((item, index) => {
        if (index === state.highlightedSearchIndex) {
          item.classOn("highlighted");
          item.elm.scrollIntoView({ block: "nearest" });
        } else {
          item.classOff("highlighted");
        }
      });
    };

    const renderSearchResults = () => {
      searchResultsContainer.clear();
      state.highlightedSearchIndex = -1;

      if (state.isSearching) {
        searchResultsContainer.text("Searching...");
        return;
      }
      if (state.searchResults.length === 0) {
        searchResultsContainer.text("No results found.");
        return;
      }

      state.searchResults.forEach((result) => {
        const item = new Html("div")
          .class("search-result-item")
          .appendTo(searchResultsContainer);
        const thumbWrapper = new Html("div")
          .class("search-thumbnail-wrapper")
          .appendTo(item);
        new Html("img")
          .class("search-thumbnail")
          .attr({ src: result.thumbnail.thumbnails[0].url })
          .appendTo(thumbWrapper);
        if (result.length && result.length.simpleText) {
          new Html("span")
            .class("search-duration")
            .text(result.length.simpleText)
            .appendTo(thumbWrapper);
        }
        const info = new Html("div").class("search-info").appendTo(item);
        new Html("div").class("search-title").text(result.title).appendTo(info);
        new Html("div")
          .class("search-channel")
          .text(result.channelTitle)
          .appendTo(info);
      });
      updateSearchHighlight();
    };

    const performSearch = async () => {
      const query = searchInput.getValue().trim();
      if (!query) return;

      state.isSearching = true;
      state.searchResults = [];
      renderSearchResults();

      try {
        const response = await fetch(
          `http://127.0.0.1:9864/yt-search?q=${encodeURIComponent(query)}`,
        );
        if (!response.ok) throw new Error("Search request failed");
        const data = await response.json();
        const items = data.items || [];
        state.searchResults = items.filter((item) => item.type === "video");
      } catch (error) {
        console.error("YouTube search failed:", error);
        state.searchResults = [];
      } finally {
        state.isSearching = false;
        renderSearchResults();
      }
    };

    searchInput.on("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
      }
    });

    const startPlayer = async (song) => {
      await Romanizer.init();

      if (timeUpdateHandler)
        document.removeEventListener(
          "CherryTree.Forte.Playback.TimeUpdate",
          timeUpdateHandler,
        );
      if (lyricEventHandler)
        document.removeEventListener(
          "CherryTree.Forte.Playback.LyricEvent",
          lyricEventHandler,
        );
      timeUpdateHandler = null;
      lyricEventHandler = null;

      lyricsScroller.clear();
      midiLineDisplay1.clear();
      midiLineDisplay2.clear();

      state.currentSongIsYouTube = song.path.startsWith("yt://");

      state.reservationNumber = "";
      setMode("player");

      window.desktopIntegration.ipc.send("setRPC", {
        details: song.title,
        state: song.artist,
      });

      if (state.currentSongIsYouTube) {
        bgvContainer.classOn("hidden");
        youtubePlayerContainer.classOff("hidden");
        const videoId = song.path.substring(5);
        youtubeIframe.attr({
          src: `https://cdpn.io/pen/debug/oNPzxKo?v=${videoId}&autoplay=1`,
          allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        });

        lrcLyricsContainer.classOn("hidden");
        midiLyricsContainer.classOn("hidden");
        playerProgress.classOn("hidden");
      } else {
        bgvContainer.classOff("hidden");
        youtubePlayerContainer.classOn("hidden");
        youtubeIframe.attr({ src: "" });

        lrcLyricsContainer.classOff("hidden");
        midiLyricsContainer.classOff("hidden");
        playerProgress.classOff("hidden");

        const trackUrl = new URL("http://127.0.0.1:9864/getFile");
        trackUrl.searchParams.append("path", song.path);
        await Forte.loadTrack(trackUrl.href);

        const playbackState = Forte.getPlaybackState();
        let lrcParsedLyrics = [],
          lrcLyricLines = [],
          currentLrcIndex = -1;

        if (playbackState.isMidi) {
          midiLyricsContainer.styleJs({ display: "flex" });
          lrcLyricsContainer.styleJs({ display: "none" });
          midiLineDisplay1.classOn("active").text(song.title);
          midiLineDisplay2.text(song.artist);
          const allSyllables = [];
          const lines = [];
          let currentLineSyllables = [];
          let displayableSyllableIndex = 0;
          playbackState.decodedLyrics.forEach((syllableText) => {
            const isNewLine = /[\r\n\/\\]/.test(syllableText);
            const cleanText = syllableText.replace(/[\r\n\/\\]/g, "");
            if (cleanText) {
              const syllable = {
                text: cleanText,
                romanized: Romanizer.romanize(cleanText),
                globalIndex: displayableSyllableIndex,
                lineIndex: lines.length,
              };
              allSyllables.push(syllable);
              currentLineSyllables.push(syllable);
              displayableSyllableIndex++;
            }
            if (isNewLine && currentLineSyllables.length > 0) {
              lines.push(currentLineSyllables);
              currentLineSyllables = [];
            }
          });
          if (currentLineSyllables.length > 0) lines.push(currentLineSyllables);
          let renderedLineIndex = -1;
          let activeIndices = new Set();
          lyricEventHandler = (e) => {
            const { index } = e.detail;
            if (index >= allSyllables.length) return;
            const activeSyllable = allSyllables[index];
            const currentLineIndex = activeSyllable.lineIndex;
            if (currentLineIndex !== renderedLineIndex) {
              renderedLineIndex = currentLineIndex;
              const currentLineData = lines[currentLineIndex];
              const nextLineData = lines[currentLineIndex + 1];
              const renderLine = (displayEl, lineData) => {
                displayEl.clear();
                if (!lineData) return;
                lineData.forEach((s) => {
                  const container = new Html("div")
                    .class("lyric-syllable-container")
                    .attr({ "data-index": s.globalIndex })
                    .appendTo(displayEl);
                  new Html("span")
                    .class("lyric-syllable-original")
                    .text(s.text)
                    .appendTo(container);
                  if (s.romanized) {
                    new Html("span")
                      .class("lyric-syllable-romanized")
                      .text(s.romanized)
                      .appendTo(container);
                  }
                  if (activeIndices.has(s.globalIndex)) {
                    container.classOn("active");
                  }
                });
              };
              renderLine(midiLineDisplay1, currentLineData);
              renderLine(midiLineDisplay2, nextLineData);
            }
            activeIndices.add(index);
            const newSyllableEl = wrapper.qs(
              `.lyric-syllable-container[data-index="${index}"]`,
            );
            if (newSyllableEl) newSyllableEl.classOn("active");
          };
          document.addEventListener(
            "CherryTree.Forte.Playback.LyricEvent",
            lyricEventHandler,
          );
        } else if (song.lrcPath) {
          midiLyricsContainer.styleJs({ display: "none" });
          lrcLyricsContainer.styleJs({ display: "block" });
          new Html("p")
            .class("lyric-line", "lrc", "active")
            .text(song.title)
            .appendTo(lyricsScroller);
          new Html("p")
            .class("lyric-line", "lrc")
            .text(song.artist)
            .appendTo(lyricsScroller);
          const lrcText = await FsSvc.readFile(song.lrcPath);
          const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
          if (lrcText) {
            lrcParsedLyrics = lrcText
              .split("\n")
              .map((line) => {
                const match = line.match(timeRegex);
                if (!match) return null;
                const time =
                  parseInt(match[1]) * 60 +
                  parseInt(match[2]) +
                  parseInt(match[3].padEnd(3, "0")) / 1000;
                const text = line.replace(timeRegex, "").trim();
                const romanized = Romanizer.romanize(text);
                return text ? { time, text, romanized } : null;
              })
              .filter(Boolean);
          }
        }
        const PRE_ROLL_DELAY_MS = 2500;
        setTimeout(() => {
          if (state.mode !== "player") return;
          if (playbackState.isMidi) {
            midiLineDisplay1.clear().classOff("active");
            midiLineDisplay2.clear();
          }
          if (lrcParsedLyrics.length > 0) {
            lyricsScroller.clear();
            const topPadding = lrcLyricsContainer.elm.clientHeight / 2;
            lyricsScroller.styleJs({
              paddingTop: `${topPadding}px`,
              paddingBottom: `${topPadding}px`,
            });
            lrcParsedLyrics.forEach((line) => {
              const p = new Html("p")
                .class("lyric-line", "lrc")
                .appendTo(lyricsScroller);
              new Html("div")
                .class("lyric-line-original")
                .text(line.text)
                .appendTo(p);
              if (line.romanized) {
                new Html("div")
                  .class("lyric-line-romanized")
                  .text(line.romanized)
                  .appendTo(p);
              }
              lrcLyricLines.push(p);
            });
          }
          Forte.playTrack();
        }, PRE_ROLL_DELAY_MS);
        timeUpdateHandler = (e) => {
          const { currentTime, duration } = e.detail;
          progressBar.styleJs({ width: `${(currentTime / duration) * 100}%` });
          if (
            lrcParsedLyrics.length === 0 ||
            lrcLyricLines.length === 0 ||
            playbackState.isMidi
          )
            return;
          let newIndex = -1;
          for (let i = lrcParsedLyrics.length - 1; i >= 0; i--)
            if (currentTime >= lrcParsedLyrics[i].time) {
              newIndex = i;
              break;
            }
          if (newIndex !== currentLrcIndex) {
            currentLrcIndex = newIndex;
            lrcLyricLines.forEach((line, i) => {
              line.classOff("active", "past");
              if (i < newIndex) line.classOn("past");
              else if (i === newIndex) line.classOn("active");
            });
            if (newIndex > -1) {
              const activeEl = lrcLyricLines[newIndex].elm;
              const scrollerTopPadding =
                lrcLyricsContainer.elm.clientHeight / 2;
              const scrollOffset =
                scrollerTopPadding -
                activeEl.offsetTop -
                activeEl.clientHeight / 2;
              lyricsScroller.styleJs({
                transform: `translateY(${scrollOffset}px)`,
              });
            }
          }
        };
        document.addEventListener(
          "CherryTree.Forte.Playback.TimeUpdate",
          timeUpdateHandler,
        );
      }
    };

    const stopPlayer = () => {
      youtubePlayerContainer.classOn("hidden");
      youtubeIframe.attr({ src: "" });
      bgvContainer.classOff("hidden");
      lyricsScroller.styleJs({ transform: "translateY(0)" });

      Forte.stopTrack();
      if (timeUpdateHandler)
        document.removeEventListener(
          "CherryTree.Forte.Playback.TimeUpdate",
          timeUpdateHandler,
        );
      if (lyricEventHandler)
        document.removeEventListener(
          "CherryTree.Forte.Playback.LyricEvent",
          lyricEventHandler,
        );
      timeUpdateHandler = null;
      lyricEventHandler = null;
      lastPlaybackStatus = null;
      state.currentSongIsYouTube = false;

      if (state.reservationQueue.length > 0) {
        const nextCode = state.reservationQueue.shift();
        updateHud();
        const nextSong = songMap.get(nextCode);
        if (nextSong) {
          startPlayer(nextSong);
          return;
        }
      }

      setMode("menu");
      window.desktopIntegration.ipc.send("setRPC", {
        details: `Browsing ${songList.length} Songs...`,
        state: `Main Menu`,
      });
    };

    const handleSubmit = () => {
      let songToPlay = null;
      if (state.songNumber.length > 0)
        songToPlay = songMap.get(state.songNumber.padStart(maxLength, "0"));
      else if (state.highlightedIndex >= 0)
        songToPlay = songList[state.highlightedIndex];
      if (songToPlay) {
        Sfx.playSfx("deck_ui_into_game_detail.wav");
        state.songNumber = "";
        state.highlightedIndex = -1;
        startPlayer(songToPlay);
      }
    };

    keydownHandler = (e) => {
      const isSearchInputFocused = document.activeElement === searchInput.elm;

      if (isSearchInputFocused) {
        const handledKeys = ["ArrowUp", "ArrowDown", "Enter", "Escape"];
        if (e.key === "Backspace" && searchInput.getValue().length === 0) {
          e.preventDefault();
          setMode("menu");
          return;
        }
        if (handledKeys.includes(e.key)) {
          e.preventDefault();
        } else {
          return;
        }
      } else {
        e.preventDefault();
      }

      if (e.key === "[" || e.key === "]") {
        BGVPlayer.cycleCategory(e.key === "[" ? -1 : 1);
        return;
      }

      if (e.key === "-" || e.key === "=") {
        const change = e.key === "-" ? -0.05 : 0.05;
        state.volume = Math.max(0, Math.min(1, state.volume + change));
        Forte.setTrackVolume(state.volume);
        VolumeOSD.show(state.volume);
        const updatedConfig = {
          ...config,
          audioConfig: {
            ...config.audioConfig,
            mix: {
              ...config.audioConfig.mix,
              instrumental: {
                ...config.audioConfig.mix.instrumental,
                volume: state.volume,
              },
            },
          },
        };
        window.desktopIntegration.ipc.send("updateConfig", updatedConfig);
        return;
      }

      if (state.mode === "menu") {
        if (e.key.toLowerCase() === "y") {
          setMode("yt-search");
          return;
        }
        if (e.key >= "0" && e.key <= "9") {
          if (state.songNumber.length < maxLength) {
            state.songNumber += e.key;
            Sfx.playSfx("deck_ui_navigation.wav");
          }
        } else if (e.key === "Backspace") {
          if (state.songNumber.length > 0) {
            state.songNumber = state.songNumber.slice(0, -1);
            Sfx.playSfx("deck_ui_out_of_game_detail.wav");
          }
        } else if (e.key === "ArrowDown") {
          state.songNumber = "";
          const newIndex = Math.min(
            songList.length - 1,
            state.highlightedIndex < 0 ? 0 : state.highlightedIndex + 1,
          );
          if (newIndex !== state.highlightedIndex) {
            state.highlightedIndex = newIndex;
            Sfx.playSfx("deck_ui_navigation.wav");
          }
        } else if (e.key === "ArrowUp") {
          state.songNumber = "";
          const newIndex = Math.max(0, state.highlightedIndex - 1);
          if (newIndex !== state.highlightedIndex) {
            state.highlightedIndex = newIndex;
            Sfx.playSfx("deck_ui_navigation.wav");
          }
        } else if (e.key === "Enter") {
          handleSubmit();
        }
        updateMenuUI();
      } else if (state.mode === "yt-search") {
        if (e.key === "Escape") {
          setMode("menu");
        } else if (e.key === "ArrowDown") {
          if (isSearchInputFocused) {
            searchInput.elm.blur();
            state.highlightedSearchIndex = 0;
          } else if (state.searchResults.length > 0) {
            state.highlightedSearchIndex = Math.min(
              state.searchResults.length - 1,
              state.highlightedSearchIndex + 1,
            );
          }
          Sfx.playSfx("deck_ui_navigation.wav");
          updateSearchHighlight();
        } else if (e.key === "ArrowUp") {
          if (!isSearchInputFocused && state.highlightedSearchIndex === 0) {
            state.highlightedSearchIndex = -1;
            searchInput.elm.focus();
          } else if (state.searchResults.length > 0) {
            state.highlightedSearchIndex = Math.max(
              0,
              state.highlightedSearchIndex - 1,
            );
          }
          Sfx.playSfx("deck_ui_navigation.wav");
          updateSearchHighlight();
        } else if (e.key === "Enter") {
          if (state.highlightedSearchIndex !== -1) {
            const video = state.searchResults[state.highlightedSearchIndex];
            if (video) {
              const songToPlay = {
                title: video.title,
                artist: video.channelTitle,
                path: `yt://${video.id}`,
              };
              Sfx.playSfx("deck_ui_into_game_detail.wav");
              startPlayer(songToPlay);
            }
          }
        }
      } else if (state.mode === "player") {
        if (
          !state.currentSongIsYouTube &&
          (e.key === "ArrowUp" || e.key === "ArrowDown")
        ) {
          const playbackState = Forte.getPlaybackState();
          const change = e.key === "ArrowUp" ? 1 : -1;
          const currentTranspose = playbackState.transpose || 0;
          const newTranspose = Math.max(
            -24,
            Math.min(24, currentTranspose + change),
          );
          Forte.setTranspose(newTranspose);
          TransposeOSD.show(newTranspose);
          return;
        }

        if (e.key >= "0" && e.key <= "9") {
          if (state.reservationNumber.length < maxLength) {
            state.reservationNumber += e.key;
            Sfx.playSfx("deck_ui_navigation.wav");
          }
          updateReservationUI();
        } else if (e.key === "Backspace") {
          if (state.reservationNumber.length > 0) {
            state.reservationNumber = state.reservationNumber.slice(0, -1);
            Sfx.playSfx("deck_ui_out_of_game_detail.wav");
            updateReservationUI();
          } else {
            Sfx.playSfx("deck_ui_out_of_game_detail.wav");
            stopPlayer();
          }
        } else if (e.key === "Enter") {
          if (state.reservationNumber.length > 0) {
            const code = state.reservationNumber.padStart(maxLength, "0");
            if (songMap.has(code)) {
              state.reservationQueue.push(code);
              Sfx.playSfx("deck_ui_into_game_detail.wav");
              state.reservationNumber = "";
              updateHud();
            } else {
              Sfx.playSfx("deck_ui_out_of_game_detail.wav");
            }
          }
        } else if (e.key === "Escape") {
          if (state.reservationNumber.length > 0) {
            state.reservationNumber = "";
            Sfx.playSfx("deck_ui_out_of_game_detail.wav");
            updateReservationUI();
          } else {
            stopPlayer();
          }
        }
      }
    };

    playbackUpdateHandler = (e) => {
      const { status } = e.detail || {};
      if (
        state.mode === "player" &&
        lastPlaybackStatus === "playing" &&
        status === "stopped"
      ) {
        if (state.reservationQueue.length > 0) {
          lyricsScroller.styleJs({ transform: "translateY(0)" });
          const nextCode = state.reservationQueue.shift();
          updateHud();
          const nextSong = songMap.get(nextCode);
          if (nextSong) {
            setTimeout(() => startPlayer(nextSong), 120);
            lastPlaybackStatus = status;
            return;
          }
        }
        stopPlayer();
      }
      lastPlaybackStatus = status;
    };
    document.addEventListener(
      "CherryTree.Forte.Playback.Update",
      playbackUpdateHandler,
    );

    window.addEventListener("keydown", keydownHandler);
    await BGVPlayer.init(bgvContainer);
    BGVPlayer.start();

    // Ensure everything is loaded before showing UI
    setTimeout(() => {
      wrapper.classOff("loading");
      Ui.transition("fadeIn", wrapper);
      setMode("menu");
    }, 100);
  },
  end: async function () {
    if (keydownHandler) window.removeEventListener("keydown", keydownHandler);
    if (timeUpdateHandler)
      document.removeEventListener(
        "CherryTree.Forte.Playback.TimeUpdate",
        timeUpdateHandler,
      );
    if (playbackUpdateHandler)
      document.removeEventListener(
        "CherryTree.Forte.Playback.Update",
        playbackUpdateHandler,
      );
    if (lyricEventHandler)
      document.removeEventListener(
        "CherryTree.Forte.Playback.LyricEvent",
        lyricEventHandler,
      );

    keydownHandler = null;
    timeUpdateHandler = null;
    playbackUpdateHandler = null;
    lyricEventHandler = null;
    lastPlaybackStatus = null;

    BGVPlayer.stop();
    Forte.stopTrack();
    Forte.stopVocalEngine();
    Ui.cleanup(Pid);
    Sfx.playSfx("deck_ui_out_of_game_detail.wav");
    Ui.giveUpUi(Pid);
    wrapper.cleanup();
  },
};

const TransposeOSD = {
  osd: null,
  timeout: null,
  visible: false,

  init(container) {
    const osd = new Html("div")
      .styleJs({
        position: "absolute",
        right: "2rem",
        bottom: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: "700",
        opacity: "0",
        transition: "opacity 0.3s ease, bottom 0.3s ease",
        pointerEvents: "none",
        zIndex: 100000,
      })
      .appendTo(container);

    const osdBox = new Html("div")
      .styleJs({
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: "0.5rem",
        padding: "0.6rem 1.2rem",
        minWidth: "240px",
      })
      .appendTo(osd);

    new Html("div")
      .styleJs({
        color: "#FFD700",
        fontSize: "1rem",
        letterSpacing: "0.1rem",
        marginBottom: "0.25rem",
      })
      .text("TRANSPOSE")
      .appendTo(osdBox);

    this.transposeDisplay = new Html("div")
      .styleJs({
        color: "#89CFF0",
        fontSize: "2rem",
        letterSpacing: "0.2rem",
        textAlign: "center",
      })
      .appendTo(osdBox);

    this.osd = osd;
  },

  show(semitones) {
    if (this.timeout) clearTimeout(this.timeout);
    const sign = semitones > 0 ? "+" : "";
    this.transposeDisplay.text(`${sign}${semitones}`);

    this.osd.styleJs({
      opacity: "1",
      bottom: VolumeOSD.visible ? "8rem" : "2rem",
    });

    this.visible = true;
    this.timeout = setTimeout(() => {
      this.osd.styleJs({ opacity: "0" });
      this.visible = false;
    }, 3000);
  },
};

const VolumeOSD = {
  osd: null,
  timeout: null,
  visible: false,

  init(container) {
    const osd = new Html("div")
      .styleJs({
        position: "absolute",
        right: "2rem",
        bottom: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: "700",
        opacity: "0",
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
        zIndex: 100000,
      })
      .appendTo(container);

    const osdBox = new Html("div")
      .styleJs({
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: "0.5rem",
        padding: "0.6rem 1.2rem",
        minWidth: "240px",
      })
      .appendTo(osd);

    new Html("div")
      .styleJs({
        color: "#FFD700",
        fontSize: "1rem",
        letterSpacing: "0.1rem",
        marginBottom: "0.25rem",
      })
      .text("VOLUME")
      .appendTo(osdBox);

    this.volumeDisplay = new Html("div")
      .styleJs({
        color: "#89CFF0",
        fontSize: "2rem",
        letterSpacing: "0.2rem",
        textAlign: "center",
      })
      .appendTo(osdBox);

    this.osd = osd;
  },

  show(volume) {
    if (this.timeout) clearTimeout(this.timeout);
    this.volumeDisplay.text(`${Math.round(volume * 100)}%`);
    this.osd.styleJs({ opacity: "1" });
    this.visible = true;

    if (TransposeOSD.visible) {
      TransposeOSD.osd.styleJs({ bottom: "8rem" });
    }

    this.timeout = setTimeout(() => {
      this.osd.styleJs({ opacity: "0" });
      this.visible = false;
      if (TransposeOSD.visible) {
        TransposeOSD.osd.styleJs({ bottom: "2rem" });
      }
    }, 3000);
  },
};

export default pkg;
