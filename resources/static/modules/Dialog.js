import Html from "/libs/html.js";

let currentDialog = null;
let dialogTimeout = null;

export default function generateDialog(elm, duration = 5000) {
  if (currentDialog) {
    currentDialog.cleanup();
    clearTimeout(dialogTimeout);
  }

  let dialog = new Html("div")
    .classOn("temp-dialog")
    .append(elm)
    .appendTo("body");

  currentDialog = dialog;
  dialogTimeout = setTimeout(() => {
    dialog.cleanup();
    currentDialog = null;
    clearTimeout(dialogTimeout);
  }, duration);
}
