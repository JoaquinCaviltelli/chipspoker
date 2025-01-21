import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useRoom } from "../services/RoomService";
import { db } from "../firebase";
import {
  doc,
  updateDoc,
  onSnapshot,
  deleteField,
  getDoc,
} from "firebase/firestore";

const GameRoom = () => {
  const { user, userData, loading } = useContext(AuthContext);
  const { roomData, isUserInRoom } = useRoom();
  const navigate = useNavigate();
  const [currentTurn, setCurrentTurn] = useState(null); // Estado local del turno actual
  const [roundState, setRoundState] = useState(null); // Estado local de la fase de la ronda

  useEffect(() => {
    if (!loading && (!user || !isUserInRoom(user?.uid))) {
      navigate("/");
    }
  }, [user, isUserInRoom, loading, navigate]);
  
  useEffect(() => {
    const roomRef = doc(db, "rooms", "default-room");
  
    // Escuchar cambios en tiempo real para `currentTurn` y `roundState`
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentTurn(data.currentTurn); // Actualizar turno local
        setRoundState(data.roundState); // Actualizar ronda local
      }
    });
  
    // Inicializar turno si no existe
    const initializeTurn = async () => {
      const docSnap = await getDoc(roomRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data.currentTurn) {
          const players = Object.values(data.players || {});
          if (players.length > 0) {
            await updateDoc(roomRef, { currentTurn: players[0].id }); // Asignar turno al primer jugador
          }
        }
      }
    };
  
    initializeTurn();
  
    return () => unsubscribe();
  }, []);
  
  // UseEffect para manejar el reinicio de la ronda
