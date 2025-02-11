import React from "react";

const AdminActionsModal = ({
  isModalOpen,
  setIsModalOpen,
  revokeAdmin,
  deleteRoom,
  setIsAdminModalOpen,
}) => {
  if (!isModalOpen) return null; // Si el modal está cerrado, no renderizar

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-end p-6 z-50 w-full">
      <div className="w-full max-w-md mx-auto flex flex-col justify-end items-end">
      <button
        onClick={() => setIsAdminModalOpen(false)} // Cerrar el modal
        className="bg-[#5B7661] text-white p-2 rounded flex items-center justify-center mb-6"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
        {/* Aquí agregamos los botones */}
        <div className="flex flex-wrap gap-6 w-full justify-end">
          <button
            onClick={revokeAdmin}
            className=" text-gray-700 p-6 flex gap-2 justify-center w-full  h-32 flex-col shadow-lg rounded-md border items-start text-left"
          >
            <span className="material-symbols-outlined rotate-180 text-3xl">logout</span>{" "}
            <p className="font-medium leading-4">Salir de la mesa</p>
          </button>

          <button
            onClick={deleteRoom}
            className=" text-gray-700 p-6 flex gap-2 justify-center w-full  h-32 flex-col shadow-lg rounded-md border items-start text-left"
          >
            <span className="material-symbols-outlined text-3xl">delete</span> 
            <p className="font-medium leading-4">Eliminar
            jugadores</p>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className=" text-gray-700 p-6 flex gap-2 justify-center w-full  h-32 flex-col shadow-lg rounded-md border items-start text-left"
          >
            <span className="material-symbols-outlined text-3xl">mintmark</span> 
            <p className="font-medium leading-4">Agregar
            fichas</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminActionsModal;
