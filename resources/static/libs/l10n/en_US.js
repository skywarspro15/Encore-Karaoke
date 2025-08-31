export default {
  languages: {
    en_US: "English (United States)",
  },
  menu: {
    apps: "apps",
    store: "store",
    friends: "friends",
    missingAppId: {
      title: "App Launch Error",
      description:
        "Your main menu is out of date. We will refresh the app listing for you.",
    },
  },
  status: {
    alert: "Alert",
    loading: "Loading...",
    checking: "Checking...",
    downloadingContent: "Downloading content...",
    loggingIn: "Logging in...",
  },
  label: {
    username: "Username",
    usernameOrEmail: "Username/Email",
    password: "Password",
    email: "Email",
    help: "Help",
  },
  actions: {
    ok: "OK",
    yes: "Yes",
    no: "No",
    on: "On",
    off: "Off",
    enable: "Enable",
    disable: "Disable",
    move: "Move",
    confirm: "Confirm",
    cancel: "Cancel",
    back: "Back",
    next: "Next",
    skip: "Skip",
    finish: "Finish",
    launch: "Launch app",
    addFavorite: "Favorite",
    delFavorite: "Unfavorite",
    delete: "Delete",
    space: "Space",
    deleteConfirm: "Are you sure you want to delete this app?",
    deleteConfirmDescription: "You will lose all settings related to this app.",
    login: "Login",
    logout: "Logout",
    register: "Register",
  },
  system: {
    offline: {
      title: "Running in offline mode",
      description:
        "We were unable to reach the Cherry Tree service. You are temporarily in offline mode.",
    },
    offlineMenu: {
      title: "You're in offline mode",
      description: "You cannot add or view the friends list.",
    },
    noLocalServer: {
      title: "Unable to reach the local server",
      description:
        "Your Cherry Tree client was unable to reach the local server, so some features may be unavailable. This experience is not fully recommended.",
    },
    oobe: {
      welcome: {
        intro: "Welcome to your",
        bingeing: "Bingeing",
        socialNetwork: "Social Network",
        library: "Library",
        tv: "TV",
        home: "Home",
        games: "Games",
        computer: "Computer",
        entertainment: "Entertainment",
        enjoyment: "Enjoyment",
      },
      configuration: "Configuration",
      getStarted: "Get started",
      phoneLink: {
        title: "Phone Link Setup",
        description:
          "Want to use your phone as a TV remote?\nScan the QR code shown on screen.",
        helpText: "Phone Link Help",
        helpInfo: `On your phone, go to this URL: %url%\n\nOnce you connect, you should see a prompt asking you to enter a code. Use the code in the top right of the screen, or find it in Settings.`,
      },
      account: {
        title: "Create an account with Cherries.to",
        description:
          "An online account can be used to add friends and download apps.",
      },
      modal: {
        username: {
          title: "Username",
          description: "Your Cherries account username",
        },
        password: {
          title: "Password",
          description: "Your Cherries account password",
        },
        email: {
          title: "Email",
          description: "Your Cherries account email",
        },
        skip: {
          title: "Are you really sure you want to skip?",
          description:
            "You won't be logged in and will miss out on some features.",
        },
      },
      login: {
        title: "Login with Cherries.to",
        description:
          "By signing in you agree and comply<br>with our Legal Information.",
      },
      register: {
        title: "Register with Cherries.to",
        description:
          "By signing up you agree and comply<br>with our Legal Information.",
      },
      thanks: {
        title: "Thank you",
        description:
          "We hope you enjoy your Home, Entertainment and Experience. Your support means the world.",
      },
    },
  },
  settings: {
    title: "Settings",
    description: "Modify and change settings.",
    categories: {
      setup: {
        title: "Setup",
        description: "Configure account settings and setup.",
        items: {
          userInfo: "Retrieve User Information",
          userInfoTitle: "User Info",
          logout: "Log out of your account",
          logoutTitle: "Are you sure you want to log out?",
          logoutDescription: "You will have to log in again.",
          delete: "Delete All Data",
          deleteTitle: "Are you sure you want to do this?",
          deleteDescription:
            "This will delete EVERYTHING. Your saved user account data and settings will be deleted permanently.",
        },
      },
      input: {
        title: "Input",
        description: "Configure input methods.",
        items: {
          phoneLinkCode: `Phone Link code:&nbsp;`,
          phoneLinkToggle: "Enable/Disable Phone Link",
        },
      },
      display: {
        title: "Display",
        description: "Configure visual and accessibility settings.",
        items: {
          uiScaling: "UI Scaling",
          background: "Background",
        },
      },
      audio: {
        title: "Audio",
        description: "Configure audio-related settings.",
        items: {
          volume: "Change system volume",
          sfx: "Sound effects settings",
          bgm: "Background music settings",
        },
      },
      pictureCalibration: {
        title: "Picture calibration",
        testPattern: "Open test pattern",
        testPatternName: "SMPTE test pattern",
      },
    },
    quit: "Quit Settings",
    quit: "Quit Settings",
  },
};
