import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useRoom } from "../services/RoomService";
import { collection, query, orderBy, getDocs, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

import Loader from '/src/components/Loader.jsx';

const Home = () => {
  const { user, userData, loading, admin, setUserData } = useContext(AuthContext);
  const { roomData, isUserInRoom } = useRoom();
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
 
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
        avatar: userData.avatar
      };

      await setDoc(roomRef, { players: { [user.uid]: player } }, { merge: true });
      navigate("/game-room");
    } catch (error) {
      console.error("Error al unirse a la sala:", error);
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
    <div className="p-6 max-w-3xl mx-auto">
      {userData && (
        <div className="flex justify-center gap-3 mt-8 mb-12 relative">
         <div className="flex items-center flex-col">
          <img className="w-24" src={userData.avatar} alt="" />

            <h1 className="text-2xl text-gray-600 font-semibold capitalize">{userData.name}</h1>
         </div>
            <span className="absolute right-0 text-gray-600 font-bold flex  gap-2">
            <span className="material-symbols-outlined">
poker_chip
</span>
              {userData.balance}</span>
         
          
        </div>
      )}
      <div className="flex gap-4 flex-col-reverse sm:flex-row">

      <button
        onClick={handleMakeAdmin}
        className="bg-gray-700 w-full text-white px-4 py-3 rounded-md font-medium"
        >
        Crear mesa
      </button>

      <button onClick={joinRoom} className="bg-[#7CA084] w-full text-white px-4 py-3 rounded-md font-medium">
        Jugar
      </button>

      {/* Botón para hacer administrador */}
        </div>

 

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
