#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'
import { spawnSync } from 'child_process'
import glob from 'glob'
import asyncMod from 'async'

import { Command } from 'commander/esm.mjs'

const program = new Command()

// Make the "build" directory to hold build artifacts
try {
  fs.mkdirSync('build')
} catch (err) {
  if (err.code !== 'EEXIST') throw err
}
program
  .option('-i, --no-build-io', 'Do not compile io modules')
  .option('-s, --no-copy-build-artifacts', 'Do not copy build artifacts')
  .option('-p, --no-build-pipelines', 'Do not build the test pipelines')
  .option('-d, --debug', 'Create a debug build of the Emscripten modules')
  .parse(process.argv)

const options = program.opts()

if (options.buildIo) {
  // Make the "build" directory to hold build artifacts
  try {
    fs.mkdirSync('build')
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }

  const dockerVersion = spawnSync('docker', ['--version'], {
    env: process.env,
    stdio: ['ignore', 'ignore', 'ignore']
  })
  if (dockerVersion.status !== 0) {
    console.error("Could not run the 'docker' command.")
    console.error('This package requires Docker to build.')
    console.error('')
    console.error('Please find installation instructions at:')
    console.error('')
    console.error('  https://docs.docker.com/install/')
    console.error('')
    process.exit(dockerVersion.status)
  }

  // Ensure we have the 'dockcross' Docker build environment driver script
  let dockcross = 'build/dockcross'
  if (options.debug) {
    dockcross = 'build/dockcross-debug'
  }
  try {
    fs.statSync(dockcross)
  } catch (err) {
    if (err.code === 'ENOENT') {
      const output = fs.openSync(dockcross, 'w')
      let buildImage = 'insighttoolkit/itk-js:latest'
      if (options.debug) {
        buildImage = 'insighttoolkit/itk-js:latest-debug'
      }
      const dockerCall = spawnSync('docker', ['run', '--rm', buildImage], {
        env: process.env,
        stdio: ['ignore', output, null]
      })
      if (dockerCall.status !== 0) {
        process.exit(dockerCall.status)
      }
      fs.closeSync(output)
      fs.chmodSync(dockcross, '755')
    } else {
      throw err
    }
  }

  // Perform initial CMake configuration if required
  try {
    fs.statSync(path.join('build', 'build.ninja'))
  } catch (err) {
    if (err.code === 'ENOENT') {
      let buildType = '-DCMAKE_BUILD_TYPE:STRING=Release'
      if (options.debug) {
        buildType = '-DCMAKE_BUILD_TYPE:STRING=Debug'
      }
      const cmakeCall = spawnSync('bash', [dockcross, 'bash', '-c', `cmake -DRapidJSON_INCLUDE_DIR=/rapidjson/include ${buildType} -Bbuild -H. -GNinja -DITK_DIR=/ITK-build -DVTK_DIR=/VTK-build -DBUILD_ITK_JS_IO_MODULES=ON`], {
        env: process.env,
        stdio: 'inherit'
      })
      if (cmakeCall.status !== 0) {
        process.exit(cmakeCall.status)
      }
    } else {
      throw err
    }
  }

  // Build the Emscripten mobules with ninja
  console.log('\nRunning ninja...')
  const ninjaCall = spawnSync('bash', [dockcross, 'ninja', '-j8', '-Cbuild'], {
    env: process.env,
    stdio: 'inherit'
  })
  if (ninjaCall.status !== 0) {
    process.exit(ninjaCall.status)
  }
  console.log('')
} // options.compile

