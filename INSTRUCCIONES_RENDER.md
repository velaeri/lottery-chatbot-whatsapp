# 🚀 DESPLIEGUE PERMANENTE EN RENDER.COM (GRATIS 24/7)

## 📋 PASO 1: Crear cuenta en Render

1. Ve a [render.com](https://render.com)
2. Haz clic en **"Get Started for Free"**
3. Regístrate con GitHub (recomendado) o email
4. Confirma tu cuenta

## 📋 PASO 2: Crear repositorio en GitHub

1. Ve a [github.com](https://github.com) y crea un nuevo repositorio
2. Nómbralo: `lottery-chatbot-backend`
3. Hazlo **público** (para plan gratuito)
4. **NO** inicialices con README

## 📋 PASO 3: Subir el código

Descarga el archivo `lottery-chatbot-backend.zip` que creé y:

1. Extrae el contenido
2. Abre terminal en la carpeta extraída
3. Ejecuta estos comandos:

```bash
git init
git add .
git commit -m "Initial commit - Lottery Chatbot Backend"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/lottery-chatbot-backend.git
git push -u origin main
```

## 📋 PASO 4: Desplegar en Render

1. En Render, haz clic en **"New +"** → **"Web Service"**
2. Conecta tu cuenta de GitHub
3. Selecciona el repositorio `lottery-chatbot-backend`
4. Configura así:

### Configuración básica:
- **Name**: `lottery-chatbot-backend`
- **Region**: `Oregon (US West)` (más rápido)
- **Branch**: `main`
- **Root Directory**: (dejar vacío)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Variables de entorno:
Haz clic en **"Advanced"** y añade estas variables:

```
SUPABASE_URL = https://zgttgbdbujrzduqekfmp.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpndHRnYmRidWpyemR1cWVrZm1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk3MzIwMywiZXhwIjoyMDczNTQ5MjAzfQ.bL6YhyLDKmwTfXwYazE1VvuxREhnf8KYDwY5D0nJvbw
DEEPSEEK_API_KEY = sk-86c5897b82cc4daca828dd989ba03349
```

5. Haz clic en **"Create Web Service"**

## 📋 PASO 5: Esperar el despliegue

- El proceso toma 2-3 minutos
- Verás logs en tiempo real
- Cuando termine, tendrás una URL como: `https://lottery-chatbot-backend.onrender.com`

## 📋 PASO 6: Probar el backend

1. Ve a tu URL + `/health`
   Ejemplo: `https://lottery-chatbot-backend.onrender.com/health`

2. Deberías ver algo como:
```json
{
  "status": "ok",
  "deepseek": { "available": true },
  "supabase": { "connected": true }
}
```

## 🎯 ¡LISTO!

Una vez que tengas la URL de Render, avísame y actualizaré el frontend para conectarse a tu backend permanente.

## 💡 NOTAS IMPORTANTES:

- **Gratis para siempre**: 750 horas/mes (más que suficiente)
- **Se duerme tras 15 min sin uso**: Se despierta automáticamente
- **URL permanente**: No cambia nunca
- **SSL incluido**: HTTPS automático
- **Logs disponibles**: Para debugging

## 🆘 SI TIENES PROBLEMAS:

1. Verifica que el repositorio sea público
2. Asegúrate de que las variables de entorno estén bien copiadas
3. Revisa los logs en Render para ver errores

**¡Avísame cuando tengas la URL de Render y conectaré todo!**

