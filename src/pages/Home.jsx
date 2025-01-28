import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useRoom } from "../services/RoomService";
import { collection, query, orderBy, getDocs, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const Home = () => {
  const { user, userData, loading, admin } = useContext(AuthContext);
  const { roomData, isUserInRoom } = useRoom();
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferError, setTransferError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar el modal

  useEffect(() => {
    if (admin) {
      navigate("/table-virtual");
      return;
    }

    if (!loading && (!user || !userData)) {
      navigate("/register");
    } else if (user && isUserInRoom(user.uid)) {
      navigate("/game-room");
    }
  }, [user, userData, loading, navigate, isUserInRoom, admin]);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("balance", "desc"));
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRanking(users);
      } catch (error) {
        console.error("Error al obtener el ranking:", error);
      }
    };

    fetchRanking();
  }, []);

  const joinRoom = async () => {
    try {
      const roomRef = doc(db, "rooms", "default-room");
      const roomDoc = await getDoc(roomRef);
      const roomData = roomDoc.data();
      const players = roomData?.players || {};

      const playerIds = Object.keys(players);
      const existingOrders = playerIds.map(id => players[id].order).filter(order => order !== undefined);
      const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;

      const player = {
        id: user.uid,
        name: userData.name,
        balance: userData.balance,
        bet: 0,
        totalBetInRound: 0,
        order: nextOrder,
        status: "none",
      };

      await setDoc(roomRef, { players: { [user.uid]: player } }, { merge: true });
      navigate("/game-room");
    } catch (error) {
      console.error("Error al unirse a la sala:", error);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferError("");

    const recipient = ranking.find((user) => user.id === selectedUserId);
    if (!recipient) {
      setTransferError("Usuario no encontrado.");
      return;
    }

    if (transferAmount <= 0 || transferAmount > userData.balance) {
      setTransferError("Monto inválido.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const recipientRef = doc(db, "users", selectedUserId);

      // Actualizar balances
      await updateDoc(userRef, { balance: userData.balance - transferAmount });
      await updateDoc(recipientRef, { balance: recipient.balance + transferAmount });

      // Resetear campos
      setSelectedUserId("");
      setTransferAmount(0);
      setIsModalOpen(false); // Cerrar el modal después de la transferencia
    } catch (error) {
      console.error("Error en la transferencia:", error);
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
    <div className="m-6 max-w-md">
      {userData && (
        <div className="flex justify-between items-center gap-3 mb-8">
          <div className="flex gap-3">

          <h1 className="text-5xl text-gray-600 font-semibold capitalize">{userData.name}</h1>
          <span className="text-xl text-gray-600 font-bold">{userData.balance}</span>
          </div>
      {/* Botón para abrir el modal */}
      <button 
        onClick={() => setIsModalOpen(true)} 
        className="bg-[#7CA084]  text-white px-3 py-2 flex rounded"
      >
        <span className="material-symbols-outlined">
sync_alt
</span>
      </button>
        </div>
      )}

      <button onClick={joinRoom} className="bg-[#7CA084] w-full text-white px-4 py-2 rounded-md">
        Jugar
      </button>


      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white text-gray-600  flex justify-center items-center z-50">
          <div className="bg-white p-6  w-96">
            <h2 className="text-xl text-gray-600 font-semibold mb-4">Transferir Balance</h2>
            <form onSubmit={handleTransfer}>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="border p-2 mb-2 w-full"
              >
                <option value="" disabled>Selecciona un jugador</option>
                {ranking.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Monto a transferir"
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
                className="border p-2 mb-2 w-full"
              />
              {transferError && <p className="text-red-500">{transferError}</p>}
              <button type="submit" className="bg-[#7CA084] w-full text-white px-4 py-2 rounded-md">
                Transferir
              </button>
            </form>
            <button
              onClick={() => setIsModalOpen(false)} // Cerrar el modal sin hacer nada
              className="bg-gray-300 text-gray-700 w-full mt-4 py-2 rounded-md"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="w-full mt-8">
        <h2 className="text-xl text-gray-600 font-semibold mb-2">Ranking</h2>
        <ul>
          {ranking.map((user, index) => (
            <li key={user.id} className="flex items-center justify-between text-gray-600 font-semibold border-b py-2">
              <div className="flex items-center">
                <span className="w-8">{index + 1}</span>
                <span className="flex items-center gap-2">
                  {user.name}
                  {roomData?.players?.[user.id] && (
                    <span className="w-2 h-2 rounded-full bg-[#7CA084]" />
                  )}
                </span>
              </div>
              <span>{user.balance}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
