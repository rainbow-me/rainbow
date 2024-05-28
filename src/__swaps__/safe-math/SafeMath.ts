// Utility function to remove the decimal point and keep track of the number of decimal places
const removeDecimalWorklet = (num: string): [bigint, number] => {
  'worklet';
  const parts = num.split('.');
  const decimalPlaces = parts.length === 2 ? parts[1].length : 0;
  const bigIntNum = BigInt(parts.join(''));
  return [bigIntNum, decimalPlaces];
};

const isNumberStringWorklet = (value: string): boolean => {
  'worklet';
  return /^-?\d+(\.\d+)?$/.test(value);
};

const isZeroWorklet = (value: string): boolean => {
  'worklet';
  if (parseFloat(value) === 0) {
    return true;
  }
  return false;
};

// Utility function to scale the number up to 20 decimal places
const scaleUpWorklet = (bigIntNum: bigint, decimalPlaces: number): bigint => {
  'worklet';
  const scaleFactor = BigInt(10) ** BigInt(20);
  return (bigIntNum * scaleFactor) / BigInt(10) ** BigInt(decimalPlaces);
};

// Utility function to format the result with 20 decimal places and remove trailing zeros
const formatResultWorklet = (result: bigint): string => {
  'worklet';
  const isNegative = result < 0;
  const absResult = isNegative ? -result : result;
  const resultStr = absResult.toString().padStart(21, '0'); // 20 decimal places + at least 1 integer place
  const integerPart = resultStr.slice(0, -20) || '0';
  let fractionalPart = resultStr.slice(-20);
  fractionalPart = fractionalPart.replace(/0+$/, ''); // Remove trailing zeros
  const formattedResult = fractionalPart.length > 0 ? `${integerPart}.${fractionalPart}` : integerPart;
  return isNegative ? `-${formattedResult}` : formattedResult;
};

// Sum function
export function sumWorklet(num1: string, num2: string): string {
  'worklet';
  if (!isNumberStringWorklet(num1) || !isNumberStringWorklet(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  if (isZeroWorklet(num1)) {
    return num2;
  }

  if (isZeroWorklet(num2)) {
    return num1;
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 + scaledBigInt2;
  return formatResultWorklet(result);
}

// Subtract function
export function subWorklet(num1: string, num2: string): string {
  'worklet';
  if (!isNumberStringWorklet(num1) || !isNumberStringWorklet(num2)) {
    throw new Error('Arguments must be a numeric string');
  }

  if (isZeroWorklet(num2)) {
    return num1;
  }

  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 - scaledBigInt2;
  return formatResultWorklet(result);
}

// Multiply function
export function mulWorklet(num1: string, num2: string): string {
  'worklet';
  if (!isNumberStringWorklet(num1) || !isNumberStringWorklet(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  if (isZeroWorklet(num1) || isZeroWorklet(num2)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  const result = (scaledBigInt1 * scaledBigInt2) / BigInt(10) ** BigInt(20);
  return formatResultWorklet(result);
}

// Divide function
export function divWorklet(num1: string, num2: string): string {
  'worklet';
  if (!isNumberStringWorklet(num1) || !isNumberStringWorklet(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  if (isZeroWorklet(num2)) {
    throw new Error('Division by zero');
  }
  if (isZeroWorklet(num1)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  const result = (scaledBigInt1 * BigInt(10) ** BigInt(20)) / scaledBigInt2;
  return formatResultWorklet(result);
}

// Modulus function
export function modWorklet(num1: string, num2: string): string {
  'worklet';
  if (!isNumberStringWorklet(num1) || !isNumberStringWorklet(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  if (isZeroWorklet(num2)) {
    throw new Error('Division by zero');
  }
  if (isZeroWorklet(num1)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 % scaledBigInt2;
  return formatResultWorklet(result);
}

// Power function
export function powWorklet(base: string, exponent: string): string {
  'worklet';
  if (!isNumberStringWorklet(base) || !isNumberStringWorklet(exponent)) {
    throw new Error('Arguments must be a numeric string');
  }
  if (isZeroWorklet(base)) {
    return '0';
  }
  if (isZeroWorklet(exponent)) {
    return '1';
  }
  const [bigIntBase, decimalPlaces] = removeDecimalWorklet(base);
  const scaledBigIntBase = scaleUpWorklet(bigIntBase, decimalPlaces);
  const result = scaledBigIntBase ** BigInt(exponent) / BigInt(10) ** BigInt(20);
  return formatResultWorklet(result);
}

// Equality function
export function equalWorklet(num1: string, num2: string): boolean {
  'worklet';
  if (!isNumberStringWorklet(num1) || !isNumberStringWorklet(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  return scaledBigInt1 === scaledBigInt2;
}

// Greater than function
export function greaterThanWorklet(num1: string, num2: string): boolean {
  'worklet';
  if (!isNumberStringWorklet(num1) || !isNumberStringWorklet(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  return scaledBigInt1 > scaledBigInt2;
}

// Greater than or equal to function
export function greaterThanOrEqualToWorklet(num1: string, num2: string): boolean {
  'worklet';
  if (!isNumberStringWorklet(num1) || !isNumberStringWorklet(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  return scaledBigInt1 >= scaledBigInt2;
}

// Less than function
export function lessThanWorklet(num1: string, num2: string): boolean {
  'worklet';
  if (!isNumberStringWorklet(num1) || !isNumberStringWorklet(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  return scaledBigInt1 < scaledBigInt2;
}

// Less than or equal to function
export function lessThanOrEqualToWorklet(num1: string, num2: string): boolean {
  'worklet';
  if (!isNumberStringWorklet(num1) || !isNumberStringWorklet(num2)) {
    throw new Error('Arguments must be a numeric string');
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  return scaledBigInt1 <= scaledBigInt2;
}
