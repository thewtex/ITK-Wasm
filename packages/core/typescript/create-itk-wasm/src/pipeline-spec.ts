import Dispatch from './dispatch.js'
import OptionSpec from './option-spec.js'

interface PipelineSpec {
  name: string
  description: string
  dispatch: Dispatch
  inputs: OptionSpec[]
  parameters: OptionSpec[]
  outputs: OptionSpec[]
}

export default PipelineSpec
