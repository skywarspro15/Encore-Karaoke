import Modal from "./modal.js";
import Html from "./html.js";
import langManager from "./l10n/manager.js";
import Notify from "./notify.js";

export default {
  togglePhoneLink: async (pid, wrapper) => {
    let remoteLinkState = await window.localforage.getItem(
      "settings__phoneLink",
    );

    const result = await Modal.Show({
      parent: wrapper,
      pid: pid,
      title: "Phone Link Settings",
      description:
        "Phone Link is currently " +
        (remoteLinkState === true ? "enabled" : "disabled") +
        ".",
      buttons: [
        {
          type: "primary",
          text: "On",
        },
        {
          type: "primary",
          text: "Off",
        },
      ],
    });

    if (result.id === 0) {
      // enable
      document.dispatchEvent(
        new CustomEvent("CherryTree.Input.EnableTvRemote"),
      );
    } else if (result.id === 1) {
      // disable
      document.dispatchEvent(
        new CustomEvent("CherryTree.Input.DisableTvRemote"),
      );
    }
  },
  uiScaling: async (pid, wrapper, Ui) => {
    let getScaleValue = Ui.scaling.getScaleValue;

    let values = [
      {
        label: "60%",
        scale: getScaleValue(60),
      },
      {
        label: "70%",
        scale: getScaleValue(70),
      },
      {
        label: "85%",
        scale: getScaleValue(85),
      },
      {
        label: "100%",
        scale: "16px",
      },
      {
        label: "125%",
        scale: getScaleValue(125),
      },
      {
        label: "150%",
        scale: getScaleValue(150),
      },
      {
        label: "175%",
        scale: getScaleValue(175),
      },
      {
        label: "200%",
        scale: getScaleValue(200),
      },
    ];

    const result = await Modal.Show({
      parent: wrapper,
      pid: pid,
      title: "Configure UI scaling",
      description: "Select the zoom level",
      buttons: values.map((m) => {
        return {
          type: "primary",
          text: m.label,
        };
      }),
    });

    if (result.canceled === true) return;
    document.documentElement.style.fontSize = values[result.id].scale;
    await window.localforage.setItem(
      "settings__uiScale",
      values[result.id].scale,
    );
  },
  background: async (pid, wrapper, Background) => {
    const result = await Modal.Show({
      parent: wrapper,
      pid: pid,
      title: "Configure background",
      description: "Select the background type you prefer.",
      buttons: [
        {
          type: "primary",
          text: "Basic",
        },
        {
          type: "primary",
          text: "Space",
        },
      ],
    });

    if (result.canceled === true) return;

    let value;

    switch (result.id) {
      case 0:
        value = "none";
        break;
      case 1:
        value = "stars";
        break;
    }

    await Background.toggle(value);

    await window.localforage.setItem(
      "settings__backgroundType",
      value === true ? "stars" : "none",
    );
  },
  changeVolume: async (pid, wrapper, Sfx) => {
    let ContainerDiv = new Html("div").class("flex-col");

    let inputBox = new Html("div")
      .class("input")
      .attr({ type: "text" })
      .appendTo(ContainerDiv);

    let cb;

    function handleInput(e) {
      inputBox.elm.textContent += e.target.textContent;
    }

    // input list
    new Html("div")
      .appendTo(ContainerDiv)
      .class("flex-col", "buttons")
      .appendMany(
        new Html("div").class("flex-row").appendMany(
          new Html("button").text("1").on("click", (e) => handleInput(e)),
          new Html("button").text("2").on("click", (e) => handleInput(e)),
          new Html("button").text("3").on("click", (e) => handleInput(e)),
        ),
        new Html("div").class("flex-row").appendMany(
          new Html("button").text("4").on("click", (e) => handleInput(e)),
          new Html("button").text("5").on("click", (e) => handleInput(e)),
          new Html("button").text("6").on("click", (e) => handleInput(e)),
        ),
        new Html("div").class("flex-row").appendMany(
          new Html("button").text("7").on("click", (e) => handleInput(e)),
          new Html("button").text("8").on("click", (e) => handleInput(e)),
          new Html("button").text("9").on("click", (e) => handleInput(e)),
        ),
        new Html("div").class("flex-row").appendMany(
          new Html("button")
            .html("&larr;")
            .on(
              "click",
              (e) =>
                (inputBox.elm.textContent = inputBox.elm.textContent.substring(
                  0,
                  inputBox.elm.textContent.length - 1,
                )),
            ),
          new Html("button").text("0").on("click", (e) => handleInput(e)),
          new Html("button").text("Confirm").on("click", (e) =>
            cb({
              canceled: false,
              text: inputBox.elm.textContent,
              id: -1,
            }),
          ),
        ),
      );

    const result = await Modal.Show({
      parent: wrapper,
      pid: pid,
      title: "Volume level",
      description: "Set the main volume level for the system (0-100%)",
      type: "custom",
      customSfx: {
        hover: "deck_ui_navigation.wav",
        activate: "deck_ui_typing.wav",
      },
      customData: ContainerDiv,
      customType: "slider",
      dataHandler: function (clb) {
        // Callback the callback
        cb = clb;
      },
    });

    Sfx.setVolume(parseInt(inputBox.elm.textContent) / 100);
    await window.localforage.setItem(
      "settings__soundVolume",
      inputBox.elm.textContent,
    );
  },
  sfx: async (pid, wrapper, Sfx) => {
    let sfxPack = await window.localforage.getItem("settings__sfxPack");

    async function promptDone() {
      await Modal.Show({
        parent: wrapper,
        pid: pid,
        title: "Completed",
        description: "Your new sound effect pack has been applied.",
        buttons: [
          {
            type: "primary",
            text: "OK",
          },
        ],
      });
    }

    const menuResult = await Modal.Show({
      parent: wrapper,
      pid: pid,
      title: "Configure sounds",
      description: "Which setting would you like to configure?",
      buttons: [
        {
          type: "primary",
          text: "Change sound pack",
        },
      ],
    });

    if (menuResult.canceled === true) return;
    if (menuResult.id === 0) {
      const result = await Modal.Show({
        parent: wrapper,
        pid: pid,
        title: "Configure sound effects",
        description: "Select the sound pack to be used.",
        buttons: [
          {
            type: "primary",
            text: "Dreamy SFX (default)",
          },
          {
            type: "primary",
            text: "Steam Deck",
          },
          {
            type: "primary",
            text: "round sounds (cadecomposer)",
          },
          {
            type: "primary",
            text: "Material Sounds (NoctenUI)",
          },
          {
            type: "primary",
            text: "PS Sounds (PS5)",
          },
          {
            type: "primary",
            text: "Cherry Tree TV",
          },
        ],
      });

      if (result.canceled === true) return;

      switch (result.id) {
        case 0:
          sfxPack = "/assets/audio/sfx_dreamy.zip";
          break;
        case 1:
          sfxPack = "/assets/audio/sfx_deck.zip";
          break;
        case 2:
          sfxPack = "/assets/audio/sfx_floating.zip";
          break;
        case 3:
          sfxPack = "/assets/audio/sfx_nocturn.zip";
          break;
        case 4:
          sfxPack = "/assets/audio/sfx_ps.zip";
          break;
        case 5:
          sfxPack = "/assets/audio/sfx_new.zip";
          break;
      }

      await window.localforage.setItem("settings__sfxPack", sfxPack);

      let A;

      await Modal.showWithoutButtons(
        "Loading",
        "Downloading content...",
        wrapper,
        pid,
        function (a) {
          A = a;
        },
      );

      await Sfx.init(sfxPack);
      await A();

      await promptDone();
    }
  },
  bgm: async (pid, wrapper, Sfx) => {
    let playBgm = await window.localforage.getItem("settings__playBgm");
    let bgmSong = await window.localforage.getItem("settings__bgmSong");

    async function promptDone() {
      Notify.show("Actions Applied", `Your actions have been applied.`);
    }

    const menuResult = await Modal.Show({
      parent: wrapper,
      pid: pid,
      title: "Configure background music",
      description: "Which setting would you like to configure?",
      buttons: [
        {
          type: "primary",
          text: "Enable/disable music",
        },
        {
          type: "primary",
          text: "Change music",
        },
      ],
    });

    if (menuResult.canceled === true) return;
    if (menuResult.id === 0) {
      if (playBgm === null) playBgm = true;

      const value = playBgm === false ? true : false;
      await window.localforage.setItem("settings__playBgm", value);

      const audio = Sfx.getAudio();
      if (value === true) {
        audio.play();
      } else {
        audio.pause();
      }

      await promptDone();
    } else if (menuResult.id === 1) {
      const result = await Modal.Show({
        parent: wrapper,
        pid: pid,
        title: "Configure background music",
        description: "Select the background music song to be played.",
        buttons: [
          {
            type: "primary",
            text: "Dreamy Ambience (default)",
          },
          {
            type: "primary",
            text: "Shopping Centre",
          },
          {
            type: "primary",
            text: "floating alone (cadecomposer)",
          },
          {
            type: "primary",
            text: "Ambient (NoctenUI)",
          },
          {
            type: "primary",
            text: "Homebrew Channel",
          },
          {
            type: "primary",
            text: "PS Music (PS5)",
          },
        ],
      });

      if (result.canceled === true) return;

      switch (result.id) {
        case 0:
          bgmSong = "/assets/audio/bgm_dreamy.mp3";
          break;
        case 1:
          bgmSong = "/assets/audio/bgm_shop.mp3";
          break;
        case 2:
          bgmSong = "/assets/audio/bgm_floating.mp3";
          break;
        case 3:
          bgmSong = "/assets/audio/bgm_nocturn.mp3";
          break;
        case 4:
          bgmSong = "/assets/audio/homebrew.mp3";
          break;
        case 5:
          bgmSong = "/assets/audio/bgm_ps.mp3";
          break;
      }

      await window.localforage.setItem("settings__bgmSong", bgmSong);

      let A;

      await Modal.showWithoutButtons(
        langManager.getString("status.loading"),
        langManager.getString("status.downloadingContent"),
        wrapper,
        pid,
        function (a) {
          A = a;
        },
      );

      await Sfx.changeBgm(bgmSong);

      await A();
      await promptDone();
    }
  },
  audioInputSelection: async (pid, wrapper) => {
    let audioInputs = [];
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      audioInputs = devices.filter((d) => d.kind === "audioinput");
    }

    let audioResult = await Modal.Show({
      parent: wrapper,
      pid: pid,
      title: "Select Audio Input",
      description: "Choose your preferred audio input device.",
      buttons:
        audioInputs.length > 0
          ? audioInputs.map((d) => ({
              type: "primary",
              text: d.label || `Audio Input ${d.deviceId.slice(-4)}`,
            }))
          : [{ type: "primary", text: "No audio input found", disabled: true }],
    });
    if (audioResult.canceled === true || audioInputs.length === 0) return;

    await window.localforage.setItem(
      "settings__audioInput",
      audioInputs[audioResult.id].deviceId,
    );

    document.dispatchEvent(
      new CustomEvent("CherryTree.Comms.Audio.Update", {
        detail: audioInputs[audioResult.id].deviceId,
      }),
    );

    Notify.show("Audio Input Selection", "Audio input device has been set.");
  },
  videoInputSelection: async (pid, wrapper) => {
    let videoInputs = [];
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      videoInputs = devices.filter((d) => d.kind === "videoinput");
    }

    let videoResult = await Modal.Show({
      parent: wrapper,
      pid: pid,
      title: "Select Video Input",
      description: "Choose your preferred video input device.",
      buttons:
        videoInputs.length > 0
          ? videoInputs.map((d) => ({
              type: "primary",
              text: d.label || `Video Input ${d.deviceId.slice(-4)}`,
            }))
          : [{ type: "primary", text: "No video input found", disabled: true }],
    });
    if (videoResult.canceled === true || videoInputs.length === 0) return;

    await window.localforage.setItem(
      "settings__videoInput",
      videoInputs[videoResult.id].deviceId,
    );

    document.dispatchEvent(
      new CustomEvent("CherryTree.Comms.Video.Update", {
        detail: videoInputs[videoResult.id].deviceId,
      }),
    );

    Notify.show("Video Input Selection", "Video input device has been set.");
  },
};
