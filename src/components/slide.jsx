import React, { useState, useEffect } from 'react';

const SliderButton = ({ fold, isPlayerFolded, currentTurn, user }) => {
  const [isActive, setIsActive] = useState(false);
  const [startY, setStartY] = useState(0);  // Mantener startY para el movimiento vertical
  const [isSliding, setIsSliding] = useState(false);

  // Función para manejar el inicio del deslizamiento
  const handleTouchStart = (e) => {
    if (isPlayerFolded) return;  // Si el jugador ha foldado, no permite deslizar
    setIsSliding(true);
    setStartY(e.touches[0].clientY);  // Guardar la posición inicial del toque
  };

  // Función para manejar el movimiento
  const handleTouchMove = (e) => {
    if (!isSliding || isPlayerFolded || currentTurn !== user) return;  // Si el jugador ha foldado o no es su turno, no permite mover
    const currentY = e.touches[0].clientY;  // Obtener la posición Y actual del toque
    const distance = startY - currentY;     // Calcular la distancia vertical (invertida)

    // Si la distancia es mayor a 140px, activamos el botón
    if (distance > 140) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  };

  useEffect(() => {
    if (isPlayerFolded) {
      setIsActive(false);  // Si el jugador ha foldado, asegúrate de que isActive sea false
    } else {
      setIsActive(false);  // Si el jugador no ha foldado, también es false
    }
  }, [isPlayerFolded]);  // Actualizar isActive cuando isPlayerFolded cambie

  // Función para manejar el final del deslizamiento
  const handleTouchEnd = () => {
    setIsSliding(false);
    if (isActive) {
      fold();
      console.log("folded");
    }
  };

  return (
    <div
      className={`w-20 h-full bg-gray-200 transition-all relative overflow-hidden ${
        isActive && 'bg-red-500'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        className={`absolute left-1/2 transform -translate-x-1/2 p-3 text-white text-center leading-4 text-xs font-semibold rounded-md transition-all w-20 h-16 duration-300 ${
          currentTurn !== user && !isActive ? 'bg-gray-500' : 'bg-red-500'
        }`}
        style={{ top: isActive ? '0' : 'calc(100% - 64px)' }}  // El botón empieza en la parte inferior y se mueve hacia arriba
      >
        Me voy
      </button>
    </div>
  );
};

export default SliderButton;
