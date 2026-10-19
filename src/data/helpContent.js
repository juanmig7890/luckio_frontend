// Textos de ayuda "Cómo jugar". Cada cifra sale de las reglas que aplica el backend.
export const HELP = {
  blackjack: {
    title: 'Cómo jugar Blackjack',
    intro: 'Acércate a 21 más que el crupier, sin pasarte.',
    sections: [
      {
        heading: 'Antes de repartir',
        items: [
          'Elige una ficha y toca los círculos de la mesa para apostar. El círculo central es tu apuesta principal (mínimo 10).',
          'Los círculos laterales son apuestas opcionales: Perfect Pairs y 21+3.',
        ],
      },
      {
        heading: 'Valor de las cartas',
        items: ['Del 2 al 10 valen su número. J, Q y K valen 10.', 'El As vale 11, o 1 si con 11 te pasarías de 21.'],
      },
      {
        heading: 'Tu turno',
        items: [
          'Pedir: recibes otra carta. Si pasas de 21 pierdes al instante.',
          'Plantarse: te quedas con tu mano y juega el crupier.',
          'Doblar: solo con 2 cartas. Doblas la apuesta y recibes una sola carta (también puedes doblar después de dividir).',
          'Dividir: si tus 2 cartas valen lo mismo (K con Q también), separas la mano en dos con otra apuesta igual. Cada mano recibe una carta y se juega por separado. Máximo 4 manos.',
          'Ases divididos: cada As recibe una sola carta, y un 21 así cuenta como 21 normal (paga 1 a 1), no como blackjack.',
          'Retirarse: solo con tus 2 primeras cartas y sin haber dividido. Recuperas la mitad de la apuesta.',
        ],
      },
      {
        heading: 'Seguro',
        items: [
          'Si el crupier muestra un As, antes de jugar puedes tomar el seguro.',
          'Cuesta media apuesta y paga 2 a 1 si el crupier tiene blackjack. Si no lo tiene, pierdes el seguro y la mano sigue.',
        ],
      },
      {
        heading: 'Charlie de 5 cartas',
        items: ['Si llegas a 5 cartas sin pasarte de 21, ganas la mano automáticamente (1 a 1), sin importar lo que tenga el crupier.'],
      },
      {
        heading: 'El crupier',
        items: ['Pide carta hasta tener 17 o más, y se planta en 17 (también en 17 suave).', 'Si el crupier se pasa de 21, ganas.'],
      },
    ],
    table: [
      { label: 'Victoria', value: 'Paga 1 a 1' },
      { label: 'Blackjack (A + carta de 10)', value: 'Paga 3 a 2' },
      { label: 'Blackjack histórico (A♠ + J♠ o J♣)', value: 'Paga 10 a 1' },
      { label: 'Empate', value: 'Se devuelve tu apuesta' },
      { label: 'Seguro', value: 'Paga 2 a 1' },
    ],
    sideBets: {
      heading: 'Apuestas laterales',
      items: [
        'Perfect Pairs (tus 2 primeras cartas): pareja mixta 6 a 1, del mismo color 12 a 1, del mismo palo 25 a 1.',
        '21+3 (tus 2 cartas + la carta visible del crupier, como en el póker): color 5 a 1, escalera 10 a 1, trío 30 a 1, escalera de color 40 a 1, trío del mismo palo 100 a 1.',
        'Las apuestas laterales se resuelven al repartir, antes de jugar la mano.',
      ],
    },
  },
  roulette: {
    title: 'Cómo jugar a la Ruleta',
    intro: 'Ruleta europea: 37 casillas, del 0 al 36. Puedes poner varias apuestas en la misma tirada (máximo 20 distintas).',
    sections: [
      {
        heading: 'Cómo apostar',
        items: [
          'Elige el valor de la ficha y toca la casilla del tapete donde quieres apostar. Cada toque suma otra ficha.',
          'Un número: pleno. Las zonas de abajo y de la derecha son apuestas externas: docenas, columnas, rojo/negro, par/impar y 1-18/19-36.',
          'Deshacer quita la última ficha; Repetir apuesta vuelve a poner la tirada anterior.',
        ],
      },
      {
        heading: 'Reglas especiales',
        items: [
          'Si sale el 0, las apuestas simples (color, par/impar, 1-18/19-36) recuperan la mitad (regla "La Partage").',
          'Números calientes (●): los más repetidos en las últimas tiradas de la mesa. Si aciertas un pleno caliente, cobras un 50% extra.',
        ],
      },
    ],
    table: [
      { label: 'Pleno (un número)', value: 'Paga 35 a 1' },
      { label: 'Rojo/Negro, Par/Impar, 1-18/19-36', value: 'Paga 1 a 1' },
      { label: 'Docena o Columna', value: 'Paga 2 a 1' },
    ],
  },
  slots: {
    title: 'Cómo jugar a las Tragamonedas',
    intro: 'Cuadrícula de 3×3 con 5 líneas de pago: las 3 filas y las 2 diagonales.',
    sections: [
      {
        heading: 'Cómo se gana',
        items: [
          'Tu apuesta se reparte en partes iguales entre las 5 líneas.',
          'Si una línea tiene 3 símbolos iguales, cobras el multiplicador del símbolo sobre la parte de esa línea. Las líneas ganadoras se dibujan sobre los carretes.',
          'Si aparecen 3 o más 🎰 en cualquier lugar de la cuadrícula, ganas el jackpot acumulado.',
          'Una parte de cada apuesta alimenta el jackpot.',
        ],
      },
    ],
    table: [
      { label: '🍒 Cereza', value: 'x8' },
      { label: '🍋 Limón', value: 'x12' },
      { label: '🔔 Campana', value: 'x25' },
      { label: '💎 Diamante', value: 'x60' },
      { label: '7️⃣ Siete', value: 'x200' },
    ],
  },
  baccarat: {
    title: 'Cómo jugar Bacará',
    intro: 'Apuestas a quién se acerca más a 9: el Punto, la Banca o un empate. No decides nada durante la mano: las cartas se reparten solas.',
    sections: [
      {
        heading: 'Valor de las cartas',
        items: ['El As vale 1. Del 2 al 9 valen su número. 10, J, Q y K valen 0.', 'Se suman las cartas y solo cuenta el último dígito (7 + 8 = 15 → 5).'],
      },
      {
        heading: 'Cómo se reparten',
        items: [
          'Se dan 2 cartas al Punto y 2 a la Banca. Con 8 o 9 (natural), nadie pide más.',
          'El Punto pide una tercera carta con 0 a 5 y se planta con 6 o 7.',
          'La Banca pide o se planta según su total y la tercera carta del Punto (reglas fijas del Punto Banco).',
        ],
      },
      {
        heading: 'Apuestas de pareja',
        items: ['Pareja del Punto o de la Banca: sus 2 primeras cartas tienen el mismo valor (K con K sí, K con 10 no).'],
      },
    ],
    table: [
      { label: 'Punto', value: 'Paga 1 a 1' },
      { label: 'Banca', value: 'Paga 1 a 1 menos 5%' },
      { label: 'Empate', value: 'Paga 8 a 1' },
      { label: 'Pareja Punto / Pareja Banca', value: 'Paga 11 a 1' },
    ],
    sideBets: {
      heading: 'Importante',
      items: ['Si hay empate, se devuelven las apuestas al Punto y a la Banca.', 'La comisión del 5% se descuenta de las ganancias de la Banca (se redondea hacia abajo).'],
    },
  },
  plinko: {
    title: 'Cómo jugar Plinko',
    intro: 'Sueltas una bola que rebota en 12 filas de clavijas y cae en una casilla con un multiplicador.',
    sections: [
      {
        heading: 'Cómo funciona',
        items: [
          'En cada clavija la bola va a la izquierda o a la derecha con la misma probabilidad.',
          'Por eso casi siempre cae cerca del centro (premios bajos); los premios grandes están en los bordes y son muy raros.',
          'El resultado lo decide el servidor al soltar la bola; la animación solo lo muestra.',
        ],
      },
      {
        heading: 'Nivel de riesgo',
        items: [
          'Bajo: premios parejos, el máximo es x5.6.',
          'Medio: más variación, el máximo es x18.',
          'Alto: casi siempre pagas menos de lo apostado, pero el máximo es x250.',
          'En los tres niveles el retorno esperado es de aproximadamente 97%.',
        ],
      },
    ],
  },
};

