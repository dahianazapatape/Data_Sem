# ITM Data — Panel Interactivo de Matriculados 2026-1

Aplicación web interactiva (Python + Flask + SQLite + Chart.js + Leaflet)
para explorar los datos reales de matrícula del Instituto Tecnológico
Metropolitano (ITM). Al ejecutarse, levanta un servidor local y abre automáticamente
la interfaz en el navegador.

## Módulos incluidos

1. **Dashboard principal** — KPIs y gráficos resumen (facultad, género, modalidad, sedes).
2. **Mapa interactivo** — ubicación geográfica de todas las sedes con volumen de matrícula.
3. **Estadísticas** — gráficos dinámicos filtrables (incluye filtro por estrato) y ranking Top/Bottom de programas con % del total.
4. **Comparador de sedes** — selecciona dos sedes y contrasta sus programas, facultades, modalidad y matrícula.
5. **Analítica avanzada** — estrato socioeconómico, tasa de virtualidad, cobertura por municipio de nacimiento y comuna, ranking de colegios, y equidad de género por facultad.
6. **Buscador** — búsqueda y filtrado avanzado (facultad, sede, modalidad, sexo, estrato, comuna, tipo de inscripción), con exportación a CSV y Excel.
7. **Reporte ejecutivo** — hallazgos generados automáticamente a partir de los datos, tarjeta de calidad de datos ("No registra" por campo), y descarga en PDF.
8. **Añadir datos** — registro manual o carga masiva por CSV de nuevos matriculados: se guardan en la base de datos *y* se agregan al archivo `Matriculados_20260820.csv`, para que persistan y alimenten todas las demás secciones.
9. **Perfil / Configuración** — modo oscuro y color de acento, persistentes en el navegador.

> **Nota sobre alcance:** el archivo de datos actual solo tiene un periodo (2026-1) y no incluye fecha de nacimiento ni etapas de inscritos/admitidos, por lo que **no** se incluyeron los módulos de comparativo entre periodos, alertas de variación, perfil por edad ni embudo de inscripción — no hay con qué calcularlos todavía. En cuanto agregues datos de otro periodo desde "Añadir datos", esas funciones podrían habilitarse en una futura iteración.

## Requisitos previos

- Python 3.10 o superior instalado (verifica con `python --version`).
- Visual Studio Code (opcional, pero recomendado — instala la extensión "Python" de Microsoft).
- Conexión a internet solo para los iconos y la tipografía (Bootstrap Icons, Google Fonts) y para las teselas del mapa (OpenStreetMap). Chart.js y Leaflet ya están incluidos localmente en `static/vendor/`, así que los gráficos funcionan incluso sin internet o detrás de un firewall restrictivo.

## Instalación y ejecución

### 1. Abrir el proyecto
Abre la carpeta `itm-data` en Visual Studio Code (`Archivo > Abrir carpeta...`).

### 2. Crear un entorno virtual (recomendado)
Abre una terminal en VS Code (`Terminal > Nueva terminal`) y ejecuta:

```bash
python -m venv venv
```

Actívalo:

- **Windows (PowerShell):** `venv\Scripts\Activate.ps1`
- **Windows (CMD):** `venv\Scripts\activate.bat`
- **macOS / Linux:** `source venv/bin/activate`

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Ejecutar la aplicación

```bash
python app.py
```

La primera vez, el sistema construirá automáticamente la base de datos
SQLite (`database/matriculados.db`) a partir del CSV incluido en `data/`.
Luego el servidor quedará disponible en:

```
http://127.0.0.1:5050/
```

y el navegador se abrirá solo. Si no se abre automáticamente, copia esa
dirección en tu navegador.

Para detener el servidor, presiona `Ctrl + C` en la terminal.

## Actualizar los datos

Si reemplazas el archivo `data/Matriculados_20260820.csv` por una versión
más reciente (misma estructura de columnas), reconstruye la base de datos:

```bash
python database/init_db.py
```

y vuelve a ejecutar `python app.py`.

## Estructura del proyecto

```
itm-data/
├── app.py                  # Punto de entrada Flask
├── config.py                # Rutas, paleta de colores, coordenadas de sedes
├── requirements.txt
├── data/
│   └── Matriculados_20260820.csv
├── database/
│   ├── init_db.py           # CSV -> SQLite
│   ├── queries.py           # Consultas SQL reutilizables
│   └── matriculados.db      # (se genera automáticamente)
├── routes/
│   ├── views.py             # Rutas que renderizan las páginas HTML
│   └── api.py                # Endpoints JSON (/api/...)
├── templates/                # Vistas Jinja2 (dashboard, mapa, etc.)
└── static/
    ├── css/style.css
    ├── js/                    # Un archivo JS por módulo
    └── vendor/                # Chart.js y Leaflet alojados localmente (sin depender de un CDN)
```

## Stack técnico

- **Backend:** Python, Flask, SQLite (vía `sqlite3` + `pandas` para la carga inicial).
- **Frontend:** HTML5, CSS3 (variables personalizadas, responsive), JavaScript vanilla.
- **Visualización:** Chart.js (gráficos), Leaflet + OpenStreetMap (mapa interactivo).
- **Arquitectura:** API REST interna (Blueprints de Flask) consumida de forma asíncrona por cada módulo del frontend.
