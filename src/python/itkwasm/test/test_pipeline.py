from itkwasm import Pipeline, InterfaceTypes, PipelineInput, PipelineOutput, Mesh
import itk

from pathlib import Path

test_input_dir = Path(__file__).resolve().parent / 'input'


def test_stdout_stderr():
    pipeline = Pipeline(test_input_dir / 'stdout-stderr-test.wasi.wasm')
    pipeline.run([])

def test_pipeline_bytes():
    pipeline_path = test_input_dir / 'stdout-stderr-test.wasi.wasm'
    with open(pipeline_path, 'rb') as fp:
        wasm_bytes = fp.read()
    pipeline = Pipeline(wasm_bytes)
    pipeline.run([])

def test_mesh_read_write():
    pipeline = Pipeline(test_input_dir / 'mesh-read-write-test.wasi.wasm')

    input_mesh_file = test_input_dir / 'cow.vtk'
    itk_mesh = itk.meshread(input_mesh_file)

    itk_mesh_dict = itk.dict_from_mesh(itk_mesh)
    itkwasm_mesh = Mesh(**itk_mesh_dict)

    args = ['0', '0', '--memory-io']
    outputs = [
      PipelineOutput(type=InterfaceTypes.Mesh)
    ]
    inputs = [
      PipelineInput(type=InterfaceTypes.Mesh, data=itkwasm_mesh)
    ]
    pipeline.run(args, outputs, inputs)
    # const { outputs, webWorker: pipelineWorker } = await runPipeline(null, pipelinePath, args, desiredOutputs, inputs)
    # pipelineWorker.terminate()
    # verifyMesh(outputs[0].data)