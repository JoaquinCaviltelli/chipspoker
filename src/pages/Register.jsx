import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

// Importar Swiper y módulos
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-cards";
import { EffectCards } from "swiper/modules";

// Función para generar un string aleatorio de 8 caracteres
const generateRandomSeed = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const Register = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState(""); // Estado para manejar errores
  const [avatarUrls, setAvatarUrls] = useState([]); // Estado para manejar los URLs de los avatares
  const [selectedAvatar, setSelectedAvatar] = useState(0); // Estado para manejar el avatar seleccionado
  const { loginAnonymously, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Función para obtener las URLs de los avatares aleatorios
  const generateAvatars = () => {
    const urls = [];
    for (let i = 0; i < 50; i++) {
      const randomSeed = generateRandomSeed();
      const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${randomSeed}`;
      urls.push(avatarUrl);
    }
    setAvatarUrls(urls);
  };

  // Manejo del cambio de slide en Swiper
  const handleSlideChange = (swiper) => {
    setSelectedAvatar(swiper.activeIndex); // Cambiar el avatar seleccionado al deslizar
  };

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

      // Verificar si el nombre es "Mesa" y asignar el valor de admin
      const adminStatus = name.trim().toLowerCase() === "mesa" ? true : false;

      // Guardar nombre, avatar, y otros datos del usuario en Firebase
      await setDoc(userRef, {
        name,
        avatar: avatarUrls[selectedAvatar], // Guardar el avatar seleccionado
        balance: 3000,
        admin: adminStatus,  // Establecer admin según el nombre
      });

      navigate("/"); // Redirigir al inicio
    } catch (error) {
      console.error("Error durante el registro:", error);
    }
  };

  // Ejecutar la generación de avatares cuando el componente se monta
  useEffect(() => {
    generateAvatars();
  }, []);

  return (
    <div className="flex justify-center items-center inset-0 min-h-screen">
      <div className="p-8 w-full max-w-sm -translate-y-28">
        <div className="flex justify-center">
          {/* Swiper para los avatares con efecto cards */}
          {avatarUrls.length > 0 && (
            <Swiper
              effect={"cards"}
              grabCursor={true}
              modules={[EffectCards]}
              className="mySwiper w-36 h-40"
              onSlideChange={handleSlideChange} // Añadir evento para el cambio de slide
            >
              {avatarUrls.map((url, index) => (
                <SwiperSlide
                  key={index}
                >
                  <img
                    src={url}
                    alt={`Avatar ${index + 1}`}
                    className="w-36 h-40 mx-auto px-4 bg-white border-2 border-[#7CA084] rounded-md"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        <div className="mt-4">
          
          <input
            type="text"
            value={name}
            placeholder="Nombre"
            onChange={(e) => {
              setName(e.target.value);
              setError(""); // Limpiar el error al escribir
            }}
            className="w-full  outline-none text-4xl text-gray-500 font-semibold text-center mb-4"
            maxLength={10}
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
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
