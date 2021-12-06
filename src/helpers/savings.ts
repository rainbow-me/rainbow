import BigNumber from 'bignumber.js';

const STABLECOINS = ['DAI', 'USDC', 'USDT'];
const APPROX_BLOCK_TIME = 15;
const MAX_DECIMALS_TO_SHOW = 10;
const BLOCKS_PER_YEAR = (60 / APPROX_BLOCK_TIME) * 60 * 24 * 365;

const calculateAPY = supplyRate => {
  if (!supplyRate) return (0).toFixed(2);
  const periodicRate = (supplyRate * 1) / BLOCKS_PER_YEAR;
  return (Math.pow(1 + periodicRate, BLOCKS_PER_YEAR - 1) - 1) * 100;
};

const calculateEarningsInDays = (principal, supplyRate, days) => {
  const totalReturn = calculateCompoundInterestInDays(
    principal,
    supplyRate,
    days
  );
  return totalReturn - principal;
};

const calculateCompoundInterestInDays = (principal, apr, days) => {
  const periodicRate = apr / BLOCKS_PER_YEAR;
  const periods = (60 / APPROX_BLOCK_TIME) * 60 * 24 * days;
  return principal * Math.pow(1 + periodicRate, periods);
};

const formatSavingsAmount = amount => {
  const amountBN = BigNumber(amount);
  return amountBN.toFixed(MAX_DECIMALS_TO_SHOW);
};

const isSymbolStablecoin = symbol => STABLECOINS.indexOf(symbol) !== -1;
const isSymbolStablecoinWorklet = symbol => {
  'worklet';
  return STABLECOINS.indexOf(symbol) !== -1;
};

export {
  APPROX_BLOCK_TIME,
  calculateAPY,
  calculateCompoundInterestInDays,
  calculateEarningsInDays,
  formatSavingsAmount,
  isSymbolStablecoin,
  isSymbolStablecoinWorklet,
};
