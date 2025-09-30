from flask import Flask, send_from_directory, send_file
import os

app = Flask(__name__)

# Ruta al directorio de archivos estáticos
STATIC_DIR = '/home/ubuntu/lottery-chatbot/chatbot-web-traced/dist'

@app.route('/')
def index():
    """Servir el archivo index.html"""
    return send_file(os.path.join(STATIC_DIR, 'index.html'))

@app.route('/<path:filename>')
def static_files(filename):
    """Servir archivos estáticos"""
    return send_from_directory(STATIC_DIR, filename)

@app.route('/assets/<path:filename>')
def assets(filename):
    """Servir archivos de assets"""
    return send_from_directory(os.path.join(STATIC_DIR, 'assets'), filename)

@app.route('/health')
def health():
    """Endpoint de salud"""
    return {
        "status": "ok",
        "service": "lottery-chatbot-frontend",
        "message": "Sitio web del chatbot de lotería funcionando correctamente"
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
