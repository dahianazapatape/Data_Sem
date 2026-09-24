# -*- coding: utf-8 -*-
"""
Consultas SQL sobre matriculados.db. Se mantienen simples y directas
(sin ORM) para que el proyecto sea fácil de leer y de sustentar.
"""
import sqlite3

from config import DB_PATH

FILTERABLE_COLUMNS = [
    "facultad", "sede", "modalidad", "sexo", "tipo_programa",
    "area_conocimiento", "comuna", "estrato", "tipo_inscripcion",
]


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _where_clause(filters):
    """Construye un WHERE ... parametrizado a partir de un dict de filtros."""
    clauses, params = [], []
    for col in FILTERABLE_COLUMNS:
        val = filters.get(col) if filters else None
        if val:
            clauses.append(f"{col} = ?")
            params.append(val)
    q = filters.get("q") if filters else None
    if q:
        clauses.append(
            "(programa LIKE ? OR colegio LIKE ? OR barrio LIKE ? OR institucion LIKE ?)"
        )
        like = f"%{q}%"
        params += [like, like, like, like]
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    return where, params


def get_kpis(filters=None):
    where, params = _where_clause(filters or {})
    conn = get_conn()
    total = conn.execute(f"SELECT COUNT(*) c FROM matriculados {where}", params).fetchone()["c"]
    sedes = conn.execute(f"SELECT COUNT(DISTINCT sede) c FROM matriculados {where}", params).fetchone()["c"]
    facultades = conn.execute(f"SELECT COUNT(DISTINCT facultad) c FROM matriculados {where}", params).fetchone()["c"]
    programas = conn.execute(f"SELECT COUNT(DISTINCT programa) c FROM matriculados {where}", params).fetchone()["c"]
    femenino = conn.execute(
        f"SELECT COUNT(*) c FROM matriculados {where}{' AND' if where else 'WHERE'} sexo = 'Femenino'",
        params,
    ).fetchone()["c"]
    virtual = conn.execute(
        f"SELECT COUNT(*) c FROM matriculados {where}{' AND' if where else 'WHERE'} modalidad = 'Virtual'",
        params,
    ).fetchone()["c"]
    nuevos = conn.execute(
        f"SELECT COUNT(*) c FROM matriculados {where}{' AND' if where else 'WHERE'} tipo_inscripcion != 'Antiguo'",
        params,
    ).fetchone()["c"]
    conn.close()

    pct_femenino = round((femenino / total) * 100, 1) if total else 0
    pct_virtual = round((virtual / total) * 100, 1) if total else 0

    return {
        "total_matriculados": total,
        "total_sedes": sedes,
        "total_facultades": facultades,
        "total_programas": programas,
        "pct_femenino": pct_femenino,
        "pct_masculino": round(100 - pct_femenino, 1),
        "pct_virtual": pct_virtual,
        "nuevos_ingresos": nuevos,
    }


def get_counts_by(column, filters=None, limit=None, order="DESC"):
    where, params = _where_clause(filters or {})
    sql = f"""
        SELECT {column} AS label, COUNT(*) AS total
        FROM matriculados {where}
        GROUP BY {column}
        ORDER BY total {order}
    """
    if limit:
        sql += f" LIMIT {int(limit)}"
    conn = get_conn()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_stacked_counts(group_col, stack_col, filters=None):
    """Conteos cruzados, ej: facultad x sexo, para gráficos apilados."""
    where, params = _where_clause(filters or {})
    sql = f"""
        SELECT {group_col} AS grp, {stack_col} AS stack, COUNT(*) AS total
        FROM matriculados {where}
        GROUP BY {group_col}, {stack_col}
        ORDER BY {group_col}
    """
    conn = get_conn()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_sede_summary(filters=None):
    where, params = _where_clause(filters or {})
    sql = f"""
        SELECT sede AS label, COUNT(*) AS total,
               SUM(CASE WHEN sexo = 'Femenino' THEN 1 ELSE 0 END) AS femenino,
               SUM(CASE WHEN sexo = 'Masculino' THEN 1 ELSE 0 END) AS masculino
        FROM matriculados {where}
        GROUP BY sede
        ORDER BY total DESC
    """
    conn = get_conn()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_top_facultad_by_sede(sede):
    conn = get_conn()
    row = conn.execute(
        """
        SELECT facultad, COUNT(*) c FROM matriculados
        WHERE sede = ? GROUP BY facultad ORDER BY c DESC LIMIT 1
        """,
        (sede,),
    ).fetchone()
    conn.close()
    return row["facultad"] if row else None


