import test from 'tape'
import axios from 'axios'

import { IntTypes, PixelTypes, readImageFile, WorkerPool, stackImages, imageSharedBufferOrCopy, runPipelineBrowser, IOTypes } from 'browser/index.js'

export default function () {

test('WorkerPool runs and reports progress', async (t) => {
  const verifyImage = (image) => {
    t.is(image.imageType.dimension, 2, 'dimension')
    t.is(image.imageType.componentType, IntTypes.UInt8, 'componentType')
    t.is(image.imageType.pixelType, PixelTypes.Scalar, 'pixelType')
    t.is(image.imageType.components, 1, 'components')
    t.is(image.origin[0], 0.0, 'origin[0]')
    t.is(image.origin[1], 0.0, 'origin[1]')
    t.is(image.spacing[0], 1.0, 'spacing[0]')
    t.is(image.spacing[1], 1.0, 'spacing[1]')
    t.is(image.size[0], 256, 'size[0]')
    t.is(image.size[1], 256, 'size[1]')
    t.is(image.data.byteLength, 65536, 'data.byteLength')
    t.end()
  }

  const progressUpdates = []
  let reportedTotalSplits = null
  function progressLogger (split, totalSplits) {
    progressUpdates.push(split)
    reportedTotalSplits = totalSplits
  }

  const poolSize = 2
  const maxTotalSplits = 4
  const workerPool = new WorkerPool(poolSize, runPipelineBrowser)

  const fileName = 'cthead1.png'
  const testFilePath = 'base/build/ExternalData/test/Input/' + fileName
  const response = await axios.get(testFilePath, { responseType: 'blob' })
  const jsFile = await new window.File([response.data], fileName)
  const { image, webWorker } = await readImageFile(null, jsFile)
  webWorker.terminate()

  const taskArgsArray = []
  for (let index = 0; index < maxTotalSplits; index++) {
    const pipelinePath = 'MedianFilterTest'
    const args = ['cthead1.png.json', 'cthead1.png.shrink.json', '4', '' + maxTotalSplits, '' + index]
    const desiredOutputs = [
      { path: args[1], type: IOTypes.Image }
    ]
    const data = imageSharedBufferOrCopy(image)
    const inputs = [
      { path: args[0], type: IOTypes.Image, data }
    ]
    taskArgsArray.push([pipelinePath, args, desiredOutputs, inputs])
  }

  const results = await workerPool.runTasks(taskArgsArray, progressLogger).promise
  workerPool.terminateWorkers()

  t.is(reportedTotalSplits, maxTotalSplits, 'reported total splits')
  const imageSplits = results.map(({ outputs }) => outputs[0].data)
  const stackedImage = stackImages(imageSplits)

  verifyImage(stackedImage)
})

}
