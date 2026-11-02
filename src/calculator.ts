export interface Inputs {
  bore: number;
  rod: number;
  pressure: number;
  flow?: number;
  stroke?: number;
  efficiency?: number;
}

export function calculate(inputs: Inputs) {
  const { bore, rod, pressure, flow, stroke, efficiency = 0.9 } = inputs;
  for (const [name, value] of Object.entries({ bore, rod, pressure, flow, stroke, efficiency })) {
    if (value === undefined && (name === 'flow' || name === 'stroke')) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} must be a positive finite number.`);
    }
  }
  if (rod >= bore) throw new Error('rod must be smaller than bore.');
  const piston = Math.PI * bore ** 2 / 4;
  const annulus = Math.PI * (bore ** 2 - rod ** 2) / 4;
  const extend = pressure * 0.1 * piston / 1000;
  const retract = pressure * 0.1 * annulus / 1000;
  const speed = flow === undefined ? undefined : {
    extend: flow * 1e6 / 60 / piston,
    retract: flow * 1e6 / 60 / annulus,
  };
  const result = {
    efficiency,
    pistonArea: { mm2: piston, cm2: piston / 100 },
    annulusArea: { mm2: annulus, cm2: annulus / 100 },
    forceKN: {
      extend: { theoretical: extend, withEfficiency: extend * efficiency },
      retract: { theoretical: retract, withEfficiency: retract * efficiency },
    },
    areaRatio: piston / annulus,
    ...(speed === undefined ? {} : { speedMmPerS: speed }),
    ...(stroke === undefined ? {} : {
      oilVolumeL: { extend: piston * stroke / 1e6, retract: annulus * stroke / 1e6 },
    }),
    ...(stroke === undefined || speed === undefined ? {} : {
      timeS: { extend: stroke / speed.extend, retract: stroke / speed.retract },
    }),
  };
  // Reject overflow/underflow rather than printing invalid numerical results.
  function check(value: unknown): void {
    if (typeof value === 'number' && (!Number.isFinite(value) || value <= 0)) {
      throw new Error('Inputs produce results outside the supported numeric range.');
    }
    if (typeof value === 'object' && value !== null) Object.values(value).forEach(check);
  }
  check(result);
  return result;
}