def search_students(filters, page=1, page_size=25):
    where, params = _where_clause(filters or {})
    conn = get_conn()
    total = conn.execute(f"SELECT COUNT(*) c FROM matriculados {where}", params).fetchone()["c"]
    offset = max(page - 1, 0) * page_size
    sql = f"""
        SELECT consecutivo, programa, facultad, sede, modalidad, sexo,
               estrato, comuna, barrio, institucion, colegio, tipo_programa, tipo_inscripcion
        FROM matriculados {where}
        ORDER BY consecutivo
        LIMIT ? OFFSET ?
    """
    rows = conn.execute(sql, params + [page_size, offset]).fetchall()
    conn.close()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max((total + page_size - 1) // page_size, 1),
        "results": [dict(r) for r in rows],
    }


def get_filter_options():
    conn = get_conn()
    options = {}
    for col in ["facultad", "sede", "modalidad", "sexo", "tipo_programa", "area_conocimiento", "comuna", "tipo_inscripcion"]:
        rows = conn.execute(
            f"SELECT DISTINCT {col} FROM matriculados WHERE {col} != 'No registra' ORDER BY {col}"
        ).fetchall()
        options[col] = [r[0] for r in rows]
    rows = conn.execute(
        "SELECT DISTINCT estrato FROM matriculados WHERE estrato > 0 ORDER BY estrato"
    ).fetchall()
    options["estrato"] = [0] + [r[0] for r in rows]
    conn.close()
    return options


def get_form_options():
    """Opciones reales tomadas de la base de datos, usadas para poblar los
    desplegables del formulario de 'Añadir datos'."""
    conn = get_conn()
    options = {}
    cols = [
        "facultad", "sede", "modalidad", "sexo", "tipo_programa",
        "area_conocimiento", "tipo_inscripcion", "comuna", "pais_nacimiento",
        "programa", "barrio", "ciudad_nacimiento", "institucion", "colegio",
    ]
    for col in cols:
        rows = conn.execute(
            f"SELECT DISTINCT {col} FROM matriculados WHERE {col} != 'No registra' ORDER BY {col} LIMIT 4000"
        ).fetchall()
        options[col] = [r[0] for r in rows]
    rows = conn.execute(
        "SELECT DISTINCT estrato FROM matriculados WHERE estrato > 0 ORDER BY estrato"
    ).fetchall()
    options["estrato"] = [0] + [r[0] for r in rows]
    conn.close()
    return options


def get_estrato_distribution(filters=None):
    where, params = _where_clause(filters or {})
    sql = f"""
        SELECT estrato, COUNT(*) AS total
        FROM matriculados {where}
        GROUP BY estrato ORDER BY estrato
    """
    conn = get_conn()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_coverage(dimension, filters=None, limit=12):
    """Distribución porcentual por comuna, estrato o municipio de nacimiento."""
    col_map = {
        "comuna": "comuna",
        "estrato": "estrato",
        "municipio_nacimiento": "ciudad_nacimiento",
    }
    col = col_map.get(dimension)
    if not col:
        return {"error": "dimensión no válida"}
    where, params = _where_clause(filters or {})
    total = get_kpis(filters)["total_matriculados"]
    sql = f"""
        SELECT {col} AS label, COUNT(*) AS total
        FROM matriculados {where}
        GROUP BY {col}
        ORDER BY total DESC
        LIMIT {int(limit)}
    """
    conn = get_conn()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    out = []
    for r in rows:
        label = r["label"]
        if dimension == "estrato":
            label = "Sin dato" if label in (0, "0") else f"Estrato {label}"
        out.append({
            "label": label,
            "total": r["total"],
            "pct": round((r["total"] / total) * 100, 1) if total else 0,
        })
    return out


