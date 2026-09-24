# -*- coding: utf-8 -*-
import csv
import io

from flask import Blueprint, Response, jsonify, request, send_file

from config import MEDELLIN_CENTER, SEDE_COORDS
from database import queries as q
from database.init_db import append_records_to_csv, build_database

api_bp = Blueprint("api", __name__, url_prefix="/api")

FILTER_KEYS = [
    "facultad", "sede", "modalidad", "sexo", "tipo_programa",
    "area_conocimiento", "comuna", "estrato", "tipo_inscripcion", "q",
]

# Columnas que puede diligenciar el formulario de "Añadir datos"
RECORD_FIELDS = [
    "anio", "barrio", "comuna", "ciudad_nacimiento", "pais_nacimiento",
    "estrato", "ciudad_nacimiento_alt", "programa", "sexo",
    "tipo_inscripcion", "sede", "facultad", "area_conocimiento",
    "institucion", "colegio", "modalidad", "tipo_programa",
]


def _filters_from_request():
    return {k: request.args.get(k) for k in FILTER_KEYS if request.args.get(k)}


def _jitter(sede_name, center):
    """Genera un desplazamiento pequeño y determinístico para sedes sin
    coordenada exacta, evitando que todos los puntos caigan uno encima
    del otro en el mapa."""
    h = sum(ord(c) for c in sede_name)
    dx = ((h % 100) / 100 - 0.5) * 0.09
    dy = (((h * 7) % 100) / 100 - 0.5) * 0.09
    return round(center[0] + dy, 5), round(center[1] + dx, 5)


@api_bp.route("/kpis")
def kpis():
    return jsonify(q.get_kpis(_filters_from_request()))


@api_bp.route("/filtros")
def filtros():
    return jsonify(q.get_filter_options())


@api_bp.route("/charts/<dimension>")
def chart_by_dimension(dimension):
    valid = {
        "facultad": "facultad",
        "sede": "sede",
        "modalidad": "modalidad",
        "sexo": "sexo",
        "tipo_programa": "tipo_programa",
        "area_conocimiento": "area_conocimiento",
        "comuna": "comuna",
        "colegio": "colegio",
        "institucion": "institucion",
        "tipo_inscripcion": "tipo_inscripcion",
        "programa": "programa",
    }
    if dimension not in valid:
        return jsonify({"error": "dimensión no válida"}), 400
    limit = request.args.get("limit", type=int)
    data = q.get_counts_by(valid[dimension], _filters_from_request(), limit=limit)
    return jsonify(data)


@api_bp.route("/charts/cruce/<group_col>/<stack_col>")
def chart_cross(group_col, stack_col):
    allowed = {"facultad", "sede", "modalidad", "sexo", "tipo_programa", "area_conocimiento"}
    if group_col not in allowed or stack_col not in allowed:
        return jsonify({"error": "dimensión no válida"}), 400
    data = q.get_stacked_counts(group_col, stack_col, _filters_from_request())
    return jsonify(data)


@api_bp.route("/estrato")
def estrato():
    return jsonify(q.get_estrato_distribution(_filters_from_request()))


@api_bp.route("/sedes")
def sedes():
    resumen = q.get_sede_summary(_filters_from_request())
    out = []
    for row in resumen:
        nombre = row["label"]
        if nombre in ("VIRTUAL", "No registra") or "MOVILIDAD" in nombre.upper():
            continue  # sin ubicación física
        if nombre in SEDE_COORDS:
            lat, lon = SEDE_COORDS[nombre]
        else:
            lat, lon = _jitter(nombre, MEDELLIN_CENTER)
        out.append({
            "sede": nombre,
            "total": row["total"],
            "femenino": row["femenino"],
            "masculino": row["masculino"],
            "facultad_top": q.get_top_facultad_by_sede(nombre),
            "lat": lat,
            "lon": lon,
        })
    return jsonify(out)


@api_bp.route("/buscar")
def buscar():
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("page_size", 25, type=int)
    return jsonify(q.search_students(_filters_from_request(), page=page, page_size=page_size))


