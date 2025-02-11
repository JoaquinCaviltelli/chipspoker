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
      <div className="fixed inset-0 bg-white flex flex-col py-6 items-end z-50 max-w-md mx-auto">
        <button
          onClick={() => {
            setIsModalOpen(false);
            setSelectedUserId("");
            setTransferAmount("");
            setStep(1); // Volver al paso 1
          }} // Cerrar el modal
          className="bg-gray-800 text-white p-2 rounded flex items-center justify-center self-end"
        >
          
          <span className="material-symbols-outlined">
chevron_backward
</span>
        </button>
        <div className="bg-white max-w-md w-full my-6">
          <h2 className="text-xl text-gray-800 font-semibold ">
            Selecciona Jugador
          </h2>

          <form onSubmit={handleFormSubmit}>
            {step === 1 ? (
              <div className="mb-4">
                <div className="grid gap-1">
                  {ranking.length === 0 && (
                    <p className="text-gray-500 w-full text-left mt-3">
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
                          className={` border  rounded p-2 w-full text-left mt-6 ${
                            selectedUserId === player.id
                              ? "bg-[#7CA084] text-white"
                              : "bg-white"
                          }`}
                        >
                          {player.name}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 text-gray-600">
                <p className="mb-2">
                  Enviar a <b>{selectedUser?.name}</b>
                </p>

                <input
                  type="text"
                  value={transferAmount}
                  readOnly
                  className="border border-[#7CA084] text-gray-600 placeholder:text-gray-600 rounded p-2 mb-4 w-full outline-none text-lg font-medium text-center"
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
                        className="border border-[#7CA084] p-2  rounded"
                      >
                        {number}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={handleDeleteLastDigit}
                    className="border border-[#7CA084] p-2 rounded flex justify-center items-center"
                  >
                    <span className="material-symbols-outlined text-lg">
                      backspace
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountChange(transferAmount + "0")}
                    className="border border-[#7CA084] p-2 rounded"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    className="border border-[#7CA084] p-2 rounded"
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
                className="bg-[#7CA084] w-full text-white px-4 py-2 rounded-md font-medium"
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
