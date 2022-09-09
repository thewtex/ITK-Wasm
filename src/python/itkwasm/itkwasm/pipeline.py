from pathlib import Path
from typing import List, Union, Optional
from enum import Enum
from dataclasses import dataclass

from wasmer import engine, wasi, Store, Module, ImportObject, Instance
from wasmer_compiler_cranelift import Compiler

from .image import Image
from .mesh import Mesh

class InterfaceTypes(Enum):
    TextFile = 'InterfaceTextFile'
    BinaryFile = 'InterfaceBinaryFile'
    TextStream = 'InterfaceTextStream'
    BinaryStream = 'InterfaceBinaryStream'
    Image = 'InterfaceImage'
    Mesh = 'InterfaceMesh'
    PolyData = 'InterfacePolyData'

@dataclass
class TextFile:
    path: str

@dataclass
class BinaryFile:
    path: str

@dataclass
class TextStream:
    data: str

@dataclass
class BinaryStream:
    data: bytes

@dataclass
class PipelineInput:
    type: InterfaceTypes
    data: Union[str, bytes, Image, Mesh, TextFile, BinaryFile, TextStream, BinaryStream]
    path: Optional[str] = None

class Pipeline:
    """Run an itk-wasm WASI pipeline."""

    def __init__(self, pipeline: Union[str, Path, bytes]):
        """Compile the pipeline."""
        self.engine = engine.Universal(Compiler)
        if isinstance(pipeline, bytes):
            wasm_bytes = pipeline
        else:
            with open(pipeline, 'rb') as fp:
                wasm_bytes = fp.read()
        self.store = Store(self.engine)
        self.module = Module(self.store, wasm_bytes)
        self.wasi_version = wasi.get_version(self.module, strict=True)

    def run(self, args: List[str], outputs=[], inputs=[], preopen_directories=[], map_directories={}, environments={}):
        """Run the itk-wasm pipeline."""

        wasi_state = wasi.StateBuilder('itk-wasm-pipeline')
        wasi_state.arguments(args)
        wasi_state.environments(environments)
        wasi_state.map_directories(map_directories)
        wasi_state.preopen_directories(preopen_directories)
        wasi_env = wasi_state.finalize()
        import_object = wasi_env.generate_import_object(self.store, self.wasi_version)

        instance = Instance(self.module, import_object)

        for input_ in inputs:
            if input_['type'] is InterfaceTypes.TextFile:
                data_array = input_['data']

        start = instance.exports._start
        start()
