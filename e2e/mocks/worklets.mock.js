// unused atm
export const divWorklet = (a, b) => {
  'worklet';
  return a / b;
};

export const floorWorklet = value => {
  'worklet';
  return Math.floor(value);
};

export const log10Worklet = value => {
  'worklet';
  return Math.log10(value);
};

export const powWorklet = (base, exponent) => {
  'worklet';
  return Math.pow(base, exponent);
};

export const mulWorklet = (a, b) => {
  'worklet';
  return a * b;
};

export const lessThanOrEqualToWorklet = (a, b) => {
  'worklet';
  return a <= b;
};

export const findNiceIncrement = availableBalance => {
  'worklet';

  const niceFactors = [1, 2, 10];
  const exactIncrement = divWorklet(availableBalance, 100);
  const orderOfMagnitude = floorWorklet(log10Worklet(exactIncrement));
  const baseIncrement = powWorklet(10, orderOfMagnitude);

  let adjustedIncrement = baseIncrement;

  for (let i = niceFactors.length - 1; i >= 0; i--) {
    const potentialIncrement = mulWorklet(baseIncrement, niceFactors[i]);
    if (lessThanOrEqualToWorklet(potentialIncrement, exactIncrement)) {
      adjustedIncrement = potentialIncrement;
      break;
    }
  }

  return adjustedIncrement;
};
