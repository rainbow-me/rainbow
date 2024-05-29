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

// Helper function to handle string and number input types
const toStringWorklet = (value: string | number): string => {
  'worklet';
  return typeof value === 'number' ? value.toString() : value;
};

// Sum function
export function sumWorklet(num1: string | number, num2: string | number): string {
  'worklet';
  const num1Str = toStringWorklet(num1);
  const num2Str = toStringWorklet(num2);

  if (!isNumberStringWorklet(num1Str) || !isNumberStringWorklet(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZeroWorklet(num1Str)) {
    return num2Str;
  }

  if (isZeroWorklet(num2Str)) {
    return num1Str;
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2Str);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 + scaledBigInt2;
  return formatResultWorklet(result);
}

// Subtract function
export function subWorklet(num1: string | number, num2: string | number): string {
  'worklet';
  const num1Str = toStringWorklet(num1);
  const num2Str = toStringWorklet(num2);

  if (!isNumberStringWorklet(num1Str) || !isNumberStringWorklet(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }

  if (isZeroWorklet(num2Str)) {
    return num1Str;
  }

  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2Str);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 - scaledBigInt2;
  return formatResultWorklet(result);
}

// Multiply function
export function mulWorklet(num1: string | number, num2: string | number): string {
  'worklet';
  const num1Str = toStringWorklet(num1);
  const num2Str = toStringWorklet(num2);

  if (!isNumberStringWorklet(num1Str) || !isNumberStringWorklet(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZeroWorklet(num1Str) || isZeroWorklet(num2Str)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2Str);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  const result = (scaledBigInt1 * scaledBigInt2) / BigInt(10) ** BigInt(20);
  return formatResultWorklet(result);
}

// Divide function
export function divWorklet(num1: string | number, num2: string | number): string {
  'worklet';
  const num1Str = toStringWorklet(num1);
  const num2Str = toStringWorklet(num2);

  if (!isNumberStringWorklet(num1Str) || !isNumberStringWorklet(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZeroWorklet(num2Str)) {
    throw new Error('Division by zero');
  }
  if (isZeroWorklet(num1Str)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2Str);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  const result = (scaledBigInt1 * BigInt(10) ** BigInt(20)) / scaledBigInt2;
  return formatResultWorklet(result);
}

// Modulus function
export function modWorklet(num1: string | number, num2: string | number): string {
  'worklet';
  const num1Str = toStringWorklet(num1);
  const num2Str = toStringWorklet(num2);

  if (!isNumberStringWorklet(num1Str) || !isNumberStringWorklet(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZeroWorklet(num2Str)) {
    throw new Error('Division by zero');
  }
  if (isZeroWorklet(num1Str)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2Str);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 % scaledBigInt2;
  return formatResultWorklet(result);
}

// Power function
export function powWorklet(base: string | number, exponent: string | number): string {
  'worklet';
  const baseStr = toStringWorklet(base);
  const exponentStr = toStringWorklet(exponent);

  if (!isNumberStringWorklet(baseStr) || !isNumberStringWorklet(exponentStr)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZeroWorklet(baseStr)) {
    return '0';
  }
  if (isZeroWorklet(exponentStr)) {
    return '1';
  }
  if (exponentStr === '1') {
    return baseStr;
  }

  const [bigIntBase, decimalPlaces] = removeDecimalWorklet(baseStr);
  let result;
  if (decimalPlaces > 0) {
    const scaledBigIntBase = scaleUpWorklet(bigIntBase, decimalPlaces);
    result = scaledBigIntBase ** BigInt(exponentStr) / BigInt(10) ** BigInt(20);
    return formatResultWorklet(result);
  } else {
    result = bigIntBase ** BigInt(exponentStr);
    return result.toString();
  }
}

// Logarithm base 10 function
export function log10Worklet(num: string | number): string {
  'worklet';
  const numStr = toStringWorklet(num);

  if (!isNumberStringWorklet(numStr)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZeroWorklet(numStr)) {
    throw new Error('Argument must be greater than 0');
  }

  const [bigIntNum, decimalPlaces] = removeDecimalWorklet(numStr);
  const scaledBigIntNum = scaleUpWorklet(bigIntNum, decimalPlaces);
  const result = Math.log10(Number(scaledBigIntNum)) - 20; // Adjust the scale factor for log10
  const resultBigInt = BigInt(result * 10 ** 20);
  return formatResultWorklet(resultBigInt);
}

// Equality function
export function equalWorklet(num1: string | number, num2: string | number): boolean {
  'worklet';
  const num1Str = toStringWorklet(num1);
  const num2Str = toStringWorklet(num2);

  if (!isNumberStringWorklet(num1Str) || !isNumberStringWorklet(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2Str);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  return scaledBigInt1 === scaledBigInt2;
}

// Greater than function
export function greaterThanWorklet(num1: string | number, num2: string | number): boolean {
  'worklet';
  const num1Str = toStringWorklet(num1);
  const num2Str = toStringWorklet(num2);

  if (!isNumberStringWorklet(num1Str) || !isNumberStringWorklet(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2Str);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  return scaledBigInt1 > scaledBigInt2;
}

// Greater than or equal to function
export function greaterThanOrEqualToWorklet(num1: string | number, num2: string | number): boolean {
  'worklet';
  const num1Str = toStringWorklet(num1);
  const num2Str = toStringWorklet(num2);

  if (!isNumberStringWorklet(num1Str) || !isNumberStringWorklet(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2Str);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  return scaledBigInt1 >= scaledBigInt2;
}

// Less than function
export function lessThanWorklet(num1: string | number, num2: string | number): boolean {
  'worklet';
  const num1Str = toStringWorklet(num1);
  const num2Str = toStringWorklet(num2);

  if (!isNumberStringWorklet(num1Str) || !isNumberStringWorklet(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2Str);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  return scaledBigInt1 < scaledBigInt2;
}

// Less than or equal to function
export function lessThanOrEqualToWorklet(num1: string | number, num2: string | number): boolean {
  'worklet';
  const num1Str = toStringWorklet(num1);
  const num2Str = toStringWorklet(num2);

  if (!isNumberStringWorklet(num1Str) || !isNumberStringWorklet(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  const [bigInt1, decimalPlaces1] = removeDecimalWorklet(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimalWorklet(num2Str);
  const scaledBigInt1 = scaleUpWorklet(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUpWorklet(bigInt2, decimalPlaces2);
  return scaledBigInt1 <= scaledBigInt2;
}

// toFixed function
export function toFixedWorklet(num: string | number, decimalPlaces: number): string {
  'worklet';
  const numStr = toStringWorklet(num);

  if (!isNumberStringWorklet(numStr)) {
    throw new Error('Argument must be a numeric string or number');
  }

  const [bigIntNum, numDecimalPlaces] = removeDecimalWorklet(numStr);
  const scaledBigIntNum = scaleUpWorklet(bigIntNum, numDecimalPlaces);

  const scaleFactor = BigInt(10) ** BigInt(20 - decimalPlaces);
  const roundedBigInt = ((scaledBigIntNum + scaleFactor / BigInt(2)) / scaleFactor) * scaleFactor;

  const resultStr = roundedBigInt.toString().padStart(20 + 1, '0'); // SCALE_FACTOR decimal places + at least 1 integer place
  const integerPart = resultStr.slice(0, -20) || '0';
  const fractionalPart = resultStr.slice(-20, -20 + decimalPlaces).padEnd(decimalPlaces, '0');

  return `${integerPart}.${fractionalPart}`;
}

// Ceil function
export function ceilWorklet(num: string | number): string {
  'worklet';
  const numStr = toStringWorklet(num);

  if (!isNumberStringWorklet(numStr)) {
    throw new Error('Argument must be a numeric string or number');
  }

  const [bigIntNum, decimalPlaces] = removeDecimalWorklet(numStr);
  const scaledBigIntNum = scaleUpWorklet(bigIntNum, decimalPlaces);

  const scaleFactor = BigInt(10) ** BigInt(20);
  const ceilBigInt = ((scaledBigIntNum + scaleFactor - BigInt(1)) / scaleFactor) * scaleFactor;

  return formatResultWorklet(ceilBigInt);
}

// Floor function
export function floorWorklet(num: string | number): string {
  'worklet';
  const numStr = toStringWorklet(num);

  if (!isNumberStringWorklet(numStr)) {
    throw new Error('Argument must be a numeric string or number');
  }

  const [bigIntNum, decimalPlaces] = removeDecimalWorklet(numStr);
  const scaledBigIntNum = scaleUpWorklet(bigIntNum, decimalPlaces);

  const scaleFactor = BigInt(10) ** BigInt(20);
  const floorBigInt = (scaledBigIntNum / scaleFactor) * scaleFactor;

  return formatResultWorklet(floorBigInt);
}

// Round function
export function roundWorklet(num: string | number): string {
  'worklet';
  const numStr = toStringWorklet(num);

  if (!isNumberStringWorklet(numStr)) {
    throw new Error('Argument must be a numeric string or number');
  }

  const [bigIntNum, decimalPlaces] = removeDecimalWorklet(numStr);
  const scaledBigIntNum = scaleUpWorklet(bigIntNum, decimalPlaces);

  const scaleFactor = BigInt(10) ** BigInt(20);
  const roundBigInt = ((scaledBigIntNum + scaleFactor / BigInt(2)) / scaleFactor) * scaleFactor;

  return formatResultWorklet(roundBigInt);
}

export function minWorklet(numA: string | number, numB: string | number) {
  return lessThanOrEqualToWorklet(numA, numB) ? numA : numB;
}

export function maxWorklet(numA: string | number, numB: string | number) {
  return greaterThanOrEqualToWorklet(numA, numB) ? numA : numB;
}
