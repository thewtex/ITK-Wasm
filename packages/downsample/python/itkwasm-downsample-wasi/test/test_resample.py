from itkwasm import PixelTypes
from itkwasm_compare_images import compare_images
from itkwasm_image_io import read_image, write_image
from itkwasm_transform_io import transformread

from itkwasm_downsample_wasi import resample

from .common import test_input_path, test_baseline_path, test_output_path


def test_resample():
    """Linear interpolation with a non-identity affine transform.

    Resample cthead1 onto a reference grid whose size/spacing/origin all differ
    from the moving image, applying the affine transform (rotation about the
    centre + translation) read from the packed ``.h5``. The baseline was produced
    independently with the native itk ``ResampleImageFilter`` (Phase 04), so the
    comparison is not self-referential.
    """
    test_moving_file_path = test_input_path / 'cthead1.png'
    test_reference_file_path = test_input_path / 'cthead1-resample-reference.nrrd'
    test_transform_file_path = test_input_path / 'cthead1-resample-transform.h5'
    test_output_file_path = test_output_path / 'resample-test-cthead1-linear.mha'
    test_baseline_file_path = test_baseline_path / 'cthead1-resample-linear.nrrd'

    moving = read_image(test_moving_file_path)
    reference = read_image(test_reference_file_path)
    transform = transformread(test_transform_file_path)

    output = resample(moving, reference, transform=transform, interpolator='linear')
    write_image(output, test_output_file_path)

    baseline = read_image(test_baseline_file_path)
    metrics, _, _ = compare_images(output, [baseline,])
    assert metrics['almostEqual']


def test_resample_nearest_neighbor():
    """Nearest-neighbor interpolation with the same affine transform."""
    test_moving_file_path = test_input_path / 'cthead1.png'
    test_reference_file_path = test_input_path / 'cthead1-resample-reference.nrrd'
    test_transform_file_path = test_input_path / 'cthead1-resample-transform.h5'
    test_output_file_path = test_output_path / 'resample-test-cthead1-nearest-neighbor.mha'
    test_baseline_file_path = test_baseline_path / 'cthead1-resample-nearest-neighbor.nrrd'

    moving = read_image(test_moving_file_path)
    reference = read_image(test_reference_file_path)
    transform = transformread(test_transform_file_path)

    output = resample(moving, reference, transform=transform, interpolator='nearest_neighbor')
    write_image(output, test_output_file_path)

    baseline = read_image(test_baseline_file_path)
    metrics, _, _ = compare_images(output, [baseline,])
    assert metrics['almostEqual']


def test_resample_label_image():
    """label_image interpolator.

    ITK's GenericLabelInterpolator (the ``label_image`` backend) is not in the
    ``itk`` Python wheel, so Phase 04 produced no independent baseline. Instead,
    mirror the C++ ``resample-label-image`` ctest: resample the multi-label image
    ``2th_cthead1.png`` onto its own geometry with the identity transform. A
    grid-aligned identity resample samples each output point at an exact input
    pixel centre, so the label interpolator reproduces the input labels exactly --
    the input image is therefore its own trusted baseline.
    """
    test_label_file_path = test_input_path / '2th_cthead1.png'
    test_output_file_path = test_output_path / 'resample-test-2th_cthead1-label-image.mha'

    label_image = read_image(test_label_file_path)

    output = resample(label_image, label_image, interpolator='label_image')
    write_image(output, test_output_file_path)

    baseline = read_image(test_label_file_path)
    metrics, _, _ = compare_images(output, [baseline,])
    assert metrics['almostEqual']


def test_resample_vector_image():
    """VectorImage (multi-component) path.

    itkwasm reads apple.jpg as ``RGB`` and the reference ``.mha`` as ``Vector``,
    but resample's SupportInputImageTypes dispatch only matches
    ``VariableLengthVector``, so reassign the pixelType on both the moving and
    reference images before calling resample (as ``test_downsample_vector_image``
    does). The independent baseline uses the identity transform (grid change only).
    """
    test_moving_file_path = test_input_path / 'apple.jpg'
    test_reference_file_path = test_input_path / 'apple-resample-reference.mha'
    test_output_file_path = test_output_path / 'resample-test-apple-linear.mha'
    test_baseline_file_path = test_baseline_path / 'apple-resample-linear.mha'

    moving = read_image(test_moving_file_path)
    moving.imageType.pixelType = PixelTypes.VariableLengthVector
    reference = read_image(test_reference_file_path)
    reference.imageType.pixelType = PixelTypes.VariableLengthVector

    output = resample(moving, reference, interpolator='linear')
    write_image(output, test_output_file_path)

    baseline = read_image(test_baseline_file_path)
    metrics, _, _ = compare_images(output, [baseline,])
    assert metrics['almostEqual']