// Mesas en vivo: mismas reglas que la mesa individual, más cómo funciona la mesa compartida
const LIVE_SECTION = {
  heading: 'Mesa en vivo',
  items: [
    'Es una mesa compartida: todos los jugadores sentados ven el mismo resultado al mismo tiempo.',
    'Cada ronda tiene 3 momentos: apuestas abiertas (20 s), sorteo y animación (7 s) y resultado (4 s). Luego empieza otra ronda sola.',
    'Pon tus fichas en el tapete y pulsa «Apostar» antes de que se acabe el tiempo. Lo apostado se cobra al enviarlo; puedes apostar varias veces en la misma ronda.',
    'Tus pagos se acreditan automáticamente aunque cierres la página.',
  ],
};
HELP.rouletteLive = { ...HELP.roulette, title: 'Cómo jugar a la Ruleta en vivo', sections: [LIVE_SECTION, ...HELP.roulette.sections] };
HELP.baccaratLive = { ...HELP.baccarat, title: 'Cómo jugar Bacará en vivo', sections: [LIVE_SECTION, ...HELP.baccarat.sections] };

// El blackjack en vivo no comparte una sola mano (como Ruleta/Bacará): tiene 6 sillas independientes,
// cada una con sus propias cartas y decisiones, pero las 6 juegan contra el mismo crupier.
const BLACKJACK_LIVE_SECTION = {
  heading: 'Mesa en vivo: 6 sillas, un solo crupier',
  items: [
    'La mesa tiene 6 sillas. Elige una libre para sentarte; mientras no apuestes, puedes levantarte cuando quieras.',
    'Cada silla reparte y juega SU propia mano de forma independiente (incluidas sus apuestas laterales), pero las 6 sillas comparten el mismo crupier.',
    'Cuando te toca a ti, tienes un tiempo límite para decidir (se ve en el reloj de arriba). Si no respondes a tiempo, tu mano se planta sola, igual que en una mesa real.',
    'El seguro (si el crupier muestra un As) se ofrece a todas las sillas con apuesta al mismo tiempo, cada una decide por su cuenta.',
    'El número de cartas que quedan en el zapato se ve arriba: cuando baja demasiado, la mesa arma un zapato nuevo antes de la siguiente ronda, igual que en un casino real.',
    'Tus pagos se acreditan automáticamente al terminar la ronda, aunque cierres la página.',
  ],
};
HELP.blackjackLive = { ...HELP.blackjack, title: 'Cómo jugar Blackjack en vivo', sections: [BLACKJACK_LIVE_SECTION, ...HELP.blackjack.sections] };
