import React from 'react';

export default function ModalAlerta({ items, onAprobar, onCancelar }) {
  // Calculamos el gran total sumando los totales de cada item
  // Nota: internamente la variable se sigue llamando 'faltante' en el código de App.jsx, 
  // pero visualmente le mostraremos al usuario "Cant. Necesitada"
  const granTotal = items.reduce((acc, item) => acc + (item.faltante * item.precioUnidad), 0);
  const esVolumenAlto = granTotal > 500000;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-40">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Disponibilidad en Texora</h2>
        <p className="text-gray-600 mb-6 border-b pb-4">Este es el resumen de los productos consultados:</p>

        {/* Tabla de Productos */}
        <div className="overflow-hidden border border-gray-200 rounded-lg mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Producto</th>
                {/* CAMBIO DE TEXTO AQUÍ */}
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Cant. Requerida</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Stock Texora</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.producto}</td>
                  {/* Visualizamos la cantidad */}
                  <td className="px-4 py-3 text-sm text-center text-blue-600 font-bold">{item.faltante}</td>
                  <td className="px-4 py-3 text-sm text-center text-green-600 font-bold">{item.stockTexora}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-800 font-semibold">
                    ${(item.faltante * item.precioUnidad).toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-blue-50">
              <tr>
                <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-700 uppercase">Total Estimado:</td>
                <td className="px-4 py-3 text-right font-black text-blue-700 text-lg">
                  ${granTotal.toLocaleString('es-CL')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {esVolumenAlto && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mb-6">
            <p className="text-yellow-700 text-sm font-bold">⚠️ Monto elevado: Requiere aprobación obligatoria de gerencia.</p>
          </div>
        )}

        <div className="flex space-x-4">
          <button onClick={onCancelar} className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={onAprobar} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg transition">
            Solicitar Aprobación
          </button>
        </div>
      </div>
    </div>
  );
}   