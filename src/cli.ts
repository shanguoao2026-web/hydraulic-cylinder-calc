#!/usr/bin/env node
import { calculate, type Inputs } from './calculator.js';
import { pathToFileURL } from 'node:url';

const help = `Hydraulic cylinder sizing calculator

Usage: hydraulic-cylinder-calc --bore <mm> --rod <mm> --pressure <bar> [options]

Required:
  --bore <mm>          Piston bore diameter
  --rod <mm>           Rod diameter (smaller than bore)
  --pressure <bar>     Operating pressure
Options:
  --flow <L/min>       Oil flow for speeds
  --stroke <mm>        Stroke for oil volumes; with flow, travel times
  --efficiency <n>     Force multiplier (default: 0.9)
  --json              Output JSON
  --help, -h          Show help

All numeric inputs must be positive and finite.`;

export function main(args: string[]): void {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
    console.log(help);
    return;
  }
  const inputs: Partial<Inputs> = {};
  const seen = new Set<string>();
  let json = false;
  const names = ['bore', 'rod', 'pressure', 'flow', 'stroke', 'efficiency'] as const;
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (seen.has(flag)) throw new Error(`Duplicate option: ${flag}`);
    seen.add(flag);
    if (flag === '--json') { json = true; continue; }
    const name = names.find(name => flag === `--${name}`);
    if (!name) throw new Error(`Unknown option: ${flag}. Use --help for usage.`);
    const raw = args[++index];
    if (raw === undefined || raw.startsWith('--')) throw new Error(`Missing value for ${flag}.`);
    if (!/^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
      throw new Error(`${name} must be a positive finite number.`);
    }
    inputs[name] = Number(raw);
  }
  for (const name of ['bore', 'rod', 'pressure'] as const) {
    if (inputs[name] === undefined) throw new Error(`Missing required option: --${name}. Use --help for usage.`);
  }
  const result = calculate(inputs as Inputs);
  if (json) { console.log(JSON.stringify(result, null, 2)); return; }
  const format = (value: number, digits = 2) => value.toFixed(digits);
  console.log(`Piston area: ${format(result.pistonArea.mm2, 1)} mm² (${format(result.pistonArea.cm2)} cm²)`);
  console.log(`Annulus area: ${format(result.annulusArea.mm2, 1)} mm² (${format(result.annulusArea.cm2)} cm²)`);
  for (const direction of ['extend', 'retract'] as const) {
    const label = direction === 'extend' ? 'Extend' : 'Retract';
    const force = result.forceKN[direction];
    console.log(`${label} force: ${format(force.theoretical)} kN theoretical; ${format(force.withEfficiency)} kN with efficiency ${result.efficiency}`);
    if (result.speedMmPerS) console.log(`${label} speed: ${format(result.speedMmPerS[direction], 1)} mm/s`);
    if (result.timeS) console.log(`${label} time: ${format(result.timeS[direction])} s`);
    if (result.oilVolumeL) console.log(`${label} oil volume: ${format(result.oilVolumeL[direction], 4)} L`);
  }
  console.log(`Area ratio (piston / annulus): ${format(result.areaRatio, 4)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
try { main(process.argv.slice(2)); }
catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

}
