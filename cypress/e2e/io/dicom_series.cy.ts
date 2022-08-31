// import { IntTypes, PixelTypes, getMatrixElement, readImageDICOMFileSeries, readImageDICOMArrayBufferSeries } from '../../../dist/browser/index.js'

import { readImageDICOMFileSeries } from "../../../dist/browser"

const testSeriesDirectory = 'build-emscripten/ExternalData/test/Input/DicomImageOrientationTest/'
const fileNames = ['ImageOrientation.1.dcm', 'ImageOrientation.2.dcm', 'ImageOrientation.3.dcm']

/*
function verifyImage (t, image) {
  t.is(image.imageType.dimension, 3, 'dimension')
  t.is(image.imageType.componentType, IntTypes.Int16, 'componentType')
  t.is(image.imageType.pixelType, PixelTypes.Scalar, 'pixelType')
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
  t.end()
}

export default function () {
  test('Test reading DICOM file series', t => {
    const fetchFiles = fileNames.map(function (file) {
      const path = testSeriesDirectory + file
      return axios.get(path, { responseType: 'blob' }).then(function (response) {
        const jsFile = new window.File([response.data], file)
        return jsFile
      })
    })

    return Promise.all(fetchFiles)
      .then(function (files) {
        return readImageDICOMFileSeries(files)
      })
      .then(function ({ image, webWorkerPool }) {
        webWorkerPool.terminateWorkers()
        verifyImage(t, image)
      })
  })

  test('Test reading DICOM file series, assume a single sorted series', t => {
    const fetchFiles = fileNames.map(function (file) {
      const path = testSeriesDirectory + file
      return axios.get(path, { responseType: 'blob' }).then(function (response) {
        const jsFile = new window.File([response.data], file)
        return jsFile
      })
    })

    return Promise.all(fetchFiles)
      .then(function (files) {
        const singleSortedSeries = true
        return readImageDICOMFileSeries(files, singleSortedSeries)
      })
      .then(function ({ image, webWorkerPool }) {
        webWorkerPool.terminateWorkers()
        verifyImage(t, image)
      })
  })

  test('Test reading DICOM array buffer series', async t => {
    const fetchFiles = fileNames.map(async function (file) {
      const path = testSeriesDirectory + file
      const response = await axios.get(path, { responseType: 'arraybuffer' })
      return response.data
    })

    const arrayBuffers = await Promise.all(fetchFiles)
    const { image, webWorkerPool } = await readImageDICOMArrayBufferSeries(arrayBuffers)
    webWorkerPool.terminateWorkers()
    verifyImage(t, image)
  })

  test('Test reading DICOM array buffer series, assume a single sorted series', async t => {
    const fetchFiles = fileNames.map(async function (file) {
      const path = testSeriesDirectory + file
      const response = await axios.get(path, { responseType: 'arraybuffer' })
      return response.data
    })

    const arrayBuffers = await Promise.all(fetchFiles)
    const singleSortedSeries = true
    const { image, webWorkerPool } = await readImageDICOMArrayBufferSeries(arrayBuffers, singleSortedSeries)
    webWorkerPool.terminateWorkers()
    verifyImage(t, image)
  })
}
*/

const generateFilesArray = async (win, that) => {
  const fetchFiles = fileNames.map(async function (fileName) {
    const jsFile = await new win.File([that[fileName].buffer], fileName)
    return jsFile
  })
  const files = await Promise.all(fetchFiles)
  return files
}

describe('DICOMSeries', () => {
  beforeEach(() => {
    cy.visit('/')
    fileNames.map(async (fileName) => {
      const path = testSeriesDirectory + fileName
      cy.readFile(path, null).as(fileName)
    })
  })

  it('reads a DICOM file series', function () {
    cy.window().then(async function (win) {
      const itk = win.itk
      const that = this
      const files = await generateFilesArray(win, that)

      const { image, webWorkerPool } = await itk.readImageDICOMFileSeries(files)
      webWorkerPool.terminateWorkers()
      // verifyImage(t, image)
    })
  })
})
