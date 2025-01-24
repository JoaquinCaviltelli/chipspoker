import React from 'react';

const pokerHands = [
  { 
    name: "Escalera Real", 
    cards: ["A♠", "K♠", "Q♠", "J♠", "10♠"], 
    highlighted: [0, 1, 2, 3, 4],
    description: "La mejor mano de póker. Compuesta por A, K, Q, J y 10 del mismo palo."
  },
  { 
    name: "Escalera de Color", 
    cards: ["9♣", "8♣", "7♣", "6♣", "5♣"], 
    highlighted: [0, 1, 2, 3, 4],
    description: "Cinco cartas consecutivas del mismo palo."
  },
  { 
    name: "Póker", 
    cards: ["K♠", "K♦", "K♣", "K♥", "2♠"], 
    highlighted: [0, 1, 2, 3],
    description: "Cuatro cartas del mismo valor, independientemente del palo."
  },
  { 
    name: "Full House", 
    cards: ["3♠", "3♦", "3♣", "J♠", "J♦"], 
    highlighted: [0, 1, 2, 3, 4],
    description: "Tres cartas de un valor y dos cartas de otro valor."
  },
  { 
    name: "Color", 
    cards: ["A♠", "10♠", "7♠", "5♠", "3♠"], 
    highlighted: [0, 1, 2, 3, 4],
    description: "Cinco cartas del mismo palo, pero no en orden consecutivo."
  },
  { 
    name: "Escalera", 
    cards: ["5♣", "6♦", "7♠", "8♥", "9♠"], 
    highlighted: [0, 1, 2, 3, 4],
    description: "Cinco cartas consecutivas, sin importar el palo."
  },
  { 
    name: "Trío", 
    cards: ["4♠", "4♦", "4♣", "2♠", "7♥"], 
    highlighted: [0, 1, 2],
    description: "Tres cartas del mismo valor."
  },
  { 
    name: "Doble Pareja", 
    cards: ["9♠", "9♦", "6♠", "6♣", "2♠"], 
    highlighted: [0, 1, 2, 3],
    description: "Dos pares de cartas del mismo valor."
  },
  { 
    name: "Pareja", 
    cards: ["8♠", "8♦", "K♠", "3♣", "5♥"], 
    highlighted: [0, 1],
    description: "Dos cartas del mismo valor."
  },
  { 
    name: "Carta Alta", 
    cards: ["K♠", "J♦", "7♠", "6♣", "2♠"], 
    highlighted: [0],
    description: "La carta más alta en caso de que no se tenga ninguna mano combinada."
  }
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
      <div className="fixed inset-0 bg-gray-100 overflow-scroll z-10">
        <div className="rounded-lg w-full max-w-xl flex justify-between items-start h-full">
          {/* <h2 className="font-bold mb-4">Manos de Póker</h2> */}
          <div className="space-y-2 p-6">
            {pokerHands.map((hand, index) => (
              <div key={index}>
                <h3 className="text-xs font-semibold mb-1">{hand.name}</h3>
                
                <div className="flex gap-1">
                  {hand.cards.map((card, idx) => {
                    // Comprobar si la carta está resaltada
                    const isHighlighted = hand.highlighted.includes(idx);

                    // Separar número/letra y símbolo
                    const number = card.slice(0, -1);  // Todo excepto el último carácter (el número/letra)
                    const suit = card.slice(-1);  // El último carácter (el símbolo del palo)

                    return (
                      <div
                        key={idx}
                        className={`w-9 h-12 bg-white border ${isHighlighted ? 'border-gray-800' : 'border-gray-400 opacity-50'} rounded flex justify-center items-center transition-all`}
                      >
                        <div className="relative flex flex-col items-center justify-center">
                          {/* Número/letra en la esquina superior izquierda */}
                          <span className={`text-[11px] font-medium ${getCardColor(card)} absolute top-0 left-0 transform -translate-x-[7px] -translate-y-2`}>
                            {number}
                          </span>
                          {/* Símbolo centrado en la carta */}
                          <span className={`text-lg ${getCardColor(card)}`}>
                            {suit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* <p className="text-xs text-gray-600">{hand.description}</p>*/}
              </div>
            ))}
          </div>
          <button
            onClick={toggleModal}
            className="py-7 px-4"
          >
            <span className="material-symbols-outlined text-gray-800 font-bold">
              close
            </span>
          </button>
        </div>
      </div>
    )
  );
};

export default PokerHandsModal;
