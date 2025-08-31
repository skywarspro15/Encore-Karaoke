import controllerMapping from "./controllerMapping.js";

export const buttons = [
  "left",
  "right",
  "up",
  "down",
  "any-dir",
  "confirm",
  "back",
  "act",
  "alt",
  "menu",
];

export function getFriendlyButtonName(playerNumber, button) {
  if (button === "any-dir")
    return `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19.6364 0.363604C19.2849 0.012132 18.7151 0.012132 18.3636 0.363604L12.636 6.09117C12.2846 6.44264 12.2846 7.01249 12.636 7.36396C12.9875 7.71543 13.5574 7.71543 13.9088 7.36396L19 2.27279L24.0912 7.36396C24.4426 7.71543 25.0125 7.71543 25.364 7.36396C25.7154 7.01249 25.7154 6.44264 25.364 6.09117L19.6364 0.363604ZM19.9 19L19.9 1L18.1 1L18.1 19L19.9 19Z" fill="white"/>
<path d="M18.3636 37.6364C18.7151 37.9879 19.2849 37.9879 19.6364 37.6364L25.364 31.9088C25.7154 31.5574 25.7154 30.9875 25.364 30.636C25.0125 30.2846 24.4426 30.2846 24.0912 30.636L19 35.7272L13.9088 30.636C13.5574 30.2846 12.9875 30.2846 12.636 30.636C12.2846 30.9875 12.2846 31.5574 12.636 31.9088L18.3636 37.6364ZM18.1 19L18.1 37L19.9 37L19.9 19L18.1 19Z" fill="white"/>
<path d="M37.6364 19.6364C37.9879 19.2849 37.9879 18.7151 37.6364 18.3636L31.9088 12.636C31.5574 12.2846 30.9875 12.2846 30.636 12.636C30.2846 12.9875 30.2846 13.5574 30.636 13.9088L35.7272 19L30.636 24.0912C30.2846 24.4426 30.2846 25.0125 30.636 25.364C30.9875 25.7154 31.5574 25.7154 31.9088 25.364L37.6364 19.6364ZM19 19.9L37 19.9V18.1L19 18.1V19.9Z" fill="white"/>
<path d="M0.363604 18.3636C0.012132 18.7151 0.012132 19.2849 0.363604 19.6364L6.09117 25.364C6.44264 25.7154 7.01249 25.7154 7.36396 25.364C7.71543 25.0125 7.71543 24.4426 7.36396 24.0912L2.27279 19L7.36396 13.9088C7.71543 13.5574 7.71543 12.9875 7.36396 12.636C7.01249 12.2846 6.44264 12.2846 6.09117 12.636L0.363604 18.3636ZM19 18.1L1 18.1L1 19.9L19 19.9L19 18.1Z" fill="white"/>
</svg>`;

  switch (playerNumber) {
    case 0:
    case 1:
    case 2:
    case 3: // Controller
      window.cm = controllerMapping;
      let map =
        controllerMapping.mappings[
          controllerMapping.getGamepadName(window.gps[playerNumber].name) ||
            "default"
        ];
      if (typeof map === "string") {
        map = controllerMapping.mappings[map];
      }
      let label =
        controllerMapping.labels[
          controllerMapping.getGamepadName(window.gps[playerNumber].name) ||
            "default"
        ];
      if (typeof label === "string") {
        label = controllerMapping.labels[label];
      }

      // stupid console.log that made it impossible to see other logs
      // console.log(label, map);

      for (const key in map) {
        if (map[key] === button) {
          if (label[key]) {
            return label[key];
          }
        }
      }

      // stupid console.log that made it impossible to see other logs
      // console.log(label, map);

      return button;

    case 4: // Keyboard
      switch (button) {
        case "left":
          return "Left Arrow";
        case "right":
          return "Right Arrow";
        case "up":
          return "Up Arrow";
        case "down":
          return "Down Arrow";
        case "confirm":
          return "Enter";
        case "back":
          return "Backspace";
        case "act":
          return "Control";
        case "alt":
          return "Backslash";
        case "menu":
          return "Escape";
        default:
          return button;
      }
    case 5: // TV Remote
      switch (button) {
        case "left":
          return "&larr;";
        case "right":
          return "&rarr;";
        case "up":
          return "&uarr;";
        case "down":
          return "&darr;";
        case "confirm":
          return `<svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="27" cy="27" r="24.75" fill="#2C2C2C" stroke="url(#paint0_linear_641_131)" stroke-width="4.5"/>
<path d="M11.3018 26.8494C11.3018 25.5264 11.4987 24.3451 11.8925 23.3056C12.302 22.2661 12.8611 21.3841 13.5698 20.6596C14.2786 19.9351 15.0976 19.3839 16.0268 19.0059C16.9718 18.6121 17.972 18.4152 19.0272 18.4152C20.0982 18.4152 21.0983 18.6121 22.0276 19.0059C22.9568 19.3839 23.7758 19.9351 24.4846 20.6596C25.1933 21.3841 25.7446 22.2661 26.1383 23.3056C26.5478 24.3451 26.7526 25.5264 26.7526 26.8494C26.7526 28.1724 26.5478 29.3536 26.1383 30.3931C25.7446 31.4326 25.1933 32.3146 24.4846 33.0391C23.7758 33.7636 22.9568 34.3227 22.0276 34.7165C21.0983 35.0945 20.1061 35.2835 19.0508 35.2835C17.9798 35.2835 16.9718 35.0945 16.0268 34.7165C15.0976 34.3227 14.2786 33.7636 13.5698 33.0391C12.8611 32.3146 12.302 31.4326 11.8925 30.3931C11.4987 29.3536 11.3018 28.1724 11.3018 26.8494ZM15.1527 26.8494C15.1527 27.6999 15.2472 28.4401 15.4362 29.0701C15.641 29.7001 15.9166 30.2277 16.2631 30.653C16.6096 31.0782 17.0191 31.3932 17.4916 31.598C17.9641 31.8027 18.476 31.9051 19.0272 31.9051C19.5785 31.9051 20.0903 31.8027 20.5628 31.598C21.0353 31.3932 21.4448 31.0782 21.7913 30.653C22.1378 30.2277 22.4056 29.7001 22.5946 29.0701C22.7993 28.4401 22.9017 27.6999 22.9017 26.8494C22.9017 25.9989 22.7993 25.2586 22.5946 24.6286C22.4056 23.9986 22.1378 23.471 21.7913 23.0457C21.4448 22.6205 21.0353 22.3055 20.5628 22.1007C20.0903 21.896 19.5785 21.7936 19.0272 21.7936C18.476 21.7936 17.9641 21.896 17.4916 22.1007C17.0191 22.3055 16.6096 22.6205 16.2631 23.0457C15.9166 23.471 15.641 23.9986 15.4362 24.6286C15.2472 25.2586 15.1527 25.9989 15.1527 26.8494ZM29.8272 35V18.6987H33.6072V35H29.8272ZM32.2842 31.976V27.1801L38.7574 18.6987H43.4588L36.4185 27.062L35.9224 27.6526L32.2842 31.976ZM34.7884 28.1015L37.2218 25.361L43.7659 35H39.1827L34.7884 28.1015Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_641_131" x1="27" y1="0" x2="27" y2="54" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>
`;
        case "back":
          return `<svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-arrow-left-to-line"
              >
                <path d="M3 19V5" />
                <path d="m13 6-6 6 6 6" />
                <path d="M7 12h14" />
              </svg>`;
        case "menu":
          return `<svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-menu"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>`;
        case "act":
        case "alt":
          return "No button available :(";
        default:
          return button;
      }
    default:
      return button;
  }
}
