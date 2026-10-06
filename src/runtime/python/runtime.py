import json

from js import __kamay_emit, __kamay_registrar
from pyodide.ffi import create_proxy


def _emit(command):
    __kamay_emit(json.dumps(command))


def _report_state(self, name, value):
    object.__setattr__(self, name, value)
    # Report public data attributes so the app can react to state changes.
    if name.startswith("_") or callable(value):
        return
    if isinstance(value, (bool, int, float, str)):
        _emit({"type": "state", "target": self._kamay_name, "name": name, "value": value})


def registrar(kind, source, handler):
    # Keep the handler alive beyond the call (borrowed proxies are auto-destroyed).
    __kamay_registrar(kind, source, create_proxy(handler))


def preparar(cls):
    """Wires a student class to the runtime: object identity and state reporting.

    Student classes have no base; the runtime injects the little it needs so the
    generated code stays a plain domain model.
    """
    if getattr(cls, "_kamay_listo", False):
        return cls

    original_init = cls.__dict__.get("__init__")

    def __init__(self, name=None, *args, **kwargs):
        if not hasattr(self, "_kamay_name"):
            self._kamay_name = name if name is not None else cls.__name__.lower()
        if original_init is not None:
            original_init(self, name, *args, **kwargs)

    cls.__init__ = __init__
    cls.__setattr__ = _report_state
    cls._kamay_listo = True
    return cls
