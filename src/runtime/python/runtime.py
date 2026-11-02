import inspect
import json

from js import __kamay_emit


def _emit(command):
    __kamay_emit(json.dumps(command))


def _object_name(self):
    return getattr(self, "_kamay_name", type(self).__name__.lower())


def _public_attributes(self):
    result = {}
    for key, value in list(vars(self).items()):
        if key.startswith("_") or callable(value):
            continue
        if isinstance(value, (bool, int, float, str)):
            result[key] = value
    return result


def _report_state(self, name, value):
    object.__setattr__(self, name, value)
    # Report public data attributes so the app can react to state changes.
    if name.startswith("_") or callable(value):
        return
    if isinstance(value, (bool, int, float, str)):
        _emit({"type": "state", "target": _object_name(self), "name": name, "value": value})


def _wrap_method(name, method):
    try:
        parameters = [item for item in inspect.signature(method).parameters if item != "self"]
    except (TypeError, ValueError):
        parameters = []

    def wrapped(self, *args, **kwargs):
        object_name = _object_name(self)
        reported = {}
        for index, value in enumerate(args):
            key = parameters[index] if index < len(parameters) else str(index)
            if isinstance(value, (bool, int, float, str)):
                reported[key] = value
        for key, value in kwargs.items():
            if isinstance(value, (bool, int, float, str)):
                reported[key] = value
        _emit(
            {
                "type": "call",
                "id": object_name,
                "name": object_name,
                "className": type(self).__name__,
                "method": name,
                "args": reported,
            }
        )
        try:
            return method(self, *args, **kwargs)
        finally:
            _emit({"type": "return", "id": object_name, "method": name})

    return wrapped


def preparar(cls):
    """Wires a student class to the runtime: object identity and lifecycle events.

    Student classes have no base; the runtime injects the little it needs so the
    generated code stays a plain domain model. Created, call and return events
    mirror the TypeScript simulator without touching the generated Python.
    """
    if cls.__dict__.get("_kamay_listo", False):
        return cls

    original_init = cls.__dict__.get("__init__")

    def __init__(self, name=None, *args, **kwargs):
        first = not hasattr(self, "_kamay_name")
        if first:
            self._kamay_name = name if name is not None else cls.__name__.lower()
        if original_init is not None:
            original_init(self, name, *args, **kwargs)
        if first:
            object_name = _object_name(self)
            _emit(
                {
                    "type": "created",
                    "id": object_name,
                    "name": object_name,
                    "className": type(self).__name__,
                    "attributes": _public_attributes(self),
                }
            )

    cls.__init__ = __init__

    for method_name, method in list(cls.__dict__.items()):
        if method_name.startswith("_") or not callable(method):
            continue
        setattr(cls, method_name, _wrap_method(method_name, method))

    cls.__setattr__ = _report_state
    cls._kamay_listo = True
    return cls
