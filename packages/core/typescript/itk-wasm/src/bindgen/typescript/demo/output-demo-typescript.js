import camelCase from "../../camel-case.js"

function outputDemoTypeScript(functionName, prefix, indent, parameter) {
  const parameterName = camelCase(parameter.name)
  let result = '\n'

  switch(parameter.type) {
    case 'OUTPUT_TEXT_FILE':
    case 'OUTPUT_TEXT_FILE:FILE':
    case 'OUTPUT_TEXT_STREAM': {
      result += `${prefix}${indent}const ${parameterName}OutputDownload = document.querySelector('#${functionName}Outputs sl-button[name=${parameter.name}-download]')\n`
      result += `${prefix}${indent}${parameterName}OutputDownload.addEventListener('click', (event) => {\n`
      result += `${prefix}${indent}${indent}event.preventDefault()\n`
      result += `${prefix}${indent}${indent}event.stopPropagation()\n`
      result += `${prefix}${indent}${indent}if (model.outputs.has("${parameterName}")) {\n`
      const textDataProp = parameter.type.includes('FILE') ? '.data' : ''
      if (parameter.itemsExpectedMax > 1) {
        const downloadFileName = parameter.type.includes('FILE') ? `o.path`: `"${parameterName}.txt"`
        result += `${prefix}${indent}${indent}${indent}model.outputs.get("${parameterName}").forEach((o) => globalThis.downloadFile(new TextEncoder().encode(o${textDataProp}), ${downloadFileName}))\n`
      } else {
        const downloadFileName = parameter.type.includes('FILE') ? `model.outputs.get("${parameterName}").path`: `"${parameterName}.txt"`
        result += `${prefix}${indent}${indent}${indent}globalThis.downloadFile(new TextEncoder().encode(model.outputs.get("${parameterName}")${textDataProp}), ${downloadFileName})\n`
      }
      result += `${prefix}${indent}${indent}}\n`
      result += `${prefix}${indent}})\n`
    }
      break
    case 'OUTPUT_BINARY_FILE':
    case 'OUTPUT_BINARY_FILE:FILE':
    case 'OUTPUT_BINARY_STREAM': {
      result += `${prefix}${indent}const ${parameterName}OutputDownload = document.querySelector('#${functionName}Outputs sl-button[name=${parameter.name}-download]')\n`
      result += `${prefix}${indent}${parameterName}OutputDownload.addEventListener('click', (event) => {\n`
      result += `${prefix}${indent}${indent}event.preventDefault()\n`
      result += `${prefix}${indent}${indent}event.stopPropagation()\n`
      result += `${prefix}${indent}${indent}if (model.outputs.has("${parameterName}")) {\n`
      const binaryDataProp = parameter.type.includes('FILE') ? '.data' : ''
      if (parameter.itemsExpectedMax > 1) {
        const downloadFileName = parameter.type.includes('FILE') ? `o.path`: `"${parameterName}.bin"`
        result += `${prefix}${indent}${indent}${indent}model.outputs.get("${parameterName}").forEach((o) => globalThis.downloadFile(o${binaryDataProp}, ${downloadFileName}))\n`
      } else {
        const downloadFileName = parameter.type.includes('FILE') ? `model.outputs.get("${parameterName}").path`: `"${parameterName}.bin"`
        result += `${prefix}${indent}${indent}${indent}globalThis.downloadFile(model.outputs.get("${parameterName}")${binaryDataProp}, ${downloadFileName})\n`
      }
      result += `${prefix}${indent}${indent}}\n`
      result += `${prefix}${indent}})\n`
    }
      break
    case 'OUTPUT_JSON':
      result += `${prefix}${indent}const ${parameterName}OutputDownload = document.querySelector('#${functionName}Outputs sl-button[name=${parameter.name}-download]')\n`
      result += `${prefix}${indent}${parameterName}OutputDownload.addEventListener('click', async (event) => {\n`
      result += `${prefix}${indent}${indent}event.preventDefault()\n`
      result += `${prefix}${indent}${indent}event.stopPropagation()\n`
      result += `${prefix}${indent}${indent}if (model.outputs.has("${parameterName}")) {\n`
      result += `${prefix}${indent}${indent}${indent}const fileName = \`${parameterName}.json\`\n`
      result += `${prefix}${indent}${indent}${indent}globalThis.downloadFile(new TextEncoder().encode(JSON.stringify(model.outputs.get("${parameterName}"))), fileName)\n`
      result += `${prefix}${indent}${indent}}\n`
      result += `${prefix}${indent}})\n`
      break
    case 'OUTPUT_IMAGE':
      result += `${prefix}${indent}const ${parameterName}OutputDownload = document.querySelector('#${functionName}Outputs sl-button[name=${parameter.name}-download]')\n`
      result += `${prefix}${indent}${parameterName}OutputDownload.addEventListener('click', async (event) => {\n`
      result += `${prefix}${indent}${indent}event.preventDefault()\n`
      result += `${prefix}${indent}${indent}event.stopPropagation()\n`
      result += `${prefix}${indent}${indent}if (model.outputs.has("${parameterName}")) {\n`
      result += `${prefix}${indent}${indent}${indent}const ${parameterName}DownloadFormat = document.getElementById('${parameter.name}-output-format')\n`
      result += `${prefix}${indent}${indent}${indent}const downloadFormat = ${parameterName}DownloadFormat.value || 'nrrd'\n`
      result += `${prefix}${indent}${indent}${indent}const fileName = \`${parameterName}.\${downloadFormat}\`\n`
      result += `${prefix}${indent}${indent}${indent}const { webWorker, serializedImage } = await writeImage(null, copyImage(model.outputs.get("${parameterName}")), fileName)\n\n`
      result += `${prefix}${indent}${indent}${indent}webWorker.terminate()\n`
      result += `${prefix}${indent}${indent}${indent}globalThis.downloadFile(serializedImage, fileName)\n`
      result += `${prefix}${indent}${indent}}\n`
      result += `${prefix}${indent}})\n`
      break
    case 'OUTPUT_MESH':
      result += `${prefix}${indent}const ${parameterName}OutputDownload = document.querySelector('#${functionName}Outputs sl-button[name=${parameter.name}-download]')\n`
      result += `${prefix}${indent}${parameterName}OutputDownload.addEventListener('click', async (event) => {\n`
      result += `${prefix}${indent}${indent}event.preventDefault()\n`
      result += `${prefix}${indent}${indent}event.stopPropagation()\n`
      result += `${prefix}${indent}${indent}if (model.outputs.has("${parameterName}")) {\n`
      result += `${prefix}${indent}${indent}${indent}const ${parameterName}DownloadFormat = document.getElementById('${parameter.name}-output-format')\n`
      result += `${prefix}${indent}${indent}${indent}const downloadFormat = ${parameterName}DownloadFormat.value || 'vtk'\n`
      result += `${prefix}${indent}${indent}${indent}const fileName = \`${parameterName}.\${downloadFormat}\`\n`
      result += `${prefix}${indent}${indent}${indent}const { webWorker, arrayBuffer } = await writeMeshArrayBuffer(null, model.outputs.get("${parameterName}"), fileName)\n\n`
      result += `${prefix}${indent}${indent}${indent}webWorker.terminate()\n`
      result += `${prefix}${indent}${indent}${indent}globalThis.downloadFile(arrayBuffer, fileName)\n`
      result += `${prefix}${indent}${indent}}\n`
      result += `${prefix}${indent}})\n`
      break
    default:
      console.error(`Unexpected interface type: ${parameter.type}`)
      process.exit(1)
  }
  return result
}

export default outputDemoTypeScript