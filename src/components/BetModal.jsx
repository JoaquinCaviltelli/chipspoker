import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext"; // Accede al contexto
import Slide from "/src/components/slide.jsx";

// Estilo de las fichas basado en el código que compartiste
const estiloFicha = {
  10: { color1: "#7e7e7c", color2: "#a2a2a0" },
  25: { color1: "#3a6d5b", color2: "#6e9d8c" },
  50: { color1: "#1b2553", color2: "#4b5270" },
  100: { color1: "#232429", color2: "#47474b" },
  500: { color1: "#8f3636", color2: "#c18585" },
  1000: { color1: "#e6c66a", color2: "#f1e0a3" },
};

const Ficha = ({ denominacion, color1, color2 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className="w-14 h-14 shadow-xl rounded-full"
    fill="none"
  >
    <defs>
      <radialGradient id={`grad${denominacion}`} cx="50%" cy="50%" r="40%">
        <stop offset="0%" style={{ stopColor: color2, stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: color1, stopOpacity: 1 }} />
      </radialGradient>
    </defs>
    <circle
      cx="50"
      cy="50"
      r="60"
      fill={`url(#grad${denominacion})`}
      stroke="white"
      strokeWidth="4"
    />
    <circle cx="50" cy="50" r="38" fill="none" stroke="white" strokeWidth="3" />
    <text
      x="50"
      y="52"
      fontSize="18"
      textAnchor="middle"
      dy=".3em"
      fill="white"
      fontWeight="bold"
    >
      {denominacion}
    </text>
    <line x1="50" y1="0" x2="50" y2="13" stroke="white" strokeWidth="14" />
    <line x1="50" y1="100" x2="50" y2="87" stroke="white" strokeWidth="14" />
    <line x1="100" y1="50" x2="87" y2="50" stroke="white" strokeWidth="14" />
    <line x1="0" y1="50" x2="13" y2="50" stroke="white" strokeWidth="14" />
  </svg>
);

const BetModal = ({
  round,
  user,
  currentTurn,
  handleBet,
  pass,
  onAddBet,
  onResetBet,
  onConfirmBet,
  currentBet,
}) => {
  const { userData, updateBalance } = useContext(AuthContext); // Accede a userData y la función updateBalance
  const [selectedFiches, setSelectedFiches] = useState([]);
  const [simulatedBalance, setSimulatedBalance] = useState(userData.balance); // Estado para el balance simulado
  const [touchCount, setTouchCount] = useState(0);
  const [lastTouchTime, setLastTouchTime] = useState(0);
  const touchThreshold = 300; // Tiempo máximo entre toques para considerar un doble toque en ms

  // Efecto para sincronizar el balance simulado con el balance real
  useEffect(() => {
    setSimulatedBalance(userData.balance); // Inicializa el balance simulado al balance real
  }, [userData.balance]);

  // Función para manejar el doble toque en dispositivos móviles
  const handleTouch = (event) => {
    const currentTime = new Date().getTime();
    // Si el tiempo entre toques es menor que el umbral, es un doble toque
    if (currentTime - lastTouchTime <= touchThreshold) {
      handlePass(); // Llama a la función de pasar
    } else {
      setTouchCount(1); // Resetear el contador
    }
    setLastTouchTime(currentTime);
  };

  const handleAddBet = (value) => {
    if (simulatedBalance >= value) {
      setSelectedFiches((prev) => [...prev, value]); // Añadir la ficha seleccionada
      setSimulatedBalance((prev) => prev - value); // Descuenta el valor de la apuesta del balance simulado
      onAddBet(value);
    }
  };

  const handlePass = () => {
    console.log("Pasar");
    pass();
  };

  const renderSelectedFiches = () => {
    const fichesGrouped = selectedFiches.reduce((acc, value) => {
      acc[value] = acc[value] ? [...acc[value], value] : [value];
      return acc;
    }, {});

    return (
      <div className="flex justify-center relative gap-10 mb-4 w-screen h-full p-6">
        <h2 className="text-3xl text-gray-700 absolute bottom-3 right-10 font-bold text-center">
          {currentBet}
          {/* {simulatedBalance} */}
        </h2>
        {Object.keys(fichesGrouped).map((value) => (
          <div key={value} className="relative -translate-x-8">
            {fichesGrouped[value].map((_, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  top: `${index * 10}px`,
                  transform: `rotate(${index * 5}deg)`,
                }}
              >
                <Ficha
                  denominacion={parseInt(value)}
                  color1={estiloFicha[value].color1}
                  color2={estiloFicha[value].color2}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const handleResetBet = () => {
    // Calcular el total de las fichas seleccionadas y añadirlo de vuelta al balance simulado
    const totalBetValue = selectedFiches.reduce(
      (total, value) => total + value,
      0
    );
    setSelectedFiches([]); // Restablecer las fichas seleccionadas
    setSimulatedBalance((prev) => prev + totalBetValue); // Restaurar el balance simulado
    onResetBet(); // Llamar a la función de resetear
  };

  const handleConfirmBet = () => {
    // Cuando se confirma la apuesta, actualizar el balance real

    updateBalance(simulatedBalance); // Actualizar el balance real con el balance simulado
    setSelectedFiches([]); // Vaciar las fichas seleccionadas
    onConfirmBet(); // Confirmar la apuesta
  };

  return (
    <div className="w-full flex flex-col justify-between items-center h-full">
      <div className="flex w-full h-full mb-10 gap-2 flex-row-reverse">

     
      <Slide/>

      {!currentBet ? (
        // si hace doble click o doble touch active la funcion de pasar

        <>
          {currentTurn === user && round !== 4 ? (
            <div
              onDoubleClick={handlePass} // Para escritorio
              onTouchEnd={handleTouch} // Para dispositivos móviles
              className="bg-green-200 h-full w-full mb-4 flex justify-center items-center flex-col cursor-pointer select-none"
            >
              <span className="material-symbols-outlined text-gray-700 text-5xl">
                touch_double
              </span>
              <span className="text-gray-700 font-medium">Check</span>
            </div>
          ) : (
            <div className="bg-gray-200 h-full w-full mb-4 flex justify-center items-center ">
              <span className="material-symbols-outlined text-gray-700 text-5xl">
                hourglass_top
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="bg-green-200 h-full w-full mb-4 select-none">
          {/* Área donde se acumulan las fichas seleccionadas */}
          {renderSelectedFiches()}
        </div>
      )}
 </div>

      {/* Fichas de casino */}
      <div className="flex flex-wrap justify-center gap-2 max-w-2xl m-auto mb-10">
        {[10, 25, 50, 100, 500, 1000].map((valor) => (
          <button
            key={valor}
            onClick={() => handleAddBet(valor)}
            disabled={simulatedBalance < valor || currentTurn !== user} // Deshabilitar si no hay suficiente balance
            className={`flex flex-col items-center justify-center ${
              simulatedBalance < valor || currentTurn !== user ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Ficha
              denominacion={valor}
              color1={estiloFicha[valor].color1}
              color2={estiloFicha[valor].color2}
            />
          </button>
        ))}
      </div>

      {/* Botones para resetear, confirmar y cerrar */}
      <div className="flex gap-3 max-w-2xl">
        <button
        disabled={currentTurn !== user}
          onClick={handleResetBet}
          className={`bg-gray-500 text-white px-4 py-2 rounded-md ${
          currentTurn !== user ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Resetear
        </button>
        <button
        disabled={currentTurn !== user}
          onClick={handleConfirmBet}
          className={`bg-[#5B7661] text-white px-4 py-2 rounded-md ${
            currentTurn !== user ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          Confirmar Apuesta
        </button>
      </div>
    </div>
  );
};

export default BetModal;
