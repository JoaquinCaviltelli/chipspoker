import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useRoom } from "../services/RoomService";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const TableVirtual = () => {
  const { user, userData, loading, admin } = useContext(AuthContext);
  const { roomData } = useRoom();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [cards, setCards] = useState([]);

  useEffect(() => {
    if (loading) return;

    if (!user || !admin) {
      navigate("/");
    }

    const fetchPlayers = async () => {
      try {
        if (roomData?.players) {
          const sortedPlayers = Object.values(roomData.players).sort(
            (a, b) => a.order - b.order
          );
          setPlayers(sortedPlayers);
        }
      } catch (error) {
        console.error("Error al obtener los jugadores:", error);
      }
    };

    fetchPlayers();

    const fetchGameState = async () => {
      try {
        const roomRef = doc(db, "rooms", "default-room");
        const roomDoc = await getDoc(roomRef);
        const roomData = roomDoc.data();

        setRound(roomData?.round || 0);
        setCurrentTurn(roomData?.currentTurn || null);
      } catch (error) {
        console.error("Error al obtener el estado del juego:", error);
      }
    };

    fetchGameState();
  }, [user, loading, roomData, admin, navigate]);

  useEffect(() => {
    if (roomData?.players) {
      const updatedPlayers = Object.values(roomData.players).map((player) => {
        if (player.id === user.uid) {
          return { ...player, balance: userData.balance };
        }
        return player;
      });
      setPlayers(updatedPlayers);
    }
  }, [roomData, userData.balance, user?.uid]);

  useEffect(() => {
    if (round === 0 && currentTurn === null && players.length > 0) {
      const nextTurn = players[0].id; // El jugador con el orden más bajo
      updateGameState({ currentTurn: nextTurn });
    }
  }, [round, currentTurn, players]);

  const updateGameState = async (updates) => {
    const roomRef = doc(db, "rooms", "default-room");

    try {
      await updateDoc(roomRef, updates);
      console.log("Estado actualizado en Firestore");
    } catch (error) {
      console.error("Error al actualizar estado en Firestore:", error);
    }
  };

  const getAction = (player) => {
    if (player.status === "passed") {
      if(player.betAmount){
        return `${player.betAmount || 0}`
      } else {
        return "Paso"
      }
    } else if (player.status === "bet") {
      return `${player.betAmount || 0}`;
    } else if (player.status === "folded") {
      return "Me voy";
    } else {
      return "...";
    }
  };


  const resetRound = async () => {
    try {
      
      const rotatedPlayers = rotatePlayersOrder(players);
      const updatedPlayers = rotatedPlayers.map((player, index) => ({
        ...player,
        order: index + 1,
      }));
      

      const nextTurn = updatedPlayers[0].id;

      const roomRef = doc(db, "rooms", "default-room");
      await updateDoc(roomRef, {
        round: 0,
        currentTurn: nextTurn,
        pot: 0,
      });

      const playersUpdate = updatedPlayers.reduce((acc, player) => {
        acc[`players.${player.id}`] = { ...player };
        return acc;
      }, {});

      const resetPlayers = updatedPlayers.reduce((acc, player) => {
        acc[`players.${player.id}.status`] = "none";
        return acc;
      }, {});

      await updateDoc(roomRef, {
        ...playersUpdate,
        ...resetPlayers,
      });

      console.log("Ronda reiniciada exitosamente");

      setPlayers(updatedPlayers);
      setRound(0);
      setCurrentTurn(nextTurn);
    } catch (error) {
      console.error("Error al reiniciar la ronda:", error);
    }
  };

  const rotatePlayersOrder = (players) => {
    const [firstPlayer, ...restPlayers] = players;
    return [...restPlayers, firstPlayer];
  };

  const getCardsToShow = () => {
    const totalCards = 5;
    const cards = [];

    let faceUpCards = 0;
    if (round === 1) faceUpCards = 3;
    else if (round === 2) faceUpCards = 4;
    else if (round === 3) faceUpCards = 5;

    for (let i = 0; i < faceUpCards; i++) {
      cards.push({ image: "/src/assets/carta.jpg", isFlipped: true });
    }

    for (let i = 0; i < totalCards - faceUpCards; i++) {
      cards.push({ image: "/src/assets/boca_abajo.jpg", isFlipped: false });
    }

    return cards;
  };

  const flipCardAnimation = (isFlipped) => {
    return isFlipped ? "flip-card" : "";
  };

  useEffect(() => {
    setCards(getCardsToShow());
  }, [round]);

  const nextRound = async () => {
    try {
      const updatedPlayers = players.map((player) => ({
        ...player,
        status: "none", // Resetea el estado de todos los jugadores
        betAmount: 0, // Resetea las apuestas de todos los jugadores
      }));

      const nextRound = round + 1; // Aumenta el contador de la ronda

      // Buscar al jugador con order = 1
      const firstPlayer = updatedPlayers.find((player) => player.order === 1);

      const roomRef = doc(db, "rooms", "default-room");
      await updateDoc(roomRef, {
        round: nextRound, // Aumenta la ronda
        currentTurn: firstPlayer.id, // El primer jugador es el de order 1
      });

      const playersUpdate = updatedPlayers.reduce((acc, player) => {
        acc[`players.${player.id}`] = { ...player };
        return acc;
      }, {});

      await updateDoc(roomRef, {
        ...playersUpdate,
      });

      console.log("Siguiente ronda iniciada");

      // Actualiza los estados en el frontend
      setPlayers(updatedPlayers);
      setRound(nextRound);
      setCurrentTurn(firstPlayer.id); // Asigna el jugador con order 1 al turno actual
    } catch (error) {
      console.error("Error al pasar a la siguiente ronda:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl m-auto p-6">
      {/* <h1 className="text-3xl text-gray-600 font-semibold capitalize">Mesa Virtual</h1>
      
      <div className="my-4">
        <h2 className="text-xl text-gray-600 font-semibold">Ronda: {round}</h2>
        <h3 className="text-lg text-gray-500">Turno actual: {currentTurn ? players.find(player => player.id === currentTurn)?.name : "Ninguno"}</h3>
      </div> */}
      <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={resetRound}
            className="bg-red-500 text-white px-6 py-2 rounded-md"
          >
            Reiniciar Ronda
          </button>
          <button
            onClick={nextRound}
            className="bg-blue-500 text-white px-6 py-2 rounded-md"
          >
            Siguiente Ronda
          </button>
        </div>

      <div className="flex justify-center space-x-2 mt-8 mb-2">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`card-container border border-gray-400 rounded-md  ${flipCardAnimation(
              card.isFlipped
            )}`}
          >
            <img
              src={card.image}
              alt={`card-${index}`}
              className="card w-full rounded-md shadow-lg"
            />
          </div>
        ))}
      </div>
      <h2 className="text-xl text-gray-600 font-bold text-center">
        {round === 0 && "Preflop"}
        {round === 1 && "Flop"}
        {round === 2 && "Rivers"}
        {round === 3 && "Turn"}
      </h2>
      <h2 className="text-xl text-red-800 font-bold text-center">{roomData?.pot || 0}</h2>

      <div className="my-6">
        {/* <h2 className="text-xl text-gray-600 font-semibold mb-2">
          Jugadores en la sala
        </h2> */}
        <ul className="flex justify-center flex-wrap items-center gap-6">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex flex-col items-center font-semibold"
            >
              <div className="mb-4 text-xl font-bold text-center">
                <span
                  className={
                    player.id === currentTurn
                      ? "text-[#5B7661]"
                      : "text-gray-700"
                  }
                >
                  {getAction(player)}
                </span>
              </div>
              <div className={`flex flex-col justify-center items-center  text-white w-36 h-16 rounded-lg text-lg ${player.id === currentTurn ? "bg-[#5B7661]" : "bg-gray-700"}`}>
                <span
                 
                >
                  {player.name}
                </span>
                <span className=" text-xs">
                  {player.balance}k
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      
        
      

    </div>
  );
};

export default TableVirtual;
