# hydraulic-cylinder-calc

TypeScript Node.js CLI for hydraulic cylinder sizing. No runtime dependencies.
Requires Node.js 18 or later and npm.

```sh
npm install
npm run build
npm test
```

Calculate areas and forces:

```sh
node dist/cli.js --bore 63 --rod 36 --pressure 100
```

This gives a piston area of 3117.2 mm², an annulus area of 2099.4 mm²,
and theoretical extend/retract forces of 31.17/20.99 kN. The default
0.9 efficiency gives effective forces of 28.06/18.89 kN.

Add flow and stroke for speeds, times, and oil volumes:

```sh
node dist/cli.js --bore 63 --rod 36 --pressure 100 --flow 20 --stroke 500 --efficiency 0.9
node dist/cli.js --bore 63 --rod 36 --pressure 100 --flow 20 --stroke 500 --json
node dist/cli.js --help
```

At 20 L/min, extend speed is 106.9 mm/s. At a 500 mm stroke,
extend oil volume is 1.5586 L and extend time is 4.68 s.
The package also exposes the `hydraulic-cylinder-calc` executable when installed.

| Option | Unit | Meaning |
| --- | --- | --- |
| `--bore` | mm | Required piston bore diameter |
| `--rod` | mm | Required rod diameter; must be smaller than bore |
| `--pressure` | bar | Required operating pressure |
| `--flow` | L/min | Optional flow; enables both speeds |
| `--stroke` | mm | Optional stroke; enables both oil volumes |
| `--efficiency` | dimensionless | Force multiplier, default 0.9 |
| `--json` | — | Print unrounded structured results as JSON |
| `--help`, `-h` | — | Display usage |

All numeric inputs must be positive and finite. Invalid, missing, duplicate,
or unknown options produce an error on stderr and a nonzero exit status.
Times require both flow and stroke. Efficiency scales forces only; speeds
and times use ideal flow. Oil volumes describe the chamber filled during each
stroke, excluding plumbing and dead volume.

Calculations use:

- Piston area: A = π × bore² / 4, in mm².
- Annulus area: A = π × (bore² − rod²) / 4, in mm².
- Area in cm² = area in mm² / 100.
- Theoretical force in N = pressure in bar × 0.1 × area in mm².
- Force in kN = force in N / 1000; effective force = theoretical force × efficiency.
- Speed in mm/s = flow in L/min × 1,000,000 / 60 / area in mm².
- Time in seconds = stroke in mm / speed in mm/s.
- Oil volume in L = area in mm² × stroke in mm / 1,000,000.
- Area ratio = piston area / annulus area.

JSON keys include `pistonArea` and `annulusArea` (`mm2`, `cm2`),
`forceKN` (`extend`, `retract`, each with `theoretical` and `withEfficiency`),
`efficiency`, and `areaRatio`. Optional `speedMmPerS`, `timeS`, and `oilVolumeL`
objects each contain `extend` and `retract`. Unavailable outputs are omitted.

Licensed under the [MIT license](LICENSE).
