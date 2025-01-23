import { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useRoom } from "../services/RoomService";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase";
import BetModal from "/src/components/BetModal.jsx";
import PokerHandsModal from "/src/components/PokerHandsModal.jsx"; // Importar el nuevo componente

const ROOM_ID = "default-room";

const GameRoom = () => {
  const { user, userData, loading } = useContext(AuthContext);
  const { roomData, isUserInRoom } = useRoom();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [currentBet, setCurrentBet] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para abrir/cerrar el modal

  const roomRef = doc(db, "rooms", ROOM_ID);

  const fetchGameData = useCallback(async () => {
    try {
      const roomDoc = await getDoc(roomRef);
      const data = roomDoc.data();
      if (data?.players) {
        const sortedPlayers = Object.values(data.players).sort(
          (a, b) => a.order - b.order
        );
        setPlayers(sortedPlayers);
      }
      setRound(data?.round || 0);
      setCurrentTurn(data?.currentTurn || null);
    } catch (error) {
      console.error("Error al obtener datos del juego:", error);
    }
  }, [roomRef]);

  const updateRoom = async (updates) => {
    try {
      await updateDoc(roomRef, updates);
    } catch (error) {
      console.error("Error al actualizar la sala:", error);
    }
  };

  const isPlayerFolded = players.some(
    (player) => player.id === user.uid && player.status === "folded"
  );

  const isPlayerTurn = currentTurn === user.uid && !isPlayerFolded && round !== 4;

  const getNextTurn = () => {
    const activePlayers = players.filter((player) => player.status !== "folded");
    const currentIndex = activePlayers.findIndex((p) => p.id === currentTurn);
    return activePlayers[(currentIndex + 1) % activePlayers.length]?.id;
  };

  const handlePlayerAction = async (action, updates = {}) => {
    if (!isPlayerTurn) return;
    await updateRoom({ [`players.${user.uid}.status`]: action, ...updates });
    const nextTurn = getNextTurn();
    await updateRoom({ currentTurn: nextTurn });
  };

  const handleBet = async (amount) => {
    if (!isPlayerTurn || userData.balance < amount) {
      alert("Saldo insuficiente para realizar esta apuesta.");
      return;
    }

    try {
      const newBalance = userData.balance - amount;
      const updatedBet = (players.find((p) => p.id === user.uid)?.betAmount || 0) + amount;
      const roomDoc = await getDoc(roomRef);
      const currentPot = roomDoc.data()?.pot || 0;

      await updateDoc(doc(db, "users", user.uid), { balance: newBalance });
      await updateRoom({
        [`players.${user.uid}.betAmount`]: updatedBet,
        [`players.${user.uid}.balance`]: newBalance,
        pot: currentPot + amount,
      });
      handlePlayerAction("bet");
      setCurrentBet(0)
    } catch (error) {
      console.error("Error al realizar la apuesta:", error);
    }
  };

  const leaveRoom = async () => {
    try {
      await updateDoc(roomRef, { [`players.${user.uid}`]: deleteField() });
      fetchGameData();
      navigate("/");
    } catch (error) {
      console.error("Error al salir de la sala:", error);
    }
  };

  useEffect(() => {
    if (loading || !user || !isUserInRoom(user.uid)) {
      navigate("/");
      return;
    }
    fetchGameData();
  }, [loading, user, isUserInRoom, fetchGameData, navigate]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen); // Alternar la visibilidad del modal
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
      <div className="flex justify-start items-center">
        <button
          onClick={leaveRoom}
          className="bg-red-800 text-white p-2 px-3 rounded-r flex items-center"
        >
          <span className="material-symbols-outlined rotate-180">logout</span>
        </button>
        <div className="flex gap-3 m-6">
          <h1 className="text-3xl text-gray-800 font-bold">
            {userData?.name}
          </h1>
          <span className="text-sm text-gray-800 font-bold">
            {userData?.balance}
          </span>
        </div>
      </div>

      {/* Botón para abrir el modal con las manos de póker */}
      <button 
        onClick={toggleModal} 
        className="bg-blue-600 text-white p-2 rounded-lg mt-4"
      >
        Ver las manos de Póker
      </button>

      {/* Modal con las manos de póker */}
      <PokerHandsModal 
        isModalOpen={isModalOpen} 
        toggleModal={toggleModal}
      />

      <BetModal
        isPlayerFolded={isPlayerFolded}
        players={players}
        round={round}
        user={user.uid}
        currentTurn={currentTurn}
        fold={() => handlePlayerAction("folded")}
        pass={() => handlePlayerAction("passed")}
        onAddBet={(amount) => setCurrentBet((prev) => prev + amount)}
        onResetBet={() => setCurrentBet(0)}
        onConfirmBet={() => handleBet(currentBet)}
        currentBet={currentBet}
      />
    </div>
  );
};

export default GameRoom;
