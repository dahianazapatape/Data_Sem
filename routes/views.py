# -*- coding: utf-8 -*-
from flask import Blueprint, render_template

from config import APP_NAME, APP_SUBTITLE, PALETTE

views_bp = Blueprint("views", __name__)

COMMON_CTX = {
    "app_name": APP_NAME,
    "app_subtitle": APP_SUBTITLE,
    "palette": PALETTE,
}


@views_bp.route("/")
def dashboard():
    return render_template("dashboard.html", active="dashboard", **COMMON_CTX)


@views_bp.route("/mapa")
def mapa():
    return render_template("mapa.html", active="mapa", **COMMON_CTX)


@views_bp.route("/estadisticas")
def estadisticas():
    return render_template("estadisticas.html", active="estadisticas", **COMMON_CTX)


@views_bp.route("/analitica")
def analitica():
    return render_template("analitica.html", active="analitica", **COMMON_CTX)


@views_bp.route("/comparador")
def comparador():
    return render_template("comparador.html", active="comparador", **COMMON_CTX)


@views_bp.route("/reporte")
def reporte():
    return render_template("reporte.html", active="reporte", **COMMON_CTX)


@views_bp.route("/anadir-datos")
def anadir_datos():
    return render_template("anadir_datos.html", active="anadir_datos", **COMMON_CTX)


@views_bp.route("/buscador")
def buscador():
    return render_template("buscador.html", active="buscador", **COMMON_CTX)


@views_bp.route("/configuracion")
def configuracion():
    return render_template("configuracion.html", active="configuracion", **COMMON_CTX)
