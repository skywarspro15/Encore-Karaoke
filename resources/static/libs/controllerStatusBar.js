import Html from "./html.js";

import { buttons, getFriendlyButtonName } from "./getButton.js";

export default class ControllerStatusBar {
  constructor(...buttons) {
    if (document.querySelector(".controller-status-bar") !== null) {
      this.pastBar = document.querySelector(".controller-status-bar");
      this.pastBar.classList.add("slideDownOut");
    }

    const bar = new Html("div")
      .class("controller-status-bar", "slideDownIn")
      .appendTo("body");

    this.bar = bar;
    this.buttons = buttons;

    document.addEventListener("CherryTree.Ui.ControllerChange", (e) =>
      this.update(e.detail),
    );

    this.update(
      window.currentPlayerId === undefined ? 4 : window.currentPlayerId,
    );
  }

  update(newPlayer) {
    this.bar.clear();

    let player = newPlayer;

    for (const button of this.buttons) {
      if (!button.type) {
        continue;
      }
      if (!button.label) {
        continue;
      }

      const btn = new Html("div").class("csb-button");
      let btnIcon;
      for (const buttonInfo of buttons) {
        const name = getFriendlyButtonName(player, buttonInfo);

        if (button.type === buttonInfo) {
          if (name.startsWith("<")) {
            btnIcon = new Html("span").class("csb-button-icon").appendTo(btn);
          } else {
            btnIcon = new Html("kbd").class("csb-button-icon").appendTo(btn);
          }
          btnIcon.html(name);
          /* btnLabel */
          new Html("div")
            .class("csb-button-label")
            .text(button.label)
            .appendTo(btn);
        }
      }

      btn.appendTo(this.bar);
    }
  }

  cleanup() {
    document.removeEventListener("CherryTree.Ui.ControllerChange", () => {
      this.update(this);
    });
    this.bar.classOff("slideDownIn").classOn("slideDownOut");
    if (this.pastBar !== undefined) {
      this.pastBar.classList.remove("slideDownOut");
      this.pastBar.classList.add("slideDownIn");
    }
    setTimeout(() => {
      this.bar.cleanup();
    }, 500);
  }
}
