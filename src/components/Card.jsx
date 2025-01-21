import React, { useState, useEffect } from "react";

const Card = ({ imageUrl, faceDown }) => {
  const [isFlipped, setIsFlipped] = useState(faceDown);

  // useEffect para actualizar el estado de la carta al cambiar la fase
  useEffect(() => {
    setIsFlipped(faceDown);
  }, [faceDown]);

  return (
    <>
      <style>
        {`
          .card-container {
            perspective: 1000px; /* Define el espacio 3D */
          }

          .card {
            width: 100px;
            height: 150px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            transform-style: preserve-3d; /* Mantiene las caras al girar */
            transition: transform 0.6s; /* Tiempo de animación */
            background-size: cover;
            background-position: center;
          }

          .card.flip {
            transform: rotateY(180deg); /* Girar la carta 180 grados en el eje Y */
          }

          .card .card-front,
          .card .card-back {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            backface-visibility: hidden; /* Ocultar la parte de atrás cuando está girada */
          }

          .card .card-front {
            background-image: url('${imageUrl}');
            background-size: cover;
            background-position: center;
          }

          .card .card-back {
            background-image: url('src/assets/boca_abajo.jpg');
            background-size: cover;
            background-position: center;
          }
        `}
      </style>
      
      <div className="card-container">
        <div className={`card ${isFlipped ? 'flip' : ''}`}>
          <div className="card-front"></div> {/* Carta boca arriba */}
          <div className="card-back"></div>  {/* Carta boca abajo */}
        </div>
      </div>
    </>
  );
};

export default Card;
