// Textos de ayuda "Cómo jugar". Cada cifra sale de las reglas que hoy aplica el backend.
export const HELP = {
  blackjack: {
    title: 'Cómo jugar Blackjack',
    intro: 'Acércate a 21 más que el crupier, sin pasarte.',
    sections: [
      {
        heading: 'Valor de las cartas',
        items: [
          'Del 2 al 10 valen su número. J, Q y K valen 10.',
          'El As vale 11, o 1 si con 11 te pasarías de 21.',
        ],
      },
      {
        heading: 'Tu turno',
        items: [
          'Pedir: recibes otra carta. Si pasas de 21 pierdes al instante.',
          'Plantarse: te quedas con tu mano y juega el crupier.',
          'Doblar: solo con tus 2 primeras cartas. Doblas la apuesta y recibes una sola carta.',
          'Retirarse: solo con tus 2 primeras cartas. Recuperas la mitad de la apuesta.',
        ],
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
    ],
    sideBets: {
      heading: 'Apuesta lateral: Perfect Pairs',
      items: [
        'Se juega sobre tus 2 primeras cartas: ganas si forman pareja.',
        'Pareja mixta (colores distintos): devuelve 6 veces la apuesta.',
        'Pareja del mismo color: devuelve 12 veces la apuesta.',
        'Pareja perfecta (mismo palo): devuelve 25 veces la apuesta.',
        'Los totales incluyen tu apuesta inicial.',
      ],
    },
  },
  roulette: {
    title: 'Cómo jugar a la Ruleta',
    intro: 'Ruleta europea: 37 casillas, del 0 al 36. Puedes poner varias apuestas en la misma tirada (máximo 20).',
    sections: [
      {
        heading: 'Cómo apostar',
        items: [
          'Elige el valor de la ficha y haz clic en la casilla o la zona donde quieres apostar.',
          'Apuestas internas: un número (pleno).',
          'Apuestas externas: rojo/negro, par/impar, 1-18/19-36, docenas y columnas.',
        ],
      },
      {
        heading: 'Reglas especiales',
        items: [
          'Si sale el 0, las apuestas simples (color, par/impar, 1-18/19-36) recuperan la mitad (regla "La Partage").',
          'Números calientes: los más repetidos en las últimas tiradas de la mesa. Si aciertas un pleno caliente, cobras un 50% extra.',
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
          'Si una línea tiene 3 símbolos iguales, cobras el multiplicador del símbolo sobre la parte de esa línea.',
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
};