@api_bp.route("/exportar")
def exportar():
    data = q.search_students(_filters_from_request(), page=1, page_size=100000)["results"]
    buf = io.StringIO()
    if data:
        writer = csv.DictWriter(buf, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    return Response(
        buf.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=matriculados_filtrado.csv"},
    )


@api_bp.route("/exportar/excel")
def exportar_excel():
    import pandas as pd

    data = q.search_students(_filters_from_request(), page=1, page_size=100000)["results"]
    df = pd.DataFrame(data)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Matriculados")
    buf.seek(0)
    return send_file(
        buf,
        as_attachment=True,
        download_name="matriculados_filtrado.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


# ---------- Cobertura / virtualidad / top-bottom ----------

@api_bp.route("/cobertura/<dimension>")
def cobertura(dimension):
    if dimension not in ("comuna", "estrato", "municipio_nacimiento"):
        return jsonify({"error": "dimensión no válida"}), 400
    limit = request.args.get("limit", 12, type=int)
    return jsonify(q.get_coverage(dimension, _filters_from_request(), limit=limit))


@api_bp.route("/virtualidad")
def virtualidad():
    return jsonify(q.get_virtuality_rate(_filters_from_request()))


@api_bp.route("/top-bottom/programas")
def top_bottom_programas():
    limit = request.args.get("limit", 10, type=int)
    return jsonify(q.get_top_bottom_programas(limit, _filters_from_request()))


# ---------- Comparador de sedes ----------

@api_bp.route("/comparar-sedes")
def comparar_sedes():
    sede_a = request.args.get("sede_a")
    sede_b = request.args.get("sede_b")
    if not sede_a or not sede_b:
        return jsonify({"error": "Debes indicar sede_a y sede_b"}), 400
    return jsonify(q.get_sede_comparison(sede_a, sede_b))


# ---------- Calidad de datos y reporte ejecutivo ----------

@api_bp.route("/calidad-datos")
def calidad_datos():
    return jsonify(q.get_data_quality())


@api_bp.route("/reporte")
def reporte():
    return jsonify(q.get_report_findings())


@api_bp.route("/reporte/pdf")
def reporte_pdf():
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import (Paragraph, SimpleDocTemplate, Spacer,
                                     Table, TableStyle)

    data = q.get_report_findings()
    kpis = data["kpis"]
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("Reporte Ejecutivo — ITM Data", styles["Title"]),
        Paragraph("Instituto Tecnológico Metropolitano · Periodo 2026-1", styles["Normal"]),
        Spacer(1, 16),
        Paragraph("Indicadores generales", styles["Heading2"]),
    ]
    tabla_kpis = [
        ["Total matriculados", f"{kpis['total_matriculados']:,}".replace(",", ".")],
        ["Sedes activas", str(kpis["total_sedes"])],
        ["Facultades", str(kpis["total_facultades"])],
        ["Programas", str(kpis["total_programas"])],
        ["% Mujeres / % Hombres", f"{kpis['pct_femenino']}% / {kpis['pct_masculino']}%"],
        ["% Modalidad virtual", f"{kpis['pct_virtual']}%"],
    ]
    t = Table(tabla_kpis, colWidths=[9 * cm, 6 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#36C9C6")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DCE3DA")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
    ]))
    story += [t, Spacer(1, 20), Paragraph("Hallazgos clave", styles["Heading2"])]
    for h in data["hallazgos"]:
        story.append(Paragraph(f"• {h}", styles["Normal"]))
        story.append(Spacer(1, 6))
    doc.build(story)
    buf.seek(0)
    return send_file(buf, as_attachment=True, download_name="reporte_ejecutivo_itm.pdf", mimetype="application/pdf")


# ---------- Añadir datos ----------

@api_bp.route("/datos/esquema")
def datos_esquema():
    return jsonify(q.get_form_options())


@api_bp.route("/datos/agregar", methods=["POST"])
def datos_agregar():
    payload = request.get_json(force=True, silent=True) or {}
    record = {f: str(payload.get(f, "")).strip() or "No registra" for f in RECORD_FIELDS}
    try:
        record["anio"] = int(payload.get("anio") or 2026)
    except (TypeError, ValueError):
        record["anio"] = 2026
    try:
        record["estrato"] = int(payload.get("estrato") or 0)
    except (TypeError, ValueError):
        record["estrato"] = 0
    record["consecutivo"] = q.get_next_consecutivo()

    q.insert_record(record)
    append_records_to_csv([record])
    return jsonify({"ok": True, "consecutivo": record["consecutivo"]})


@api_bp.route("/datos/reconstruir", methods=["POST"])
def datos_reconstruir():
    """Reconstruye la base de datos completa a partir del CSV maestro
    (útil como mantenimiento tras varias cargas manuales)."""
    build_database()
    return jsonify({"ok": True})


@api_bp.route("/datos/cargar-csv", methods=["POST"])
def datos_cargar_csv():
    import pandas as pd

    from database.init_db import COLUMN_MAP, UNKNOWN_TOKENS

    file = request.files.get("archivo")
    if not file:
        return jsonify({"error": "No se recibió ningún archivo"}), 400

    try:
        df = pd.read_csv(file, encoding="utf-8", thousands=",")
        df = df.rename(columns=COLUMN_MAP)
        missing = [c for c in COLUMN_MAP.values() if c not in df.columns]
        if missing:
            return jsonify({"error": f"Faltan columnas requeridas: {', '.join(missing)}"}), 400

        text_cols = [c for c in COLUMN_MAP.values() if c not in ("estrato", "anio")]
        for col in text_cols:
            df[col] = df[col].astype(str).str.strip()
            df.loc[df[col].isin(UNKNOWN_TOKENS), col] = "No registra"
        df["estrato"] = pd.to_numeric(df["estrato"], errors="coerce").fillna(0).astype(int)
        df["anio"] = pd.to_numeric(df["anio"], errors="coerce").fillna(2026).astype(int)

        start = q.get_next_consecutivo()
        df["consecutivo"] = range(start, start + len(df))

        records = df[list(COLUMN_MAP.values())].to_dict(orient="records")
        q.insert_records_bulk(records)
        append_records_to_csv(records)
        return jsonify({"ok": True, "registros_agregados": len(records)})
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"No se pudo procesar el archivo: {exc}"}), 400
