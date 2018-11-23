export function formatUSD(value = '0.00') {
  return Number(value || 0).toFixed(2);
}

export function formatUSDInput(value = '') {
  const formattedValue = removeLeadingZeros(value);
  const parts = formattedValue.split('.');
  const decimals = parts[1] || '';

  if (decimals.length > 2) {
    return `${parts[0]}.${decimals.substring(0, 2)}`;
  }

  return formattedValue;
}

export function removeLeadingZeros(value = '') {
  if (value.length > 1 && value.substring(0, 1) === '0' && value.substring(1, 2) !== '.') {
    return removeLeadingZeros(value.substring(1));
  }

  if (value.substring(value.length - 1, value.length) === '.' && value.indexOf('.') !== value.length - 1) {
    return value.substring(0, value.length - 1);
  }

  if (value.substring(0, 1) === '.') {
    return `0${value}`;
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

