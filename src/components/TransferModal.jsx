import React, { useEffect, useState } from "react";

const TransferModal = ({
  isModalOpen,
  setIsModalOpen,
  ranking,
  handleTransfer,
  user,
}) => {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferError, setTransferError] = useState("");
  const [step, setStep] = useState(1); // Paso actual (1: selección, 2: monto)

  useEffect(() => {
    if (selectedUserId) {
      setStep(2); // Pasar al paso 2 cuando un jugador es seleccionado
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (step == 1) {
      setTransferError("");
    }
    if (transferAmount) {
      setTransferError("");
    }
  }, [transferAmount, step]);

  // Función para manejar el paso de la transferencia
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setTransferError("");

    if (step === 1) {
      if (!selectedUserId) {
        setTransferError("Debes seleccionar un usuario.");
        return;
      }
      setStep(2); // Cambiar al paso 2 para mostrar el teclado numérico
    } else if (step === 2) {
      const recipient = ranking.find((user) => user.id === selectedUserId);
      if (!recipient) {
        setTransferError("Usuario no encontrado.");
        return;
      }

      // Convertir a número antes de transferir
      const amount = Number(transferAmount);

      try {
        setIsModalOpen(false);
        await handleTransfer(selectedUserId, amount); // Llamada a la función handleTransfer
        setSelectedUserId("");
        setTransferAmount("");
        setStep(1); // Volver al paso 1
      } catch (error) {
        console.error("Error al realizar la transferencia", error);
        setTransferError("Error al realizar la transferencia.");
      }
    }
  };

  // Manejo del cambio de monto
  const handleAmountChange = (value) => {
    if (value === "0" && transferAmount === "") return; // No permitir valor vacío o solo ceros
    if (/^[0-9]*$/.test(value)) {
      setTransferAmount(value); // Solo números válidos
    }
  };

  // Borrar último dígito
  const handleDeleteLastDigit = () => {
    setTransferAmount((prev) => prev.slice(0, -1)); // Elimina el último dígito
  };

  // Borrar todo el monto
  const handleDeleteAll = () => {
    setTransferAmount(""); // Elimina todo el monto
  };

  // Obtener el jugador seleccionado
  const selectedUser = ranking.find((user) => user.id === selectedUserId);

  return (
    isModalOpen && (
      <div className="fixed inset-0 bg-white flex flex-col  items-end z-50 w-full">
        <div className="max-w-3xl p-6 w-full mx-auto flex flex-col my-10">
          <button
            onClick={() => {
              setIsModalOpen(false);
              setSelectedUserId("");
              setTransferAmount("");
              setStep(1); // Volver al paso 1
            }} // Cerrar el modal
            className="bg-gray-800 text-white p-4 rounded-full flex items-center justify-center self-end fixed bottom-6 right-6"
          >
            <span className="material-symbols-outlined font-bold">chevron_backward</span>
          </button>
          <div className=" text-gray-800  flex gap-2  w-full  items-center text-left">
            <span className="material-symbols-outlined text-3xl">mintmark</span>
            <p className="font-medium leading-4 ">Agregar fichas</p>
          </div>

          <form onSubmit={handleFormSubmit}>
            {step === 1 ? (
              <div className="mb-4">
                <div className="grid gap-1">
                  {ranking.length === 0 && (
                    <p className="text-gray-800 w-full text-left">
                      no hay jugadores en la sala
                    </p>
                  )}

                  {ranking.map((player) => (
                    <div key={player.id}>
                      {player.id !== user.uid && (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => setSelectedUserId(player.id)}
                          className=" text-gray-800 p-4 flex gap-3  items-center w-full  shadow-lg rounded-md border  text-left mb-3 bg-white"
                        >
                          <img  className="w-8" src={player.avatar} alt="" />
                          <div className="flex justify-between w-full items-center translate-y-0.5">
                            <span className="font-medium">{player.name}</span>
                            <span className="text-sm">{player.balance}k</span>
                          </div>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 text-white font-medium">
                <div className="text-gray-800 flex flex-col justify-center items-center mb-6">

                <img  className="w-16" src={selectedUser?.avatar} alt="" />
                <b>{selectedUser?.name}</b>
                <p className="text-xs">
                   
                  {selectedUser?.balance}k
                </p>
                </div>

                <input
                  type="text"
                  value={transferAmount}
                  placeholder="0"
                  readOnly
                  className="b text-gray-600 placeholder:text-gray-600 rounded p-2 mb-4 w-full outline-none text-lg font-medium text-center border border-gray-600"
                />
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                    (number) => (
                      <button
                        key={number}
                        type="button"
                        onClick={() =>
                          handleAmountChange(transferAmount + number)
                        }
                        className="bg-gray-800 p-2  rounded"
                      >
                        {number}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteLastDigit}
                    className="bg-gray-800 p-2 rounded flex justify-center items-center"
                  >
                    <span className="material-symbols-outlined text-lg">
                      backspace
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountChange(transferAmount + "0")}
                    className="bg-gray-800 p-2 rounded"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    className="bg-gray-800 p-2 rounded"
                  >
                    c
                  </button>
                </div>
              </div>
            )}

            {transferError && <p className="text-red-500">{transferError}</p>}

            {step === 2 && (
              <button
                type="submit"
                className="bg-gray-800 w-full text-white px-4 py-3 rounded-md font-medium mt-6"
              >
                Transferir
              </button>
            )}
          </form>
        </div>
      </div>
    )
  );
};

export default TransferModal;
