import React from 'react';

const pokerHands = [
  { name: "Escalera Real", cards: ["A♠", "K♠", "Q♠", "J♠", "10♠"], highlighted: [0,1,2,3,4] },
  { name: "Escalera de Color", cards: ["9♣", "8♣", "7♣", "6♣", "5♣"], highlighted: [0,1,2,3,4] },
  { name: "Póker", cards: ["K♠", "K♦", "K♣", "K♥", "2♠"], highlighted: [0, 1, 2, 3] },
  { name: "Full House", cards: ["3♠", "3♦", "3♣", "J♠", "J♦"], highlighted: [0, 1, 2,3,4] },
  { name: "Color", cards: ["A♠", "10♠", "7♠", "5♠", "3♠"], highlighted: [0,1,2,3,4] },
  { name: "Escalera", cards: ["5♣", "6♦", "7♠", "8♥", "9♠"], highlighted: [0,1,2,3,4] },
  { name: "Trío", cards: ["4♠", "4♦", "4♣", "2♠", "7♥"], highlighted: [0, 1, 2] },
  { name: "Doble Pareja", cards: ["9♠", "9♦", "6♠", "6♣", "2♠"], highlighted: [0, 1, 2, 3] },
  { name: "Pareja", cards: ["8♠", "8♦", "K♠", "3♣", "5♥"], highlighted: [0, 1] },
  { name: "Carta Alta", cards: ["K♠", "J♦", "7♠", "6♣", "2♠"], highlighted: [0] }
];

// Función para asignar color a cada carta según el palo
const getCardColor = (card) => {
  if (card.includes('♠') || card.includes('♣')) {
    return 'text-black'; // Negro para Picas y Tréboles
  }
  if (card.includes('♥') || card.includes('♦')) {
    return 'text-red-500'; // Rojo para Corazones y Diamantes
  }
  return 'text-black'; // Por defecto negro
};

const PokerHandsModal = ({ isModalOpen, toggleModal }) => {
  return (
    isModalOpen && (
      <div className="fixed inset-0 bg-white overflow-scroll z-10">
        <div className="bg-white p-6 rounded-lg w-full max-w-xl">
          {/* <h2 className=" font-bold mb-4">Manos de Póker</h2> */}
          <div className="space-y-2">
            {pokerHands.map((hand, index) => (
              <div key={index}>
                <h3 className="text-xs font-semibold">{hand.name}</h3>
                <div className="flex gap-2">
                  {hand.cards.map((card, idx) => {
                    // Comprobar si la carta está resaltada
                    const isHighlighted = hand.highlighted.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`w-9 h-12 bg-white border-2 ${isHighlighted ? 'border-red-800' : 'border-gray-400 opacity-70'} rounded-md flex justify-center items-center transition-all`}
                      >
                        <span className={`text-sm font-bold ${getCardColor(card)}`}>{card}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={toggleModal}
            className="bg-red-600 text-white p-2 rounded-lg mt-4 w-full"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  );
};

export default PokerHandsModal;
