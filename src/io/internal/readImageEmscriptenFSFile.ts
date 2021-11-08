import Image from '../../core/Image.js'
import ImageType from '../../core/ImageType.js'
import setMatrixElement from '../../core/setMatrixElement.js'
import getMatrixElement from '../../core/getMatrixElement.js'

import imageIOComponentToJSComponent from './imageIOComponentToJSComponent.js'
import imageIOPixelTypeToJSPixelType from './imageIOPixelTypeToJSPixelType.js'

import ImageIOBaseEmscriptenModule from './ImageIOBaseEmscriptenModule.js'

function readImageEmscriptenFSFile (imageModule: ImageIOBaseEmscriptenModule, filePath: string): Image {
  const imageIO = new imageModule.ITKImageIO()
  imageIO.SetFileName(filePath)
  if (!imageIO.CanReadFile(filePath)) {
    throw new Error('Could not read file: ' + filePath)
  }
  imageIO.ReadImageInformation()

  const ioDimensions = imageIO.GetNumberOfDimensions()

  const ioComponentType = imageIO.GetComponentType()
  const componentType = imageIOComponentToJSComponent(imageModule, ioComponentType)
  if (componentType === null) {
    throw Error('image component type cannot be unknown / null')
  }

  const ioPixelType = imageIO.GetPixelType()
  const pixelType = imageIOPixelTypeToJSPixelType(imageModule, ioPixelType)

  const components = imageIO.GetNumberOfComponents()

  const imageType = new ImageType(ioDimensions, componentType, pixelType, components)

  const image = new Image(imageType)

  const ioDirection = new Float64Array(ioDimensions * ioDimensions)
  for (let ii = 0; ii < ioDimensions; ++ii) {
    const directionColumn = imageIO.GetDirection(ii)
    for (let jj = 0; jj < ioDimensions; ++jj) {
      setMatrixElement(ioDirection, ioDimensions, jj, ii, directionColumn.get(jj))
    }
  }

  for (let ii = 0; ii < image.imageType.dimension; ++ii) {
    if (ii < ioDimensions) {
      image.size[ii] = imageIO.GetDimensions(ii)
      image.spacing[ii] = imageIO.GetSpacing(ii)
      image.origin[ii] = imageIO.GetOrigin(ii)
      for (let jj = 0; jj < image.imageType.dimension; ++jj) {
        if (jj < ioDimensions) {
          const element = getMatrixElement(ioDirection, image.imageType.dimension, jj, ii)
          setMatrixElement(image.direction, image.imageType.dimension, jj, ii, element)
        } else {
          setMatrixElement(image.direction, image.imageType.dimension, jj, ii, 0.0)
        }
      }
    } else {
      image.size[ii] = 0
      image.spacing[ii] = 1.0
      image.origin[ii] = 0.0
      for (let jj = 0; jj < image.imageType.dimension; ++jj) {
        if (ii === jj) {
          setMatrixElement(image.direction, image.imageType.dimension, jj, ii, 1.0)
        } else {
          setMatrixElement(image.direction, image.imageType.dimension, jj, ii, 0.0)
        }
      }
    }
  }

  // Spacing is expected to be greater than 0
  // If negative, flip image direction along this axis.
  for (let ii = 0; ii < image.imageType.dimension; ++ii) {
    if (image.spacing[ii] < 0.0) {
      image.spacing[ii] = -image.spacing[ii]
      for (let jj = 0; jj < image.imageType.dimension; ++jj) {
        setMatrixElement(image.direction, image.imageType.dimension, ii, jj, -getMatrixElement(image.direction, image.imageType.dimension, ii, jj))
      }
    }
  }

  image.data = imageIO.Read()

  return image
}

export default readImageEmscriptenFSFile
