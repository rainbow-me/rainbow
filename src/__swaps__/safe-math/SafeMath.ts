// Utility function to remove the decimal point and keep track of the number of decimal places
const removeDecimal = (num: string): [bigint, number] => {
  const parts = num.split('.');
  const decimalPlaces = parts.length === 2 ? parts[1].length : 0;
  const bigIntNum = BigInt(parts.join(''));
  return [bigIntNum, decimalPlaces];
};

const isNumberString = (value: string): boolean => {
  return /^\d+(\.\d+)?$/.test(value);
};

const isZero = (value: string): boolean => {
  if (parseFloat(value) === 0) {
    return true;
  }
  return false;
};

// Utility function to scale the number up to 20 decimal places
const scaleUp = (bigIntNum: bigint, decimalPlaces: number): bigint => {
  const scaleFactor = BigInt(10) ** (BigInt(20) - BigInt(decimalPlaces));
  return bigIntNum * scaleFactor;
};

// Utility function to format the result with 20 decimal places and remove trailing zeros
const formatResult = (result: bigint): string => {
  const resultStr = result.toString().padStart(21, '0'); // 20 decimal places + at least 1 integer place
  const integerPart = resultStr.slice(0, -20) || '0';
  let fractionalPart = resultStr.slice(-20);
  fractionalPart = fractionalPart.replace(/0+$/, ''); // Remove trailing zeros
  return fractionalPart.length > 0 ? `${integerPart}.${fractionalPart}` : integerPart;
};

// Sum function
export function sum(num1: string, num2: string): string {
  if (!isNumberString(num1) || !isNumberString(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  if (isZero(num1)) {
    return num2;
  }

  if (isZero(num2)) {
    return num1;
  }
  const [bigInt1, decimalPlaces1] = removeDecimal(num1);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 + scaledBigInt2;
  return formatResult(result);
}

// Subtract function
export function sub(num1: string, num2: string): string {
  if (!isNumberString(num1) || !isNumberString(num2)) {
    throw new Error('Arguments must be a numeric string');
  }

  if (isZero(num2)) {
    return num1;
  }

  const [bigInt1, decimalPlaces1] = removeDecimal(num1);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 - scaledBigInt2;
  return formatResult(result);
}

// Multiply function
export function mul(num1: string, num2: string): string {
  if (!isNumberString(num1) || !isNumberString(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  if (isZero(num1) || isZero(num2)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimal(num1);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  const result = (scaledBigInt1 * scaledBigInt2) / BigInt(10) ** BigInt(20);
  return formatResult(result);
}

// Divide function
export function div(num1: string, num2: string): string {
  if (!isNumberString(num1) || !isNumberString(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  if (isZero(num2)) {
    throw new Error('Division by zero');
  }
  if (isZero(num1)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimal(num1);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  const result = (scaledBigInt1 * BigInt(10) ** BigInt(20)) / scaledBigInt2;
  return formatResult(result);
}

// Modulus function
export function mod(num1: string, num2: string): string {
  if (!isNumberString(num1) || !isNumberString(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  if (isZero(num2)) {
    throw new Error('Division by zero');
  }
  if (isZero(num1)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimal(num1);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 % scaledBigInt2;
  return formatResult(result);
}

// Power function
export function pow(base: string, exponent: string): string {
  if (!isNumberString(base) || !isNumberString(exponent)) {
    throw new Error('Arguments must be a numeric string');
  }
  if (isZero(base)) {
    return '0';
  }
  if (isZero(exponent)) {
    return '1';
  }
  const [bigIntBase, decimalPlaces] = removeDecimal(base);
  const scaledBigIntBase = scaleUp(bigIntBase, decimalPlaces);
  const result = scaledBigIntBase ** BigInt(exponent) / BigInt(10) ** BigInt(20);
  return formatResult(result);
}