useEffect(() => {
  if (roundState === 0) {
    const roomRef = doc(db, "rooms", "default-room");

    // Primero reiniciar el estado de "folded" para todos los jugadores
    const resetFolded = async () => {
      const docSnap = await getDoc(roomRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updates = {};

        // Reiniciar el estado de "folded" para todos los jugadores
        Object.keys(data.players || {}).forEach((playerId) => {
          updates[`players.${playerId}.folded`] = false;
        });

        try {
          await updateDoc(roomRef, updates);
          console.log("Estado de folded reiniciado para todos los jugadores.");
          resetRound(); // Luego llamar a la función de reinicio de ronda después de reiniciar "folded"
        } catch (error) {
          console.error("Error al reiniciar el estado de folded:", error);
        }
      }
    };

    const resetRound = async () => {
      const docSnap = await getDoc(roomRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        try {
          // Aquí puedes reiniciar la ronda
          await updateDoc(roomRef, {
            roundState: 0, // Reiniciar la ronda
            currentTurn: Object.keys(data.players || {})[0], // Asignar el primer jugador como turno
          });
          console.log("Ronda reiniciada.");
        } catch (error) {
          console.error("Error al reiniciar la ronda:", error);
        }
      }
    };

    resetFolded(); // Ejecutar la función para reiniciar "folded" primero
  }
}, [roundState]);

  
  // UseEffect para verificar si todos menos uno han foldeado
  useEffect(() => {
    const roomRef = doc(db, "rooms", "default-room");
  
    const checkFoldedPlayers = async () => {
      const docSnap = await getDoc(roomRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const players = Object.values(data.players || {});
        const activePlayers = players.filter((player) => !player.folded);
  
        if (activePlayers.length === 1) {
          try {
            await updateDoc(roomRef, {
              roundState: 0, // Reiniciar la ronda
              currentTurn: activePlayers[0].id, // Establecer turno al único jugador restante
            });
  
            console.log(
              `Ronda reiniciada. Ganador de la ronda: ${activePlayers[0].name}`
            );
          } catch (error) {
            console.error("Error al reiniciar el estado de la ronda:", error);
          }
        }
      }
    };
  
    checkFoldedPlayers();
  }, [roomData]); // Dependencia de roomData para verificar cambios en tiempo real
  
  // Función para pasar el turno
  const passTurn = async () => {
    const roomRef = doc(db, "rooms", "default-room");
  
    // Ordenar jugadores por orden de ingreso y filtrar los que no han foldeado
    const sortedPlayers = Object.values(roomData?.players || {})
      .sort((a, b) => a.joinedAt?.seconds - b.joinedAt?.seconds)
      .filter((player) => !player.folded);
  
    // Encontrar el índice del jugador actual y calcular el siguiente
    const currentIndex = sortedPlayers.findIndex(
      (player) => player.id === currentTurn
    );
    const nextIndex = (currentIndex + 1) % sortedPlayers.length; // Ciclar al siguiente jugador
  
    // Si regresamos al primer jugador, avanzar el roundState
    const isRoundComplete = nextIndex === 0;
  
    try {
      const updates = {
        currentTurn: sortedPlayers[nextIndex]?.id || null, // Actualizar al siguiente jugador o null si no hay
        ...(isRoundComplete && {
          roundState: roundState < 3 ? roundState + 1 : 0, // Avanzar la ronda o reiniciar
        }),
      };
  
      await updateDoc(roomRef, updates); // Aplicar todas las actualizaciones
    } catch (error) {
      console.error("Error al pasar el turno:", error);
    }
  };
  
  // Función para foldear
  const fold = async () => {
    const roomRef = doc(db, "rooms", "default-room");
  
    try {
      // Marcar al jugador como "folded" y pasar el turno al siguiente
      await updateDoc(roomRef, {
        [`players.${user.uid}.folded`]: true,
      });
  
      passTurn(); // Pasar el turno al siguiente jugador automáticamente
    } catch (error) {
      console.error("Error al foldear:", error);
    }
  };
  
  

  const leaveRoom = async () => {
    const roomRef = doc(db, "rooms", "default-room");

    // Ordenar jugadores por orden de ingreso
    const sortedPlayers = Object.values(roomData?.players || {}).sort(
      (a, b) => a.joinedAt?.seconds - b.joinedAt?.seconds
    );

    const currentIndex = sortedPlayers.findIndex(
      (player) => player.id === currentTurn
    );

    // Eliminar al jugador de la sala
    try {
      await updateDoc(roomRef, {
        [`players.${user.uid}`]: deleteField(),
      });

      // Si el jugador saliente tiene el turno, pasarlo al siguiente
      if (currentTurn === user.uid) {
        const remainingPlayers = sortedPlayers.filter(
          (player) => player.id !== user.uid
        );
        if (remainingPlayers.length > 0) {
          const nextIndex = currentIndex % remainingPlayers.length; // Calcular el siguiente turno
          await updateDoc(roomRef, {
            currentTurn: remainingPlayers[nextIndex].id,
          });
        } else {
          // Si no quedan jugadores, eliminar el turno actual
          await updateDoc(roomRef, { currentTurn: null });
          await updateDoc(roomRef, { roundState: 0 });
        }
      }

      navigate("/");
    } catch (error) {
      console.error("Error al salir de la sala:", error);
    }
  };

  // Muestra un estado de carga mientras los datos se obtienen
  if (loading || !userData || !roomData) {
    return <div className="text-center text-gray-600">Cargando...</div>;
  }

  // Ordenar jugadores por fecha de ingreso (joinedAt)
  const sortedPlayers = Object.values(roomData?.players || {}).sort(
    (a, b) => a.joinedAt?.seconds - b.joinedAt?.seconds
  );

  return (
    <div className="m-6 max-w-md">
      <div className="flex gap-3 mb-8">
        <h1 className="text-5xl text-gray-600 font-semibold capitalize">
          {userData.name}
        </h1>
        <span className="text-xl text-gray-600 font-bold">
          {userData.balance}
        </span>
      </div>

      <button
        onClick={leaveRoom}
        className="bg-red-500 w-full text-white px-4 py-2 rounded-md"
      >
        Salir
      </button>

      <div className="w-full mt-8">
        <h2 className="text-xl text-gray-600 font-semibold mb-2">
          Jugadores en la sala
        </h2>
        <ul>
          {sortedPlayers.map((player) => (
            <li
              key={player.id}
              className={`flex justify-between ${
                currentTurn === player.id
                  ? "text-green-500 font-bold"
                  : "text-gray-700"
              } ${player.folded ? "line-through text-red-500" : ""}`}
            >
              <span>{player.name}</span>
              <span>{player.balance}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <button
          onClick={passTurn}
          disabled={currentTurn !== user.uid || userData?.folded}
          className={`w-full text-white px-4 py-2 rounded-md ${
            currentTurn === user.uid && !userData?.folded
              ? "bg-green-500"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Pasar turno
        </button>

        <button
          onClick={fold}
          disabled={currentTurn !== user.uid || userData?.folded}
          className={`w-full mt-2 text-white px-4 py-2 rounded-md ${
            currentTurn === user.uid && !userData?.folded
              ? "bg-red-500"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Foldear
        </button>

        <div className="mt-6 text-center font-bold text-2xl text-gray-600">
          {currentTurn === user.uid
            ? userData?.folded
              ? "Has foldeado"
              : "¡Es tu turno!"
            : "Esperando turno..."}
        </div>
        <div className="mt-4 text-center font-bold text-xl text-gray-500">
          Fase actual:{" "}
          {["Pre Flop", "Flop", "Turn", "River"][roundState] || "Cargando..."}
        </div>
      </div>
    </div>
  );
};

export default GameRoom;
