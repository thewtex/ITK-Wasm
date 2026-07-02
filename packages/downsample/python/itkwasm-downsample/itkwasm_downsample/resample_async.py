# Generated file. Do not edit.

import os
from typing import Dict, Tuple, Optional, List, Any

from itkwasm import (
    environment_dispatch,
    Image,
    TransformList,
)

async def resample_async(
    input: Image,
    reference_image: Image,
    transform: Optional[TransformList] = None,
    interpolator: str = "linear",
) -> Image:
    """Resample an image onto a reference image's grid with an optional transform and a selectable interpolator.

    :param input: The moving image to resample.
    :type  input: Image

    :param reference_image: Reference image whose geometry defines the output grid. Only the metadata (origin, spacing, direction, size) is used, so an empty pixel buffer is acceptable.
    :type  reference_image: Image

    :param transform: Optional transform mapping output-grid points into the moving-image space. Defaults to identity.
    :type  transform: TransformList

    :param interpolator: Interpolation method used to sample the moving image.
    :type  interpolator: str

    :return: The resampled output image.
    :rtype:  Image
    """
    func = environment_dispatch("itkwasm_downsample", "resample_async")
    output = await func(input, reference_image, transform=transform, interpolator=interpolator)
    return output