if (options.copyBuildArtifacts) {
  try {
    fs.mkdirSync('dist')
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
  try {
    fs.mkdirSync(path.join('dist', 'image-io'))
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
  try {
    fs.mkdirSync(path.join('dist', 'mesh-io'))
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
  try {
    fs.mkdirSync(path.join('dist', 'polydata-io'))
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
  try {
    fs.mkdirSync(path.join('dist', 'web-workers'))
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
  let imageIOFiles = glob.sync(path.join('build', 'image-io', '*.js'))
  imageIOFiles = imageIOFiles.concat(glob.sync(path.join('build', 'image-io', '*.wasm')))
  const copyImageIOModules = function (imageIOFile, callback) {
    const io = path.basename(imageIOFile)
    const output = path.join('dist', 'image-io', io)
    fs.copySync(imageIOFile, output)
    callback(null, io)
  }
  const buildImageIOsParallel = function (callback) {
    console.log('Copying image-io modules...')
    const result = asyncMod.map(imageIOFiles, copyImageIOModules)
    callback(null, result)
  }
  let meshIOFiles = glob.sync(path.join('build', 'mesh-io', '*.js'))
  meshIOFiles = meshIOFiles.concat(glob.sync(path.join('build', 'mesh-io', '*.wasm')))
  const copyMeshIOModules = function (meshIOFile, callback) {
    const io = path.basename(meshIOFile)
    const output = path.join('dist', 'mesh-io', io)
    fs.copySync(meshIOFile, output)
    callback(null, io)
  }
  const buildMeshIOsParallel = function (callback) {
    console.log('Copying mesh-io modules...')
    const result = asyncMod.map(meshIOFiles, copyMeshIOModules)
    callback(null, result)
  }

  let polyDataIOFiles = glob.sync(path.join('build', 'polydata-io', '*.js'))
  polyDataIOFiles = polyDataIOFiles.concat(glob.sync(path.join('build', 'polydata-io', '*.wasm')))
  const copyPolyDataIOModules = function (polyDataIOFile, callback) {
    const io = path.basename(polyDataIOFile)
    const output = path.join('dist', 'polydata-io', io)
    fs.copySync(polyDataIOFile, output)
    callback(null, io)
  }
  const buildPolyDataIOsParallel = function (callback) {
    console.log('Copying polydata-io modules...')
    const result = asyncMod.map(polyDataIOFiles, copyPolyDataIOModules)
    callback(null, result)
  }

  asyncMod.parallel([
    buildImageIOsParallel,
    buildMeshIOsParallel,
    buildPolyDataIOsParallel,
  ])
} // options.copySources

if (options.buildPipelines) {
  const buildPipeline = (pipelinePath) => {
    console.log('Building ' + pipelinePath + ' ...')
    let debugFlags = []
    let buildImage = 'insighttoolkit/itk-js:latest'
    if (options.debug) {
      debugFlags = ['-DCMAKE_BUILD_TYPE:STRING=Debug', "-DCMAKE_EXE_LINKER_FLAGS_DEBUG='-s DISABLE_EXCEPTION_CATCHING=0'"]
      buildImage = 'insighttoolkit/itk-js:latest-debug'
    }
    const buildPipelineCall = spawnSync('node', [path.join('src', 'itk-js-cli.js'), 'build', '--image', buildImage, pipelinePath, '--'].concat(debugFlags), {
      env: process.env,
      stdio: 'inherit'
    })
    if (buildPipelineCall.status !== 0) {
      process.exit(buildPipelineCall.status)
    }
    let pipelineFiles = glob.sync(path.join(pipelinePath, 'web-build', '*.js'))
    pipelineFiles = pipelineFiles.concat(glob.sync(path.join(pipelinePath, 'web-build', '*.wasm')))
    pipelineFiles.forEach((file) => {
      const filename = path.basename(file)
      const output = path.join('dist', 'pipeline', filename)
      fs.copySync(file, output)
    })
  }

  const buildPipelineWasi = (pipelinePath) => {
    console.log('Building ' + pipelinePath + ' with wasi...')
    let debugFlags = []
    let buildImage = 'insighttoolkit/itk-js-wasi:latest'
    if (options.debug) {
      debugFlags = ['-DCMAKE_BUILD_TYPE:STRING=Debug']
      buildImage = 'insighttoolkit/itk-js-wasi:latest-debug'
    }
    const buildPipelineCall = spawnSync('node', [path.join('src', 'itk-js-cli.js'), 'build', '--image', buildImage, '--build-dir', 'wasi-build', pipelinePath, '--'].concat(debugFlags), {
      env: process.env,
      stdio: 'inherit'
    })
    if (buildPipelineCall.status !== 0) {
      process.exit(buildPipelineCall.status)
    }
    const pipelineFiles = glob.sync(path.join(pipelinePath, 'wasi-build', '*.wasm'))
    pipelineFiles.forEach((file) => {
      const filename = path.basename(file)
      const output = path.join('dist', 'pipeline', filename)
      fs.copySync(file, output)
    })
  }

  const pipelines = [
    path.join('test', 'pipelines', 'StdoutStderrPipeline'),
    path.join('test', 'pipelines', 'MedianFilterPipeline'),
    path.join('test', 'pipelines', 'InputOutputFilesPipeline'),
    path.join('test', 'pipelines', 'MeshReadWritePipeline'),
    // todo: re-enable with VTK image
    // path.join('test', 'pipelines', 'WriteVTKPolyDataPipeline'),
    // path.join('test', 'pipelines', 'CLPExample1'),
    // path.join('src', 'pipelines', 'mesh-to-polydata'),
  ]
  try {
    fs.mkdirSync(path.join('dist', 'pipeline'))
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
  //asyncMod.map(pipelines, buildPipeline)
  asyncMod.map(pipelines, buildPipelineWasi)
} // progrem
