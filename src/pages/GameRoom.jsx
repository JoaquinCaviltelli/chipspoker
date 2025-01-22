import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useRoom } from "../services/RoomService";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase";
import BetModal from "/src/components/BetModal.jsx";

const GameRoom = () => {
  const { user, userData, loading } = useContext(AuthContext);
  const { roomData, isUserInRoom } = useRoom();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [currentBet, setCurrentBet] = useState(0);

  const isPlayerTurn = () =>
    round !== 4 &&
    currentTurn === user.uid &&
    !players.find(
      (player) => player.id === user.uid && player.status === "folded"
    );

  useEffect(() => {
    if (loading || !user || !isUserInRoom(user.uid)) {
      navigate("/");
      return;
    }

    const fetchGameData = async () => {
      try {
        const roomRef = doc(db, "rooms", "default-room");
        const roomDoc = await getDoc(roomRef);
        const roomData = roomDoc.data();
        if (roomData?.players) {
          const sortedPlayers = Object.values(roomData.players).sort(
            (a, b) => a.order - b.order
          );
          setPlayers(sortedPlayers);
        }
        setRound(roomData?.round || 0);
        setCurrentTurn(roomData?.currentTurn || null);
      } catch (error) {
        console.error("Error al obtener los datos del juego:", error);
      }
    };

    fetchGameData();
  }, [user, loading, roomData, isUserInRoom, navigate]);

  const updateRoom = async (updates) => {
    const roomRef = doc(db, "rooms", "default-room");
    try {
      await updateDoc(roomRef, updates);
      console.log("Estado de la sala actualizado");
    } catch (error) {
      console.error("Error al actualizar estado de la sala:", error);
    }
  };

  const updatePlayerStatus = async (status) => {
    await updateRoom({ [`players.${user.uid}.status`]: status });
  };

  const handlePass = async () => {
    if (isPlayerTurn()) {
      await updatePlayerStatus("passed");
      await updateRoom({ currentTurn: getNextTurn() });
    }
  };

  const handleFold = async () => {
    if (!isPlayerTurn()) return;

    // Si el jugador decide no igualar la apuesta, se marca como folded
    await updatePlayerStatus("folded");
    const nextTurn = getNextTurn();
    await updateRoom({ currentTurn: nextTurn });
  };

  const handleBet = async (amount) => {
    if (!isPlayerTurn()) return;

    console.log(userData.balance);
    // Obtener el betAmount actual del jugador
    const playerRef = doc(db, "rooms", "default-room");
    const playerDoc = await getDoc(playerRef);
    const currentPlayerBetAmount =
      playerDoc.data()?.players[user.uid]?.betAmount || 0;

    // Sumar el nuevo monto al betAmount existente
    const newBetAmount = currentPlayerBetAmount + amount;

    // Verificar si el jugador tiene suficiente saldo
    const newBalance = userData.balance - amount;
    if (newBalance < 0) {
      alert("No tienes suficiente saldo para realizar esta apuesta.");
      return;
    }

    // Actualizar el balance del jugador
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { balance: newBalance });

    // Actualizar el estado de la apuesta y el estado del jugador
    const updates = {
      [`players.${user.uid}.status`]: "bet",
      [`players.${user.uid}.balance`]: userData.balance,
      [`players.${user.uid}.betAmount`]: newBetAmount,
    };

    // Actualizar la sala con la nueva apuesta
    await updateRoom(updates);

    // Sumar al pot global
    const roomRef = doc(db, "rooms", "default-room");
    const roomDoc = await getDoc(roomRef);
    const currentPot = roomDoc.data()?.pot || 0;
    const newPot = currentPot + amount;

    // Actualizar el pot global en la sala
    await updateRoom({ pot: newPot });

    // Mover al siguiente turno
    const nextTurn = getNextTurn();
    await updateRoom({ currentTurn: nextTurn });
  };

  const handleAddBet = (amount) => setCurrentBet((prevBet) => prevBet + amount); // Añade al total de la apuesta
  const handleResetBet = () => setCurrentBet(0); // Resetea la apuesta actual

  const handleConfirmBet = async () => {
    if (currentBet > 0 && userData.balance >= currentBet) {
      try {
        await handleBet(currentBet);
        const updatedBalance = userData.balance - currentBet;
        await updateDoc(doc(db, "users", user.uid), {
          balance: updatedBalance,
        });
        await updateRoom({ [`players.${user.uid}.balance`]: updatedBalance });

        handleResetBet();
      } catch (error) {
        console.error("Error al confirmar la apuesta:", error);
      }
    } else {
      alert("No tienes suficiente saldo para realizar esta apuesta.");
    }
  };

  const getNextTurn = () => {
    const activePlayers = players.filter(
      (player) => player.status !== "folded"
    );
    const currentIndex = activePlayers.findIndex(
      (player) => player.id === currentTurn
    );
    return activePlayers[(currentIndex + 1) % activePlayers.length]?.id;
  };

  useEffect(() => {
    const checkIfRoomIsEmpty = async () => {
      const roomRef = doc(db, "rooms", "default-room");
      const roomDoc = await getDoc(roomRef);
      if (!roomDoc.data()?.players) {
        await updateRoom({ currentTurn: null, round: 0 });
        console.log("Sala vacía, resetando estado del juego");
      }
    };
    checkIfRoomIsEmpty();
  }, [players]);

  const leaveRoom = async () => {
    try {
      const roomRef = doc(db, "rooms", "default-room");
      await updateDoc(roomRef, { [`players.${user.uid}`]: deleteField() });

      const roomDoc = await getDoc(roomRef);
      const sortedPlayers = Object.values(roomDoc.data()?.players || {}).sort(
        (a, b) => a.order - b.order
      );
      const updatedPlayers = sortedPlayers.map((player, index) => ({
        ...player,
        order: index + 1,
      }));

      const playersUpdate = updatedPlayers.reduce((acc, player) => {
        acc[`players.${player.id}`] = { ...player };
        return acc;
      }, {});

      await updateDoc(roomRef, playersUpdate);
      navigate("/");
    } catch (error) {
      console.error("Error al salir de la sala:", error);
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
    <div className="fixed inset-0 flex flex-col justify-center">
      <div className="flex justify-between gap-3 items-center">
        <div className="flex gap-3 m-6">
          <h1 className="text-3xl text-gray-600 font-semibold capitalize">
            {userData?.name}
          </h1>
          <span className="text-xl text-gray-600 font-bold">
            {userData?.balance}
          </span>
        </div>
        <button
          onClick={leaveRoom}
          className="bg-red-800 text-white p-2 px-3 rounded-l flex items-center"
        >
          <span className="material-symbols-outlined rotate-180 font-medium">logout</span>
        </button>
      </div>

      <BetModal
        round={round}
        user={user.uid}
        currentTurn={currentTurn}
        pass={handlePass}
        onAddBet={handleAddBet}
        onResetBet={handleResetBet}
        onConfirmBet={handleConfirmBet}
        currentBet={currentBet}
      />

      {/* {currentTurn === user.uid && round !== 4 && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleFold}
            className="bg-red-500 text-white px-4 py-2 rounded-md"
          >
            Foldear
          </button>
          <button
            onClick={handlePass}
            className="bg-gray-500 w-full text-white px-4 py-2 rounded-md"
          >
            Pasar
          </button>
        </div>
      )} */}
    </div>
  );
};

export default GameRoom;
