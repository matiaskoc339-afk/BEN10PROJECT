"use strict";
window.B10 = {};
(function (B) {
  B.TAU = Math.PI * 2;
  B.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  B.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  B.angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  B.wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  B.forms = [
    {
      id: "heat",
      name: "Fuego",
      color: "#ff9d39",
      speed: 215,
      armor: 1,
      role: "Fuego · distancia y control",
      light: 18,
      heavy: 32,
      reach: 100,
      branches: ["ELEMENTAL", "CONTROL", "MOVILIDAD"],
      skills: [
        ["Combustión", "Las bolas de fuego explotan al impactar."],
        ["Corona solar", "F deja un anillo abrasador persistente."],
        ["Estela ígnea", "Esquivar deja una estela que quema."],
      ],
    },
    {
      id: "four",
      name: "Cuatro Brazos",
      color: "#ed7055",
      speed: 185,
      armor: 0.73,
      role: "Fuerza · golpes y contraataques",
      light: 27,
      heavy: 53,
      reach: 102,
      branches: ["FUERZA", "DEFENSA", "COMBATE"],
      skills: [
        ["Terremoto", "K al terminar un combo provoca una onda de área."],
        ["Revancha", "Un parry dispara un contraataque de cuatro puños."],
        ["Cuádruple", "J → K → J ejecuta cuatro impactos y atrae enemigos."],
      ],
    },
    {
      id: "xlr8",
      name: "XLR8",
      color: "#64ccea",
      speed: 360,
      armor: 1.1,
      role: "Velocidad · ADN en poder de Kevin 11",
    },
    {
      id: "diamond",
      name: "Diamante",
      color: "#8ce6cb",
      speed: 193,
      armor: 0.6,
      role: "Cristal · defensa y proyectiles",
      light: 23,
      heavy: 40,
      reach: 110,
      branches: ["CRISTAL", "BASTIÓN", "ESTRUCTURAS"],
      skills: [
        ["Dispersión", "J dispara tres esquirlas en abanico."],
        ["Refracción", "Bloquear refleja los disparos enemigos."],
        ["Geoda", "F crea una barrera de espinas que daña y frena."],
      ],
    },
    {
      id: "ghost",
      name: "Fantasmático",
      color: "#d0c7e5",
      speed: 240,
      role: "Intangibilidad · ADN en poder de Zombozo",
    },
    {
      id: "blitz",
      name: "Blitzwolfer",
      color: "#b6a3b8",
      speed: 250,
      role: "Sonido · requiere una misión de escaneo",
    },
    {
      id: "upgrade",
      name: "Ultra T",
      color: "#9deb59",
      speed: 210,
      role: "Tecnología · ADN en poder de Malware",
    },
    {
      id: "cannon",
      name: "Cannonbolt",
      color: "#e5d58c",
      speed: 230,
      role: "Embestida · ADN en poder de Kevin 11",
    },
    {
      id: "vine",
      name: "Wildvine",
      color: "#80b75f",
      speed: 220,
      role: "Vegetación · ADN en poder del Dr. Ánimo",
    },
    {
      id: "snare",
      name: "Snare-oh",
      color: "#d4b88b",
      speed: 220,
      role: "Vendas · ADN en poder de Hex",
    },
  ];
  B.form = (id) =>
    B.forms.find((f) => f.id === id) || {
      id: "ben",
      name: "Ben Tennyson",
      color: "#b4ef61",
      speed: 220,
      armor: 1.2,
      light: 7,
      heavy: 12,
      reach: 60,
      role: "Humano · recuperación de energía",
    };
  B.defaults = {
    up: "KeyW",
    down: "KeyS",
    left: "KeyA",
    right: "KeyD",
    light: "KeyJ",
    heavy: "KeyK",
    dodge: "Space",
    block: "ShiftLeft",
    special: "KeyF",
    interact: "KeyE",
    wheel: "KeyQ",
    cancel: "KeyX",
    skills: "Tab",
    pause: "Escape",
  };
  B.controlNames = {
    up: "Mover arriba",
    down: "Mover abajo",
    left: "Mover izquierda",
    right: "Mover derecha",
    light: "Ataque ligero / clic izquierdo",
    heavy: "Ataque fuerte / clic derecho",
    dodge: "Esquiva",
    block: "Bloquear / parry",
    special: "Habilidad especial",
    interact: "Interactuar / diálogo",
    wheel: "Mantener rueda del Omnitrix",
    cancel: "Regresar a Ben",
    skills: "Árboles de habilidades",
    pause: "Pausa",
  };
  B.fresh = () => ({
    version: 1,
    chapter: 1,
    zone: "city",
    checkpoint: "city",
    stage: 0,
    unlocked: ["heat", "four"],
    favorites: ["four", "heat", null],
    xp: 0,
    points: 0,
    spent: 0,
    skills: { heat: [], four: [], diamond: [] },
    items: [],
    flags: {},
    hpBonus: 0,
    energyBonus: 0,
    kills: 0,
    playTime: 0,
    completed: false,
  });
  B.futureMissions = [
    { id: "zombozo", villain: "Zombozo", dna: ["ghost"] },
    { id: "kevin", villain: "Kevin 11", dna: ["xlr8", "cannon"] },
    { id: "hex", villain: "Hex", dna: ["snare"] },
    { id: "animo", villain: "Dr. Ánimo", dna: ["vine"] },
    { id: "malware", villain: "Malware", dna: ["upgrade"] },
    {
      id: "blitz-scan",
      villain: "Lobo alienígena",
      dna: ["blitz"],
      scan: true,
    },
    { id: "vilgax", villain: "Vilgax", dna: [] },
  ];
  const line = (who, text, expression = "DECIDIDO", action) => ({
    who,
    text,
    expression,
    action,
  });
  B.scenes = {
    intro: {
      title: "PRÓLOGO / EL PROTOCOLO DE PROTECCIÓN",
      lines: [
        line(
          "Vilgax",
          "Al fin. El Omnitrix completo será mío. ¡Activa el extractor, Malware!",
          "AMENAZANTE",
        ),
        line(
          "Malware",
          "La conexión está lista. Tu reloj tiene un aspecto… delicioso.",
          "CORRUPTO",
          "extract",
        ),
        line(
          "Ben",
          "Eh, tentáculos. ¿Tu plan incluye garantía? Porque este reloj es un poco temperamental.",
          "DESAFIANTE",
        ),
        line("Ben", "¡Aaaah! ¡No, no, no! ¡Mi reloj!", "ALARMADO", "fracture"),
        line("Kevin", "¡Yo lo capturé! El reloj debería ser mío.", "FURIOSO"),
        line(
          "Zombozo",
          "¿Y si lo compartimos? Los martes me pido al payaso de fuego.",
          "BURLÓN",
        ),
        line("Hex", "Ninguno de estos necios merece ese poder.", "INDIGNADO"),
        line(
          "Dr. Ánimo",
          "¡Mis criaturas tienen más cerebro que todos ustedes juntos!",
          "FURIOSO",
        ),
        line(
          "Driscoll",
          "Basta. Mis caballeros ya tienen el ADN cristalino.",
          "FRÍO",
        ),
        line("Vilgax", "¡YO QUIERO EL OMNITRIX ENTERO!", "FURIOSO", "brawl"),
        line(
          "Ben",
          "Genial. Reunión de villanos… sin moderador. Yo me voy.",
          "SONRIENTE",
          "escape",
        ),
      ],
    },
    arrival: {
      title: "CAPÍTULO 01 / LA CAZA DE LOS CABALLEROS",
      lines: [
        line(
          "Max",
          "Estás a salvo, Ben. Pero el reloj ha perdido siete firmas de ADN.",
          "PREOCUPADO",
        ),
        line(
          "Gwen",
          "Quedan Fuego y Cuatro Brazos. El resto está en manos de esa alianza.",
          "ATENTA",
        ),
        line(
          "Ben",
          "Perfecto. Un calamar gigante me roba el reloj y encima deja que se peleen por las piezas.",
          "MOLESTO",
        ),
        line(
          "Gwen",
          "Ben… esos tipos de la calle no vienen a pedirte un autógrafo.",
          "ALARMADA",
        ),
        line(
          "Comandante",
          "¡Por orden del Rey Eterno, entregad el Omnitrix!",
          "AMENAZANTE",
        ),
        line("Ben", "Hora de Diamante… Espera. ¿Bloqueado?", "SORPRENDIDO"),
        line("Gwen", "¡Solo tienes dos alienígenas, genio!", "IRÓNICA"),
        line(
          "Ben",
          "Entonces… ¡cuatro brazos serán suficientes!",
          "DECIDIDO",
          "four",
        ),
      ],
    },
    gate: {
      title: "BELLWOOD / DOS PODERES, UN CAMINO",
      lines: [
        line(
          "Gwen",
          "El motor de esa compuerta está frío. Prueba con un poco de calor.",
          "ATENTA",
        ),
        line(
          "Max",
          "Y una vez encendido, necesitarás mucha fuerza para levantarla.",
          "TRANQUILO",
        ),
      ],
    },
    market: {
      title: "DISTRITO COMERCIAL / LA EMBOSCADA",
      lines: [
        line(
          "Ben",
          "Caballeros medievales con pistolas láser. ¿No les pareció suficiente la espada?",
          "IRÓNICO",
        ),
        line(
          "Gwen",
          "Los cristales de sus armaduras… se parecen a Diamante. Sigue hacia la plaza.",
          "ATENTA",
        ),
      ],
    },
    executor: {
      title: "PLAZA CENTRAL / EL EJECUTOR ETERNO",
      lines: [
        line("Ejecutor", "Nadie atraviesa esta plaza.", "AMENAZANTE"),
        line(
          "Ben",
          "Buen escudo. ¿También lo tienes en talla exagerada?",
          "SONRIENTE",
        ),
      ],
    },
    executorEnd: {
      title: "ACCESO A LA FORTALEZA",
      lines: [
        line(
          "Ben",
          "Creo que alguien se saltó el día de piernas.",
          "SONRIENTE",
        ),
        line(
          "Max",
          "La entrada a la fortaleza está al este. Revisa la zona antes de seguir.",
          "TRANQUILO",
        ),
      ],
    },
    fort: {
      title: "FORTALEZA / ECOS DE DIAMANTE",
      lines: [
        line(
          "Gwen",
          "Están usando el ADN de Diamante para alimentar todo el complejo.",
          "PREOCUPADA",
        ),
        line("Ben", "Pues vamos a desconectarlo.", "DECIDIDO"),
      ],
    },
    throne: {
      title: "SALA DEL TRONO / EL REY ETERNO",
      lines: [
        line(
          "Driscoll",
          "Con esta armadura, la Orden renacerá. Tu alienígena ahora me pertenece.",
          "ORGULLOSO",
        ),
        line(
          "Ben",
          "Tengo dos amigos que quieren hablar contigo. Uno es caliente. El otro tiene cuatro brazos.",
          "DESAFIANTE",
        ),
        line(
          "Gwen",
          "¡Los conductos! Ya sabes cómo fracturar ese cristal, Ben.",
          "ATENTA",
        ),
      ],
    },
    recovery: {
      title: "OMNITRIX / RESTAURACIÓN GENÉTICA",
      lines: [
        line(
          "Ben",
          "Espera… el reloj está haciendo algo.",
          "SORPRENDIDO",
          "dna",
        ),
        line(
          "Gwen",
          "¡Está recuperando la firma genética desde los restos de la armadura!",
          "EMOCIONADA",
        ),
        line(
          "Ben",
          "¡Diamante! Creí que te había perdido, amigo.",
          "FELIZ",
          "unlock",
        ),
        line(
          "Max",
          "No es momento de celebrarlo. La fortaleza se está derrumbando. ¡Sal de ahí!",
          "URGENTE",
        ),
      ],
    },
    finish: {
      title: "BELLWOOD / DE NUEVO JUNTOS",
      lines: [
        line(
          "Max",
          "La firma genética se ha restaurado perfectamente. Buen trabajo, Ben.",
          "ORGULLOSO",
        ),
        line(
          "Gwen",
          "Si hemos recuperado a Diamante, podemos recuperar los demás ADN.",
          "SONRIENTE",
        ),
        line(
          "Ben",
          "Siete villanos, un reloj roto y un verano entero. ¿Quién dijo que las vacaciones eran aburridas?",
          "SONRIENTE",
        ),
      ],
    },
  };
  B.objectives = {
    city: "Despeja la calle y abre la compuerta del este",
    market: "Explora el distrito y derrota al Ejecutor",
    fort: "Calienta los conductos y rompe los soportes",
    throne: "Recupera el ADN de Diamante",
    escape: "Usa a Diamante para escapar de la fortaleza",
  };
  B.zoneNames = {
    city: "CALLES DE BELLWOOD",
    market: "DISTRITO COMERCIAL",
    fort: "FORTALEZA SUBTERRÁNEA",
    throne: "SALA DEL TRONO",
    escape: "RUTA DE EVACUACIÓN",
  };
})(window.B10);
