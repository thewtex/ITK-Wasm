import IOTypes from '../../core/IOTypes.js'
import bufferToTypedArray from '../../core/bufferToTypedArray.js'
import TypedArray from '../../core/TypedArray.js'
import Image from '../../core/Image.js'
import Mesh from '../../core/Mesh.js'
import PolyData from '../../core/vtkPolyData.js'

import PipelineEmscriptenModule from '../PipelineEmscriptenModule.js'
import PipelineInput from '../PipelineInput.js'
import PipelineOutput from '../PipelineOutput.js'

let haveSharedArrayBuffer = false
// @ts-ignore: error TS2304: Cannot find name 'window'.
if (typeof window !== 'undefined') {
  // @ts-ignore: error TS2304: Cannot find name 'window'.
  haveSharedArrayBuffer = typeof window.SharedArrayBuffer === 'function'
} else {
  haveSharedArrayBuffer = typeof globalThis.SharedArrayBuffer === 'function'
}

function typedArrayForBuffer(typedArrayType: string, buffer: ArrayBuffer) {
  let TypedArrayFunction = null
  // @ts-ignore: error TS2304: Cannot find name 'window'.
  if (typeof window !== 'undefined') {
    // browser
    // @ts-ignore: erorr TS7015: Element implicitly has an 'any' type because index
    // expression is not of type 'number'.
    TypedArrayFunction = window[typedArrayType] as TypedArray
  } else {
    // Node.js
    // @ts-ignore: error TS7053: Element implicitly has an 'any' type because
    // expression of type 'string' can't be used to index type 'Global &
    // typeof globalThis'.
    TypedArrayFunction = globalThis[typedArrayType] as TypedArray
  }
  // @ts-ignore: error TS2351: This expression is not constructable.
  return new TypedArrayFunction(buffer)
}

function readFileSharedArray(emscriptenModule: PipelineEmscriptenModule, path: string): Uint8Array {
  const opts = { flags: 'r', encoding: 'binary' }
  const stream = emscriptenModule.fs_open(path, opts.flags)
  const stat = emscriptenModule.fs_stat(path)
  const length = stat.size
  let arrayBufferData = null
  if (haveSharedArrayBuffer) {
    arrayBufferData = new SharedArrayBuffer(length) // eslint-disable-line
  } else {
    arrayBufferData = new ArrayBuffer(length)
  }
  const array = new Uint8Array(arrayBufferData)
  emscriptenModule.fs_read(stream, array, 0, length, 0)
  emscriptenModule.fs_close(stream)
  return array
}

