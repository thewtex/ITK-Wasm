import OptionType from './option-type.js'

interface OptionSpec {
  name: string
  type: OptionType
  description: string
  defaultValue?: string
  required?: boolean
  itemsExpected?: number
  itemsExpectedMin?: number
  itemsExpectedMax?: number
}

export default OptionSpec
