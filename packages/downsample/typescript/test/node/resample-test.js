import test from 'ava'
import path from 'path'

import { readImageNode } from '@itk-wasm/image-io'
import { readTransformNode } from '@itk-wasm/transform-io'
import { compareImagesNode } from '@itk-wasm/compare-images'
import { PixelTypes } from 'itk-wasm'

import { resampleNode } from '../../dist/index-node.js'
import { testInputPath, testBaselinePath } from './common.js'

test('Test resampleNode linear with transform', async t => {
  const movingFilePath = path.join(testInputPath, 'cthead1.png')
  const referenceFilePath = path.join(testInputPath, 'cthead1-resample-reference.nrrd')
  const transformFilePath = path.join(testInputPath, 'cthead1-resample-transform.h5')
  const baselineFilePath = path.join(testBaselinePath, 'cthead1-resample-linear.nrrd')

  const moving = await readImageNode(movingFilePath)
  const reference = await readImageNode(referenceFilePath)
  const transform = await readTransformNode(transformFilePath)

  const { output } = await resampleNode(moving, reference, { transform, interpolator: 'linear' })
  const baseline = await readImageNode(baselineFilePath)

  const { metrics } = await compareImagesNode(output, { baselineImages: [baseline, ] })

  t.true(metrics.almostEqual)
})

test('Test resampleNode nearest_neighbor with transform', async t => {
  const movingFilePath = path.join(testInputPath, 'cthead1.png')
  const referenceFilePath = path.join(testInputPath, 'cthead1-resample-reference.nrrd')
  const transformFilePath = path.join(testInputPath, 'cthead1-resample-transform.h5')
  const baselineFilePath = path.join(testBaselinePath, 'cthead1-resample-nearest-neighbor.nrrd')

  const moving = await readImageNode(movingFilePath)
  const reference = await readImageNode(referenceFilePath)
  const transform = await readTransformNode(transformFilePath)

  const { output } = await resampleNode(moving, reference, { transform, interpolator: 'nearest_neighbor' })
  const baseline = await readImageNode(baselineFilePath)

  const { metrics } = await compareImagesNode(output, { baselineImages: [baseline, ] })

  t.true(metrics.almostEqual)
})

// The label_image interpolator (ITK's GenericLabelInterpolator remote module) is
// not available in the `itk` Python wheel, so no independent baseline could be
// generated in Phase 04. Instead, mirror the C++ `resample-label-image` ctest:
// resample the multi-label image `2th_cthead1.png` onto its own geometry with the
// identity transform. A grid-aligned identity resample samples each output point
// at an exact input pixel centre, so the label interpolator reproduces the input
// labels exactly -- the input image is therefore its own trusted baseline.
test('Test resampleNode label_image interpolator', async t => {
  const labelImageFilePath = path.join(testInputPath, '2th_cthead1.png')

  const labelImage = await readImageNode(labelImageFilePath)

  const { output } = await resampleNode(labelImage, labelImage, { interpolator: 'label_image' })
  const baseline = await readImageNode(labelImageFilePath)

  const { metrics } = await compareImagesNode(output, { baselineImages: [baseline, ] })

  t.true(metrics.almostEqual)
})

// VectorImage (multi-component) path. itkwasm reads apple.jpg as `RGB` and the
// reference .mha as `Vector`, but resample's SupportInputImageTypes dispatch only
// matches `VariableLengthVector`, so reassign the pixelType on both the moving and
// reference images before calling resample (as test_downsample.py's vector test does).
// The independent baseline uses the identity transform (grid change only).
test('Test resampleNode VectorImage', async t => {
  const movingFilePath = path.join(testInputPath, 'apple.jpg')
  const referenceFilePath = path.join(testInputPath, 'apple-resample-reference.mha')
  const baselineFilePath = path.join(testBaselinePath, 'apple-resample-linear.mha')

  const moving = await readImageNode(movingFilePath)
  moving.imageType.pixelType = PixelTypes.VariableLengthVector
  const reference = await readImageNode(referenceFilePath)
  reference.imageType.pixelType = PixelTypes.VariableLengthVector

  const { output } = await resampleNode(moving, reference, { interpolator: 'linear' })
  const baseline = await readImageNode(baselineFilePath)

  const { metrics } = await compareImagesNode(output, { baselineImages: [baseline, ] })

  t.true(metrics.almostEqual)
})
