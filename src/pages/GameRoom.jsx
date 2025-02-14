import { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useRoom } from "../services/RoomService";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase";
import BetModal from "/src/components/BetModal.jsx";
import PokerHandsModal from "/src/components/PokerHandsModal.jsx"; // Importar el nuevo componente
import Loader from "/src/components/Loader.jsx";

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
  const [playerData, setPlayerData] = useState({});

  const roomRef = doc(db, "rooms", ROOM_ID);

  useEffect(() => {
    if (loading || !user || !userData || !isUserInRoom(user.uid)) return;

    // Actualizar el estado del jugador cuando cambian los datos en Firestore
    if (roomData && roomData.players[user.uid]) {
      const playerInRoom = roomData.players[user.uid];
      setPlayerData((prevState) => ({
        ...prevState,
        name: playerInRoom.name,
        avatar: playerInRoom.avatar,
        balance: playerInRoom.balance,
        bet: playerInRoom.bet,
        totalBetInRound: playerInRoom.totalBetInRound,
        order: playerInRoom.order,
        status: playerInRoom.status,
      }));
    }
  }, [loading, user, userData, players, roomData, isUserInRoom]);

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

  const isPlayerTurn =
    currentTurn === user.uid && !isPlayerFolded && round !== 4;

  const getNextTurn = () => {
    const activePlayers = players.filter(
      (player) => player.status !== "folded"
    );
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
    if (!isPlayerTurn || playerData.balance < amount) {
      alert("Saldo insuficiente para realizar esta apuesta.");
      return;
    }

    try {
      const newBalance = playerData.balance - amount;
      const updatedBet = playerData.bet + amount;
      const updatedTotalBet = playerData.totalBetInRound + amount;
      const roomDoc = await getDoc(roomRef);
      const currentPot = roomDoc.data()?.pot || 0;

      // await updateDoc(doc(db, "users", user.uid), { balance: newBalance });
      await updateRoom({
        [`players.${user.uid}.bet`]: updatedBet,
        [`players.${user.uid}.totalBetInRound`]: updatedTotalBet,
        [`players.${user.uid}.balance`]: newBalance,
        pot: currentPot + amount,
      });
      handlePlayerAction("bet");
      setCurrentBet(0);
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
    return <Loader />;
  }

  return (
    <div className="fixed inset-0 flex flex-col justify-center max-w-3xl mx-auto">
      <div className="flex items-end justify-between">
        <div className="flex gap-3">
          <button
            onClick={leaveRoom}
            className="bg-[#985858] text-white p-2 px-3 rounded-r flex items-center"
          >
            <span className="material-symbols-outlined rotate-180">logout</span>
          </button>
            <img className="w-16 py-2" src={playerData.avatar} alt="" />
          <div className="flex flex-col justify-end pb-3">
            <h1 className="text-3xl text-gray-700 font-semibold capitalize leading-5">
              {playerData.name}
            </h1>
            <span className=" text-gray-600 font-semibold text-sm">
              {playerData.balance}k
            </span>
          </div>
        </div>
        {/* Botón para abrir el modal con las manos de póker */}
        <button onClick={toggleModal} className="text-gray-800 z-30 p-3">
          <span className={`material-symbols-outlined text-4xl transition-all font-medium ${isModalOpen && "rotate-90"}`}>
            playing_cards
          </span>
        </button>
      </div>

      {/* Modal con las manos de póker */}
      <PokerHandsModal isModalOpen={isModalOpen} toggleModal={toggleModal} />

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
        playerData={playerData}
      />
    </div>
  );
};

export default GameRoom;
