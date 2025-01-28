
import card from '/src/assets/cartaAs.png';
import backCard from '/src/assets/boca_abajo.jpg';
import end from '/src/assets/carta.jpg';

export const Carta = ({ isFlipped, round }) => {
  return (
    <div className="card perspective-1000 group cursor-pointer">
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d   rounded-md shadow-lg ${isFlipped ? "rotate-y-180" : ""}`}
      >
        {/* Cara frontal de la carta */}
        <div
          className={`absolute w-full h-full backface-hidden bg-cover bg-center rounded-md border border-gray-400 ${round === 4 && "blur-[1px]"}`}
          style={{
            backgroundImage: `url(${card})`,
          }}
        ></div>

        {/* Cara trasera de la carta */}
        <div
          className={`absolute w-full h-full rotate-y-180 backface-hidden bg-cover bg-center rounded-md `}
          style={{
            backgroundImage: `url(${backCard})`,
          }}
        ></div>
        
      </div>
    </div>
  );
};
