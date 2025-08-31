export default {
  languages: {
    en_US: "Ingles (Estados Unidos)",
  },
  menu: {
    apps: "aplikasyon",
    store: "store",
    friends: "kaibigan",
    missingAppId: {
      title: "Hindi mai-launch ang App",
      description:
        "Ang main menu mo ay hindi up-to-date. Kami na ang bahala sa pag-refresh ng listing.",
    },
  },
  status: {
    alert: "Alert",
    loading: "Sandali lang...",
    checking: "Checking...",
    downloadingContent: "Nagda-download ng content...",
    loggingIn: "Naglo-log in...",
  },
  label: {
    username: "Username",
    usernameOrEmail: "Username/Email",
    password: "Password",
    email: "Email",
    help: "Tulong",
  },
  actions: {
    ok: "OK",
    yes: "Oo",
    no: "Hindi",
    on: "Buksan",
    off: "Isara",
    enable: "Buksan",
    disable: "Isara",
    move: "Ilipat",
    confirm: "I-confirm",
    cancel: "I-cancel",
    back: "Bumalik",
    next: "Sumunod",
    skip: "I-skip",
    finish: "Tapusin",
    launch: "I-buksan ang App",
    addFavorite: "Paborito",
    delFavorite: "Hindi paborito",
    delete: "I-delete",
    space: "Space",
    deleteConfirm: "Gusto mo bang i-delete ang App na ito?",
    deleteConfirmDescription:
      "Mawawala ang lahat ng settings na kaugnay sa App na ito.",
    login: "Mag-login",
    logout: "Mag-logout",
    register: "Mag-register",
  },
  system: {
    offline: {
      title: "Ikaw ay offline",
      description:
        "Hindi ka namin mai-connect sa Cherry Tree service. Ikaw ay nasa offline mode.",
    },
    offlineMenu: {
      title: "Ikaw ay offline",
      description:
        "Hindi ka pwedeng magdagdag ng kaibigan, o makita ang mga kaibigan mo.",
    },
    noLocalServer: {
      title: "Hindi mai-connect sa local server",
      description:
        "Ang client mo ay hindi naka-connect sa local server, at hindi mo magagamit ang mga feature na kailangan nito. Hindi namin nirerekomenda ito.",
    },
    oobe: {
      welcome: {
        intro: "Maligayang pagdating sa iyong",
        bingeing: "Bingeing",
        socialNetwork: "Social Network",
        library: "Library",
        tv: "Telebisyon",
        home: "Home",
        games: "Games",
        computer: "Computer",
        entertainment: "Entertainment",
        enjoyment: "Enjoyment",
      },
      configuration: "Configuration",
      getStarted: "Magsimula",
      phoneLink: {
        title: "Phone Link Setup",
        description:
          "Gusto mo bang gawing remote ang phone mo?\nI-scan ang QR code na nakapaskil sa screen.",
        helpText: "Kailangan ng tulong?",
        helpInfo: `Sa phone mo, i-type ang URL: %url%\n\nKung ikaw ay nakaconnect na, dapay mo'y makita ang isang prompt na naghahanap sa code ng TV mo. Makikita ang code na ito sa kanang itaas ng screen at sa Settings app.`,
      },
      account: {
        title: "Gumawa ng Cherries.to account",
        description:
          "Magdagdag ng kaibigan at mag-install ng apps sa tulong ng isang Cherries.to account.",
      },
      modal: {
        username: {
          title: "Username",
          description: "Ang username ng Cherries account mo",
        },
        password: {
          title: "Password",
          description: "Ang password ng Cherries account mo",
        },
        email: {
          title: "Email",
          description: "Ang email ng Cherries account mo",
        },
        skip: {
          title: "Gusto mo ba talagang i-skip ang procesong ito?",
          description:
            "Hindi mo magagamit ang mga features na nagre-require ng Cherries.to  account.",
        },
      },
      login: {
        title: "Mag-log in sa Cherries.to",
        description:
          "Sa pag-log in, sumasangayon ka<brsa aming impormasyon Legal.",
      },
      register: {
        title: "Mag-register sa Cherries.to",
        description:
          "Sa pag-register, sumasangayon ka<brsa aming impormasyon Legal.",
      },
      thanks: {
        title: "Salamat!",
        description:
          "Sana'y ma-enjoy mo ang iyong pinaka-bagong, pinaka-bonggang entertainment center!",
      },
    },
  },
  settings: {
    title: "Settings",
    description: "Baguhin ang mga settings dito.",
    categories: {
      setup: {
        title: "Setup",
        description: "I-configure ang iyong account at setup.",
        items: {
          userInfo: "Kunin ang iyong User Info",
          userInfoTitle: "Ang iyong User Info",
          logout: "Mag-log out sa iyong account",
          logoutTitle: "Gusto mo bang mag log-out?",
          logoutDescription: "Kailangan mong mag log-in ulit.",
          delete: "I-delete ang data",
          deleteTitle: "Siguado ka ba?",
          deleteDescription:
            "Ang aksyon na ito'y magdedelete sa account at saved information mo.",
        },
      },
      input: {
        title: "Input",
        description: "I-configure ang input methods ng iyong TV.",
        items: {
          phoneLinkCode: `Phone Link code:&nbsp;`,
          phoneLinkToggle: "I-enable o I-disable ang Phone Link",
        },
      },
      display: {
        title: "Display",
        description: "I-configure ang visual at accessibility settings.",
        items: {
          uiScaling: "UI Scaling",
          background: "Background",
        },
      },
      audio: {
        title: "Audio",
        description: "I-configure ang tunog ng iyong TV.",
        items: {
          volume: "Baguhin ang volume",
          sfx: "I-configure ang sound effects",
          bgm: "I-configure ang background music",
        },
      },
      pictureCalibration: {
        title: "Calibrasyon",
        testPattern: "Buksan ang test pattern",
        testPatternName: "SMPTE test pattern",
      },
    },
    quit: "I-exit ang Settings",
  },
};
