import React, { useState } from 'react';

export default function ModalAprobacion({ onConfirmar, onCancelar, cargando, error }) {
  const [pin, setPin] = useState('');

  const manejarEnvio = (e) => {
    e.preventDefault();
    if (pin.trim() !== '') {
      onConfirmar(pin); // Enviamos el PIN al componente principal
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        
        <h2 className="text-xl font-bold text-gray-800 mb-2">Autorización Requerida</h2>
        <p className="text-gray-600 mb-4 text-sm">Ingrese el PIN de supervisor para aprobar la compra en Texora.</p>
        
        <form onSubmit={manejarEnvio}>
          <div className="mb-4">
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 text-center tracking-[0.5em] text-2xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••"
              maxLength={4}
              required
              autoFocus
            />
          </div>

          {/* Feedback visual de error */}
          {error && (
            <div className="text-red-500 text-sm mb-4 text-center font-medium bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button 
              type="button"
              onClick={onCancelar}
              disabled={cargando}
              className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={cargando || pin.length < 4}
              className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex justify-center items-center"
            >
              {cargando ? 'Validando...' : 'Aprobar'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}