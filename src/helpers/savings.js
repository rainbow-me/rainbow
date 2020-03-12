const APROX_BLOCK_TIME = 15;

const calculateAPY = supplyRate => {
  if (!supplyRate) return (0).toFixed(2);
  let blocksPerYear = (60 / APROX_BLOCK_TIME) * 60 * 24 * 365;
  const periodicRate = (supplyRate * 1) / blocksPerYear;
  return ((Math.pow(1 + periodicRate, blocksPerYear - 1) - 1) * 100).toFixed(2);
};

const calculateCompoundInterestPerBlock = (amount, apy) => {
  let blocksPerYear = (60 / APROX_BLOCK_TIME) * 60 * 24 * 365;
  const totalInterest = amount * (apy / 100);
  return (1 / blocksPerYear) * totalInterest;
};

const calculateEarningsInDays = (amount, apr, days) => {
  const apy = calculateAPY(apr);
  const compoundInterestPerBlock = calculateCompoundInterestPerBlock(
    amount,
    apy
  );
  const blocksPerMinute = 60 / APROX_BLOCK_TIME;
  return compoundInterestPerBlock * blocksPerMinute * 60 * 24 * days;
};

export {
  calculateAPY,
  calculateCompoundInterestPerBlock,
  calculateEarningsInDays,
  APROX_BLOCK_TIME,
};
