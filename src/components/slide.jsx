import React, { useState } from 'react';

const SliderButton = () => {
  const [isActive, setIsActive] = useState(false);
  const [startY, setStartY] = useState(0);  // Mantener startY para el movimiento vertical
  const [isSliding, setIsSliding] = useState(false);

  // Función para manejar el inicio del deslizamiento
  const handleTouchStart = (e) => {
    setIsSliding(true);
    setStartY(e.touches[0].clientY);  // Guardar la posición inicial del toque
  };

  // Función para manejar el movimiento
  const handleTouchMove = (e) => {
    if (!isSliding) return;
    const currentY = e.touches[0].clientY;  // Obtener la posición Y actual del toque
    const distance = startY - currentY;     // Calcular la distancia vertical (invertida)

    // Si la distancia es mayor a 140px, activamos el botón
    if (distance > 140) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  };

  // Función para manejar el final del deslizamiento
  const handleTouchEnd = () => {
    setIsSliding(false);
    if (isActive) {
      console.log("folded");
    }
    setIsActive(false);
  };

  return (
    <div
      className={`w-12 h-64 bg-gray-300 rounded-lg transition-all relative overflow-hidden ${
        isActive && 'bg-red-400'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        className={`absolute left-1/2 transform -translate-x-1/2 p-3 text-white font-semibold rounded-md transition-all w-12 h-16 duration-300 ${
          isActive ? 'bg-red-500' : 'bg-red-400'
        }`}
        style={{ top: isActive ? '0' : 'calc(100% - 64px)' }}  // El botón empieza en la parte inferior y se mueve hacia arriba
      >
        Foldear
      </button>
    </div>
  );
};

export default SliderButton;
