# 🚀 DESPLIEGUE DE BACKENDS EN RAILWAY (GRATIS 24/7)

## 📋 PASOS PARA DESPLEGAR AMBOS BACKENDS:

### 🟢 **BACKEND NODE.JS:**

1. **Crear cuenta en Railway:**
   - Ve a https://railway.app
   - Regístrate con GitHub (gratis)

2. **Crear nuevo proyecto:**
   - Click "New Project" → "Deploy from GitHub repo"
   - Conecta tu cuenta de GitHub

3. **Subir código a GitHub:**
   ```bash
   # Crear repositorio para backend Node.js
   cd /home/ubuntu/lottery-chatbot
   mkdir nodejs-backend-deploy
   cp real-backend.js nodejs-backend-deploy/server.js
   cp package.json nodejs-backend-deploy/
   cd nodejs-backend-deploy
   
   # Crear package.json específico
   cat > package.json << 'EOF'
   {
     "name": "lottery-chatbot-nodejs",
     "version": "1.0.0",
     "description": "Backend Node.js para chatbot de lotería",
     "main": "server.js",
     "scripts": {
       "start": "node server.js",
       "dev": "node server.js"
     },
     "dependencies": {
       "express": "^4.18.2",
       "cors": "^2.8.5",
       "axios": "^1.6.0",
       "zod": "^3.22.4"
     },
     "engines": {
       "node": "18.x"
     }
   }
   EOF
   
   # Subir a GitHub
   git init
   git add .
   git commit -m "Backend Node.js para Railway"
   # Crear repo en GitHub y hacer push
   ```

4. **Configurar variables de entorno en Railway:**
   ```
   SUPABASE_URL=https://zgttgbdbujrzduqekfmp.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpndHRnYmRidWpyemR1cWVrZm1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk3MzIwMywiZXhwIjoyMDczNTQ5MjAzfQ.bL6YhyLDKmwTfXwYazE1VvuxREhnf8KYDwY5D0nJvbw
   DEEPSEEK_API_KEY=sk-86c5897b82cc4daca828dd989ba03349
   PORT=3000
   ```

### 🔄 **BACKEND N8N:**

1. **Crear segundo proyecto en Railway:**
   ```bash
   # Crear repositorio para backend N8N
   cd /home/ubuntu/lottery-chatbot
   mkdir n8n-backend-deploy
   cp n8n-backend/simple-n8n-server.js n8n-backend-deploy/server.js
   cd n8n-backend-deploy
   
   # Crear package.json específico
   cat > package.json << 'EOF'
   {
     "name": "lottery-chatbot-n8n",
     "version": "1.0.0",
     "description": "Backend N8N para chatbot de lotería",
     "main": "server.js",
     "scripts": {
       "start": "node server.js",
       "dev": "node server.js"
     },
     "dependencies": {
       "express": "^4.18.2",
       "cors": "^2.8.5",
       "axios": "^1.6.0"
     },
     "engines": {
       "node": "18.x"
     }
   }
   EOF
   ```

2. **Configurar las mismas variables de entorno**

## 🌐 **URLS RESULTANTES:**

Después del despliegue tendrás:
- **Backend Node.js:** `https://tu-proyecto-nodejs.railway.app`
- **Backend N8N:** `https://tu-proyecto-n8n.railway.app`

## 🔧 **ACTUALIZAR FRONTEND:**

Una vez que tengas las URLs de Railway, actualizar en el frontend:

```javascript
const backendUrls = {
  nodejs: 'https://tu-proyecto-nodejs.railway.app',
  n8n: 'https://tu-proyecto-n8n.railway.app'
}
```

## 💰 **COSTOS:**

- **Railway:** Gratis hasta 500 horas/mes (suficiente para 24/7)
- **Supabase:** Gratis hasta 50,000 requests/mes
- **DeepSeek:** Muy económico por uso

## ⚡ **ALTERNATIVAS RÁPIDAS:**

Si prefieres que lo haga yo directamente, puedo usar:
1. **Render.com** (también gratis)
2. **Vercel** (para el backend Node.js)
3. **Heroku** (con plan gratuito limitado)

¿Prefieres que te guíe paso a paso o que use una alternativa que pueda configurar directamente?

