import registerWebworker from 'webworker-promise/lib/register'

import mimeToIO from '../MimeToImageIO'
import getFileExtension from '../getFileExtension'
import extensionToIO from '../extensionToImageIO'
import ImageIOIndex from '../ImageIOIndex'
import loadEmscriptenModule from '../loadEmscriptenModuleBrowser'

import readImageEmscriptenFSFile from '../readImageEmscriptenFSFile'
import writeImageEmscriptenFSFile from '../writeImageEmscriptenFSFile'
import readImageEmscriptenFSDICOMFileSeries from '../readImageEmscriptenFSDICOMFileSeries'

// To cache loaded io modules
let ioToModule = {}
let seriesReaderModule = null

const readImage = (input) => {
  const extension = getFileExtension(input.name)
  const mountpoint = '/work'

  let io = null
  if (mimeToIO.has(input.type)) {
    io = mimeToIO.get(input.type)
  } else if (extensionToIO.has(extension)) {
    io = extensionToIO.get(extension)
  } else {
    for (let idx = 0; idx < ImageIOIndex.length; ++idx) {
      let ioModule = null
      const trialIO = ImageIOIndex[idx]
      if (trialIO in ioToModule) {
        ioModule = ioToModule[trialIO]
      } else {
        ioToModule[trialIO] = loadEmscriptenModule(input.config.itkModulesPath, 'ImageIOs', trialIO)
        ioModule = ioToModule[trialIO]
      }
      const imageIO = new ioModule.ITKImageIO()
      const blob = new Blob([input.data])
      const blobs = [{ name: input.name, data: blob }]
      ioModule.mountBlobs(mountpoint, blobs)
      const filePath = mountpoint + '/' + input.name
      imageIO.SetFileName(filePath)
      if (imageIO.CanReadFile(filePath)) {
        io = trialIO
        ioModule.unmountBlobs(mountpoint)
        break
      }
      ioModule.unmountBlobs(mountpoint)
    }
  }
  if (io === null) {
    ioToModule = {}
    return Promise.reject(new Error('Could not find IO for: ' + input.name))
  }

  let ioModule = null
  if (io in ioToModule) {
    ioModule = ioToModule[io]
  } else {
    ioToModule[io] = loadEmscriptenModule(input.config.itkModulesPath, 'ImageIOs', io)
    ioModule = ioToModule[io]
  }

  const blob = new Blob([input.data])
  const blobs = [{ name: input.name, data: blob }]
  ioModule.callMain();
  ioModule.mountBlobs(mountpoint, blobs)
  const filePath = mountpoint + '/' + input.name
  const image = readImageEmscriptenFSFile(ioModule, filePath)
  ioModule.unmountBlobs(mountpoint)

  return new registerWebworker.TransferableResponse(image, [image.data.buffer])
}

const writeImage = (input) => {
  const extension = getFileExtension(input.name)
  const mountpoint = '/work'

  let io = null
  if (mimeToIO.has(input.type)) {
    io = mimeToIO.get(input.type)
  } else if (extensionToIO.has(extension)) {
    io = extensionToIO.get(extension)
  } else {
    for (let idx = 0; idx < ImageIOIndex.length; ++idx) {
      let ioModule = null
      const trialIO = ImageIOIndex[idx]
      if (trialIO in ioToModule) {
        ioModule = ioToModule[trialIO]
      } else {
        ioToModule[trialIO] = loadEmscriptenModule(input.config.itkModulesPath, 'ImageIOs', trialIO)
        ioModule = ioToModule[trialIO]
      }
      const imageIO = new ioModule.ITKImageIO()
      const filePath = mountpoint + '/' + input.name
      imageIO.SetFileName(filePath)
      if (imageIO.CanWriteFile(filePath)) {
        io = trialIO
        break
      }
    }
  }
  if (io === null) {
    ioToModule = {}
    return Promise.reject(new Error('Could not find IO for: ' + input.name))
  }

  let ioModule = null
  if (io in ioToModule) {
    ioModule = ioToModule[io]
  } else {
    ioToModule[io] = loadEmscriptenModule(input.config.itkModulesPath, 'ImageIOs', io)
    ioModule = ioToModule[io]
  }

  const filePath = mountpoint + '/' + input.name
  ioModule.mkdirs(mountpoint)
  writeImageEmscriptenFSFile(ioModule, input.useCompression, input.image, filePath)
  const writtenFile = ioModule.readFile(filePath, { encoding: 'binary' })

  return new registerWebworker.TransferableResponse(writtenFile.buffer, [writtenFile.buffer])
}

const readDICOMSeriesInternal = (input) => {
  seriesReaderModule.callMain();

  const blobs = input.fileDescriptions.map((fileDescription) => {
    const blob = new Blob([fileDescription.data])
    return { name: fileDescription.name, data: blob }
  })
  const mountpoint = '/work'
  seriesReaderModule.mountBlobs(mountpoint, blobs)
  const filePath = mountpoint + '/' + input.fileDescriptions[0].name
  const image = readImageEmscriptenFSDICOMFileSeries(seriesReaderModule,
    mountpoint, filePath)
  seriesReaderModule.unmountBlobs(mountpoint)

  return new registerWebworker.TransferableResponse(image, [image.data.buffer])
}

const readDICOMImageSeries = (input) => {
  const seriesReader = 'itkDICOMImageSeriesReaderJSBinding'
  if (!seriesReaderModule) {
    ITKJSModule = loadEmscriptenModule(input.config.itkModulesPath, 'ImageIOs', seriesReader)
    return ITKJSModule().then((Module) => {
      seriesReaderModule = Module
      return readDICOMSeriesInternal(input)
    })
  }

  return readDICOMSeriesInternal(input)
}

registerWebworker(function (input) {
  if (input.operation === 'readImage') {
    return Promise.resolve(readImage(input))
  } else if (input.operation === 'writeImage') {
    return Promise.resolve(writeImage(input))
  } else if (input.operation === 'readDICOMImageSeries') {
    return Promise.resolve(readDICOMImageSeries(input))
  } else {
    return Promise.resolve(new Error('Unknown worker operation'))
  }
})
