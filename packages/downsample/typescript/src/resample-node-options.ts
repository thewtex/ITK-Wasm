// Generated file. To retain edits, remove this comment.

import { TransformList } from 'itk-wasm'

interface ResampleNodeOptions {
  /** Optional transform mapping output-grid points into the moving-image space. Defaults to identity. */
  transform?: TransformList

  /** Interpolation method used to sample the moving image. */
  interpolator?: string

}

export default ResampleNodeOptions
