# -*- coding: utf-8 -*-
"""
ITM Data — Panel interactivo de matriculados del ITM.

Ejecutar con:
    python app.py

Al iniciar, si no existe la base de datos, se construye automáticamente
a partir de data/Matriculados_20260820.csv, luego se levanta un
servidor Flask local y se abre el navegador por defecto.
"""
import os
import threading
import webbrowser

from flask import Flask

from config import DB_PATH, HOST, PORT
from database.init_db import build_database
from routes.api import api_bp
from routes.views import views_bp


def create_app():
    app = Flask(__name__)
    app.config["JSON_AS_ASCII"] = False
    app.register_blueprint(views_bp)
    app.register_blueprint(api_bp)

    @app.after_request
    def add_no_cache_headers(response):
        # Evita que el navegador guarde en caché el HTML/JS/CSS mientras
        # se está desarrollando — así cada cambio se ve al recargar.
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    return app


app = create_app()


def _open_browser():
    webbrowser.open(f"http://{HOST}:{PORT}/")


if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print("No se encontró la base de datos. Construyéndola desde el CSV...")
        build_database()

    if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        threading.Timer(1.2, _open_browser).start()

    print(f"\n ITM Data disponible en: http://{HOST}:{PORT}/\n")
    debug_mode = os.environ.get("ITM_DEBUG", "true").lower() == "true"
    app.run(host=HOST, port=PORT, debug=debug_mode)