function runPipelineEmscripten(pipelineModule: PipelineEmscriptenModule, args: string[], outputs: PipelineOutput[], inputs: PipelineInput[]) {
  if (inputs) {
    inputs.forEach(function (input) {
      switch (input.type) {
        case IOTypes.Text:
        {
          pipelineModule.fs_writeFile(input.path, input.data as string)
          break
        }
        case IOTypes.Binary:
        {
          pipelineModule.fs_writeFile(input.path, input.data as Uint8Array)
          break
        }
        case IOTypes.Image:
        {
          const image = input.data as Image
          const imageJSON = {
            imageType: image.imageType,
            name: image.name,
            origin: image.origin,
            spacing: image.spacing,
            direction: image.direction,
            size: image.size,
            data: input.path + '.data',
          }
          pipelineModule.fs_writeFile(input.path, JSON.stringify(imageJSON))
          if (image.data === null) {
            throw Error('image.data is null')
          }
          pipelineModule.fs_writeFile(imageJSON.data, image.data)
          break
        }
        case IOTypes.Mesh:
        {
          const mesh = input.data as Mesh
          const meshJSON = {
            meshType: mesh.meshType,
            name: mesh.name,

            numberOfPoints: mesh.numberOfPoints,
            points: input.path + '.points.data',

            numberOfPointPixels: mesh.numberOfPointPixels,
            pointData: input.path + '.pointData.data',

            numberOfCells: mesh.numberOfCells,
            cells: input.path + '.cells.data',

            numberOfCellPixels: mesh.numberOfCellPixels,
            cellData: input.path + '.cellData.data',
            cellBufferSize: mesh.cellBufferSize,

          }
          console.log('meshJSON', meshJSON)
          pipelineModule.fs_writeFile(input.path, JSON.stringify(meshJSON))
          if (meshJSON.numberOfPoints) {
            if (mesh.points === null) {
              throw Error('mesh.points is null')
            }
            pipelineModule.fs_writeFile(meshJSON.points, mesh.points)
          }
          if (meshJSON.numberOfPointPixels) {
            if (mesh.pointData === null) {
              throw Error('mesh.pointData is null')
            }
            pipelineModule.fs_writeFile(meshJSON.pointData, mesh.pointData)
          }
          if (meshJSON.numberOfCells) {
            if (mesh.cells === null) {
              throw Error('mesh.cells is null')
            }
            pipelineModule.fs_writeFile(meshJSON.cells, mesh.cells)
          }
          if (meshJSON.numberOfCellPixels) {
            if (mesh.cellData === null) {
              throw Error('mesh.cellData is null')
            }
            pipelineModule.fs_writeFile(meshJSON.cellData, mesh.cellData)
          }
          break
        }
        default:
          throw Error('Unsupported input IOType')
      }
    })
  }

  pipelineModule.resetModuleStdout()
  pipelineModule.resetModuleStderr()
  try {
    pipelineModule.callMain(args)
  } catch (exception) {
    // Note: Module must be built with CMAKE_BUILD_TYPE set to Debug.
    // e.g.: itk-js build my/project -- -DCMAKE_BUILD_TYPE:STRING=Debug
    if (typeof exception === 'number') {
      console.log('Exception while running pipeline:')
      console.log('stdout:', pipelineModule.getModuleStdout())
      console.error('stderr:', pipelineModule.getModuleStderr())
      console.error('exception:', pipelineModule.getExceptionMessage(exception))
    }
    throw exception
  }
  const stdout = pipelineModule.getModuleStdout()
  const stderr = pipelineModule.getModuleStderr()
  console.log('stdout,stderr', stdout, stderr)

  const populatedOutputs: PipelineOutput[] = []
  if (outputs) {
    outputs.forEach(function (output) {
      let outputData: any = null
      switch (output.type) {
        case IOTypes.Text:
        {
          outputData = pipelineModule.fs_readFile(output.path, { encoding: 'utf8' }) as string
          break
        }
        case IOTypes.Binary:
        {
          outputData = readFileSharedArray(pipelineModule, output.path) as Uint8Array
          break
        }
        case IOTypes.Image:
        {
          const imageJSON = pipelineModule.fs_readFile(output.path, { encoding: 'utf8' }) as string
          const image = JSON.parse(imageJSON)
          const dataUint8 = readFileSharedArray(pipelineModule, image.data as string)
          image.data = bufferToTypedArray(image.imageType.componentType, dataUint8.buffer)
          outputData = image as Image
          break
        }
        case IOTypes.Mesh:
        {
          // debugger
          const meshJSON = pipelineModule.fs_readFile(output.path, { encoding: 'utf8' }) as string
          const mesh = JSON.parse(meshJSON)
          if (mesh.numberOfPoints) {
            const dataUint8Points = readFileSharedArray(pipelineModule, mesh.points)
            mesh.points = bufferToTypedArray(mesh.meshType.pointComponentType, dataUint8Points.buffer)
          } else {
            mesh.points = bufferToTypedArray(mesh.meshType.pointComponentType, new ArrayBuffer(0))
          }
          if (mesh.numberOfPointPixels) {
            const dataUint8PointData = readFileSharedArray(pipelineModule, mesh.pointData)
            mesh.pointData = bufferToTypedArray(mesh.meshType.pointPixelComponentType, dataUint8PointData.buffer)
          } else {
            mesh.pointData = bufferToTypedArray(mesh.meshType.pointPixelComponentType, new ArrayBuffer(0))
          }
          if (mesh.numberOfCells) {
            const dataUint8Cells = readFileSharedArray(pipelineModule, mesh.cells)
            mesh.cells = bufferToTypedArray(mesh.meshType.cellComponentType, dataUint8Cells.buffer)
          } else {
            mesh.cells = bufferToTypedArray(mesh.meshType.cellComponentType, new ArrayBuffer(0))
          }
          if (mesh.numberOfCellPixels) {
            const dataUint8CellData = readFileSharedArray(pipelineModule, mesh.cellData)
            mesh.cellData = bufferToTypedArray(mesh.meshType.cellPixelComponentType, dataUint8CellData.buffer)
          } else {
            mesh.cellData = bufferToTypedArray(mesh.meshType.cellPixelComponentType, new ArrayBuffer(0))
          }
          outputData = mesh as Mesh
          break
        }
        case IOTypes.vtkPolyData:
        {
          const polyDataJSON = pipelineModule.fs_readFile(`${output.path}/index.json`, { encoding: 'utf8' }) as string
          const polyData = JSON.parse(polyDataJSON)
          const cellTypes = ['points', 'verts', 'lines', 'polys', 'strips']
          cellTypes.forEach((cellName) => {
            if (polyData[cellName]) {
              const cell = polyData[cellName]
              if (cell.ref) {
                const dataUint8 = readFileSharedArray(pipelineModule, `${output.path}/${cell.ref.basepath}/${cell.ref.id}`)
                polyData[cellName].buffer = dataUint8.buffer
                polyData[cellName].values = typedArrayForBuffer(polyData[cellName].dataType, dataUint8.buffer)
                delete cell.ref
              }
            }
          })

          const dataSetType = ['pointData', 'cellData', 'fieldData']
          dataSetType.forEach((dataName) => {
            if (polyData[dataName]) {
              const data = polyData[dataName]
              data.arrays.forEach((array: { data: { ref?: { basepath: string, id: string }, buffer: ArrayBuffer, values: TypedArray, dataType: string }}) => {
                if (array.data.ref) {
                  const dataUint8 = readFileSharedArray(pipelineModule, `${output.path}/${array.data.ref.basepath}/${array.data.ref.id}`)
                  array.data.buffer = dataUint8.buffer
                  array.data.values = typedArrayForBuffer(array.data.dataType, dataUint8.buffer)
                  delete array.data.ref
                }
              })
            }
          })
          outputData = polyData as PolyData
          break
        }
        default:
          throw Error('Unsupported output IOType')
      }
      const populatedOutput = {
        path: output.path,
        type: output.type,
        data: outputData,
      }
      populatedOutputs.push(populatedOutput)
    })
  }

  return { stdout, stderr, outputs: populatedOutputs }
}

export default runPipelineEmscripten
