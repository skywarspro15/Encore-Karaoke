let notify;

export default {
  names: {
    "Xbox 360 Controller (XInput STANDARD GAMEPAD)": "Xbox Controller",
    xinput: "Xbox Controller",
    "Wireless Gamepad (STANDARD GAMEPAD Vendor: 057e Product: 2009)":
      "Switch Pro Controller",
    "JC-W01U": "Wii Classic Controller",
    "Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)":
      "DualShock 4",
    "usb gamepad            (Vendor: 0810 Product: e501)": "SNES Controller",
    "0810-e501-usb gamepad           ": "SNES Controller",
    "Wireless Gamepad (Vendor: 0000 Product: 0000)": "Generic Controller",
    "0079-1843-MAYFLASH GameCube Controller Adapter": "GameCube Controller",
    "Backbone Labs, Inc. ": "Backbone Controller",
    "18d1-9400-Unknown Gamepad": "Stadia Controller",
    "18d1-9400-Stadia Controller rev. A": "Stadia Controller",
    // evdev
    "Microsoft X-Box 360 pad 0 (STANDARD GAMEPAD Vendor: 28de Product: 11ff)":
      "Xbox Controller",
    "Microsoft X-Box 360 pad 1 (STANDARD GAMEPAD Vendor: 28de Product: 11ff)":
      "Xbox Controller",
    "Microsoft X-Box 360 pad 2 (STANDARD GAMEPAD Vendor: 28de Product: 11ff)":
      "Xbox Controller",
    "Microsoft X-Box 360 pad 3 (STANDARD GAMEPAD Vendor: 28de Product: 11ff)":
      "Xbox Controller",
  },
  mappings: {
    default: {
      up: "up",
      down: "down",
      left: "left",
      right: "right",
      button0: "confirm",
      button1: "back",
      button2: "act",
      button3: "alt",
      button12: "up",
      button13: "down",
      button14: "left",
      button15: "right",
      button16: "menu",
      button8: "menu",
      button9: "menu",
    },
    "Xbox Controller": "default",
    "Wii Classic Controller": "JC-W01U",
    "JC-W01U": {
      up: "up",
      down: "down",
      left: "left",
      right: "right",
      button3: "confirm",
      button2: "back",
      button0: "act",
      button1: "alt",
      button8: "menu",
      button9: "menu",
    },
    "Switch Pro Controller": {
      // L stick
      up1: "up",
      down1: "down",
      up0: "left",
      down0: "right",
      // ABXY
      button1: "confirm",
      button0: "back",
      button2: "act",
      button3: "alt",
      // SELECT / START
      button8: "menu",
      button9: "menu",
      // d-pad
      button12: "up",
      button13: "down",
      button14: "left",
      button15: "right",
      // home & capture
      // button16: "home",
      // button17: "capture",
    },
    "SNES Controller": {
      up: "up",
      down: "down",
      left: "left",
      right: "right",
      button1: "confirm",
      button2: "back",
      button3: "act",
      button0: "alt",
      button8: "menu",
      button9: "menu",
    },
    "GameCube Controller": {
      // L stick
      up: "up",
      down: "down",
      left: "left",
      right: "right",
      // ABXY
      button1: "confirm",
      button2: "back",
      button0: "act",
      button3: "alt",
      // SELECT / START
      button9: "menu",
      // d-pad
      button12: "up",
      button13: "right",
      button14: "down",
      button15: "left",
    },
    "Stadia Controller": {
      up: "up",
      down: "down",
      left: "left",
      right: "right",
      button0: "confirm",
      button1: "back",
      button3: "act",
      button4: "alt",
      button10: "menu",
      button11: "menu",
      button12: "menu",
      button16: "menu",
      button17: "menu",
    },
  },
  labels: {
    default: {
      // D-Pad Up
      up: `<svg width="39" height="38" viewBox="0 0 39 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="14.3574" width="10.8571" height="13.5714" fill="#414141"/>
<rect x="14.3574" y="24.4297" width="10.8571" height="13.5714" fill="#414141"/>
<rect x="14.3574" y="24.4297" width="10.8571" height="10.8571" transform="rotate(-90 14.3574 24.4297)" fill="#414141"/>
<rect x="25.2148" y="13.5703" width="13.5714" height="10.8571" fill="#414141"/>
<rect x="0.786133" y="13.5703" width="13.5714" height="10.8571" fill="#414141"/>
<path d="M14.3574 0V13.5714L19.786 20.0179L25.2146 13.5714V0H14.3574Z" fill="white" fill-opacity="0.26"/>
</svg>`,
      // D-Pad Down
      down: `<svg width="39" height="38" viewBox="0 0 39 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="24.8594" y="38" width="10.8571" height="13.5714" transform="rotate(-180 24.8594 38)" fill="#414141"/>
<rect x="24.8594" y="13.5723" width="10.8571" height="13.5714" transform="rotate(-180 24.8594 13.5723)" fill="#414141"/>
<rect x="24.8594" y="13.5723" width="10.8571" height="10.8571" transform="rotate(90 24.8594 13.5723)" fill="#414141"/>
<rect x="14.002" y="24.4297" width="13.5714" height="10.8571" transform="rotate(-180 14.002 24.4297)" fill="#414141"/>
<rect x="38.4297" y="24.4297" width="13.5714" height="10.8571" transform="rotate(-180 38.4297 24.4297)" fill="#414141"/>
<path d="M24.8594 38L24.8594 24.4286L19.4308 17.9821L14.0022 24.4286L14.0022 38L24.8594 38Z" fill="white" fill-opacity="0.26"/>
</svg>`,
      // D-Pad Left
      left: `<svg width="39" height="38" viewBox="0 0 39 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="0.212891" y="24.4297" width="10.8571" height="13.5714" transform="rotate(-90 0.212891 24.4297)" fill="#414141"/>
<rect x="24.6426" y="24.4297" width="10.8571" height="13.5714" transform="rotate(-90 24.6426 24.4297)" fill="#414141"/>
<rect x="24.6426" y="24.4297" width="10.8571" height="10.8571" transform="rotate(180 24.6426 24.4297)" fill="#414141"/>
<rect x="13.7832" y="13.5723" width="13.5714" height="10.8571" transform="rotate(-90 13.7832 13.5723)" fill="#414141"/>
<rect x="13.7832" y="38" width="13.5714" height="10.8571" transform="rotate(-90 13.7832 38)" fill="#414141"/>
<path d="M0.212891 24.4297L13.7843 24.4297L20.2307 19.0011L13.7843 13.5725L0.21289 13.5725L0.212891 24.4297Z" fill="white" fill-opacity="0.26"/>
</svg>`,
      // D-Pad Right
      right: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="38" y="13.5703" width="10.8571" height="13.5714" transform="rotate(90 38 13.5703)" fill="#414141"/>
<rect x="13.5723" y="13.5703" width="10.8571" height="13.5714" transform="rotate(90 13.5723 13.5703)" fill="#414141"/>
<rect x="13.5723" y="13.5703" width="10.8571" height="10.8571" fill="#414141"/>
<rect x="24.4297" y="24.4297" width="13.5714" height="10.8571" transform="rotate(90 24.4297 24.4297)" fill="#414141"/>
<rect x="24.4297" width="13.5714" height="10.8571" transform="rotate(90 24.4297 0)" fill="#414141"/>
<path d="M38 13.5703L24.4286 13.5703L17.9821 18.9989L24.4286 24.4275L38 24.4275L38 13.5703Z" fill="white" fill-opacity="0.26"/>
</svg>`,
      // A
      button0: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="#21B219" stroke="url(#paint0_linear_641_44)" stroke-width="4"/>
<path d="M12.1094 26L17.3804 11.51H19.1444L19.3124 14.786L15.5954 26H12.1094ZM15.6584 23.144V20.477H22.5044V23.144H15.6584ZM18.5984 14.786L18.6824 11.51H20.6144L25.8854 26H22.3154L18.5984 14.786Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_641_44" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // B
      button1: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="#EC4848" stroke="url(#paint0_linear_641_45)" stroke-width="4"/>
<path d="M13.9149 26V11.51H17.2749V26H13.9149ZM15.4689 26V23.186H19.5219C20.0819 23.186 20.5299 23.053 20.8659 22.787C21.2159 22.507 21.3909 22.101 21.3909 21.569C21.3909 21.037 21.2159 20.638 20.8659 20.372C20.5299 20.092 20.0819 19.952 19.5219 19.952H15.4689V17.852H19.8369C20.8309 17.852 21.6989 18.027 22.4409 18.377C23.1829 18.713 23.7639 19.196 24.1839 19.826C24.6039 20.442 24.8139 21.17 24.8139 22.01C24.8139 22.85 24.5899 23.571 24.1419 24.173C23.7079 24.761 23.1129 25.216 22.3569 25.538C21.6149 25.846 20.7749 26 19.8369 26H15.4689ZM15.4689 19.112V17.348H19.1019C19.6339 17.348 20.0609 17.222 20.3829 16.97C20.7049 16.704 20.8659 16.326 20.8659 15.836C20.8659 15.346 20.7049 14.975 20.3829 14.723C20.0609 14.457 19.6339 14.324 19.1019 14.324H15.4689V11.51H19.3119C20.2219 11.51 21.0479 11.671 21.7899 11.993C22.5319 12.301 23.1129 12.742 23.5329 13.316C23.9669 13.89 24.1839 14.583 24.1839 15.395C24.1839 16.207 23.9669 16.893 23.5329 17.453C23.1129 17.999 22.5319 18.412 21.7899 18.692C21.0619 18.972 20.2359 19.112 19.3119 19.112H15.4689Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_641_45" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // X
      button2: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="#487FEC" stroke="url(#paint0_linear_641_46)" stroke-width="4"/>
<path d="M12.5528 26L17.5718 17.936L18.7688 16.382L21.4778 11.51H25.2368L20.4488 19.217L19.2518 20.75L16.3118 26H12.5528ZM12.7628 11.51H16.6268L19.9448 17.159L25.4468 26H21.5828L18.0968 20.078L12.7628 11.51Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_641_46" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // Y
      button3: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="#ECB048" stroke="url(#paint0_linear_641_47)" stroke-width="4"/>
<path d="M12.1094 11.51H15.9734L19.3964 17.663L19.3124 20.54H17.5904L12.1094 11.51ZM17.3174 26V19.91H20.6774V26H17.3174ZM18.6824 17.663L22.1054 11.51H25.8854L20.4044 20.54H18.8504L18.6824 17.663Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_641_47" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // D-Pad Up
      button12: `<svg width="39" height="38" viewBox="0 0 39 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="14.3574" width="10.8571" height="13.5714" fill="#414141"/>
<rect x="14.3574" y="24.4297" width="10.8571" height="13.5714" fill="#414141"/>
<rect x="14.3574" y="24.4297" width="10.8571" height="10.8571" transform="rotate(-90 14.3574 24.4297)" fill="#414141"/>
<rect x="25.2148" y="13.5703" width="13.5714" height="10.8571" fill="#414141"/>
<rect x="0.786133" y="13.5703" width="13.5714" height="10.8571" fill="#414141"/>
<path d="M14.3574 0V13.5714L19.786 20.0179L25.2146 13.5714V0H14.3574Z" fill="white" fill-opacity="0.26"/>
</svg>`,
      // D-Pad Down
      button13: `<svg width="39" height="38" viewBox="0 0 39 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="24.8594" y="38" width="10.8571" height="13.5714" transform="rotate(-180 24.8594 38)" fill="#414141"/>
<rect x="24.8594" y="13.5723" width="10.8571" height="13.5714" transform="rotate(-180 24.8594 13.5723)" fill="#414141"/>
<rect x="24.8594" y="13.5723" width="10.8571" height="10.8571" transform="rotate(90 24.8594 13.5723)" fill="#414141"/>
<rect x="14.002" y="24.4297" width="13.5714" height="10.8571" transform="rotate(-180 14.002 24.4297)" fill="#414141"/>
<rect x="38.4297" y="24.4297" width="13.5714" height="10.8571" transform="rotate(-180 38.4297 24.4297)" fill="#414141"/>
<path d="M24.8594 38L24.8594 24.4286L19.4308 17.9821L14.0022 24.4286L14.0022 38L24.8594 38Z" fill="white" fill-opacity="0.26"/>
</svg>`,
      // D-Pad Left
      button14: `<svg width="39" height="38" viewBox="0 0 39 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="0.212891" y="24.4297" width="10.8571" height="13.5714" transform="rotate(-90 0.212891 24.4297)" fill="#414141"/>
<rect x="24.6426" y="24.4297" width="10.8571" height="13.5714" transform="rotate(-90 24.6426 24.4297)" fill="#414141"/>
<rect x="24.6426" y="24.4297" width="10.8571" height="10.8571" transform="rotate(180 24.6426 24.4297)" fill="#414141"/>
<rect x="13.7832" y="13.5723" width="13.5714" height="10.8571" transform="rotate(-90 13.7832 13.5723)" fill="#414141"/>
<rect x="13.7832" y="38" width="13.5714" height="10.8571" transform="rotate(-90 13.7832 38)" fill="#414141"/>
<path d="M0.212891 24.4297L13.7843 24.4297L20.2307 19.0011L13.7843 13.5725L0.21289 13.5725L0.212891 24.4297Z" fill="white" fill-opacity="0.26"/>
</svg>`,
      // D-Pad Right
      button15: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="38" y="13.5703" width="10.8571" height="13.5714" transform="rotate(90 38 13.5703)" fill="#414141"/>
<rect x="13.5723" y="13.5703" width="10.8571" height="13.5714" transform="rotate(90 13.5723 13.5703)" fill="#414141"/>
<rect x="13.5723" y="13.5703" width="10.8571" height="10.8571" fill="#414141"/>
<rect x="24.4297" y="24.4297" width="13.5714" height="10.8571" transform="rotate(90 24.4297 24.4297)" fill="#414141"/>
<rect x="24.4297" width="13.5714" height="10.8571" transform="rotate(90 24.4297 0)" fill="#414141"/>
<path d="M38 13.5703L24.4286 13.5703L17.9821 18.9989L24.4286 24.4275L38 24.4275L38 13.5703Z" fill="white" fill-opacity="0.26"/>
</svg>`,
      // Menu
      button16: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="#2C2C2C" stroke="url(#paint0_linear_641_29)" stroke-width="4"/>
<rect x="11" y="12" width="16" height="3" fill="white"/>
<rect x="11" y="18" width="16" height="3" fill="white"/>
<rect x="11" y="24" width="16" height="3" fill="white"/>
<defs>
<linearGradient id="paint0_linear_641_29" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // View
      button8: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="#2C2C2C" stroke="url(#paint0_linear_641_43)" stroke-width="4"/>
<rect x="16" y="16" width="12" height="10" stroke="white" stroke-width="2"/>
<path d="M17 16H16V17V22H10V12H24V16H17Z" stroke="white" stroke-width="2"/>
<defs>
<linearGradient id="paint0_linear_641_43" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // Menu
      button9: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="#2C2C2C" stroke="url(#paint0_linear_641_29)" stroke-width="4"/>
<rect x="11" y="12" width="16" height="3" fill="white"/>
<rect x="11" y="18" width="16" height="3" fill="white"/>
<rect x="11" y="24" width="16" height="3" fill="white"/>
<defs>
<linearGradient id="paint0_linear_641_29" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
    },
    "Xbox Controller": "default",
    "Wii Classic Controller": "JC-W01U",
    "JC-W01U": {
      up: "up",
      down: "down",
      left: "left",
      right: "right",
      // A
      button3: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="black" stroke="url(#paint0_linear_672_17)" stroke-width="4"/>
<path d="M14.3186 23.186C14.3186 22.528 14.4936 21.933 14.8436 21.401C15.1936 20.869 15.7536 20.435 16.5236 20.099C17.2936 19.763 18.3016 19.574 19.5476 19.532L21.0806 19.49V21.002L19.6736 21.107C18.8616 21.163 18.2316 21.289 17.7836 21.485C17.3496 21.667 17.0416 21.884 16.8596 22.136C16.6916 22.388 16.6076 22.661 16.6076 22.955C16.6076 23.361 16.7336 23.683 16.9856 23.921C17.2376 24.145 17.5666 24.257 17.9726 24.257C18.5326 24.257 19.0716 24.117 19.5896 23.837C20.1216 23.543 20.6046 23.151 21.0386 22.661V24.257C20.6466 24.817 20.1356 25.286 19.5056 25.664C18.8756 26.042 18.1756 26.231 17.4056 26.231C16.8596 26.231 16.3486 26.105 15.8726 25.853C15.4106 25.601 15.0326 25.251 14.7386 24.803C14.4586 24.341 14.3186 23.802 14.3186 23.186ZM14.6546 15.941C15.1586 15.647 15.7746 15.402 16.5026 15.206C17.2306 14.996 17.9516 14.891 18.6656 14.891C19.5196 14.891 20.2756 15.052 20.9336 15.374C21.6056 15.682 22.1306 16.158 22.5086 16.802C22.8866 17.432 23.0756 18.223 23.0756 19.175V23.417C23.0756 23.711 23.0826 23.977 23.0966 24.215C23.1246 24.453 23.1666 24.726 23.2226 25.034L23.3906 26H21.1436L20.7236 23.9V19.385C20.7236 18.559 20.5206 17.957 20.1146 17.579C19.7086 17.201 19.1276 17.012 18.3716 17.012C17.8116 17.012 17.2866 17.096 16.7966 17.264C16.3066 17.432 15.8376 17.635 15.3896 17.873L14.6546 15.941Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_672_17" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // B
      button2: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="black" stroke="url(#paint0_linear_672_14)" stroke-width="4"/>
<path d="M14.7254 26L14.8934 25.034C14.9494 24.726 14.9844 24.453 14.9984 24.215C15.0264 23.977 15.0404 23.711 15.0404 23.417V10.985L17.3924 10.565V23.9L16.9724 26H14.7254ZM16.4684 21.338L17.3924 21.17C17.3924 21.884 17.4974 22.472 17.7074 22.934C17.9314 23.396 18.2114 23.739 18.5474 23.963C18.8974 24.187 19.2754 24.299 19.6814 24.299C20.4794 24.299 21.1164 23.963 21.5924 23.291C22.0824 22.619 22.3274 21.723 22.3274 20.603C22.3274 19.819 22.2224 19.168 22.0124 18.65C21.8164 18.118 21.5364 17.719 21.1724 17.453C20.8084 17.187 20.3954 17.054 19.9334 17.054C19.4434 17.054 18.9464 17.187 18.4424 17.453C17.9524 17.705 17.4974 18.062 17.0774 18.524V16.886C17.5254 16.298 18.0574 15.822 18.6734 15.458C19.2894 15.08 19.9474 14.891 20.6474 14.891C21.3894 14.891 22.0684 15.122 22.6844 15.584C23.3004 16.032 23.7904 16.676 24.1544 17.516C24.5324 18.342 24.7214 19.336 24.7214 20.498C24.7214 21.702 24.5254 22.731 24.1334 23.585C23.7554 24.439 23.2234 25.097 22.5374 25.559C21.8654 26.007 21.0814 26.231 20.1854 26.231C19.5414 26.231 18.9324 26.063 18.3584 25.727C17.7984 25.377 17.3434 24.845 16.9934 24.131C16.6434 23.403 16.4684 22.472 16.4684 21.338Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_672_14" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // Y
      button0: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="black" stroke="url(#paint0_linear_672_23)" stroke-width="4"/>
<path d="M14.294 15.101H16.877L19.943 23.963L19.964 26H18.557L14.294 15.101ZM14.63 29.822L14.924 27.911C15.12 27.967 15.288 28.009 15.428 28.037C15.582 28.065 15.75 28.079 15.932 28.079C16.268 28.079 16.576 28.009 16.856 27.869C17.15 27.729 17.43 27.456 17.696 27.05C17.976 26.658 18.263 26.084 18.557 25.328L19.187 23.963L22.232 15.101H24.71L20.3 26.357C19.964 27.225 19.586 27.939 19.166 28.499C18.746 29.059 18.277 29.465 17.759 29.717C17.255 29.983 16.695 30.116 16.079 30.116C15.827 30.116 15.575 30.088 15.323 30.032C15.085 29.976 14.854 29.906 14.63 29.822Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_672_23" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // X
      button1: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="black" stroke="url(#paint0_linear_672_20)" stroke-width="4"/>
<path d="M13.8087 26L17.8827 20.036L18.7437 19.007L21.2427 15.101H23.8467L19.9617 20.771L19.1007 21.779L16.4127 26H13.8087ZM14.0187 15.101H16.7697L19.6257 19.469L19.6677 19.532L24.0567 26H21.3057L18.2817 21.38L18.2397 21.317L14.0187 15.101Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_672_20" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      button8: "-",
      button9: "+",
    },
    "Switch Pro Controller": {
      // L stick
      up1: "L Up",
      down1: "L Down",
      up0: "L Left",
      down0: "L Right",
      // ABXY
      button1: "A",
      button0: "B",
      button2: "X",
      button3: "Y",
      // SELECT / START
      button8: "Select",
      button9: "Start",
      // d-pad
      button12: "D-Pad Up",
      button13: "D-Pad Down",
      button14: "D-Pad Left",
      button15: "D-Pad Right",
      // home & capture
      // button16: "home",
      // button17: "capture",
    },
    "SNES Controller": {
      up: "D-Pad Up",
      down: "D-Pad Down",
      left: "D-Pad Left",
      right: "D-Pad Right",
      button1: "A",
      button2: "B",
      button3: "Y",
      button0: "X",
      button8: "Select",
      button9: "Start",
    },
    "GameCube Controller": {
      // L stick
      up: "Up",
      down: "Down",
      left: "Left",
      right: "Right",
      // ABXY
      button1: "A",
      button2: "B",
      button0: "X",
      button3: "Y",
      // SELECT / START
      button9: "Start",
      // d-pad
      button12: "D-Pad Up",
      button13: "D-Pad Right",
      button14: "D-Pad Down",
      button15: "D-Pad Left",
    },
    "Stadia Controller": {
      up: "Up",
      down: "Down",
      left: "Left",
      right: "Right",
      // A
      button0: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="black" stroke="url(#paint0_linear_672_5)" stroke-width="4"/>
<path d="M12.5294 26L18.1154 11.51H19.1444L19.3124 13.4L14.6294 26H12.5294ZM15.2594 21.926V20.12H22.7354V21.926H15.2594ZM18.5984 13.4L18.6824 11.51H19.8794L25.4654 26H23.2814L18.5984 13.4Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_672_5" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // B
      button1: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="black" stroke="url(#paint0_linear_672_2)" stroke-width="4"/>
<path d="M14.3017 26V11.51H16.3177V26H14.3017ZM15.3517 26V24.236H19.6147C20.4127 24.236 21.0847 24.026 21.6307 23.606C22.1767 23.172 22.4497 22.57 22.4497 21.8C22.4497 21.03 22.1767 20.442 21.6307 20.036C21.0987 19.616 20.4267 19.406 19.6147 19.406H15.3517V18.02H19.7197C20.6017 18.02 21.4067 18.167 22.1347 18.461C22.8627 18.755 23.4437 19.196 23.8777 19.784C24.3117 20.358 24.5287 21.065 24.5287 21.905C24.5287 22.787 24.3117 23.536 23.8777 24.152C23.4437 24.754 22.8627 25.216 22.1347 25.538C21.4067 25.846 20.6017 26 19.7197 26H15.3517ZM15.3517 18.965V17.684H19.2367C19.9787 17.684 20.6017 17.495 21.1057 17.117C21.6097 16.739 21.8617 16.2 21.8617 15.5C21.8617 14.8 21.6097 14.254 21.1057 13.862C20.6157 13.47 19.9927 13.274 19.2367 13.274H15.3517V11.51H19.3417C20.1957 11.51 20.9657 11.657 21.6517 11.951C22.3517 12.245 22.9047 12.686 23.3107 13.274C23.7307 13.848 23.9407 14.555 23.9407 15.395C23.9407 16.165 23.7307 16.816 23.3107 17.348C22.9047 17.88 22.3517 18.286 21.6517 18.566C20.9657 18.832 20.1957 18.965 19.3417 18.965H15.3517Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_672_2" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // X
      button3: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="black" stroke="url(#paint0_linear_672_8)" stroke-width="4"/>
<path d="M12.8727 26L18.1647 18.146L18.7737 17.411L22.6167 11.51H24.9267L19.8447 19.049L19.2357 19.784L15.1827 26H12.8727ZM13.0827 11.51H15.5187L19.6557 17.726L25.1367 26H22.7007L18.3747 19.49L13.0827 11.51Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_672_8" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // Y
      button4: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="black" stroke="url(#paint0_linear_672_11)" stroke-width="4"/>
<path d="M13.3448 11.51H15.6548L19.9388 18.839V20.33H18.6578L13.3448 11.51ZM18.4898 26V19.28H20.5058V26H18.4898ZM19.1408 18.839L23.4248 11.51H25.6508L20.3378 20.33H19.1408V18.839Z" fill="white"/>
<defs>
<linearGradient id="paint0_linear_672_11" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
      // Menu
      button10: `<svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="19" cy="19" r="17" fill="black" stroke="url(#paint0_linear_672_26)" stroke-width="4"/>
<rect x="11" y="12" width="16" height="2" fill="white"/>
<rect x="11" y="18" width="16" height="2" fill="white"/>
<rect x="11" y="24" width="16" height="2" fill="white"/>
<defs>
<linearGradient id="paint0_linear_672_26" x1="19" y1="0" x2="19" y2="38" gradientUnits="userSpaceOnUse">
<stop stop-color="white" stop-opacity="0.1"/>
<stop offset="1" stop-opacity="0.45"/>
</linearGradient>
</defs>
</svg>`,
    },
  },
  parseControllerId(id) {
    const userAgent = navigator.userAgent;

    const isChrome = /Chrome/.test(userAgent);
    const isFirefox = /Firefox/.test(userAgent);

    const result = {};

    if (isChrome) {
      const regex = /(.+)\s\(Vendor:\s(\w+)\sProduct:\s(\w+)\)$/;
      const matches = id.match(regex);

      if (matches) {
        result.controllerName = matches[1];
        result.vendorID = matches[2];
        result.productID = matches[3];
      }
    } else if (isFirefox) {
      const regex = /^(\w+)-(\w+)-(.+)$/;
      const matches = id.match(regex);

      if (matches) {
        result.vendorID = matches[1];
        result.productID = matches[2];
        result.controllerName = matches[3];
      }
    }

    return result;
  },
  getGamepadName(id) {
    let result = this.parseControllerId(id);

    if (result.controllerName && this.names[result.controllerName]) {
      return this.names[result.controllerName];
    } else if (this.names[id]) {
      return this.names[id];
    } else {
      return id;
    }
  },
  init(n) {
    notify = n;
  },
  setup(gamepad, forceGamepadName = false) {
    let formalGamepadName;

    if (forceGamepadName) {
      formalGamepadName = gamepad.name;
    } else {
      formalGamepadName = this.getGamepadName(gamepad.name);
    }

    console.log("Gp controller name", formalGamepadName);

    console.log("A new gamepad was connected!", gamepad);
    window.gps.push(gamepad);
    if (notify) notify("A new gamepad was connected!", formalGamepadName);
    else {
      let loop = setInterval((_) => {
        if (notify !== undefined) {
          clearInterval(loop);
          notify("A new gamepad was connected!", formalGamepadName);
        }
      }, 1000);
    }

    function popInput(i) {
      const p = window.gps.findIndex((g) => g.id === gamepad.id);
      window.Libs.Input.pop(i, p);
    }

    let mapping = this.mappings[formalGamepadName];

    if (mapping === undefined) {
      mapping = this.mappings.default;
    }

    while (typeof mapping === "string") {
      mapping = this.mappings[mapping];
    }

    let holdingTimeouts = {};
    let holdingIntervals = {};

    let holdableInputs = [
      "up",
      "down",
      "left",
      "right",
      "confirm",
      "back",
      "act",
      "alt",
    ];
    let i = 0;

    function beginHoldingTimeout(key) {
      holdingTimeouts[key] = setTimeout(() => {
        window.snapScroll = true;

        if (holdingIntervals[key]) {
          clearInterval(holdingIntervals[key]);
        }
        holdingIntervals[key] = setInterval(() => {
          popInput(mapping[key]);
        }, 100);
      }, 330);
    }
    function clearHoldingTimeout(key) {
      window.snapScroll = false;
      clearTimeout(holdingTimeouts[key]);
      clearInterval(holdingIntervals[key]);
    }

    for (let key in mapping) {
      let j = parseInt(i);

      gamepad.before(key, (_) => {
        popInput(mapping[key]);

        beginHoldingTimeout(mapping[key]);
      });
      gamepad.after(key, (_) => {
        clearHoldingTimeout(mapping[key]);
      });

      i++;
    }
  },
};
