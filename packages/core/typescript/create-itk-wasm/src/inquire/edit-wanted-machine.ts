import { assign, setup, fromPromise, AnyActor } from 'xstate'
import inquirer from 'inquirer'
import chalk from 'chalk'

function printJustified(object: Record<string, unknown>, indent: string) {
  let newKeys = Object.keys(object).map((key) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
  )
  let maxLength = Math.max(...newKeys.map((key) => key.length))
  newKeys = newKeys.map((key) => key.padStart(maxLength))
  const values = Object.values(object)
  for (let i = 0; i < newKeys.length; i++) {
    console.log(
      `${indent}${chalk.green(newKeys[i])}: ${chalk.yellow(values[i])}`
    )
  }
  console.log(`${indent}${chalk.gray(new inquirer.Separator())}`)
}

const inquireEditWantedMachine = setup({
  types: {
    context: {} as {
      sender?: AnyActor
      response?: boolean
      specName: string
      spec: Record<string, unknown>
    },
    input: {} as {
      spec?: Record<string, unknown>
      specName?: string
    },
    events: {} as {
      type: 'inquire'
      sender: AnyActor
      spec: Record<string, unknown>
    }
  },
  actions: {
    sendResponse: ({ context }) => {
      const edit = context.response
      if (edit) {
        context.sender.send({ type: 'edit' })
      } else {
        context.sender.send({ type: 'confirm' })
      }
    }
  },
  actors: {
    printAndInquire: fromPromise(async ({ input }) => {
      // @ts-ignore
      const spec = input.spec
      // @ts-ignore
      const specName = input.specName

      // hack
      if (specName === 'Add another pipeline?') {
        console.log('\n')
        const questions = [
          {
            type: 'confirm',
            name: 'edit',
            message: `🔢  ${specName}`,
            default: false
          }
        ]
        const { edit } = await inquirer.prompt(questions)
        return edit
      }

      console.log(chalk.gray(new inquirer.Separator()))
      console.log(`${chalk.greenBright(specName)}:`)

      let newKeys = Object.keys(spec).map((key) =>
        key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
      )
      let maxLength = Math.max(...newKeys.map((key) => key.length))
      newKeys = newKeys.map((key) => key.padStart(maxLength))
      const values = Object.values(spec)
      for (let i = 0; i < newKeys.length; i++) {
        if (Array.isArray(values[i])) {
          // @ts-ignore
          if (values[i].length === 0) {
            console.log(`${chalk.green(newKeys[i])}: ∅  (none)`)
          } else {
            console.log(`${chalk.green(newKeys[i])}:`)
          }
          // @ts-ignore
          for (let j = 0; j < values[i].length; j++) {
            // @ts-ignore
            printJustified(values[i][j], ' '.repeat(newKeys[i].length + 2))
          }
        } else {
          console.log(`${chalk.green(newKeys[i])}: ${chalk.yellow(values[i])}`)
        }
      }

      const questions = [
        {
          type: 'confirm',
          name: 'edit',
          message: '✔️  Edit?',
          default: false
        }
      ]
      const { edit } = await inquirer.prompt(questions)
      return edit
    })
  }
}).createMachine({
  id: 'inquireEditWanted',
  initial: 'idle',
  context: ({ input }) => {
    return {
      specName: input.specName,
      spec: input.spec
    }
  },
  states: {
    idle: {
      on: {
        inquire: {
          target: 'inquiring',
          actions: assign({
            sender: ({ event }) => event.sender
          })
        }
      }
    },
    inquiring: {
      invoke: {
        id: 'printAndInquire',
        src: 'printAndInquire',
        input: ({ context }) => {
          return { spec: context.spec, specName: context.specName }
        },
        onDone: {
          target: 'obtainedReponse',
          actions: [
            assign({ response: ({ event }) => event.output as boolean }),
            'sendResponse'
          ]
        }
      }
    },
    obtainedReponse: {
      type: 'final'
    }
  }
})

export default inquireEditWantedMachine
