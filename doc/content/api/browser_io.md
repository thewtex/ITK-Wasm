title: Web Browser Input/Output
---

These Input/Output (IO) functions can be used from within a web browser's JavaScript runtime. *itk-wasm* is best tested in Chrome, but it is used and designed to work on Chrome, Firefox, Microsoft Edge, Safari, and other browsers, including mobile browsers. In general, older browsers will function, but users on newer browsers will experience improved performance.

The *itk-wasm* IO functions convert native brower objects, [File](https://developer.mozilla.org/en-US/docs/Web/API/File)'s, [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)'s, and [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)'s to / from JavaScript objects with [TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)'s for binary data.

Most of these functions return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

These functions return the [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) used for computation. They also optionally accept a web worker from a previous execution as their first argument -- pass the worker generated from execution or `null` if one is not available. Re-using workers can greatly improve performance.

---

## readFile(webWorker, file) -> { webWorker, [image](./Image.html), [mesh](./Mesh.html), [polyData](https://insightsoftwareconsortium.github.io/itk-wasm/docs/polydata_formats.html) }

Read an image or mesh or poly data from a [File](https://developer.mozilla.org/en-US/docs/Web/API/File).


## readBlob(webWorker, blob, fileName, mimeType) -> { webWorker, [image](./Image.html), [mesh](./Mesh.html), [polyData](https://insightsoftwareconsortium.github.io/itk-wasm/docs/polydata_formats.html) }

Read an image or mesh or poly data from a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob). `fileName` is a string with the file name. `mimeType` is an optional mime-type string.

## readArrayBuffer(webWorker, arrayBuffer, fileName, mimeType) -> { webWorker, [image](./Image.html) or [mesh](./Mesh.html) }

Read an image or mesh from an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer). `fileName` is a string with the file name. `mimeType` is an optional mime-type string.

## writeArrayBuffer(webWorker, useCompression, imageOrMesh, fileName, mimeType) ->  { webWorker, [arrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) }

Write an image or mesh to a an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).

*useCompression*: compress the pixel data when possible
*imageOrMesh*:    [itk/Image](./Image.html) or [itk/Mesh](./Mesh.html) instance to write
*fileName*:       name that would be used for the resulting file
*mimeType*:       optional mime-type for the resulting file

---

## readImageFile(webWorker, file) -> { webWorker, [image](./Image.html) }

Read an image from a [File](https://developer.mozilla.org/en-US/docs/Web/API/File).

## readImageBlob(webWorker, blob, fileName, mimeType) -> { webWorker, [image](./Image.html) }

Read an image from a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob). `fileName` is a string with the file name. `mimeType` is an optional mime-type string.

## readImageArrayBuffer(webWorker, arrayBuffer, fileName, mimeType) -> { webWorker, [image](./Image.html) }

Read an image from an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer). `fileName` is a string with the file name. `mimeType` is an optional mime-type string.

## readImageHTTP(url) -> [image](./Image.html)

Read a server-side generated image created with [`itk::WASMImageIO`](https://github.com/InsightSoftwareConsortium/itk-wasm/blob/master/include/itkWASMImageIO.h). The primary `*.json` file should be served at the given `url` and the pixel buffer file served at `url + ".data"`

## readImageFileSeries(fileList, zSpacing=1.0, zOrigin=0.0, sortedSeries=false) -> { [image](./Image.html), webWorkerPool }

Read an image from a series of [File](https://developer.mozilla.org/en-US/docs/Web/API/File)'s or [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)'s stored in an [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) or [FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList).

The `zSpacing` and `zOrigin` arguments enable specification of the spacing and origin in the third dimension.

By default, files are sorted by name, lexicographically. To sort by a different method, sort the files first, then set `sortedSeries` to `true`.

The used `webWorkerPool` is returned to enable resource cleanup by calling `.terminateWorkers()`.

## readImageDICOMFileSeries(fileList, singleSortedSeries=false) -> { [image](./Image.html), webWorkerPool }

Read an image from a series of DICOM [File](https://developer.mozilla.org/en-US/docs/Web/API/File)'s or [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)'s stored in an [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) or [FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList).

If the files are known to be from a single, sorted series, the last argument can be set to true for performance.

The used `webWorkerPool` is returned to enable resource cleanup by calling `.terminateWorkers()`.

## readDICOMTags(webWorker, file, tags=[]) -> { tags, webWorker }

Read tags from a DICOM [File](https://developer.mozilla.org/en-US/docs/Web/API/File).

Tags should be of the form `"GGGG|EEEE"`, where `GGGG` is the group ID in hex and `EEEE` is the element ID in hex. As an example, "0010|0010" is the PatientID.
Hexadecimal strings are treated case-insensitively.
A web worker object can be optionally provided to re-use a previously created web worker.
Otherwise, leave this null.

Returns:
- tags: a [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) containing the mapping from tag to tag value.
- webWorker: a webworker that can be re-used.

## writeImageArrayBuffer(webWorker, useCompression, image, fileName, mimeType) ->  { webWorker, [arrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) }

Write an image to a an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).

*useCompression*: compress the pixel data when possible
*image*:          [itk/Image](./Image.html) instance to write
*fileName*:       name that would be used for the resulting file
*mimeType*:       optional mime-type for the resulting file

---

## readMeshFile(webWorker, file) -> { webWorker, [mesh](./Mesh.html) }

Read a mesh from a [File](https://developer.mozilla.org/en-US/docs/Web/API/File).

## readMeshBlob(webWorker, blob, fileName, mimeType) -> { webWorker, [mesh](./Mesh.html) }

Read an mesh from a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob). `fileName` is a string with the file name. `mimeType` is an optional mime-type string.

## readMeshArrayBuffer(webWorker, arrayBuffer, fileName, mimeType) -> { webWorker, [mesh](./Mesh.html) }

Read an mesh from an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer). `fileName` is a string with the file name. `mimeType` is an optional mime-type string.

## writeMeshArrayBuffer(webWorker, useCompression, mesh, fileName, mimeType) ->  { webWorker, [arrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) }

Write an mesh to a an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer).

*useCompression*: compress the pixel data when possible
*mesh*:           [itk/Mesh](./Mesh.html) instance to write
*fileName*:       name that would be used for the resulting file
*mimeType*:       optional mime-type for the resulting file

---

## readPolyDataFile(webWorker, file) -> { webWorker, [polyData](https://kitware.github.io/vtk-js/docs/structures_PolyData.html) }

Read a vtk.js PolyData from a [File](https://developer.mozilla.org/en-US/docs/Web/API/File).

## readPolyDataBlob(webWorker, blob, fileName, mimeType) -> { webWorker, [polyData](https://kitware.github.io/vtk-js/docs/structures_PolyData.html) }

Read a vtk.js PolyData from a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob). `fileName` is a string with the file name. `mimeType` is an optional mime-type string.

## readPolyDataArrayBuffer(webWorker, arrayBuffer, fileName, mimeType) -> { webWorker, [polyData](https://kitware.github.io/vtk-js/docs/structures_PolyData.html) }

Read a vtk.js PolyData from an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer). `fileName` is a string with the file name. `mimeType` is an optional mime-type string.
