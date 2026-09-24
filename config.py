# -*- coding: utf-8 -*-
"""
Configuración central del proyecto.
Aquí viven las rutas de archivos, la paleta de colores institucional
y el diccionario de coordenadas geográficas de las sedes, usado por
el módulo de Mapa Interactivo.
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_CSV = os.path.join(BASE_DIR, "data", "Matriculados_20260820.csv")
DB_PATH = os.path.join(BASE_DIR, "database", "matriculados.db")

APP_NAME = "ITM Data"
APP_SUBTITLE = "Panel de Matriculados 2026-1 · Instituto Tecnológico Metropolitano"

HOST = "127.0.0.1"
PORT = 5050

# Paleta de colores de referencia (imagen adjunta por el usuario)
PALETTE = {
    "terra_cotta": "#E76F51",   # acentos, alertas, resaltados
    "pale_spring_bud": "#F4F1BB",  # chips / fondos cálidos suaves
    "opal": "#9BC1BC",          # secundario, bordes suaves
    "alabaster": "#E6EBE0",     # fondo general de la app
    "kobi_egg_blue": "#36C9C6", # color primario / marca
}

# Coordenadas aproximadas (lat, lon) de las sedes y Unidades Educativas
# Municipales/Regionales (UEMB / UEMR) del Instituto Tecnológico Metropolitano
# (ITM). Los valores de las sedes principales de Medellín (Robledo,
# Fraternidad, Castilla, La Floresta) se basan en su ubicación real
# conocida; las sedes regionales usan el centro urbano aproximado del
# municipio correspondiente (uso académico / demostrativo).
SEDE_COORDS = {
    "ROBLEDO": (6.2886, -75.5896),           # Campus principal — Calle 73 #76A-354, Vía al Volador
    "FRATERNIDAD MEDELLÍN": (6.2472, -75.5642),  # Sede Fraternidad, sobre el Parque de Boston
    "FLORESTA": (6.2661, -75.6024),          # Sede La Floresta
    "CASTILLA": (6.2961, -75.5735),          # Sede Castilla
    "CAMPUS C4TA": (6.2088, -75.5697),       # Espacio académico zona El Poblado

    # Unidades Educativas Municipales Regionales (UEMR) — municipios de Antioquia
    "UEMR - Carepa": (7.7539, -76.6553),
    "UEMR - Bello": (6.3373, -75.5581),
    "UEMR - El Peñol": (6.2181, -75.2394),
    "UEMR-Valparaiso": (5.6167, -75.2333),
    "UEMR - Jardín": (5.5989, -75.8236),
    "UEMR - Belmira": (6.6067, -75.6675),
    "UEMR - Sonsón": (5.7075, -75.3072),
    "UEMR - Tarso": (5.9683, -75.7972),
    "UEMR - Maceo": (6.5461, -74.7856),
    "UEMR - Betania": (5.7461, -75.9761),
    "UEMR - Nodo Gómez Plata": (6.6367, -75.2280),
    "UEMR - Andes": (5.6597, -75.8783),
    "UEMR-HISPANIA": (5.7994, -75.9008),
    "UEMR- BETULIA": (6.1136, -75.9847),
    "UEMR - Cañas Gordas": (6.7481, -76.0328),
    "UEMR - Urrao": (6.3178, -76.1394),
    "UEMR - Ituango": (7.1719, -75.7628),
    "UEMR - Briceño": (7.1094, -75.5658),
    "UEMR- Angostura": (6.8836, -75.3372),
    "UEMR- EBEJICO": (6.3272, -75.7686),
    "UEMR - San Jeronimo": (6.4453, -75.6975),
    "UEMR - Carolina del Principe": (6.7239, -75.2764),
    "UEMR - Donmatías": (6.4833, -75.3861),
    "UEMR - Yolombo": (6.5947, -75.0117),
    "UEMR - Cisneros": (6.5417, -75.0844),
    "UEMR- Caucasia": (7.9889, -75.1978),
    "UEMR - Taraza": (7.5836, -75.3986),
    "UEMR - Valdivia": (7.1636, -75.4356),
    "UEMR - Nodo Vegachi": (6.7783, -74.7994),
}

# Coordenada de referencia para Medellín (usada para ubicar puntos sin
# coordenada exacta, típicamente sedes UEMB dentro de instituciones
# educativas de la ciudad) y para el centro inicial del mapa.
MEDELLIN_CENTER = (6.2442, -75.5812)
ANTIOQUIA_CENTER = (6.6, -75.6)
