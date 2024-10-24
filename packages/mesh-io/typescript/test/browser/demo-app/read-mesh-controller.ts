import * as meshIo from "../../../dist/index.js";
import readMeshLoadSampleInputs, {
  usePreRun,
} from "./read-mesh-load-sample-inputs.js";

class ReadMeshModel {
  inputs: Map<string, any>;
  options: Map<string, any>;
  outputs: Map<string, any>;

  constructor() {
    this.inputs = new Map();
    this.options = new Map();
    this.outputs = new Map();
  }
}

class ReadMeshController {
  constructor(loadSampleInputs) {
    this.loadSampleInputs = loadSampleInputs;

    this.model = new ReadMeshModel();
    const model = this.model;

    this.webWorker = null;

    if (loadSampleInputs) {
      const loadSampleInputsButton = document.querySelector(
        "#readMeshInputs [name=loadSampleInputs]",
      );
      loadSampleInputsButton.setAttribute("style", "display: block-inline;");
      loadSampleInputsButton.addEventListener("click", async (event) => {
        loadSampleInputsButton.loading = true;
        await loadSampleInputs(model);
        loadSampleInputsButton.loading = false;
      });
    }

    // ----------------------------------------------
    // Inputs
    const serializedMeshElement = document.querySelector(
      "#readMeshInputs input[name=serialized-mesh-file]",
    );
    serializedMeshElement.addEventListener("change", async (event) => {
      const dataTransfer = event.dataTransfer;
      const files = event.target.files || dataTransfer.files;

      const arrayBuffer = await files[0].arrayBuffer();
      model.inputs.set("serializedMesh", {
        data: new Uint8Array(arrayBuffer),
        path: files[0].name,
      });
      const details = document.getElementById(
        "readMesh-serialized-mesh-details",
      );
      details.innerHTML = `<pre>${globalThis.escapeHtml(model.inputs.get("serializedMesh").data.subarray(0, 50).toString() + " ...")}</pre>`;
      details.disabled = false;
    });

    // ----------------------------------------------
    // Options
    const informationOnlyElement = document.querySelector(
      "#readMeshInputs sl-checkbox[name=information-only]",
    );
    informationOnlyElement.addEventListener("sl-change", (event) => {
      model.options.set("informationOnly", informationOnlyElement.checked);
    });

    // ----------------------------------------------
    // Outputs
    const meshOutputDownload = document.querySelector(
      "#readMeshOutputs sl-button[name=mesh-download]",
    );
    meshOutputDownload.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (model.outputs.has("mesh")) {
        const meshDownloadFormat =
          document.getElementById("mesh-output-format");
        const downloadFormat = meshDownloadFormat.value || "nrrd";
        const fileName = `mesh.${downloadFormat}`;
        const { webWorker, serializedMesh } = await meshIo.writeMesh(
          model.outputs.get("mesh"),
          fileName,
        );

        webWorker.terminate();
        globalThis.downloadFile(serializedMesh, fileName);
      }
    });

    const preRun = async () => {
      if (!this.webWorker && loadSampleInputs && usePreRun) {
        await loadSampleInputs(model, true);
        await this.run();
      }
    };

    const onSelectTab = async (event) => {
      if (event.detail.name === "readMesh-panel") {
        const params = new URLSearchParams(window.location.search);
        if (
          !params.has("functionName") ||
          params.get("functionName") !== "readMesh"
        ) {
          params.set("functionName", "readMesh");
          const url = new URL(document.location);
          url.search = params;
          window.history.replaceState({ functionName: "readMesh" }, "", url);
          await preRun();
        }
      }
    };

    const tabGroup = document.querySelector("sl-tab-group");
    tabGroup.addEventListener("sl-tab-show", onSelectTab);
    function onInit() {
      const params = new URLSearchParams(window.location.search);
      if (
        params.has("functionName") &&
        params.get("functionName") === "readMesh"
      ) {
        tabGroup.show("readMesh-panel");
        preRun();
      }
    }
    onInit();

    const runButton = document.querySelector(
      '#readMeshInputs sl-button[name="run"]',
    );
    runButton.addEventListener("click", async (event) => {
      event.preventDefault();

      if (!model.inputs.has("serializedMesh")) {
        globalThis.notify(
          "Required input not provided",
          "serializedMesh",
          "danger",
          "exclamation-octagon",
        );
        return;
      }

      try {
        runButton.loading = true;

        const t0 = performance.now();
        const { mesh } = await this.run();
        const t1 = performance.now();
        globalThis.notify(
          "readMesh successfully completed",
          `in ${t1 - t0} milliseconds.`,
          "success",
          "rocket-fill",
        );

        model.outputs.set("mesh", mesh);
        meshOutputDownload.variant = "success";
        meshOutputDownload.disabled = false;
        const meshDetails = document.getElementById("readMesh-mesh-details");
        meshDetails.innerHTML = `<pre>${globalThis.escapeHtml(JSON.stringify(mesh, globalThis.interfaceTypeJsonReplacer, 2))}</pre>`;
        meshDetails.disabled = false;
        const meshOutput = document.getElementById("readMesh-mesh-details");
      } catch (error) {
        globalThis.notify(
          "Error while running pipeline",
          error.toString(),
          "danger",
          "exclamation-octagon",
        );
        throw error;
      } finally {
        runButton.loading = false;
      }
    });
  }

  async run() {
    const options = Object.fromEntries(this.model.options.entries());
    options.webWorker = this.webWorker;
    const { webWorker, mesh } = await meshIo.readMesh(
      {
        data: this.model.inputs.get("serializedMesh").data.slice(),
        path: this.model.inputs.get("serializedMesh").path,
      },
      options,
    );
    this.webWorker = webWorker;

    return { mesh };
  }
}

const readMeshController = new ReadMeshController(readMeshLoadSampleInputs);
