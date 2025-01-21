import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Datos adicionales del usuario, incluyendo el balance
  const [loading, setLoading] = useState(true); // Indicador de carga
  const [admin, setAdmin] = useState(false); // Estado para el valor admin



  const updateBalance = (amount) => {
    const userRef = doc(db, "users", user.uid);
    updateDoc(userRef, { balance: amount })
      .then(() => {
        setUserData((prevData) => ({ ...prevData, balance: amount })); // Actualiza localmente el estado
      })
      .catch((error) => {
        console.error("Error actualizando balance:", error);
      });
  };
  
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Verificar si el usuario tiene datos en Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setAdmin(data.admin || false); // Obtener el valor de admin desde Firestore
        } else {
          setUserData(null);
          setAdmin(false); // Si no hay datos de usuario, asegurar que admin sea falso
        }
      } else {
        setUserData(null);
        setAdmin(false); // Si no hay usuario, admin será falso
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const loginAnonymously = async () => {
    const { user } = await signInAnonymously(auth);
    return user;
  };

  return (
    <AuthContext.Provider value={{ user, userData, loginAnonymously, loading, admin, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
};
