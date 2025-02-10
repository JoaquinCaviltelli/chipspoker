import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useRoom } from "../services/RoomService";
import { collection, query, orderBy, getDocs, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import TransferModal from "/src/components/TransferModal.jsx"; // Importar el nuevo componente
import Loader from '/src/components/Loader.jsx';

const Home = () => {
  const { user, userData, loading, admin, setUserData } = useContext(AuthContext);
  const { roomData, isUserInRoom } = useRoom();
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
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

  const fetchUserData = async () => {
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid); // Obtén el documento de usuario usando su UID
        const userSnapshot = await getDoc(userRef); // Obtén el documento de Firestore

        if (userSnapshot.exists()) {
          const userDataFromDb = userSnapshot.data(); // Extrae los datos del documento
          setUserData(userDataFromDb); // Actualiza el contexto con los nuevos datos
        } else {
          console.log("No se encontró el documento del usuario");
        }
      } catch (error) {
        console.error("Error al obtener el balance desde Firestore:", error);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user, userData]);

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

        // Filtrar usuarios que no sean administradores
        const filteredUsers = users.filter(user => !user.admin);
        setRanking(filteredUsers);
      } catch (error) {
        console.error("Error al obtener el ranking:", error);
      }
    };

    fetchRanking();
  }, [userData]);

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

  const handleTransfer = async (recipientId, transferAmount) => {
    const recipient = ranking.find((user) => user.id === recipientId);
    if (!recipient) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const recipientRef = doc(db, "users", recipientId);

      // Actualizar balances
      await updateDoc(userRef, { balance: userData.balance - transferAmount });
      await updateDoc(recipientRef, { balance: recipient.balance + transferAmount });
    } catch (error) {
      console.error("Error en la transferencia:", error);
    }
  };

  // Función para hacer admin
  const handleMakeAdmin = async () => {
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { admin: true });
        navigate(0);
      } catch (error) {
        console.error("Error al hacer administrador:", error);
      }
    }
    
  };

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      {userData && (
        <div className="flex justify-between items-center gap-3 mb-8">
          <div className="flex gap-2">
            <h1 className="text-4xl text-gray-600 font-semibold capitalize">{userData.name}</h1>
            <span className=" text-gray-600 font-semibold">{userData.balance}</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#7CA084] text-white px-2 py-1 flex rounded"
          >
            <span className="material-symbols-outlined text-2xl">sync_alt</span>
          </button>
        </div>
      )}

      <button onClick={joinRoom} className="bg-[#7CA084] w-full text-white px-4 py-2 rounded-md font-medium">
        Jugar
      </button>

      {/* Botón para hacer administrador */}
      <button
        onClick={handleMakeAdmin}
        className="bg-[#985858] w-full text-white px-4 py-2 rounded-md font-medium mt-4"
      >
        Mesa
      </button>

      <TransferModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        ranking={ranking}
        userData={userData}
        user={user}
        handleTransfer={handleTransfer}
      />

      <div className="w-full mt-8">
        <h2 className="text-xl text-gray-600 font-semibold mb-2">Ranking</h2>
        <ul>
          {ranking.map((player, index) => (
            <li
              key={player.id}
              className={`flex items-center justify-between  border-b py-2 ${player.id === user.uid ? "text-[#7CA084] font-bold " : "text-gray-600 font-semibold "}`} 
            >
              <div className="flex items-center ">
                <span className="w-8">{index + 1}</span>
                <span className="flex items-center gap-2">
                  {player.name}
                  {roomData?.players?.[player.id] && <span className="w-2 h-2 rounded-full bg-[#7CA084]" />}
                </span>
              </div>
              <span>{player.balance}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
