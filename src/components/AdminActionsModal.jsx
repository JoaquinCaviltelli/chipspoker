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
        className="bg-gray-800 text-white p-2 rounded flex items-center justify-center mb-6"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
        {/* Aquí agregamos los botones */}
        <div className="flex flex-col gap-6 w-full">
          <button
            onClick={revokeAdmin}
            className="bg-gray-800 text-white p-4 rounded flex items-center justify-between gap-3"
          >
            <span className="material-symbols-outlined rotate-180">logout</span>{" "}
            Salir de la mesa
          </button>

          <button
            onClick={deleteRoom}
            className="bg-gray-800 text-white p-4 rounded flex items-center justify-between gap-3"
          >
            <span className="material-symbols-outlined">delete</span> Eliminar
            jugadores
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-800 text-white p-4 rounded flex items-center justify-between gap-3"
          >
            <span className="material-symbols-outlined ">mintmark</span> Agregar
            fichas
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminActionsModal;
