import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import * as emoji from 'node-emoji'

import ProjectSpec from '../project-spec.js'
import PipelineSpec from '../pipeline-spec.js'
import die from '../die.js'

function generatePipeline(
  project: ProjectSpec,
  pipeline: PipelineSpec,
  verbose: boolean = false
) {
  if (verbose) {
    console.log(
      chalk.cyan(
        `    ${emoji.random().emoji}  Generating pipeline ${pipeline.name}...`
      )
    )
  }

  if (
    pipeline.inputs.length === 0 &&
    pipeline.outputs.length === 0 &&
    pipeline.parameters.length === 0
  ) {
    die(
      `Pipeline ${pipeline.name} must have at least one input, parameter, or output.`
    )
  }

  const cmakelistsPath = path.join(project.directory, 'CMakeLists.txt')
  const content = fs.readFileSync(cmakelistsPath, 'utf8')
  const pipelineDelimiter = '# End create-itk-wasm added pipelines.\n'
  if (!content.includes(pipelineDelimiter)) {
    die(
      `CMakeLists.txt does not contain the pipeline content delimiter: ${pipelineDelimiter}`
    )
  }

  const pipelinePath = path.join(project.directory, pipeline.name)
  fs.mkdirSync(pipelinePath, { recursive: true })

  const pipelineCmakelistsPath = path.join(pipelinePath, 'CMakeLists.txt')
  const pipelineContent = `add_executable(${pipeline.name} ${pipeline.name}.cxx)
target_link_libraries(${pipeline.name} PUBLIC \${ITK_LIBRARIES})

add_test(NAME ${pipeline.name}-help COMMAND ${pipeline.name} --help)
`
  fs.writeFileSync(pipelineCmakelistsPath, pipelineContent)

  const pipelineCxxPath = path.join(pipelinePath, `${pipeline.name}.cxx`)
  const pipelineCxxContent = `/*=========================================================================

 *  Copyright NumFOCUS
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         https://www.apache.org/licenses/LICENSE-2.0.txt
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 *=========================================================================*/

#include "itkPipeline.h"

int main(int argc, char * argv[])
{
  itk::wasm::Pipeline pipeline("${pipeline.name}", "${pipeline.description}", argc, argv);

  ITK_WASM_PARSE(pipeline);

  // Pipeline code goes here

  return EXIT_SUCCESS;
}
`
  fs.writeFileSync(pipelineCxxPath, pipelineCxxContent)

  const contentSplit = content.split(pipelineDelimiter, 2)
  const newContent = `${contentSplit[0]}add_subdirectory(${pipeline.name})
${pipelineDelimiter}${contentSplit[1]}`
  fs.writeFileSync(cmakelistsPath, newContent)
}

export default generatePipeline
