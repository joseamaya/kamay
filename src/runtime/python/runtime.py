import json

from js import __kamay_emit, __kamay_registrar
from pyodide.ffi import create_proxy


def _emit(command):
    __kamay_emit(json.dumps(command))


_signals = {}


def registrar(kind, source, handler):
    # Signals stay in Python: emitir() dispatches to them without a round trip.
    if kind == "signal":
        _signals.setdefault(source, []).append(handler)
        return
    # Keep the handler alive beyond the call (borrowed proxies are auto-destroyed).
    __kamay_registrar(kind, source, create_proxy(handler))


def _emitir_signal(nombre):
    for handler in list(_signals.get(str(nombre), [])):
        handler()


class Actor:
    """Base class for every object the student creates."""

    def __init__(self, name=None):
        self._kamay_name = name or "actor"

    def decir(self, mensaje):
        _emit({"type": "say", "target": self._kamay_name, "message": str(mensaje)})

    def mover(self, x, y):
        _emit({"type": "move", "target": self._kamay_name, "x": float(x), "y": float(y)})

    def girar(self, grados):
        _emit({"type": "rotate", "target": self._kamay_name, "degrees": float(grados)})

    def cambiar_escala(self, factor):
        _emit({"type": "scale", "target": self._kamay_name, "factor": float(factor)})

    def esperar(self, segundos):
        _emit({"type": "wait", "seconds": float(segundos)})

    def emitir(self, nombre):
        _emitir_signal(nombre)
