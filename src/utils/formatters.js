export function formatUSD(value = '0.00') {
  const cents = value.replace(/\./g, '');

  return (parseInt(cents, 10) / 100).toFixed(2);
}

export default {
  formatUSD,
};

