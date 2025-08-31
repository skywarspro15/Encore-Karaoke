import Html from "/libs/html.js";

let Processes, Ui;
let Sfx = { playSfx() {} };

export default {
  init(p) {
    Processes = p;

    // hacky way to find UiLib before it's initialized
    let x = setInterval(() => {
      if (Processes.getService("UiLib") !== undefined) {
        Ui = Processes.getService("UiLib").data;
        clearInterval(x);
      }
    }, 1000);
  },
  async new(callback, layout, uiNum) {
    Sfx = Processes.getService("SfxLib").data;

    function handleInput(e) {
      callback({ type: "key", data: e.target.textContent });
      Sfx.playSfx("deck_ui_typing.wav");
      // inputBox.elm.value += e.target.textContent;
    }

    const keysOri = (await import(`/assets/keyboard_layouts/${layout}.js`))
      .default;

    const keyList = keysOri.normal;

    let keyMode = "normal";

    let keysHtml = [];

    function modeSwitch(mode, quiet = false) {
      let previousMode = keyMode.toString();

      if (mode) keyMode = mode;
      else {
        console.log("Mode not found in layout:", mode);
        keyMode = "normal";
      }

      if (quiet === false) Sfx.playSfx("deck_ui_switch_toggle_on.wav");

      // Update keys
      keysHtml.forEach((k) => {
        let foundKey = null,
          X,
          Y;

        keysOri[previousMode].forEach((row, y) => {
          row.forEach((obj, x) => {
            if (obj.key === k.elm.textContent) {
              foundKey = obj;
              X = x;
              Y = y;
            }
          });
        });

        if (foundKey) {
          let keyData = keysOri[keyMode][Y][X];
          k.elm.textContent = keyData.key;
          k.elm.classList.remove("wide", "small", "sm", "pressed");
          switch (keyData.type) {
            case "normal":
              k.elm.classList.add("sm");
              break;
            case "normal_pressed":
              k.elm.classList.add("pressed", "sm");
              break;
            case "wide":
              k.elm.classList.add("wide");
              break;
            default:
              k.elm.classList.add("small");
              break;
          }
        } else console.log("No key for", k, "found in", keyMode);
      });
    }

    function keyHandle(event, y, x) {
      const currentKey = keysOri[keyMode][y][x];

      if (currentKey.modeSwitch !== undefined) {
        // Modifier key
        // console.log("[Keyboard] ModKey", currentKey.key);
        modeSwitch(currentKey.modeSwitch);
        return;
      }

      if (currentKey.special) {
        switch (currentKey.special) {
          case "space":
            callback({ type: "key", data: " " });
            break;
          case "complete":
            callback({ type: "special", data: "complete" });
            break;
          case "cancel":
            callback({ type: "special", data: "cancel" });
            break;
          case "backspace":
            callback({ type: "special", data: "backspace" });
            break;
        }
      } else handleInput(event);

      if (keyMode === "shift") {
        modeSwitch("normal");
      }
    }

    const keysListHtml = keyList.map((keyRow, y) => {
      const keys = keyRow.map((k, x) => {
        if (k.type === "normal" || k.type === "normal_pressed") {
          return new Html("button")
            .class("sm", "key")
            .html(keysOri[keyMode][y][x].key)
            .on("click", (e) => keyHandle(e, y, x));
        } else {
          return new Html("button")
            .class("small", "key")
            .html(keysOri[keyMode][y][x].key)
            .on("click", (e) => keyHandle(e, y, x));
        }
      });
      keysHtml.push(...keys);
      return new Html("div").class("flex-row-small").appendMany(...keys);
    });

    modeSwitch("normal", true);

    let lastX = -1,
      lastY = -1;

    return {
      keysListHtml,
      buttonHandler(btn) {
        if (btn.y) {
          // smart way of saving button input
          if (lastY === 4 && btn.y === 3) {
            Ui.updatePos(uiNum, { x: lastX, y: 3 });
          }
          lastY = btn.y;
          if (lastY !== 4) {
            lastX = btn.x;
          }
        }

        if (btn === "act") {
          callback({ type: "special", data: "backspace" });
          Sfx.playSfx("deck_ui_slider_down.wav");
        } else if (btn === "alt") {
          callback({ type: "key", data: " " });
          Sfx.playSfx("deck_ui_slider_up.wav");
        }
      },
    };
  },
};