def get_virtuality_rate(filters=None):
    where, params = _where_clause(filters or {})
    total = get_kpis(filters)["total_matriculados"]
    sql = f"""
        SELECT modalidad AS label, COUNT(*) AS total
        FROM matriculados {where}
        GROUP BY modalidad ORDER BY total DESC
    """
    conn = get_conn()
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [
        {"label": r["label"], "total": r["total"], "pct": round((r["total"] / total) * 100, 1) if total else 0}
        for r in rows
    ]


def get_top_bottom_programas(limit=10, filters=None):
    where, params = _where_clause(filters or {})
    total = get_kpis(filters)["total_matriculados"]

    def _query(order):
        sql = f"""
            SELECT programa AS label, COUNT(*) AS total
            FROM matriculados {where}
            GROUP BY programa
            ORDER BY total {order}
            LIMIT {int(limit)}
        """
        conn = get_conn()
        rows = conn.execute(sql, params).fetchall()
        conn.close()
        return [
            {"label": r["label"], "total": r["total"], "pct": round((r["total"] / total) * 100, 2) if total else 0}
            for r in rows
        ]

    return {"top": _query("DESC"), "bottom": _query("ASC")}


def get_sede_comparison(sede_a, sede_b):
    def _profile(sede):
        conn = get_conn()
        total = conn.execute("SELECT COUNT(*) c FROM matriculados WHERE sede = ?", (sede,)).fetchone()["c"]
        femenino = conn.execute(
            "SELECT COUNT(*) c FROM matriculados WHERE sede = ? AND sexo = 'Femenino'", (sede,)
        ).fetchone()["c"]
        programas = conn.execute(
            """SELECT programa AS label, COUNT(*) AS total FROM matriculados
               WHERE sede = ? GROUP BY programa ORDER BY total DESC LIMIT 5""",
            (sede,),
        ).fetchall()
        modalidad = conn.execute(
            """SELECT modalidad AS label, COUNT(*) AS total FROM matriculados
               WHERE sede = ? GROUP BY modalidad ORDER BY total DESC""",
            (sede,),
        ).fetchall()
        facultades = conn.execute(
            """SELECT facultad AS label, COUNT(*) AS total FROM matriculados
               WHERE sede = ? GROUP BY facultad ORDER BY total DESC LIMIT 5""",
            (sede,),
        ).fetchall()
        conn.close()
        return {
            "sede": sede,
            "total": total,
            "pct_femenino": round((femenino / total) * 100, 1) if total else 0,
            "top_programas": [dict(r) for r in programas],
            "modalidad": [dict(r) for r in modalidad],
            "top_facultades": [dict(r) for r in facultades],
        }

    return {"a": _profile(sede_a), "b": _profile(sede_b)}


DATA_QUALITY_FIELDS = [
    "barrio", "comuna", "ciudad_nacimiento", "pais_nacimiento", "programa",
    "sexo", "tipo_inscripcion", "sede", "facultad", "area_conocimiento",
    "institucion", "colegio", "modalidad", "tipo_programa",
]


def get_data_quality():
    conn = get_conn()
    total = conn.execute("SELECT COUNT(*) c FROM matriculados").fetchone()["c"]
    out = []
    for col in DATA_QUALITY_FIELDS:
        missing = conn.execute(
            f"SELECT COUNT(*) c FROM matriculados WHERE {col} = 'No registra'"
        ).fetchone()["c"]
        out.append({
            "campo": col,
            "faltantes": missing,
            "pct": round((missing / total) * 100, 2) if total else 0,
        })
    estrato_missing = conn.execute("SELECT COUNT(*) c FROM matriculados WHERE estrato = 0").fetchone()["c"]
    out.append({
        "campo": "estrato",
        "faltantes": estrato_missing,
        "pct": round((estrato_missing / total) * 100, 2) if total else 0,
    })
    conn.close()
    out.sort(key=lambda x: x["pct"], reverse=True)
    return {"total_registros": total, "campos": out}


