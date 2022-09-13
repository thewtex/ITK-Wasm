from pathlib import Path
from typing import List, Union, Optional, Dict
from enum import Enum
from dataclasses import dataclass
import json
import math

from wasmer import engine, wasi, Store, Module, ImportObject, Instance
from wasmer_compiler_cranelift import Compiler

from .image import Image
from .mesh import Mesh
# Todo: add PolyData

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
    data: Union[bytes | bytearray]

# Todo: add PolyData
@dataclass
class PipelineInput:
    type: InterfaceTypes
    data: Union[str, bytes, bytearray, TextFile, BinaryFile, TextStream, BinaryStream, Image, Mesh, ]
    path: Optional[str] = None

# Todo: add PolyData
@dataclass
class PipelineOutput:
    type: InterfaceTypes
    data: Optional[Union[str, bytes, bytearray, TextFile, BinaryFile, TextStream, BinaryStream, Image, Mesh, ]] = None
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

        self.memory = instance.exports.memory
        self.itk_wasm_input_array_alloc = instance.exports.itk_wasm_input_array_alloc
        self.itk_wasm_input_json_alloc = instance.exports.itk_wasm_input_json_alloc

        for index, input_ in enumerate(inputs):
            # Todo: test
            if input_.type is InterfaceTypes.TextStream:
                data_array = bytearray(input_.data.data)
                array_ptr = self._set_pipeline_input_array(data_array, index, 0)
                data_json = {
                    'size': len(data_array),
                    'data': f'data:application/vnd.itk.address,0:{array_ptr}'
                }
                self._set_pipeline_input_json(data_json, index)
            # Todo: test
            elif input_.type is InterfaceTypes.BinaryStream:
                data_array = input_.data.data
                array_ptr = self._set_pipeline_input_array(data_array, index, 0)
                data_json = {
                    'size': len(data_array),
                    'data': f'data:application/vnd.itk.address,0:{array_ptr}'
                }
                self._set_pipeline_input_json(data_json, index)
            elif input_.type is InterfaceTypes.Mesh:
                mesh = input_.data
                points_ptr = self._set_pipeline_input_array(bytearray(mesh.points), index, 0)
                cells_ptr = self._set_pipeline_input_array(bytearray(mesh.cells), index, 1)
                point_data_ptr = self._set_pipeline_input_array(bytearray(mesh.pointData), index, 2)
                cell_data_ptr = self._set_pipeline_input_array(bytearray(mesh.cellData), index, 3)
                mesh_json = {
                    'meshType': mesh.meshType,
                    'name': mesh.name,

                    'numberOfPoints': mesh.numberOfPoints,
                    'points': f'data:application/vnd.itk.address,0:{points_ptr}',

                    'numberOfCells': mesh.numberOfCells,
                    'cells': f'data:application/vnd.itk.address,0:{cells_ptr}',
                    'cellBufferSize': mesh.cellBufferSize,

                    'numberOfPointPixels': mesh.numberOfPointPixels,
                    'pointData': f'data:application/vnd.itk.address,0:{point_data_ptr}',

                    'numberOfCellPixels': mesh.numberOfCellPixels,
                    'cellData': f'data:application/vnd.itk.address,0:{cell_data_ptr}',
                }
                self._set_pipeline_input_json(mesh_json, index)
            else:
                raise NotImplementedError('Pipeline input interface type is not yet supported')

        start = instance.exports._start
        start()

    def _set_pipeline_input_array(self, data_array: Optional[Union[bytes, bytearray]], input_index: int, sub_index: int) -> int:
        data_ptr = 0
        if (data_array is not None):
            print(self.memory.data_size)
            print(self.memory.size)
            print(len(data_array))
            self.memory.grow(math.ceil(len(data_array)/65536))
            data_ptr = self.itk_wasm_input_array_alloc(0, input_index, sub_index, len(data_array))
            mem_view = bytearray(self.memory.buffer)
            mem_view[data_ptr:data_ptr + len(data_array)] = data_array
        return data_ptr

    def _set_pipeline_input_json(self, data_object: Dict, index: int) -> None:
        data_json = json.dumps(data_object)
        data_json_array = bytearray(data_json)
        json_ptr = self.itk_wasm_input_json_alloc(0, index, len(data_json_array))
        mem_view = bytearray(self.memory.buffer)
        mem_view[json_ptr:json_ptr + len(data_json_array)] = data_json_array

