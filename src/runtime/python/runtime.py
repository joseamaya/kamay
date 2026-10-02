import json

from js import __kamay_emit, __kamay_registrar


def _emit(command):
    __kamay_emit(json.dumps(command))


def registrar(kind, source, handler):
    __kamay_registrar(kind, source, handler)


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
