export function formatUSD(value = '0.00') {
  return Number(value || 0).toFixed(2);
}

export function formatUSDInput(value = '0.00') {
  const cents = value.replace(/\./g, '');

  return (parseInt(cents, 10) / 100).toFixed(2);
}

export function removeLeadingZeros(value = '') {
  if (value.length > 1 && value.substring(0, 1) === '0' && value.substring(1, 2) !== '.') {
    return removeLeadingZeros(value.substring(1));
  }

  if (value.substring(value.length - 1, value.length) === '.' && value.indexOf('.') !== value.length - 1) {
    return value.substring(0, value.length - 1);
  }

  return value;
}

export function uppercase(value = '') {
  return value.substring(0, 1).toUpperCase() + value.substring(1);
}

export default {
  formatUSD,
  formatUSDInput,
  removeLeadingZeros,
  uppercase,
};

