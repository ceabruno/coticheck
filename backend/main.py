import sys
import asyncio

# --- FIX PARA WINDOWS + PLAYWRIGHT ---
# Obliga a Python a usar el motor asíncrono correcto en Windows para poder abrir navegadores
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
# -------------------------------------

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime

# Importamos el scraper que ya tenemos
from automatización.texora_scraper import consultar_stock_texora

# Importamos el scraper que ya tenemos
from automatización.texora_scraper import consultar_stock_texora

app = FastAPI(title="API Integración Laudus - Multi-Producto")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELOS DE DATOS ---

class SolicitudConsulta(BaseModel):
    # Ahora aceptamos una lista de códigos: ["PROD1", "PROD2"]
    codigos_productos: List[str]

class ItemCompra(BaseModel):
    # Estructura para cada producto individual en la orden
    producto: str
    cantidad: int
    precio_unitario: float
    total_item: float

class SolicitudAprobacion(BaseModel):
    vendedor_id: str
    items: List[ItemCompra]  # Lista de productos (ej: 20 de uno, 20 de otro)
    total_orden: float
    pin_supervisor: str

# Base de datos simulada
SUPERVISORES_AUTORIZADOS = {"1234": "Supervisor_Ventas"}
LOGS_SISTEMA = []

# --- ENDPOINTS ---
@app.get("/api/laudus/producto/{sku}")
async def obtener_info_laudus(sku: str):
    """
    Consulta la información base de un producto directamente en Laudus.
    Ideal para autocompletar el nombre del producto cuando el vendedor escribe el SKU.
    """
    resultado = await consultar_producto_laudus(sku)
    
    if resultado.get("estado") == "error":
        raise HTTPException(status_code=404, detail=resultado.get("mensaje"))
        
    return resultado

@app.post("/api/consultar-stock-masivo")
async def consultar_stock_masivo(solicitud: SolicitudConsulta):
    """
    Recibe una lista de productos y ejecuta una única sesión de Playwright.
    """
    print(f"Consultando {len(solicitud.codigos_productos)} productos...")
    
    # Ahora le pasamos la lista completa directamente a nuestro bot
    resultados = await consultar_stock_texora(solicitud.codigos_productos)
    
    return {
        "resultados": resultados,
        "fecha_consulta": datetime.now().isoformat()
    }

@app.post("/api/aprobar-orden")
async def aprobar_orden_compra(solicitud: SolicitudAprobacion):
    """
    Valida y registra una orden que puede contener múltiples productos.
    """
    if solicitud.pin_supervisor not in SUPERVISORES_AUTORIZADOS:
        raise HTTPException(status_code=403, detail="PIN de supervisor inválido")
    
    supervisor_nombre = SUPERVISORES_AUTORIZADOS[solicitud.pin_supervisor]

    # Registro detallado en el Log
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "vendedor": solicitud.vendedor_id,
        "aprobador": supervisor_nombre,
        "detalle_items": [item.dict() for item in solicitud.items],
        "total_final": solicitud.total_orden,
        "estado": "APROBADO"
    }
    
    LOGS_SISTEMA.append(log_entry)
    
    return {
        "mensaje": f"Orden de {len(solicitud.items)} productos aprobada con éxito.",
        "log_id": len(LOGS_SISTEMA)
    }