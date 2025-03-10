// Generated file. To retain edits, remove this comment.

import { JsonCompatible, TransformList, WorkerPoolFunctionResult } from 'itk-wasm'

interface WasmReadTransformResult extends WorkerPoolFunctionResult {
  /** Whether the input could be read. If false, the output transform is not valid. */
  couldRead: JsonCompatible

  /** Output transform */
  transform: TransformList

}

export default WasmReadTransformResult
