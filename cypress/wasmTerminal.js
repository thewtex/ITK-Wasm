import WasmTerminal, { fetchCommandFromWAPM } from "@wasmer/wasm-terminal";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import { WasmFs } from "@wasmer/wasmfs";

// From webassembly.sh
const curlCli = async (options, wasmFs) => {
  const VERSION = "0.0.1";

  const help = () => {
    return (
      [
        "",
        "Usage: curl [options] [url]...",
        "",
        "Curl is a simple HTTP client",
        "",
        "Options:",
        "",
        "  -h, --help           output usage information",
        "  -o, --output         Output the contents to a file",
        "  -v, --version        output version number",
        "",
        "Usage:",
        "",
        "# Download file",
        "$ curl https://api.github.com/repos/wasmerio/wasmer/issues?state=closed",
        "",
      ].join("\n  ") + "\n"
    );
  };

  const firstNonFlag = args => {
    for (var i = 0; i < args.length; i++) {
      if (args[i].charAt(0) != "-") {
        return args[i];
      }
    }
    return "";
  };

  const curl = async ({url, output}, wasmFs) => {
      const response = await fetch(url, {credentials: 'omit'});
      const responseArray = await response.arrayBuffer();
      let view = new Uint8Array(responseArray); // treat buffer as a sequence of 32-bit integers
      if (!output) {
          output = "/dev/stdout"
      }
      wasmFs.fs.writeFileSync(
          output,
          view
      );
  };

  const argv = options.args.slice(1);

  if (argv.indexOf("--help") !== -1 || argv.indexOf("-h") !== -1) {
    return help();
  } else if (argv.indexOf("--version") !== -1 || argv.indexOf("-v") !== -1) {
    return VERSION;
  } else if (argv.length) {
    var destinationIndex =
      argv.indexOf("--output") + argv.indexOf("-o") + 2;

    var args = {};
    if (destinationIndex) {
      args.output = argv[destinationIndex];
      argv.splice(destinationIndex - 1, 2);
    }
    args.url = firstNonFlag(argv);
    if (args.url.length > 0) {
      return await curl(args, wasmFs);
    } else {
      return help();
    }
  } else {
    return help();
  }
};


const fetchCommandHandler = async ({args}) => {
  let commandName = args[0];
  if (commandName === "curl") {
    return curlCli;
  } else if (commandName.startsWith('dist/')) {
    const response = await fetch(commandName)
    const wasmBinary = await response.arrayBuffer();
    return await lowerI64Imports(new Uint8Array(wasmBinary));
  }

  // Let's fetch a wasm Binary from WAPM for the command name.
  const wasmBinary = await fetchCommandFromWAPM({args});

  // lower i64 imports from Wasi Modules, so that most Wasi modules
  // Can run in a Javascript context.
  return await lowerI64Imports(wasmBinary);
};

const wasmFs = new WasmFs()

const wasmTerminal = new WasmTerminal({
  fetchCommand: fetchCommandHandler,
  processWorkerUrl: './node_modules/@wasmer/wasm-terminal/lib/workers/process.worker.js',
  wasmFs,
});

// Let's print out our initial message
wasmTerminal.print(`itk-wasm test shell.

Commands starting with \`dist/\` will be fetched locally. Others will be fetched from WAPM.`);

// Let's bind our Wasm terminal to it's container
const containerElement = document.querySelector("#root");
wasmTerminal.open(containerElement);
wasmTerminal.fit();
wasmTerminal.focus();

// Later, when we are done with the terminal, let's destroy it
// wasmTerminal.destroy();