def get_report_findings():
    """Genera hallazgos automáticos en lenguaje natural a partir de los datos."""
    kpis = get_kpis()
    facultades = get_counts_by("facultad", limit=1)
    sedes = get_counts_by("sede", limit=1)
    colegios = get_counts_by("colegio", limit=1)
    modalidades = get_virtuality_rate()
    genero_facultad = get_stacked_counts("facultad", "sexo")

    findings = []
    if facultades:
        pct = round((facultades[0]["total"] / kpis["total_matriculados"]) * 100, 1)
        findings.append(
            f"La facultad con mayor matrícula es {facultades[0]['label']}, con "
            f"{facultades[0]['total']:,} estudiantes ({pct}% del total).".replace(",", ".")
        )
    if sedes:
        pct = round((sedes[0]["total"] / kpis["total_matriculados"]) * 100, 1)
        findings.append(
            f"La sede {sedes[0]['label']} concentra la mayor matrícula, con {pct}% del total de estudiantes."
        )
    findings.append(
        f"El {kpis['pct_femenino']}% de los matriculados son mujeres y el {kpis['pct_masculino']}% hombres."
    )
    if modalidades:
        top_mod = max(modalidades, key=lambda m: m["total"])
        findings.append(f"La modalidad predominante es {top_mod['label']}, con {top_mod['pct']}% de la matrícula.")
    if colegios and colegios[0]["label"] != "No registra":
        findings.append(
            f"El colegio que más estudiantes aporta a la institución es {colegios[0]['label']}, "
            f"con {colegios[0]['total']} matriculados."
        )

    # Facultad con mayor brecha de género
    by_fac = {}
    for row in genero_facultad:
        by_fac.setdefault(row["grp"], {})[row["stack"]] = row["total"]
    brechas = []
    for fac, d in by_fac.items():
        total_fac = sum(d.values())
        if total_fac < 30:
            continue
        fem_pct = (d.get("Femenino", 0) / total_fac) * 100
        brechas.append((fac, fem_pct, total_fac))
    if brechas:
        brechas.sort(key=lambda x: abs(x[1] - 50), reverse=True)
        fac, fem_pct, _ = brechas[0]
        genero_dom = "mujeres" if fem_pct > 50 else "hombres"
        pct_dom = round(fem_pct if fem_pct > 50 else 100 - fem_pct, 1)
        findings.append(
            f"La mayor brecha de género se da en {fac.replace('Facultad de ', '')}, "
            f"donde el {pct_dom}% de los matriculados son {genero_dom}."
        )

    return {"kpis": kpis, "hallazgos": findings}


def get_next_consecutivo():
    conn = get_conn()
    row = conn.execute("SELECT MAX(consecutivo) m FROM matriculados").fetchone()
    conn.close()
    return (row["m"] or 0) + 1


def insert_record(record: dict):
    """Inserta un nuevo matriculado en la base de datos."""
    conn = get_conn()
    cols = list(record.keys())
    placeholders = ", ".join(["?"] * len(cols))
    conn.execute(
        f"INSERT INTO matriculados ({', '.join(cols)}) VALUES ({placeholders})",
        [record[c] for c in cols],
    )
    conn.commit()
    conn.close()


def insert_records_bulk(records: list):
    if not records:
        return
    conn = get_conn()
    cols = list(records[0].keys())
    placeholders = ", ".join(["?"] * len(cols))
    conn.executemany(
        f"INSERT INTO matriculados ({', '.join(cols)}) VALUES ({placeholders})",
        [[r[c] for c in cols] for r in records],
    )
    conn.commit()
    conn.close()
