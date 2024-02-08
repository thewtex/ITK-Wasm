import inquirer from 'inquirer'

import PipelineSpec from '../pipeline-spec.js'
import isValidPackageName from '../is-valid-package-name.js'
import Dispatch from '../dispatch.js'

async function inquirePipelineSpec(
  pipeline: PipelineSpec,
  askAnswered: boolean
): Promise<PipelineSpec> {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Pipeline name:',
      default: pipeline.name,
      askAnswered,
      validate: (input: string) => {
        if (isValidPackageName(input)) {
          return true
        }
        return 'Invalid pipeline name. Must be kebab case (lowercase and hyphens).'
      }
    },
    {
      type: 'input',
      name: 'description',
      message: 'Pipeline description:',
      askAnswered,
      default: pipeline.description,
      validate: (input: string) => {
        if (input.length > 0) {
          return true
        }
        return 'Description cannot be empty.'
      }
    },
    {
      type: 'list',
      name: 'dispatch',
      message: 'Dispatch:',
      choices: Object.values(Dispatch),
      askAnswered,
      default: pipeline.dispatch || Dispatch.None
    }
  ]
  const answers = await inquirer.prompt(questions, pipeline)
  return answers
}

export default inquirePipelineSpec
