export function formatUSD(value = '0.00') {
  return Number(value || 0).toFixed(2);
}

export function formatUSDInput(value = '0.00') {
  const cents = value.replace(/\./g, '');

  return (parseInt(cents, 10) / 100).toFixed(2);
}

export function removeLeadingZeros(value = '') {
  return String(Number(value));
}

export default {
  formatUSD,
  formatUSDInput,
  removeLeadingZeros,
};

