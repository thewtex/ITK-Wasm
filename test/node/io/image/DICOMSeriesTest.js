import test from 'ava'
import path from 'path'
import glob from 'glob'

import { IntTypes, PixelTypes, getMatrixElement, readImageLocalDICOMFileSeries } from '../../../../dist/index.js'

const testSeriesDirectory = path.resolve('build-emscripten', 'ExternalData', 'test', 'Input', 'DicomImageOrientationTest')
const testFiles = glob.sync(`${testSeriesDirectory}/*.dcm`)

function verifyImage (t, image, expectedComponentType, expectedPixelType) {
  let componentType = IntTypes.Int16
  if (expectedComponentType) {
    componentType = expectedComponentType
  }
  let pixelType = PixelTypes.Scalar
  if (expectedPixelType) {
    pixelType = expectedPixelType
  }
  t.is(image.imageType.dimension, 3, 'dimension')
  t.is(image.imageType.componentType, componentType, 'componentType')
  t.is(image.imageType.pixelType, pixelType, 'pixelType')
  t.is(image.imageType.components, 1, 'components')
  t.is(image.origin[0], -17.3551, 'origin[0]')
  t.is(image.origin[1], -133.9286, 'origin[1]')
  t.is(image.origin[2], 116.7857, 'origin[2]')
  t.is(image.spacing[0], 1.0, 'spacing[0]')
  t.is(image.spacing[1], 1.0, 'spacing[1]')
  t.is(image.spacing[2], 1.3000000000000007, 'spacing[2]')
  t.is(getMatrixElement(image.direction, 3, 0, 0), 0.0, 'direction (0, 0)')
  t.is(getMatrixElement(image.direction, 3, 0, 1), 0.0, 'direction (0, 1)')
  t.is(getMatrixElement(image.direction, 3, 0, 2), -1.0, 'direction (0, 2)')
  t.is(getMatrixElement(image.direction, 3, 1, 0), 1.0, 'direction (1, 0)')
  t.is(getMatrixElement(image.direction, 3, 1, 1), 0.0, 'direction (1, 1)')
  t.is(getMatrixElement(image.direction, 3, 1, 2), 0.0, 'direction (1, 2)')
  t.is(getMatrixElement(image.direction, 3, 2, 0), 0.0, 'direction (2, 0)')
  t.is(getMatrixElement(image.direction, 3, 2, 1), -1.0, 'direction (2, 1)')
  t.is(getMatrixElement(image.direction, 3, 2, 2), 0.0, 'direction (2, 2)')
  t.is(image.size[0], 256, 'size[0]')
  t.is(image.size[1], 256, 'size[1]')
  t.is(image.size[2], 3, 'size[2]')
  t.is(image.data.length, 3 * 65536, 'data.length')
  t.is(image.data[1000], 5, 'data[1000]')
}

test('Test reading a DICOM file', async t => {
  const image = await readImageLocalDICOMFileSeries(testFiles)
  verifyImage(t, image)
})

test('Test reading a DICOM file, given componentType, pixelType', async t => {
  const componentType = IntTypes.Int32
  const pixelType = PixelTypes.Vector
  const image = await readImageLocalDICOMFileSeries(testFiles, { componentType, pixelType })
  verifyImage(t, image, componentType, pixelType)
})

test('Test reading a DICOM file assume sorted', async t => {
  const singleSortedSeries = true
  const image = await readImageLocalDICOMFileSeries(testFiles.sort(), { singleSortedSeries })
  verifyImage(t, image)
})

test('Test reading a DICOM file assume sorted, given componentType, pixelType', async t => {
  const singleSortedSeries = true
  const componentType = IntTypes.Int32
  const pixelType = PixelTypes.Vector
  const image = await readImageLocalDICOMFileSeries(testFiles.sort(), { singleSortedSeries, componentType, pixelType })
  verifyImage(t, image, componentType, pixelType)
})
