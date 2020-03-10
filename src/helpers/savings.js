const calculateAPY = supplyRate => {
  const approxBlockTime = 15;
  let blocksPerYear = (60 / approxBlockTime) * 60 * 24 * 365;
  const periodicRate = (supplyRate * 1) / blocksPerYear;
  return ((Math.pow(1 + periodicRate, blocksPerYear - 1) - 1) * 100).toFixed(2);
};

const calculateCompoundInterestPerBlock = (amount, apy) => {
  const approxBlockTime = 15;
  let blocksPerYear = (60 / approxBlockTime) * 60 * 24 * 365;
  const totalInterest = amount * (apy / 100);
  return (1 / blocksPerYear) * totalInterest;
};

export { calculateAPY, calculateCompoundInterestPerBlock };
