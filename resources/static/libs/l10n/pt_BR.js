export default {
  languages: {
    en_US: "English (United States)",
  },
  menu: {
    apps: "aplicativos",
    store: "loja de aplicativos",
    friends: "amigos",
    missingAppId: {
      title: "Erro Iniciando o Aplicativo",
      description:
        "Seu menu princiapl está desatualizado. Atualizaremos a lista de aplicativos para voce.",
    },
  },
  status: {
    alert: "Alerta",
    loading: "Carregando...",
    checking: "Verificando...",
    downloadingContent: "Baixando Conteúdo...",
    loggingIn: "Entrando na sua conta...",
  },
  label: {
    username: "Username",
    usernameOrEmail: "Username/Email",
    password: "Senha",
    email: "Email",
    help: "Ajuda",
  },
  actions: {
    ok: "OK",
    yes: "Sim",
    no: "Não",
    on: "Ligado",
    off: "Desligado",
    enable: "Habilitar",
    disable: "Desabilitar",
    move: "Mover",
    confirm: "Confirmar",
    cancel: "Cancelar",
    back: "Voltar",
    next: "Próximo",
    skip: "Pular",
    finish: "Terminar",
    launch: "Lancar aplicativo",
    addFavorite: "Favoritar",
    delFavorite: "Desfavoritar",
    delete: "Deletar",
    space: "Espaço",
    deleteConfirm: "Tem cereteza que deseja deletar este aplicativo?",
    deleteConfirmDescription: "Você vai perde todas as configurações relacionadas a este aplicativo.",
    login: "Entarar na sua conta",
    logout: "Sair da sua conta",
    register: "Registrar para uma conta cherries.to",
  },
  system: {
    offline: {
      title: "Rodando no modo offline",
      description:
        "Não conseguimos entrar em contacto com o servidor do Cherry Tree. Você está temporariamente no modo offline.",
    },
    offlineMenu: {
      title: "Você está no modo offline",
      description: "Você não consegui addicionar ou ver a lista do seus amigos.",
    },
    noLocalServer: {
      title: "Cherry Tree não consegui acessar or servidor local",
      description:
        "O seu cliente Cherry Tree nao consegui accesar or servido local, entao algumas funções não será acessível. Esta experiência nao e recomendado.", 
    },
    oobe: {
      welcome: {
        intro: "Bem-vindo ao seu",
        bingeing: "Compulsão",
        socialNetwork: "Rede Social",
        library: "Biblioteca",
        tv: "TV",
        home: "Casa",
        games: "Jogos",
        computer: "Computador",
        entertainment: "Entretenimento",
        enjoyment: "Prazer",
      },
      configuration: "Configuração",
      getStarted: "Começar",
      phoneLink: {
        title: "Setup do Phone Link",
        description:
          "Quer use o telefone como um remoto de televisão?\nEscaneia o codigo QR na tela.", 
        helpText: "Ajuda do Phone Link",
        helpInfo: `No seu telefone, vai para esse URL: %url%\n\nQuando voce connecta, você vai ver um prompt pedindo para você inserta o código. Use o código no canto superior direito da tela ou encontre o codico no Aplicativo de Configurações.`,
      },
      account: {
        title: "Cria uma conta con cherries.to",
        description:
          "Uma conta online consegui ser usado para adicionar amigos e vazer downloade dos aplicativos.",
      },
      modal: {
        username: {
          title: "Username",
          description: "O seu username da conta cherries.to",
        },
        password: {
          title: "Senha",
          description: "A sua senha da conta cherries.to",
        },
        email: {
          title: "Email",
          description: "O seu email da conta cherries.to",
        },
        skip: {
          title: "Tem certeza que quer pular?",
          description:
            "Você não vai estar logado e vai perder algumas funções.",
        },
      },
      login: {
        title: "Faça login com cherries.to",
        description:
          "Ao efetuar login, você concorda e cumpre<br>com nossas Informações Legais.",
      },
      register: {
        title: "Register with Cherries.to",
        description:
          "Ao assinar, você concorda e cumpre<br>com nossas Informações Legais.",
      },
      thanks: {
        title: "Obrigado",
        description:
          "Esperamos que você aproveite sua entretenimento e experiência. O seu supporto significa o mundo.",
      },
    },
  },
  settings: {
    title: "Configurações do Sistema",
    description: "Modifique e altere as configurações.",
    categories: {
      setup: {
        title: "Setup",
        description: "Configurar settings da sua conta.",
        items: {
          userInfo: "Pega Recuperar informações da sua conta",
          userInfoTitle: "informações da sua conta",
          logout: "Sair da sua conta",
          logoutTitle: "Tem certeza que voce quer sair da sua conta?",
          logoutDescription: "Voce vai precisar logar na sua conta denovo.",
          delete: "Apagar todos os seus dados",
          deleteTitle: "Tem certeza de que deseja fazer isso?",
          deleteDescription:
            "Isso vai apagarar TUDO. Os dados e configurações da sua conta de usuário salvado vao ser apagados permanentemente.",
        },
      },
      input: {
        title: "Input",
        description: "Configurar métodos de input.",
        items: {
          phoneLinkCode: `Codigo do Phone Link:`,
          phoneLinkToggle: "Habilitar/desabilitar Phone Link",
        },
      },
      display: {
        title: "Monitor",
        description: "Configure as configurações visuais e de acessibilidade.",
        items: {
          uiScaling: "Dimensionamento du UI",
          background: "Fundo da Tela",
        },
      },
      audio: {
        title: "Áudio",
        description: "Configurar settings relacionadas ao áudio.",
        items: {
          volume: "Mudar volume do sistema",
          sfx: "Settings dos efeitos sonoros",
          bgm: "Settings da música do fundo",
        },
      },
      pictureCalibration: {
        title: "Calibração de imagem",
        testPattern: "Abre padrão de teste",
        testPatternName: "Padrão de teste SMTPE",
      },
    },
    quit: "Sair do aplicativo Configurações do Sistema",
  },
};
