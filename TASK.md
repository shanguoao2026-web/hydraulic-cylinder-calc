# hydraulic-cylinder-calc

TypeScript Node CLI (no runtime deps; dev deps typescript, @types/node; tests with node:test). MIT license, English README with examples.

Hydraulic cylinder sizing calculator:
- Inputs: --bore (mm), --rod (mm), --pressure (bar), optional --flow (L/min), optional --stroke (mm), optional --efficiency (default 0.9), --json flag.
- Outputs: piston area, annulus area (mm² and cm²), extend force and retract force (kN, theoretical and with efficiency), extend/retract speed (mm/s) if flow given, extend/retract time (s) and oil volume (L) if stroke also given, area ratio.
- Formulas: A = pi*D²/4; F[N] = p[bar]*0.1[MPa/bar]*A[mm²]; v[mm/s] = Q[L/min]*1e6/60/A[mm²].
- Validate: rod < bore, all positive; clear error messages, non-zero exit.
- Check: bore 63 rod 36 at 100 bar -> piston area 3117.2 mm², extend force 31.17 kN theoretical; annulus 2099.4 mm², retract 20.99 kN. Flow 20 L/min -> extend 106.9 mm/s.
- .gitignore: node_modules, dist, *.log. No secrets, emails, or local paths.
Run npm install, build, npm test until all pass.
