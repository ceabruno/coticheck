import { useState } from 'react';
import PantallaLogin from './componentes/PantallaLogin';
import ModalAlerta from './componentes/ModalAlerta';
import ModalAprobacion from './componentes/ModalAprobacion';

function App() {
  const [usuarioActual, setUsuarioActual] = useState(null);
  
  // Modificamos el estado inicial para incluir campos de validación de Laudus
  const [filasConsulta, setFilasConsulta] = useState([
    { sku: '', cantidad: 1, nombreProducto: '', cargandoNombre: false, errorNombre: false }
  ]);
  
  const [buscando, setBuscando] = useState(false);
  const [mostrarAlertaFaltante, setMostrarAlertaFaltante] = useState(false);
  const [mostrarAprobacion, setMostrarAprobacion] = useState(false);
  const [estadoAprobacion, setEstadoAprobacion] = useState({ cargando: false, error: null });
  const [listaFaltantes, setListaFaltantes] = useState([]);

  // --- FUNCIÓN: Buscar el nombre en Laudus ---
  const verificarSkuEnLaudus = async (index, sku) => {
    if (!sku.trim()) return; // Si está vacío, no hacemos nada

    // 1. Activamos el estado de "cargando" para esta fila específica
    const nuevasFilas = [...filasConsulta];
    nuevasFilas[index].cargandoNombre = true;
    nuevasFilas[index].errorNombre = false;
    nuevasFilas[index].nombreProducto = '';
    setFilasConsulta(nuevasFilas);

    try {
      // 2. Consultamos al backend (fetch a nuestro endpoint local de Laudus)
      const respuesta = await fetch(`http://localhost:8000/api/laudus/producto/${sku}`);
      
      if (!respuesta.ok) {
        throw new Error("No encontrado");
      }
      
      const datos = await respuesta.json();

      // 3. Actualizamos la fila con el nombre real del producto
      const filasActualizadas = [...filasConsulta];
      filasActualizadas[index].nombreProducto = datos.nombre;
      filasActualizadas[index].cargandoNombre = false;
      setFilasConsulta(filasActualizadas);

    } catch (error) {
      // Si falla o no existe, mostramos error
      const filasConError = [...filasConsulta];
      filasConError[index].errorNombre = true;
      filasConError[index].cargandoNombre = false;
      setFilasConsulta(filasConError);
    }
  };

  const agregarFila = () => {
    setFilasConsulta([...filasConsulta, { sku: '', cantidad: 1, nombreProducto: '', cargandoNombre: false, errorNombre: false }]);
  };

  const eliminarFila = (index) => {
    setFilasConsulta(filasConsulta.filter((_, i) => i !== index));
  };

  const actualizarFila = (index, campo, valor) => {
    const nuevasFilas = [...filasConsulta];
    nuevasFilas[index][campo] = valor;
    // Si cambia el SKU, borramos el nombre anterior
    if (campo === 'sku') {
      nuevasFilas[index].nombreProducto = '';
      nuevasFilas[index].errorNombre = false;
    }
    setFilasConsulta(nuevasFilas);
  };

  // --- ACTUALIZADO: Conexión real con el bot de Playwright ---
  const manejarConsultaManual = async (e) => {
    e.preventDefault();
    
    const itemsValidos = filasConsulta.filter(fila => fila.sku.trim() !== '' && !fila.errorNombre);
    if (itemsValidos.length === 0) {
      alert("Por favor, ingresa códigos válidos antes de consultar a Texora.");
      return;
    }

    setBuscando(true);

    try {
      // 1. Extraemos solo los SKUs en una lista para enviarlos al backend
      const listaSkus = itemsValidos.map(item => item.sku);

      // 2. Hacemos la petición REAL a tu backend de Python
      const respuesta = await fetch('http://localhost:8000/api/consultar-stock-masivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigos_productos: listaSkus })
      });

      if (!respuesta.ok) throw new Error("Error en el servidor de automatización");
      
      const datosDelServidor = await respuesta.json();
      
      // 3. Cruzamos los datos: Lo que pidió el vendedor vs Lo que encontró el bot
      const resultadosFinales = itemsValidos.map(itemPedido => {
        const respuestaBot = datosDelServidor.resultados.find(r => r.producto === itemPedido.sku) || {};
        
        return {
          producto: itemPedido.nombreProducto || itemPedido.sku.toUpperCase(),
          faltante: itemPedido.cantidad, // La cantidad que el vendedor anotó
          stockTexora: respuestaBot.stockTexora || 0,
          precioUnidad: respuestaBot.precioUnidad || 0,
          estado: respuestaBot.estado || "error"
        };
      });

      setListaFaltantes(resultadosFinales);
      setMostrarAlertaFaltante(true);

    } catch (error) {
      alert("Error al intentar comunicarse con el bot de Texora. Verifica que el backend esté encendido.");
      console.error(error);
    } finally {
      setBuscando(false);
    }
  };

  // --- ACTUALIZADO: Conexión real con el Log de Aprobación ---
  const manejarAprobacionFinal = async (pinIngresado) => {
    setEstadoAprobacion({ cargando: true, error: null });
    
    try {
      // 1. Preparamos el formato exacto que espera tu main.py
      const payloadOrden = {
        vendedor_id: usuarioActual,
        items: listaFaltantes.map(item => ({
          producto: item.producto,
          cantidad: item.faltante,
          precio_unitario: item.precioUnidad,
          total_item: item.faltante * item.precioUnidad
        })),
        total_orden: listaFaltantes.reduce((acc, item) => acc + (item.faltante * item.precioUnidad), 0),
        pin_supervisor: pinIngresado
      };

      // 2. Enviamos la petición REAL a Python
      const respuesta = await fetch('http://localhost:8000/api/aprobar-orden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadOrden)
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.detail || "Error al aprobar la orden");
      }
      
      alert(`¡Éxito! ${datos.mensaje} (Log ID: ${datos.log_id})`);
      
      setMostrarAprobacion(false);
      setMostrarAlertaFaltante(false);
      // Reseteamos el formulario a una fila limpia
      setFilasConsulta([{ sku: '', cantidad: 1, nombreProducto: '', cargandoNombre: false, errorNombre: false }]);
      
    } catch (err) {
      setEstadoAprobacion({ cargando: false, error: err.message });
    }
  };

  if (!usuarioActual) return <PantallaLogin onLogin={setUsuarioActual} />;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-8 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Cotizador Integrado Laudus-Texora</h2>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Vendedor: <strong className="text-blue-600">{usuarioActual}</strong></span>
          <button onClick={() => setUsuarioActual(null)} className="text-sm text-red-500 hover:text-red-700">Cerrar Sesión</button>
        </div>
      </header>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-5xl mx-auto">
        <div className="mb-6 border-b pb-4">
          <h3 className="text-2xl font-bold text-gray-800">Consulta Rápida de Stock</h3>
          <p className="text-gray-600">Ingresa los SKU. El sistema verificará el nombre del producto en Laudus automáticamente.</p>
        </div>
        
        <form onSubmit={manejarConsultaManual}>
          <div className="space-y-3 mb-6">
            {filasConsulta.map((fila, index) => (
              <div key={index} className="flex items-start space-x-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                
                {/* Columna 1: SKU */}
                <div className="w-48">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código / SKU</label>
                  <input 
                    type="text" 
                    value={fila.sku}
                    onChange={(e) => actualizarFila(index, 'sku', e.target.value)}
                    onBlur={(e) => verificarSkuEnLaudus(index, e.target.value)} // Autocompletado Laudus
                    placeholder="Ej: CASCO-3M"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 uppercase"
                    required
                  />
                </div>

                {/* Columna 2: Nombre del Producto (Validación) */}
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción en Laudus</label>
                  <div className={`w-full px-3 py-2 border rounded bg-white flex items-center min-h-[42px] ${fila.errorNombre ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}>
                    {fila.cargandoNombre && <span className="text-gray-400 text-sm italic">Buscando en Laudus...</span>}
                    {fila.errorNombre && <span className="text-red-600 text-sm font-semibold">❌ Producto no encontrado</span>}
                    {!fila.cargandoNombre && !fila.errorNombre && fila.nombreProducto && (
                      <span className="text-gray-800 text-sm font-medium">✅ {fila.nombreProducto}</span>
                    )}
                  </div>
                </div>

                {/* Columna 3: Cantidad */}
                <div className="w-32">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cant. Necesitada</label>
                  <input 
                    type="number" 
                    min="1"
                    value={fila.cantidad}
                    onChange={(e) => actualizarFila(index, 'cantidad', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Columna 4: Eliminar */}
                <div className="w-12 pt-5 flex justify-center">
                  {filasConsulta.length > 1 && (
                    <button type="button" onClick={() => eliminarFila(index)} className="text-red-500 hover:text-red-700 font-bold text-xl">
                      ×
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <button type="button" onClick={agregarFila} className="text-blue-600 font-semibold hover:text-blue-800 flex items-center">
              + Agregar otro producto
            </button>
            <button type="submit" disabled={buscando} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition shadow disabled:opacity-70">
              {buscando ? 'Consultando a Texora...' : 'Verificar Stock y Precios'}
            </button>
          </div>
        </form>
      </div>

      {mostrarAlertaFaltante && !mostrarAprobacion && <ModalAlerta items={listaFaltantes} onCancelar={() => setMostrarAlertaFaltante(false)} onAprobar={() => setMostrarAprobacion(true)} />}
      {mostrarAprobacion && <ModalAprobacion cargando={estadoAprobacion.cargando} error={estadoAprobacion.error} onCancelar={() => { setMostrarAprobacion(false); setEstadoAprobacion({ cargando: false, error: null }); }} onConfirmar={manejarAprobacionFinal} />}
    </div>
  );
}

export default App;