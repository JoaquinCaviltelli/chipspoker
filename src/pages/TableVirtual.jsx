import React, { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useRoom } from "../services/RoomService";
import { doc, updateDoc, onSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Carta } from "/src/components/Card.jsx";
import Loader from "/src/components/Loader.jsx";
import TransferModal from "/src/components/TransferModal.jsx";
import AdminActionsModal from "/src/components/AdminActionsModal.jsx";

const TableVirtual = () => {
  const { user, userData, loading, admin } = useContext(AuthContext);
  const { roomData } = useRoom();
  const navigate = useNavigate();
  const [round, setRound] = useState(0);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]); // Estado para jugadores seleccionados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Memoize players for better performance and automatic sorting
  const players = useMemo(() => {
    if (!roomData?.players) return [];
    return Object.values(roomData.players)
      .map((player) => ({
        ...player,
      }))
      .sort((a, b) => a.order - b.order);
  }, [roomData, user.uid]);

  useEffect(() => {
    if (loading) return;

    if (!user || !admin) {
      navigate("/");
    }
    const roomRef = doc(db, "rooms", "default-room");

    // Suscribirse a los cambios en el documento de la sala
    const unsubscribe = onSnapshot(roomRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const roomData = docSnapshot.data();
        setRound(roomData?.round || 0);
        setCurrentTurn(roomData?.currentTurn || null);
      }
    });

    // Limpiar la suscripción al desmontar el componente
    return () => unsubscribe();
  }, [loading, user, admin, navigate]);

  useEffect(() => {
    // Si estamos en la ronda 4, establece currentTurn a null
    if (round === 4) {
      setCurrentTurn(null);
    }
    // Inicia el primer turno automáticamente si no hay turnos asignados
    else if (round === 0 && currentTurn === null && players.length > 0) {
      updateGameState({ currentTurn: players[0].id });
    }
  }, [round, currentTurn, players]);

  const updateGameState = async (updates) => {
    try {
      const roomRef = doc(db, "rooms", "default-room");
      await updateDoc(roomRef, updates);
    } catch (error) {
      alert("No hay jugadores en la sala");
    }
  };

  const resetRound = async () => {
    try {
      const rotatedPlayers = [...players.slice(1), players[0]]; // Rota el orden de jugadores
      const updatedPlayers = rotatedPlayers.map((player, index) => ({
        ...player,
        bet: 0,
        totalBetInRound: 0,
        order: index + 1,
        status: "none", // Reinicia el estado de todos los jugadores
      }));

      const updates = {
        round: 0,
        currentTurn: updatedPlayers[0].id,
        pot: 0,
        ...updatedPlayers.reduce((acc, player) => {
          acc[`players.${player.id}`] = player;
          return acc;
        }, {}),
      };

      await updateGameState(updates);

      setRound(0);
      setCurrentTurn(updatedPlayers[0].id);
    } catch (error) {
      alert("No hay jugadores en la sala");
    }
  };

  const nextRound = async () => {
    try {
      const updatedPlayers = players.map((player) => ({
        ...player,
        status: player.status === "folded" ? "folded" : "none",
        bet: 0,
      }));

      const firstPlayer = updatedPlayers.find(
        (player) => player.status !== "folded"
      );

      const updates = {
        round: round + 1,
        currentTurn: firstPlayer.id,
        ...updatedPlayers.reduce((acc, player) => {
          acc[`players.${player.id}`] = player;
          return acc;
        }, {}),
      };

      await updateGameState(updates);

      setRound(round + 1);
      setCurrentTurn(firstPlayer.id);
    } catch (error) {
      alert("No hay jugadores en la sala");
    }
  };

  const getCardsToShow = () => {
    const totalCards = 5;
    const faceUpCards =
      round === 1 ? 2 : round === 2 ? 1 : round === 3 ? 0 : round === 4 ? 0 : 5;

    const cards = [
      ...Array(faceUpCards).fill({
        isFlipped: true,
      }),
      ...Array(totalCards - faceUpCards).fill({
        isFlipped: false,
      }),
    ];

    // Invertir el orden de las cartas para que se muestren de izquierda a derecha
    return cards.reverse();
  };

  const getAction = (player) => {
    switch (player.status) {
      case "passed":
        return player.bet ? `${player.bet}k` : "Paso";
      case "bet":
        return `${player.bet}k`;
      case "folded":
        return "Me voy";
      default:
        return "";
    }
  };

  const handlePlayerSelection = (player) => {
    // Verificar si el jugador está "folded" o no tiene apuesta
    if (
      player.status !== "folded" &&
      player.totalBetInRound > 0 &&
      roomData?.pot !== 0
    ) {
      setSelectedPlayers((prevSelectedPlayers) => {
        if (prevSelectedPlayers.includes(player.id)) {
          return prevSelectedPlayers.filter((id) => id !== player.id);
        } else {
          return [...prevSelectedPlayers, player.id];
        }
      });
    }
  };

  const handleDistributePot = async () => {
    if (round === 4 && selectedPlayers.length > 0) {
      // Permitir múltiples jugadores seleccionados
      const selectedPlayersData = selectedPlayers
        .map((playerId) => players.find((p) => p.id === playerId))
        .filter(Boolean);

      if (selectedPlayersData.length === 0) return;

      try {
        const totalPot = roomData?.pot || 0;

        // Encuentra la menor apuesta entre los jugadores seleccionados
        const minSelectedBet = Math.min(
          ...selectedPlayersData.map((player) => player.totalBetInRound || 0)
        );

        // Calcular la diferencia con respecto a las apuestas de los demás jugadores
        const otherPlayers = players.filter(
          (p) => !selectedPlayers.includes(p.id)
        );
        const totalDifference = otherPlayers.reduce((acc, player) => {
          const otherBet = player.totalBetInRound || 0;
          return acc + Math.max(0, otherBet - minSelectedBet);
        }, 0);

        // Calcular la cantidad total que los jugadores seleccionados deberían recibir
        const amountToWin = totalPot - totalDifference;

        // Calcular la cantidad que cada jugador seleccionado debería recibir
        const totalSelectedBet = selectedPlayersData.reduce(
          (acc, player) => acc + (player.totalBetInRound || 0),
          0
        );
        const updates = {};

        for (const selectedPlayer of selectedPlayersData) {
          const selectedBet = selectedPlayer.totalBetInRound || 0;

          // Calcular la parte del pozo que corresponde a este jugador
          const playerShare = (selectedBet / totalSelectedBet) * amountToWin;

          // Asegúrate de que no se le dé más de lo que hay en el pot
          const finalAmountToWin = Math.max(0, Math.min(playerShare, totalPot));

          // Actualizar el balance del jugador seleccionado
          const userRef = doc(db, "users", selectedPlayer.id);
          updates[`players.${selectedPlayer.id}.balance`] =
            selectedPlayer.balance + finalAmountToWin;
          await updateDoc(userRef, {
            balance: selectedPlayer.balance + finalAmountToWin,
          });
        }

        // Actualizar el pot restando solo lo que se distribuyó
        updates.pot = totalPot - amountToWin; // Reducir el pot por la cantidad total ganada

        // Aplicar las actualizaciones a Firestore
        await updateGameState(updates);

        // Limpiar la selección de jugadores
        setSelectedPlayers([]);
      } catch (error) {
        console.error("Error al distribuir el pot:", error);
      }
    }
  };

  const revokeAdmin = async () => {
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid); // Obtén el documento del usuario actual

        // Actualiza el campo "admin" a false
        await updateDoc(userRef, { admin: false });
        navigate("/");
        navigate(0);
      } catch (error) {
        console.error("Error al revocar admin:", error);
      }
    }
  };

  const deleteRoom = async () => {
    try {
      const roomRef = doc(db, "rooms", "default-room");
      await deleteDoc(roomRef); // Elimina el documento de la sala
      navigate("/"); // Redirige a la página principal después de eliminar la sala
    } catch (error) {
      console.error("Error al eliminar la sala:", error);
    }
  };

  const handleTransfer = async (recipientId, transferAmount) => {
    const recipient = players.find((player) => player.id === recipientId);
    if (!recipient) return;

    try {
      const recipientRef = doc(db, "users", recipientId);

      // Solo actualiza el balance del destinatario (sin afectar al usuario actual)
      await updateDoc(recipientRef, {
        balance: recipient.balance + transferAmount,
      });
    } catch (error) {
      console.error("Error en la transferencia:", error);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-3xl p-6 m-auto mt-6">
      
      <div className="grid grid-cols-4  w-full mx-auto">
        <button
          onClick={resetRound}
          className="bg-[#985858] text-white px-6 py-2 rounded-md  flex justify-center items-center gap-2"
        >
          <span className="material-symbols-outlined">restart_alt</span>
        </button>

        <div className=" flex flex-col col-span-2 justify-center items-center">
          <h2 className="text-xl text-gray-600 font-bold">
            {["Preflop", "Flop", "Turn", "Rivers", "Repartir"][round] || ""}
          </h2>
          <h2 className="text-2xl text-gray-600 font-bold">
            {roomData?.pot || 0}k
          </h2>
        </div>
        {round !== 4 && (
          <button
            onClick={nextRound}
            className={`px-6 py-2 rounded-md text-white flex justify-center items-center gap-2 ${
              round === 4 ? "bg-gray-400 cursor-not-allowed" : "bg-gray-800"
            }`}
            disabled={round === 4}
          >
            <span className="material-symbols-outlined">skip_next</span>
          </button>
        )}
        {round === 4 && (
          <button
            disabled={roomData?.pot === 0}
            k
            onClick={handleDistributePot}
            className={`px-6 py-2 rounded-md  text-white flex justify-center items-center gap-2 ${
              roomData?.pot === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-800"
            }`}
          >
            <span className="material-symbols-outlined">send_money</span>
          </button>
        )}
      </div>

      <div className="flex justify-between mt-10 mb-20 gap-3">
        {getCardsToShow().map((card, index) => (
          <div key={index} className="card-container w-full">
            <Carta isFlipped={card.isFlipped} round={round} />
          </div>
        ))}
      </div>

      {/* <div className="mt-6 flex justify-center space-x-4 mx-6"></div> */}

      <div className="my-6">
        <ul className="flex justify-center flex-wrap items-end gap-10">
          {players.map((player) => {
            return (
              <li
                key={player.id}
                className="flex flex-col items-center font-semibold cursor-pointer"
                onClick={() => round === 4 && handlePlayerSelection(player)} // Solo se puede seleccionar en la ronda 4
              >
                <div
                  className={`leading-3 relative font-bold text-center flex flex-col `}
                >
                  <span
                    className={`text-sm  absolute text-white -right-8 top-3 rounded-lg z-10 shadow-lg ${
                      player.id === currentTurn || player.status !== "none"
                        ? "p-2"
                        : ""
                    } relative ${
                      player.id === currentTurn
                        ? "bg-[#5B7661]"
                        : player.status === "folded"
                        ? "opacity-50 bg-[#985858]"
                        : "bg-gray-700"
                    }`}
                  >
                    {getAction(player)}
                    {player.id === currentTurn &&
                      player.status === "none" &&
                      ". . ."}
                    <span
                      className={`${
                        (player.id === currentTurn) |
                          (player.status !== "none") &&
                        "absolute left-4 -bottom-4 transform -translate-x-1/2 border-8 border-transparent"
                      } ${
                        player.id === currentTurn
                          ? "border-t-[#5B7661]"
                          : player.status === "folded"
                          ? "border-t-[#985858]"
                          : "border-t-gray-700 opacity-100"
                      }`}
                    ></span>
                  </span>

                  <div
                    className={` flex flex-col justify-center items-center ${
                      selectedPlayers.includes(player.id)
                        ? "opacity-100 text-gray-600 scale-125"
                        : player.id === currentTurn
                        ? "text-gray-600"
                        : player.status === "folded"
                        ? "opacity-10"
                        : "text-gray-600 opacity-70 "
                    }`}
                  >
                    <img
                      className={`w-16 ${player.id === currentTurn && "w-20"}`}
                      src={player.avatar}
                      alt=""
                    />
                    <span className="capitalize text-lg leading-5">
                      {player.name}
                    </span>
                    <span className="text-xs">{player.balance}k</span>
                  </div>
                </div>
                {/* <div
                  className={`flex flex-col justify-center items-center text-white w-36 h-16 leading-3 rounded-lg  ${
                    selectedPlayers.includes(player.id)
                      ? "bg-[#5B7661]" // Resaltar con azul si está seleccionado
                      : player.id === currentTurn
                      ? "bg-[#5B7661]"
                      : player.status === "folded"
                      ? "bg-[#985858]"
                      : "bg-gray-700"
                  }`}
                >
                  <span className="text-lg">{player.name}</span>
                  <div>
                    <span className="text-xs ">{player.balance}k</span>
                  </div>
                </div> */}
                {/* <span className="text-xs text-gray-600 self-end pr-3 py-1">
                  Total: {player.totalBetInRound}k
                </span> */}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="w-full max-full mx-auto flex items-center justify-end fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsAdminModalOpen(true)}
          className="bg-gray-800 text-white p-4  rounded-full flex items-center"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <AdminActionsModal
          isModalOpen={isAdminModalOpen}
          setIsAdminModalOpen={setIsAdminModalOpen}
          setIsModalOpen={setIsModalOpen}
          revokeAdmin={revokeAdmin}
          deleteRoom={deleteRoom}
        />

        <TransferModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          ranking={players} // Pasar los jugadores como ranking
          userData={userData}
          user={user}
          handleTransfer={handleTransfer}
        />
      </div>
    </div>
  );
};

export default TableVirtual;
