cmake_minimum_required(VERSION 3.16)
project(itkwasm-downsample LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)

if(EMSCRIPTEN)
  set(io_components
    )
elseif(WASI)
  set(io_components
    ITKIOPNG
    )
else()
  set(io_components
    ITKImageIO
    ITKIOTransformInsightLegacy
    ITKIOTransformHDF5
    )
endif()

find_package(ITK REQUIRED
 COMPONENTS
   WebAssemblyInterface
   ITKSmoothing
   ITKImageGrid
   ITKImageFunction
   ITKTransform
   GenericLabelInterpolator
   ${io_components}
 )
include(${ITK_USE_FILE})

foreach(pipeline downsample downsample-sigma gaussian-kernel-radius downsample-bin-shrink downsample-label-image resample)
  add_executable(${pipeline} ${pipeline}.cxx)
  target_link_libraries(${pipeline} PUBLIC ${ITK_LIBRARIES})
  target_include_directories(${pipeline} PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
endforeach()

enable_testing()
# Interesting backtrace on exit
if (NOT CMAKE_BUILD_TYPE STREQUAL "Debug")
  add_test(NAME downsample
    COMMAND downsample
      ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
      ${CMAKE_CURRENT_BINARY_DIR}/cthead1_downsampled.png
      --shrink-factors 2 2
      )
endif()

add_test(NAME downsample-sigma
  COMMAND downsample-sigma
    ${CMAKE_CURRENT_BINARY_DIR}/downsample-sigma.json
    --shrink-factors 2 4
    )

add_test(NAME gaussian-kernel-radius
  COMMAND gaussian-kernel-radius
    ${CMAKE_CURRENT_BINARY_DIR}/gaussian-kernel-radius.json
    --size 64 64 32
    --sigma 2.0 4.0 2.0
    )

add_test(NAME downsample-bin-shrink
  COMMAND downsample-bin-shrink
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_BINARY_DIR}/cthead1_downsampled_bin_shrink.png
    --shrink-factors 2 2
    )

add_test(NAME downsample-label-image
  COMMAND downsample-label-image
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/2th_cthead1.png
    ${CMAKE_CURRENT_BINARY_DIR}/cthead1_downsampled_label_image.png
    --shrink-factors 2 2
    )

# Self-contained smoke test: use cthead1.png as both the moving image and the
# reference geometry with the default identity transform, so the resampled
# output closely matches the input. Needs no new test data.
add_test(NAME resample
  COMMAND resample
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_BINARY_DIR}/cthead1_resampled.png
    --interpolator linear
    )

# Interpolator coverage: one self-contained test per interpolator, using
# cthead1.png as both the moving image and the reference geometry (identity
# transform), so every interpolator selection is exercised. Needs no new data.
add_test(NAME resample-linear
  COMMAND resample
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_BINARY_DIR}/cthead1_resampled_linear.png
    --interpolator linear
    )

add_test(NAME resample-nearest-neighbor
  COMMAND resample
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_BINARY_DIR}/cthead1_resampled_nearest_neighbor.png
    --interpolator nearest_neighbor
    )

add_test(NAME resample-b-spline
  COMMAND resample
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_BINARY_DIR}/cthead1_resampled_b_spline.png
    --interpolator b_spline
    )

add_test(NAME resample-windowed-sinc
  COMMAND resample
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_BINARY_DIR}/cthead1_resampled_windowed_sinc.png
    --interpolator windowed_sinc
    )

add_test(NAME resample-gaussian
  COMMAND resample
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/cthead1.png
    ${CMAKE_CURRENT_BINARY_DIR}/cthead1_resampled_gaussian.png
    --interpolator gaussian
    )

# Label-image interpolator on the existing multi-label test image.
add_test(NAME resample-label-image
  COMMAND resample
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/2th_cthead1.png
    ${CMAKE_CURRENT_SOURCE_DIR}/test/data/input/2th_cthead1.png
    ${CMAKE_CURRENT_BINARY_DIR}/2th_cthead1_resampled_label_image.png
    --interpolator label_image
    )
