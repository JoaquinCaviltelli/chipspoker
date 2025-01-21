import { createContext, useContext, useEffect, useState } from "react";
import { db } from "/src/firebase.js";
import { doc, onSnapshot } from "firebase/firestore";

const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const [roomData, setRoomData] = useState(null);
  const ROOM_ID = "default-room";

  useEffect(() => {
    const roomRef = doc(db, "rooms", ROOM_ID);

    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      setRoomData(snapshot.data());
    });

    return () => unsubscribe(); // Limpia la suscripción al desmontar
  }, []);

  const isUserInRoom = (userId) => {
    return !!roomData?.players?.[userId];
  };

  const getRoundState = () => {
    return roomData?.roundState || "pre-flop"; // Valor por defecto
  };

  const getCurrentTurn = () => {
    return roomData?.currentTurn || null;
  };

  return (
    <RoomContext.Provider value={{ roomData, isUserInRoom, getRoundState, getCurrentTurn }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => useContext(RoomContext);
