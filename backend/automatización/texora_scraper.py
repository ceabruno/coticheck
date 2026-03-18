import asyncio
import random
from typing import List, Dict
from playwright.async_api import async_playwright

# --- ¡NUEVA FORMA DE IMPORTAR STEALTH (VERSIÓN 2.0+) ---
from playwright_stealth import Stealth 

# Variables de configuración (Reemplaza con datos reales)
TEXORA_URL_LOGIN = "https://www.texora.cl/iniciar-sesion"
TEXORA_USER = "tu_correo@empresa.cl"
TEXORA_PASS = "tu_contrasena"

async def consultar_stock_texora(skus: List[str]) -> List[Dict]:
    """
    Inicia sesión UNA sola vez en Texora y busca una lista de SKUs.
    """
    resultados = []
    
    # --- ¡NUEVA FORMA DE USAR STEALTH! ---
    # Envolvemos async_playwright() con Stealth().use_async()
    async with Stealth().use_async(async_playwright()) as p:
        
        agente_usuario = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        
        browser = await p.chromium.launch(
            headless=False, 
            args=["--disable-blink-features=AutomationControlled"] 
        )
        
        context = await browser.new_context(user_agent=agente_usuario)
        # Ya no necesitamos llamar a stealth_async(page) aquí, ¡se aplica solo!
        page = await context.new_page()
        
        try:
            print("Navegando a la página de Login...")
            await page.goto(TEXORA_URL_LOGIN)
            await page.wait_for_timeout(random.randint(2000, 3000))
            
            # --- 1. PROCESO DE LOGIN ---
            print("Iniciando sesión...")
            await page.fill('input#email', TEXORA_USER)
            await page.wait_for_timeout(random.randint(500, 1000))
            await page.fill('input[name="password"]', TEXORA_PASS)
            
            await page.click('button[type="submit"]')
            await page.wait_for_load_state('networkidle')
            print("Login completado.")
            
            # --- 2. BÚSQUEDA DE PRODUCTOS ---
            for sku in skus:
                print(f"Buscando SKU: {sku}...")
                try:
                    await page.wait_for_timeout(random.randint(1500, 3000))
                    
                    # Estos selectores de búsqueda los ajustaremos cuando podamos entrar
                    await page.fill('input[name="s"], input[name="search_query"]', sku)
                    await page.keyboard.press('Enter')
                    await page.wait_for_load_state('networkidle')
                    
                    await page.wait_for_selector('.current-price, .product-price', timeout=5000)
                    precio_texto = await page.locator('.current-price, .product-price').first.inner_text()
                    
                    try:
                        stock_texto = await page.locator('.product-quantities span, .stock-disponible').first.inner_text()
                        stock_num = int(''.join(filter(str.isdigit, stock_texto)))
                    except Exception:
                        stock_num = 0
                        
                    precio_num = float(''.join(filter(str.isdigit, precio_texto)))
                    
                    resultados.append({
                        "producto": sku,
                        "stockTexora": stock_num,
                        "precioUnidad": precio_num,
                        "estado": "exito"
                    })
                    print(f"✅ Encontrado: {sku} | Stock: {stock_num} | Precio: ${precio_num}")
                    
                except Exception as e:
                    print(f"❌ Error buscando {sku}. Quizás no existe o no hay stock visible.")
                    resultados.append({
                        "producto": sku,
                        "stockTexora": 0,
                        "precioUnidad": 0,
                        "estado": "error"
                    })
                    
        except Exception as e:
            print(f"Error crítico en la automatización: {e}")
            
        finally:
            await browser.close()
            
    return resultados