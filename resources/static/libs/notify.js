import { buttons, getFriendlyButtonName } from "./getButton.js";
import Html from "/libs/html.js";

let notifyBox, Processes;
let Sfx = { playSfx() {} };

export default {
  init: function (Proc) {
    Processes = Proc;
    // SfxLib = Processes.getService('SfxLib');

    let loop = setInterval((_) => {
      if (Processes.getService("SfxLib") !== undefined) {
        clearInterval(loop);
        Sfx = Processes.getService("SfxLib").data;
      }
    }, 1000);
  },
  show: function (title, description, buttonAction = null, callback = null) {
    if (notifyBox === undefined)
      notifyBox = new Html("div").class("notify-box").appendTo("body");

    let notifyTitle = new Html("div").class("notify-title").text(title);
    let notifyDescription = new Html("div")
      .class("notify-text")
      .text(description);

    let t = title;
    let d = description;
    let player = window.currentPlayerId;

    function update(e) {
      const num = e.detail;
      t = title;
      d = description;

      for (const button of buttons) {
        const name = getFriendlyButtonName(num, button);

        t = t.replace(`%${button}%`, `<kbd>${name}</kbd>`);
        d = d.replace(`%${button}%`, `<kbd>${name}</kbd>`);
      }

      notifyTitle.html(t);
      notifyDescription.html(d);
    }

    update({ detail: player });

    let isRemoveButtonAction = false,
      btnActionIndex = -1;

    if (buttonAction !== null && buttonAction !== undefined) {
      if (
        callback !== null &&
        callback !== undefined &&
        typeof callback === "function"
      ) {
        if (typeof buttonAction === "string") {
          if (buttons.includes(buttonAction)) {
            isRemoveButtonAction = true;
            btnActionIndex =
              window.gpListeners[buttonAction].push(() => {
                callback();
                cleanup();
              }) - 1;
          }
        }
      }
    }

    function cleanup() {
      if (isRemoveButtonAction) {
        window.gpListeners[buttonAction].splice(btnActionIndex, 1);
      }
    }

    document.addEventListener("CherryTree.Ui.ControllerChange", update);

    Sfx.playSfx("deck_ui_toast.wav");

    let notify = new Html("div")
      .class("notify", "slideIn")
      .appendMany(notifyTitle, notifyDescription)
      .appendTo(notifyBox);
    setTimeout(() => {
      notify.classOff("slideIn").classOn("slideOut");
      cleanup();
      setTimeout(() => {
        notify.cleanup();
        document.removeEventListener("CherryTree.Ui.ControllerChange", update);
      }, 500);
    }, 5000);
  },
};
