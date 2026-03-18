import React, { useState } from 'react';

export default function PantallaLogin({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');

  const manejarEnvio = (e) => {
    e.preventDefault();
    // Aquí más adelante conectaríamos con la API de usuarios.
    // Por ahora, simulamos un login exitoso si ingresa cualquier dato.
    if (usuario && clave) {
      onLogin(usuario);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Sistema de Ventas</h1>
          <p className="text-gray-500">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={manejarEnvio} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Usuario Vendedor</label>
            <input 
              type="text" 
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: j.perez"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-1">Contraseña</label>
            <input 
              type="password" 
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition duration-200 mt-4"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}