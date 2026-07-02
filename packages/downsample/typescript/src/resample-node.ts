// Generated file. To retain edits, remove this comment.

import {
  Image,
  TransformList,
  InterfaceTypes,
  PipelineOutput,
  PipelineInput,
  runPipelineNode
} from 'itk-wasm'

import ResampleNodeOptions from './resample-node-options.js'
import ResampleNodeResult from './resample-node-result.js'

import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Resample an image onto a reference image's grid with an optional transform and a selectable interpolator.
 *
 * @param {Image} input - The moving image to resample.
 * @param {Image} referenceImage - Reference image whose geometry defines the output grid. Only the metadata (origin, spacing, direction, size) is used, so an empty pixel buffer is acceptable.
 * @param {ResampleNodeOptions} options - options object
 *
 * @returns {Promise<ResampleNodeResult>} - result object
 */
async function resampleNode(
  input: Image,
  referenceImage: Image,
  options: ResampleNodeOptions = {}
) : Promise<ResampleNodeResult> {

  const desiredOutputs: Array<PipelineOutput> = [
    { type: InterfaceTypes.Image },
  ]

  const inputs: Array<PipelineInput> = [
    { type: InterfaceTypes.Image, data: input },
    { type: InterfaceTypes.Image, data: referenceImage },
  ]

  const args = []
  // Inputs
  const inputName = '0'
  args.push(inputName)

  const referenceImageName = '1'
  args.push(referenceImageName)

  // Outputs
  const outputName = '0'
  args.push(outputName)

  // Options
  args.push('--memory-io')
  if (options.transform) {
    const inputCountString = inputs.length.toString()
    inputs.push({ type: InterfaceTypes.TransformList, data: options.transform as TransformList })
    args.push('--transform', inputCountString)

  }
  if (options.interpolator) {
    if (!['linear', 'nearest_neighbor', 'label_image', 'b_spline', 'windowed_sinc', 'gaussian'].includes(options.interpolator)) {
      throw new Error('"interpolator" option must be one of linear, nearest_neighbor, label_image, b_spline, windowed_sinc, gaussian')
    }
    args.push('--interpolator', options.interpolator.toString())

  }

  const pipelinePath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pipelines', 'resample')

  const {
    returnValue,
    stderr,
    outputs
  } = await runPipelineNode(pipelinePath, args, desiredOutputs, inputs)
  if (returnValue !== 0 && stderr !== "") {
    throw new Error(stderr)
  }

  const result = {
    output: outputs[0]?.data as Image,
  }
  return result
}

export default resampleNode
