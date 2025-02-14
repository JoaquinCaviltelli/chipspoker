import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

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
  const [currentBalance, setCurrentBalance] = useState(3000);
  const [error, setError] = useState(""); // Estado para manejar errores
  const [avatarUrls, setAvatarUrls] = useState([]); // Estado para manejar los URLs de los avatares
  const [selectedAvatar, setSelectedAvatar] = useState(0); // Estado para manejar el avatar seleccionado
  const { loginAnonymously, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          setName(userData.name); // Establecer el nombre en el input si ya existe
          setCurrentBalance(userData.balance)
        }
      }
    };

    fetchUserData();
  }, [user]);

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
   
    
    

      // Guardar nombre, avatar, y otros datos del usuario en Firebase
      await setDoc(userRef, {
        name,
        avatar: avatarUrls[selectedAvatar], // Guardar el avatar seleccionado
        balance: currentBalance,
        admin: false,  // Establecer admin según el nombre
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
    <div className="flex justify-center inset-0 min-h-screen">
      <div className="p-6 w-full max-w-sm ">
        <div className="flex justify-center h-40">
          {/* Swiper para los avatares con efecto cards */}
          {avatarUrls.length > 0 && (
            <Swiper
            centeredSlides={true}
              grabCursor={true}
              slidesPerView={3}
              spaceBetween={30}
              initialSlide={0}
              modules={[EffectCards]}
              className="mySwiper "
              onSlideChange={handleSlideChange} // Añadir evento para el cambio de slide
            >
              {avatarUrls.map((url, index) => (
                <SwiperSlide
                  key={index}
                >
                  <img
                    src={url}
                    alt={`Avatar ${index + 1}`}
                    className="h-full"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        <div className="relative">
          
          <input
            type="text"
            value={name}
            placeholder="Nombre"
            onChange={(e) => {
              setName(e.target.value);
              setError(""); // Limpiar el error al escribir
            }}
            className="w-full  outline-none text-3xl text-gray-500 font-semibold text-center mb-20"
            maxLength={10}
          />
          {error && <p className="text-red-500 text-sm absolute w-full text-center bottom-0">{error}</p>}
        </div>

        <button
          onClick={handleRegister}
          className="mt-4 w-full bg-[#7CA084] text-white font-semibold py-2 rounded"
        >
          {user ? "Actualizar" : "Registrarse"}
          
        </button>
      </div>
    </div>
  );
};

export default Register;
