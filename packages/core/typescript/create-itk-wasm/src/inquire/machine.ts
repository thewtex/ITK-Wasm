import { setup, sendTo, assign, fromPromise, MachineContext } from 'xstate'
import chalk from 'chalk'

import ProjectSpec from '../project-spec.js'
import PipelineSpec from '../pipeline-spec.js'
import OptionSpec from '../option-spec.js'
import Dispatch from '../dispatch.js'

import inquireProjectSpec from './project-spec.js'
import inquireEditWantedMachine from './edit-wanted-machine.js'
import inquirePipelineSpec from './pipeline-spec.js'

interface PipelineSpecEvent {
  type: 'input_pipeline_spec'
  spec: PipelineSpec
}

interface InquireMachineContext extends MachineContext {
  project: ProjectSpec
  useProjectAnswers: boolean
  pipelines: PipelineSpec[]
  usePipelineAnswers: boolean
}

const inquireMachine = setup({
  types: {
    context: {} as InquireMachineContext,
    events: {} as
      | { type: 'edit' }
      | { type: 'cancel' }
      | { type: 'confirm' }
      | { type: 'complete_package' }
      | PipelineSpecEvent
  },
  actions: {
    'inline:inquire.Awaiting Pipeline Specification#input_pipeline_spec[-1]#transition[0]':
      assign({
        pipelines: ({ context, event }) => [
          ...context.pipelines,
          (event as PipelineSpecEvent).spec
        ]
      })
  },
  actors: {
    inquireProjectSpec: fromPromise(async ({ input }) => {
      // @ts-ignore
      let project = input.project
      // @ts-ignore
      const useAnswers = input.useAnswers
      project = await inquireProjectSpec(project, !useAnswers)
      return project
    }),
    inquireEditWantedMachine,
    inquirePipelineSpec: fromPromise(async ({ input }) => {
      // @ts-ignore
      let pipeline = input.pipeline
      // @ts-ignore
      const useAnswers = input.useAnswers
      pipeline = await inquirePipelineSpec(pipeline, !useAnswers)
      return pipeline
    })
  },
  guards: {
    haveOption: ({ context }) => {
      const newPipeline = context.pipelines[context.pipelines.length - 1]
      const invalidPipeline =
        newPipeline.inputs.length === 0 &&
        newPipeline.outputs.length === 0 &&
        newPipeline.parameters.length === 0
      return invalidPipeline
    }
  },
  delays: {}
}).createMachine({
  context: ({ input }) => {
    const inputPipelines = (input as InquireMachineContext).pipelines
    const pipelines = inputPipelines.length
      ? inputPipelines
      : [{} as PipelineSpec]
    return {
      project: (input as InquireMachineContext).project,
      useProjectAnswers: true,
      pipelines,
      usePipelineAnswers: true
    }
  },
  id: 'inquire',
  initial: 'Awaiting Project Specification',
  states: {
    'Awaiting Project Specification': {
      description:
        'The state where the machine is waiting for the user to input the base details of the package, such as the name, description, and author.',
      invoke: {
        id: 'getProjectSpec',
        src: 'inquireProjectSpec',
        input: ({ context }) => {
          return {
            project: context.project,
            useAnswers: context.useProjectAnswers
          }
        },
        onDone: {
          target: 'Confirming Project Specification',
          actions: assign({
            project: ({ event }) => event.output as ProjectSpec
          })
        },
        onError: {
          target: 'Awaiting Project Specification'
        }
      }
    },
    'Confirming Project Specification': {
      description:
        'The state where the machine has received the package details and is waiting for the user to confirm these details or to edit them.',
      on: {
        confirm: {
          target: 'Awaiting Pipeline Specification',
          actions: () => console.log('\n')
        },
        edit: {
          target: 'Awaiting Project Specification',
          actions: [() => console.log(''), assign({ useProjectAnswers: false })]
        }
      },
      invoke: {
        id: 'confirmProjectSpec',
        src: 'inquireEditWantedMachine',
        // @ts-ignore
        input: ({ context }) => {
          return { specName: '⚙️  Project', spec: context.project }
        }
      },
      entry: sendTo('confirmProjectSpec', ({ self }) => ({
        type: 'inquire',
        sender: self
      }))
    },
    'Awaiting Pipeline Specification': {
      description:
        'The state where the machine is waiting for the user to input details for a pipeline within the package or to complete the package creation process.',
      on: {
        input_pipeline_spec: {
          target: 'Confirming Pipeline Specification',
          actions: {
            type: 'inline:inquire.Awaiting Pipeline Specification#input_pipeline_spec[-1]#transition[0]'
          }
        },
        complete_package: {
          target: 'Project Creation Complete'
        }
      },
      invoke: {
        id: 'getPipelineSpec',
        src: 'inquirePipelineSpec',
        input: ({ context }) => {
          const pipeline = context.pipelines[context.pipelines.length - 1]
          return {
            pipeline,
            useAnswers: context.usePipelineAnswers
          }
        },
        onDone: {
          target: 'Confirming Pipeline Specification',
          actions: assign({
            pipelines: ({ context, event }) => {
              const newPipeline = event.output as PipelineSpec
              return [...context.pipelines, newPipeline]
            }
          })
        },
        onError: {
          target: 'Awaiting Pipeline Specification'
        }
      }
    },
    'Confirming Pipeline Specification': {
      description:
        'The state where the machine has received details for a pipeline and is waiting for the user to confirm these details or to edit them.',
      on: {
        confirm: [
          {
            target: 'Awaiting Pipeline Specification',
            guard: 'haveOption',
            actions: () =>
              console.log(
                chalk.red(
                  'At least one input, parameter, or output must be specified.'
                )
              )
          },
          {
            target: 'Confirm Add Another Pipeline Specification'
          }
        ],
        edit: {
          target: 'Awaiting Pipeline Specification',
          actions: [
            () => console.log(''),
            assign({ usePipelineAnswers: false })
          ]
        }
      },
      invoke: {
        id: 'confirmPipelineSpec',
        src: 'inquireEditWantedMachine',
        // @ts-ignore
        input: ({ context }) => {
          return {
            specName: '🧪  Pipeline',
            spec: context.pipelines[context.pipelines.length - 1]
          }
        }
      },
      entry: sendTo('confirmPipelineSpec', ({ self }) => ({
        type: 'inquire',
        sender: self
      }))
    },
    'Confirm Add Another Pipeline Specification': {
      description:
        'The state where the machine has is waiting for the user to confirm whether they want to add another pipeline.',
      on: {
        confirm: {
          target: 'Project Creation Complete'
        },
        edit: {
          target: 'Awaiting Pipeline Specification',
          actions: [
            () => console.log('\n'),
            assign({
              pipelines: ({ context }) => {
                return [
                  ...context.pipelines,
                  {
                    name: '',
                    description: '',
                    dispatch: Dispatch.None,
                    inputs: [] as OptionSpec[],
                    parameters: [] as OptionSpec[],
                    outputs: [] as OptionSpec[]
                  }
                ]
              },
              usePipelineAnswers: false
            })
          ]
        }
      },
      invoke: {
        id: 'confirmAddAnotherPipelineSpec',
        src: 'inquireEditWantedMachine',
        // @ts-ignore
        input: ({ context }) => {
          return {
            specName: 'Add another pipeline?',
            spec: ''
          }
        }
      },
      entry: sendTo('confirmAddAnotherPipelineSpec', ({ self }) => ({
        type: 'inquire',
        sender: self
      }))
    },
    'Project Creation Complete': {
      description:
        'The state where the package creation process has been completed.',
      type: 'final'
    }
  },
  on: {
    cancel: {}
  },
  output: ({ context }) => ({
    project: context.project,
    pipelines: context.pipelines
  })
})

export default inquireMachine
