# -*- coding: utf-8 -*-
"""
Carga el archivo Matriculados_20260820.csv a una base de datos SQLite
(database/matriculados.db), normalizando nombres de columnas y tipos.

Se ejecuta automáticamente la primera vez que se corre app.py, o de
forma manual con:
    python database/init_db.py
"""
import os
import sqlite3
import sys

import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DATA_CSV, DB_PATH  # noqa: E402

COLUMN_MAP = {
    "Ano": "anio",
    "Consecutivo": "consecutivo",
    "Barrio": "barrio",
    "Comuna": "comuna",
    "Ciudad Nacimiento": "ciudad_nacimiento",
    "Pais Nacimiento": "pais_nacimiento",
    "Id Estrato": "estrato",
    "Ciudad Nacimiento 1": "ciudad_nacimiento_alt",
    "Nombre Programa": "programa",
    "Sexo": "sexo",
    "Tipo Inscripcion": "tipo_inscripcion",
    "Sede": "sede",
    "Facultad": "facultad",
    "Area Conocimiento": "area_conocimiento",
    "Institucion": "institucion",
    "Colegio": "colegio",
    "Modalidad": "modalidad",
    "Tipo Programa": "tipo_programa",
}

UNKNOWN_TOKENS = [
    "** Seleccionar**", "** Desconocida **", "** Desconocido **",
    "", "NAN", "NULL", "N/A", "NA",
]

CSV_HEADER_ORDER = list(COLUMN_MAP.keys())


def append_records_to_csv(records: list):
    """Agrega nuevos matriculados al archivo CSV maestro (data/Matriculados_20260820.csv)
    para que persistan aunque se reconstruya la base de datos."""
    import csv as csv_module

    file_exists = os.path.exists(DATA_CSV)
    with open(DATA_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv_module.writer(f)
        if not file_exists:
            writer.writerow(CSV_HEADER_ORDER)
        for record in records:
            row = [record.get(COLUMN_MAP[h], "") for h in CSV_HEADER_ORDER]
            writer.writerow(row)


def build_database():
    print(f"Leyendo CSV: {DATA_CSV}")
    df = pd.read_csv(DATA_CSV, encoding="utf-8", thousands=",")
    df = df.rename(columns=COLUMN_MAP)

    # Limpieza básica de texto
    text_cols = [
        "barrio", "comuna", "ciudad_nacimiento", "pais_nacimiento",
        "ciudad_nacimiento_alt", "programa", "sexo", "tipo_inscripcion",
        "sede", "facultad", "area_conocimiento", "institucion", "colegio",
        "modalidad", "tipo_programa",
    ]
    for col in text_cols:
        df[col] = df[col].astype(str).str.strip()
        df.loc[df[col].isin(UNKNOWN_TOKENS), col] = "No registra"

    df["estrato"] = pd.to_numeric(df["estrato"], errors="coerce").fillna(0).astype(int)
    df["anio"] = pd.to_numeric(df["anio"], errors="coerce").fillna(0).astype(int)

    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    conn = sqlite3.connect(DB_PATH)
    df.to_sql("matriculados", conn, if_exists="replace", index=False)

    cur = conn.cursor()
    for col in ["facultad", "sede", "modalidad", "sexo", "tipo_programa",
                "area_conocimiento", "comuna", "colegio", "estrato"]:
        cur.execute(f"CREATE INDEX IF NOT EXISTS idx_{col} ON matriculados({col})")
    conn.commit()
    conn.close()
    print(f"Base de datos creada en: {DB_PATH} ({len(df)} registros)")


if __name__ == "__main__":
    build_database()
