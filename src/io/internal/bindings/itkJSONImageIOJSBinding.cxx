/*=========================================================================
 *
 *  Copyright NumFOCUS
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0.txt
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 *=========================================================================*/

#include <emscripten.h>
#include <emscripten/bind.h>

#include "itkWASMImageIO.h"

#include "itkImageIOBaseJSBinding.h"

typedef itk::ImageIOBaseJSBinding< itk::WASMImageIO > WASMImageIOJSBindingType;

EMSCRIPTEN_BINDINGS(itk_wasm_json_image_io_js_binding) {
  emscripten::register_vector<double>("AxisDirectionType");
  emscripten::enum_<WASMImageIOJSBindingType::IOPixelType>("IOPixelType")
    .value("UNKNOWNPIXELTYPE", itk::CommonEnums::IOPixel::UNKNOWNPIXELTYPE)
    .value("SCALAR", itk::CommonEnums::IOPixel::SCALAR)
    .value("RGB", itk::CommonEnums::IOPixel::RGB)
    .value("RGBA", itk::CommonEnums::IOPixel::RGBA)
    .value("OFFSET", itk::CommonEnums::IOPixel::OFFSET)
    .value("VECTOR", itk::CommonEnums::IOPixel::VECTOR)
    .value("POINT", itk::CommonEnums::IOPixel::POINT)
    .value("COVARIANTVECTOR", itk::CommonEnums::IOPixel::COVARIANTVECTOR)
    .value("SYMMETRICSECONDRANKTENSOR", itk::CommonEnums::IOPixel::SYMMETRICSECONDRANKTENSOR)
    .value("DIFFUSIONTENSOR3D", itk::CommonEnums::IOPixel::DIFFUSIONTENSOR3D)
    .value("FIXEDARRAY", itk::CommonEnums::IOPixel::ARRAY)
    .value("COMPLEX", itk::CommonEnums::IOPixel::COMPLEX)
    .value("FIXEDARRAY", itk::CommonEnums::IOPixel::FIXEDARRAY)
    .value("MATRIX", itk::CommonEnums::IOPixel::MATRIX)
    .value("VARIABLELENGTHVECTOR", itk::CommonEnums::IOPixel::VARIABLELENGTHVECTOR)
    .value("VARIABLESIZEMATRIX", itk::CommonEnums::IOPixel::VARIABLESIZEMATRIX)
    ;
  emscripten::enum_<WASMImageIOJSBindingType::IOComponentType>("IOComponentType")
    .value("UNKNOWNCOMPONENTTYPE", itk::CommonEnums::IOComponent::UNKNOWNCOMPONENTTYPE)
    .value("UCHAR", itk::CommonEnums::IOComponent::UCHAR)
    .value("CHAR", itk::CommonEnums::IOComponent::CHAR)
    .value("USHORT", itk::CommonEnums::IOComponent::USHORT)
    .value("SHORT", itk::CommonEnums::IOComponent::SHORT)
    .value("UINT", itk::CommonEnums::IOComponent::UINT)
    .value("INT", itk::CommonEnums::IOComponent::INT)
    .value("ULONG", itk::CommonEnums::IOComponent::ULONG)
    .value("LONG", itk::CommonEnums::IOComponent::LONG)
    .value("ULONGLONG", itk::CommonEnums::IOComponent::ULONGLONG)
    .value("LONGLONG", itk::CommonEnums::IOComponent::LONGLONG)
    .value("FLOAT", itk::CommonEnums::IOComponent::FLOAT)
    .value("DOUBLE", itk::CommonEnums::IOComponent::DOUBLE)
    ;
  emscripten::class_<WASMImageIOJSBindingType>("ITKImageIO")
  .constructor<>()
  .function("SetNumberOfDimensions", &WASMImageIOJSBindingType::SetNumberOfDimensions)
  .function("GetNumberOfDimensions", &WASMImageIOJSBindingType::GetNumberOfDimensions)
  .function("SetFileName", &WASMImageIOJSBindingType::SetFileName)
  .function("GetFileName", &WASMImageIOJSBindingType::GetFileName)
  .function("CanReadFile", &WASMImageIOJSBindingType::CanReadFile)
  .function("CanWriteFile", &WASMImageIOJSBindingType::CanWriteFile)
  .function("ReadImageInformation", &WASMImageIOJSBindingType::ReadImageInformation)
  .function("WriteImageInformation", &WASMImageIOJSBindingType::WriteImageInformation)
  .function("SetDimensions", &WASMImageIOJSBindingType::SetDimensions)
  .function("GetDimensions", &WASMImageIOJSBindingType::GetDimensions)
  .function("SetOrigin", &WASMImageIOJSBindingType::SetOrigin)
  .function("GetOrigin", &WASMImageIOJSBindingType::GetOrigin)
  .function("SetSpacing", &WASMImageIOJSBindingType::SetSpacing)
  .function("GetSpacing", &WASMImageIOJSBindingType::GetSpacing)
  .function("SetDirection", &WASMImageIOJSBindingType::SetDirection)
  .function("GetDirection", &WASMImageIOJSBindingType::GetDirection)
  .function("GetDefaultDirection", &WASMImageIOJSBindingType::GetDefaultDirection)
  .function("SetPixelType", &WASMImageIOJSBindingType::SetPixelType)
  .function("GetPixelType", &WASMImageIOJSBindingType::GetPixelType)
  .function("SetComponentType", &WASMImageIOJSBindingType::SetComponentType)
  .function("GetComponentType", &WASMImageIOJSBindingType::GetComponentType)
  .function("GetImageSizeInPixels", &WASMImageIOJSBindingType::GetImageSizeInPixels)
  .function("GetImageSizeInBytes", &WASMImageIOJSBindingType::GetImageSizeInBytes)
  .function("GetImageSizeInComponents", &WASMImageIOJSBindingType::GetImageSizeInComponents)
  .function("SetNumberOfComponents", &WASMImageIOJSBindingType::SetNumberOfComponents)
  .function("GetNumberOfComponents", &WASMImageIOJSBindingType::GetNumberOfComponents)
  .function("Read", &WASMImageIOJSBindingType::Read)
  .function("Write", &WASMImageIOJSBindingType::Write)
  .function("SetUseCompression", &WASMImageIOJSBindingType::SetUseCompression)
  ;
}
