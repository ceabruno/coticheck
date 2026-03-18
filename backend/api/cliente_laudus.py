import httpx
from typing import Dict, Optional

# Configuraciones de la API de Laudus (Reemplazarás esto cuando tengas los datos reales)
LAUDUS_API_URL = "https://api.laudus.cl"
LAUDUS_COMPANY_VAT = "78.088.375-8" # RUT de la empresa
LAUDUS_USER = "api_user"
LAUDUS_PASSWORD = "api_password"

async def obtener_token_laudus() -> Optional[str]:
    """
    Se conecta a Laudus para obtener el token de seguridad temporal.
    """
    url = f"{LAUDUS_API_URL}/security/login"
    payload = {
        "userName": LAUDUS_USER,
        "password": LAUDUS_PASSWORD,
        "companyVATId": LAUDUS_COMPANY_VAT
    }
    
    try:
        # Modo simulación si no hay credenciales reales todavía
        if LAUDUS_USER == "api_user":
            print("🟢 [MODO PRUEBA] Simulando obtención de token de Laudus...")
            return "token_simulado_12345"

        async with httpx.AsyncClient() as client:
            respuesta = await client.post(url, json=payload)
            respuesta.raise_for_status()
            datos = respuesta.json()
            return datos.get("token")
            
    except Exception as e:
        print(f"❌ Error al autenticar con Laudus: {e}")
        return None

async def consultar_producto_laudus(sku: str) -> Dict:
    """
    Busca la información de un producto específico en Laudus usando su SKU.
    """
    token = await obtener_token_laudus()
    
    if not token:
        return {"estado": "error", "mensaje": "No se pudo conectar con Laudus"}

    # --- SIMULACIÓN PARA QUE PUEDAS PROBAR HOY ---
    if token == "token_simulado_12345":
        print(f"🟢 [MODO PRUEBA] Buscando SKU '{sku}' en base de datos falsa...")
        # Simulamos que encuentra el producto
        return {
            "estado": "exito",
            "sku": sku,
            "nombre": f"Producto de prueba para {sku}",
            "stock_actual_laudus": 5, 
            "precio_costo": 8500
        }

    # --- CÓDIGO REAL PARA PRODUCCIÓN ---
    # (El endpoint exacto depende de la documentación de tu versión de Laudus)
    url_busqueda = f"{LAUDUS_API_URL}/production/products/list"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Laudus suele usar un sistema de filtros en su API
    payload_filtro = {
        "options": {
            "offset": 0,
            "limit": 1
        },
        "fields": ["productId", "sku", "description", "stock"],
        "filter": {
            "field": "sku",
            "operator": "=",
            "value": sku
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            respuesta = await client.post(url_busqueda, headers=headers, json=payload_filtro)
            respuesta.raise_for_status()
            datos = respuesta.json()
            
            if datos.get("items") and len(datos["items"]) > 0:
                producto_laudus = datos["items"][0]
                return {
                    "estado": "exito",
                    "sku": producto_laudus.get("sku"),
                    "nombre": producto_laudus.get("description"),
                    "stock_actual_laudus": producto_laudus.get("stock", 0)
                }
            else:
                return {"estado": "error", "mensaje": "Producto no encontrado en Laudus"}
                
    except Exception as e:
        print(f"❌ Error al consultar producto en Laudus: {e}")
        return {"estado": "error", "mensaje": str(e)}