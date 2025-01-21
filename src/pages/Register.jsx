import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const Register = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState(""); // Estado para manejar errores
  const { loginAnonymously, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!name.trim()) {
      setError("Por favor, ingresa un nombre válido.");
      return;
    }

    try {
      let currentUser = user;

      if (!currentUser) {
        currentUser = await loginAnonymously();
      }

      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, {
        name,
        balance: 0,
        admin: false,
      });

      navigate("/"); // Redirigir al inicio
    } catch (error) {
      console.error("Error durante el registro:", error);
    }
  };

  return (
    <div className="flex justify-center items-center inset-0 min-h-screen">
      <div className="p-8 w-full max-w-md">
        <div>
          <label className="block text-gray-500 font-semibold">Nombre:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(""); // Limpiar el error al escribir
            }}
            className="w-full border-b outline-none text-5xl text-gray-500 font-semibold"
            maxLength={8}
          />
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
        <button
          onClick={handleRegister}
          className="mt-4 w-full bg-[#7CA084] text-white font-semibold py-2 rounded"
        >
          Registrarse
        </button>
      </div>
    </div>
  );
};

export default Register;
