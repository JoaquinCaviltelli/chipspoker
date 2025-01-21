import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useRoom } from "../services/RoomService";
import { collection, query, orderBy, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const Home = () => {
  const { user, userData, loading, admin } = useContext(AuthContext);  // Asegúrate de que admin esté disponible en el contexto
  const { roomData, isUserInRoom } = useRoom(); // Usa los datos de la sala
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    // Redirigir si el usuario es admin
    if (admin) {
      navigate("/table-virtual");
      return; // No ejecutar más lógica si ya se redirigió
    }

    if (!loading && (!user || !userData)) {
      navigate("/register");
    } else if (user && isUserInRoom(user.uid)) {
      // Si el usuario ya está en la sala, redirige
      navigate("/game-room");
    }
  }, [user, userData, loading, navigate, isUserInRoom, admin]);  // Asegúrate de agregar admin a las dependencias

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
  }, [ranking]);

  const joinRoom = async () => {
    try {
      // Referencia a la sala
      const roomRef = doc(db, "rooms", "default-room");
  
      // Obtener los jugadores actuales de la sala
      const roomDoc = await getDoc(roomRef);
      const roomData = roomDoc.data();
      const players = roomData?.players || {};
  
      // Encontrar el siguiente número de orden disponible
      const playerIds = Object.keys(players);
      const existingOrders = playerIds.map(id => players[id].order).filter(order => order !== undefined);
      const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;
  
      // Crear el nuevo jugador con su orden
      const player = {
        id: user.uid,
        name: userData.name,
        balance: userData.balance,
        order: nextOrder,  // Asignar el orden consecutivo
        status: "none"
      };
  
      // Agregar el nuevo jugador a la sala
      await setDoc(roomRef, { players: { [user.uid]: player } }, { merge: true });
  
      // Redirigir al jugador a la sala del juego
      navigate("/game-room");
    } catch (error) {
      console.error("Error al unirse a la sala:", error);
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
        <div className="flex gap-3 mb-8">
          <h1 className="text-5xl text-gray-600 font-semibold capitalize">{userData.name}</h1>
          <span className="text-xl text-gray-600 font-bold">{userData.balance}</span>
        </div>
      )}

      <button onClick={joinRoom} className="bg-[#7CA084] w-full text-white px-4 py-2 rounded-md">
        Jugar
      </button>

      <div className="w-full mt-8">
        <h2 className="text-xl text-gray-600 font-semibold mb-2">Ranking</h2>
        <ul>
          {ranking.map((user, index) => (
            <li key={user.id} className="flex items-center justify-between text-gray-600 font-semibold border-b py-2">
              <div className="flex items-center">
                <span className="w-8">{index + 1}</span>
                <span className="flex items-center gap-2">
                  {user.name}
                  {/* Punto verde si el usuario está en la sala */}
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
