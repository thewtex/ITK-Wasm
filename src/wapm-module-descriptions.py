#!/usr/bin/env python3

from pathlib import Path
import argparse
import sys

from itk.support.helpers import camel_to_snake_case

parser = argparse.ArgumentParser(description='Create WASI module descriptions for WAPM.')
parser.add_argument('inputdir',
                    help='WASI modules directory')
parser.add_argument('output', nargs='?', type=argparse.FileType('w'),
                     default=sys.stdout, help='Output file')

args = parser.parse_args()
inputdir = Path(args.inputdir)
output = args.output

modules = [w for w in inputdir.glob('*.wasi.wasm')]
if len(modules) < 1:
    print('No modules found.')
    sys.exit(1)

module_source = modules[0].name
module_name = modules[0].stem[:-5]
command_name = camel_to_snake_case(module_name).replace('_', '-')

for module in modules:
    output.write('[[module]]\n')
    output.write(f'name = "{module_name}"\n')
    output.write(f'source = "{module_source}"\n')
    output.write('abi = "wasi"\n')
    output.write('\n')
    output.write('[module.interfaces]\n')
    output.write('wasi = "0.0.0-unstable"\n')
    output.write('\n')
    output.write('[[command]]\n')
    output.write(f'name = "{command_name}"\n')
    output.write(f'module = "{module_name}"\n')
    output.write('\n')
    output.write('\n')

