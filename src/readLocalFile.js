const path = require('path')

const getFileExtension = require('./getFileExtension.js')
const extensionToMeshIO = require('./extensionToMeshIO.js')

const readImageLocalFile = require('./readImageLocalFile.js')
const readMeshLocalFile = require('./readMeshLocalFile.js')

/**
 * Read an image or mesh from a file on the local filesystem in Node.js.
 *
 * @param: filePath path to the file on the local filesystem.
 */
const readLocalFile = (filePath) => {
  const absoluteFilePath = path.resolve(filePath)
  const extension = getFileExtension(absoluteFilePath)

  return new Promise(function (resolve, reject) {
    try {
      const isMesh = extensionToMeshIO.hasOwnProperty(extension)
      if (isMesh) {
        try {
          readMeshLocalFile(filePath).then((mesh) => {
            resolve(mesh)
          })
        } catch (err) {
          // Was a .vtk image file? Continue to read as an image.
        }
      }
      readImageLocalFile(filePath).then((image) => {
        resolve(image)
      })
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = readLocalFile
