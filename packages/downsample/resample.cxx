/*=========================================================================
 *
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
#include "itkInputImage.h"
#include "itkInputTransform.h"
#include "itkOutputImage.h"
#include "itkSupportInputImageTypes.h"

#include "itkResampleImageFilter.h"
#include "itkTransform.h"
#include "itkAffineTransform.h"

#include "itkInterpolateImageFunction.h"
#include "itkLinearInterpolateImageFunction.h"
#include "itkNearestNeighborInterpolateImageFunction.h"
#include "itkBSplineInterpolateImageFunction.h"
#include "itkGaussianInterpolateImageFunction.h"
#include "itkWindowedSincInterpolateImageFunction.h"
#include "itkLabelImageGenericInterpolateImageFunction.h"

#include <string>

namespace
{

// Shared interpolator-selection helper.
//
// Returns the requested interpolator as the common base pointer
// itk::InterpolateImageFunction<TImage, double>::Pointer, which feeds
// itk::ResampleImageFilter::SetInterpolator directly (the filter's
// InterpolatorType is InterpolateImageFunction<InputImageType, double>).
// The caller constrains `interpolator` to one of the six names below via
// CLI::IsMember, so the final fallback should be unreachable; it defaults to
// linear defensively.
template <typename TImage>
typename itk::InterpolateImageFunction<TImage, double>::Pointer
SelectInterpolator(const std::string & interpolator)
{
  using ImageType = TImage;
  using InterpolatorBaseType = itk::InterpolateImageFunction<ImageType, double>;

  typename InterpolatorBaseType::Pointer selected;
  if (interpolator == "nearest_neighbor")
  {
    selected = itk::NearestNeighborInterpolateImageFunction<ImageType, double>::New();
  }
  else if (interpolator == "label_image")
  {
    selected = itk::LabelImageGenericInterpolateImageFunction<ImageType, itk::LinearInterpolateImageFunction>::New();
  }
  else if (interpolator == "b_spline")
  {
    selected = itk::BSplineInterpolateImageFunction<ImageType, double, double>::New();
  }
  else if (interpolator == "windowed_sinc")
  {
    // Radius 3, default Hamming window and ZeroFluxNeumann boundary condition.
    selected = itk::WindowedSincInterpolateImageFunction<ImageType, 3>::New();
  }
  else if (interpolator == "gaussian")
  {
    selected = itk::GaussianInterpolateImageFunction<ImageType, double>::New();
  }
  else
  {
    // "linear" and the defensive default.
    selected = itk::LinearInterpolateImageFunction<ImageType, double>::New();
  }
  return selected;
}

} // namespace

template <typename TImage>
class PipelineFunctor
{
public:
  int
  operator()(itk::wasm::Pipeline & pipeline)
  {
    using ImageType = TImage;
    constexpr unsigned int ImageDimension = ImageType::ImageDimension;

    // The moving image. This is the image SupportInputImageTypes dispatches on,
    // so it must be the first positional option added.
    using InputImageType = itk::wasm::InputImage<ImageType>;
    InputImageType inputImage;
    pipeline.add_option("input", inputImage, "The moving image to resample.")->required()->type_name("INPUT_IMAGE");

    // The reference image whose geometry (origin, spacing, direction, size)
    // defines the output grid. Only the metadata is read, so a metadata-only /
    // empty pixel buffer is acceptable.
    InputImageType referenceImage;
    pipeline
      .add_option("reference-image",
                  referenceImage,
                  "Reference image whose geometry defines the output grid. Only the metadata (origin, spacing, "
                  "direction, size) is used, so an empty pixel buffer is acceptable.")
      ->required()
      ->type_name("INPUT_IMAGE");

    // Optional transform mapping output-grid points into the moving-image space.
    // itk::Transform is abstract (no New()), which breaks the InputTransform
    // memory-IO reader, so a concrete, double-precision AffineTransform is used;
    // it is-a Transform<double, N, N> and feeds SetTransform polymorphically.
    using TransformType = itk::AffineTransform<double, ImageDimension>;
    using InputTransformType = itk::wasm::InputTransform<TransformType>;
    InputTransformType inputTransform;
    pipeline
      .add_option("-t,--transform",
                  inputTransform,
                  "Optional transform mapping output-grid points into the moving-image space. Defaults to identity.")
      ->type_name("INPUT_TRANSFORM");

    std::string interpolator = "linear";
    pipeline
      .add_option("-i,--interpolator", interpolator, "Interpolation method used to sample the moving image.")
      ->check(
        CLI::IsMember({ "linear", "nearest_neighbor", "label_image", "b_spline", "windowed_sinc", "gaussian" }));

    using OutputImageType = itk::wasm::OutputImage<ImageType>;
    OutputImageType outputImage;
    pipeline.add_option("output", outputImage, "The resampled output image.")->required()->type_name("OUTPUT_IMAGE");

    ITK_WASM_PARSE(pipeline);

    typename ImageType::ConstPointer movingImage = inputImage.Get();
    typename ImageType::ConstPointer referenceGeometry = referenceImage.Get();

    using ResampleFilterType = itk::ResampleImageFilter<ImageType, ImageType>;
    auto resampleFilter = ResampleFilterType::New();
    resampleFilter->SetInput(movingImage);
    resampleFilter->SetReferenceImage(referenceGeometry);
    resampleFilter->UseReferenceImageOn();
    resampleFilter->SetInterpolator(SelectInterpolator<ImageType>(interpolator));

    // Only override the filter's default identity transform when one was provided.
    if (const TransformType * transform = inputTransform.Get(); transform != nullptr)
    {
      resampleFilter->SetTransform(transform);
    }

    ITK_WASM_CATCH_EXCEPTION(pipeline, resampleFilter->UpdateLargestPossibleRegion());

    typename ImageType::ConstPointer result = resampleFilter->GetOutput();
    outputImage.Set(result);

    return EXIT_SUCCESS;
  }
};

int
main(int argc, char * argv[])
{
  itk::wasm::Pipeline pipeline(
    "resample",
    "Resample a scalar image onto a reference image's grid with an optional transform and a selectable interpolator.",
    argc,
    argv);

  return itk::wasm::SupportInputImageTypes<PipelineFunctor,
                                           uint8_t,
                                           int8_t,
                                           uint16_t,
                                           int16_t,
                                           uint32_t,
                                           int32_t,
                                           uint64_t,
                                           int64_t,
                                           float,
                                           double>::Dimensions<2U, 3U, 4U>("input", pipeline);
}
