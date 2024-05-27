import { consoleLogWorklet } from '@/debugging/workletUtils';

const SCALE_FACTOR = () => {
  'worklet';
  return 20;
};

// Utility function to remove the decimal point and keep track of the number of decimal places
const removeDecimal = (num: string): [bigint, number] => {
  'worklet';
  const parts = num.split('.');
  const decimalPlaces = parts.length === 2 ? parts[1].length : 0;
  const bigIntNum = BigInt(parts.join(''));
  return [bigIntNum, decimalPlaces];
};

const isNumberString = (value: string): boolean => {
  'worklet';
  return /^\d+(\.\d+)?$/.test(value);
};

const isZero = (value: string): boolean => {
  'worklet';
  if (parseFloat(value) === 0) {
    return true;
  }
  return false;
};

// Utility function to scale the number up to SCALE_FACTOR decimal places
const scaleUp = (bigIntNum: bigint, decimalPlaces: number): bigint => {
  'worklet';
  const scaleFactor = BigInt(10) ** (BigInt(SCALE_FACTOR()) - BigInt(Math.min(decimalPlaces, 20)));
  return bigIntNum * scaleFactor;
};

// Utility function to format the result with SCALE_FACTOR decimal places and remove trailing zeros
const formatResult = (result: bigint): string => {
  'worklet';
  const resultStr = result.toString().padStart(SCALE_FACTOR() + 1, '0'); // SCALE_FACTOR decimal places + at least 1 integer place
  const integerPart = resultStr.slice(0, -SCALE_FACTOR()) || '0';
  let fractionalPart = resultStr.slice(-SCALE_FACTOR());
  fractionalPart = fractionalPart.replace(/0+$/, ''); // Remove trailing zeros
  return fractionalPart.length > 0 ? `${integerPart}.${fractionalPart}` : integerPart;
};

// Sum function
export function sum(num1: string | number, num2: string | number): string {
  'worklet';
  const num1Str = typeof num1 === 'number' ? num1.toString() : num1;
  const num2Str = typeof num2 === 'number' ? num2.toString() : num2;

  if (!isNumberString(num1Str) || !isNumberString(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZero(num1Str)) {
    return num2Str;
  }
  if (isZero(num2Str)) {
    return num1Str;
  }
  const [bigInt1, decimalPlaces1] = removeDecimal(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2Str);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 + scaledBigInt2;
  return formatResult(result);
}

// Subtract function
export function sub(num1: string | number, num2: string | number): string {
  'worklet';
  const num1Str = typeof num1 === 'number' ? num1.toString() : num1;
  const num2Str = typeof num2 === 'number' ? num2.toString() : num2;

  if (!isNumberString(num1Str) || !isNumberString(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZero(num2Str)) {
    return num1Str;
  }
  const [bigInt1, decimalPlaces1] = removeDecimal(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2Str);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 - scaledBigInt2;
  return formatResult(result);
}

// Multiply function
export function mul(num1: string | number, num2: string | number): string {
  'worklet';
  const num1Str = typeof num1 === 'number' ? num1.toString() : num1;
  const num2Str = typeof num2 === 'number' ? num2.toString() : num2;

  if (!isNumberString(num1Str) || !isNumberString(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZero(num1Str) || isZero(num2Str)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimal(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2Str);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  const result = (scaledBigInt1 * scaledBigInt2) / BigInt(10) ** BigInt(SCALE_FACTOR());
  return formatResult(result);
}

// Divide function
export function div(num1: string | number, num2: string | number): string {
  'worklet';
  const num1Str = typeof num1 === 'number' ? num1.toString() : num1;
  const num2Str = typeof num2 === 'number' ? num2.toString() : num2;

  if (!isNumberString(num1Str) || !isNumberString(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZero(num2Str)) {
    throw new Error('Division by zero');
  }
  if (isZero(num1Str)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimal(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2Str);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  const result = (scaledBigInt1 * BigInt(10) ** BigInt(SCALE_FACTOR())) / scaledBigInt2;
  return formatResult(result);
}

// Modulus function
export function mod(num1: string | number, num2: string | number): string {
  'worklet';
  const num1Str = typeof num1 === 'number' ? num1.toString() : num1;
  const num2Str = typeof num2 === 'number' ? num2.toString() : num2;

  if (!isNumberString(num1Str) || !isNumberString(num2Str)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZero(num2Str)) {
    throw new Error('Division by zero');
  }
  if (isZero(num1Str)) {
    return '0';
  }
  const [bigInt1, decimalPlaces1] = removeDecimal(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2Str);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  const result = scaledBigInt1 % scaledBigInt2;
  return formatResult(result);
}

// Power function
export function pow(base: string | number, exponent: string | number): string {
  'worklet';
  const baseStr = typeof base === 'number' ? base.toString() : base;
  const exponentStr = typeof exponent === 'number' ? exponent.toString() : exponent;

  if (!isNumberString(baseStr) || !isNumberString(exponentStr)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZero(baseStr)) {
    return '0';
  }
  if (isZero(exponentStr)) {
    return '1';
  }
  const [bigIntBase, decimalPlaces] = removeDecimal(baseStr);
  const scaledBigIntBase = scaleUp(bigIntBase, decimalPlaces);
  const result = scaledBigIntBase ** BigInt(exponentStr) / BigInt(10) ** BigInt(SCALE_FACTOR());
  return formatResult(result);
}

// Logarithm base 10 function
export function log10(num: string | number): string {
  'worklet';
  const numStr = typeof num === 'number' ? num.toString() : num;

  if (!isNumberString(numStr)) {
    throw new Error('Arguments must be a numeric string or number');
  }
  if (isZero(numStr)) {
    throw new Error('Argument must be greater than 0');
  }

  const [bigIntNum, decimalPlaces] = removeDecimal(numStr);
  const scaledBigIntNum = scaleUp(bigIntNum, decimalPlaces);
  const result = Math.log10(Number(scaledBigIntNum)) - SCALE_FACTOR(); // Adjust the scale factor for log10
  const resultBigInt = BigInt(result * 10 ** SCALE_FACTOR());
  return formatResult(resultBigInt);
}

// Comparison functions
export function gt(num1: string | number, num2: string | number): boolean {
  'worklet';
  const num1Str = typeof num1 === 'number' ? num1.toString() : num1;
  const num2Str = typeof num2 === 'number' ? num2.toString() : num2;

  const [bigInt1, decimalPlaces1] = removeDecimal(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2Str);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  return scaledBigInt1 > scaledBigInt2;
}

export function lt(num1: string | number, num2: string | number): boolean {
  'worklet';
  const num1Str = typeof num1 === 'number' ? num1.toString() : num1;
  const num2Str = typeof num2 === 'number' ? num2.toString() : num2;

  const [bigInt1, decimalPlaces1] = removeDecimal(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2Str);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  return scaledBigInt1 < scaledBigInt2;
}

export function gte(num1: string | number, num2: string | number): boolean {
  'worklet';
  const num1Str = typeof num1 === 'number' ? num1.toString() : num1;
  const num2Str = typeof num2 === 'number' ? num2.toString() : num2;

  const [bigInt1, decimalPlaces1] = removeDecimal(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2Str);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  return scaledBigInt1 >= scaledBigInt2;
}

export function lte(num1: string | number, num2: string | number): boolean {
  'worklet';
  const num1Str = typeof num1 === 'number' ? num1.toString() : num1;
  const num2Str = typeof num2 === 'number' ? num2.toString() : num2;

  const [bigInt1, decimalPlaces1] = removeDecimal(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2Str);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  return scaledBigInt1 <= scaledBigInt2;
}

export function equals(num1: string | number, num2: string | number): boolean {
  'worklet';
  const num1Str = typeof num1 === 'number' ? num1.toString() : num1;
  const num2Str = typeof num2 === 'number' ? num2.toString() : num2;

  const [bigInt1, decimalPlaces1] = removeDecimal(num1Str);
  const [bigInt2, decimalPlaces2] = removeDecimal(num2Str);
  const scaledBigInt1 = scaleUp(bigInt1, decimalPlaces1);
  const scaledBigInt2 = scaleUp(bigInt2, decimalPlaces2);
  return scaledBigInt1 === scaledBigInt2;
}

// toFixed function
export function toFixed(num: string | number, decimalPlaces: number): string {
  'worklet';
  const numStr = typeof num === 'number' ? num.toString() : num;

  if (!isNumberString(numStr)) {
    throw new Error('Argument must be a numeric string or number');
  }

  const [bigIntNum, numDecimalPlaces] = removeDecimal(numStr);
  const scaledBigIntNum = scaleUp(bigIntNum, numDecimalPlaces);

  const scaleFactor = BigInt(10) ** BigInt(SCALE_FACTOR() - decimalPlaces);
  const roundedBigInt = ((scaledBigIntNum + scaleFactor / BigInt(2)) / scaleFactor) * scaleFactor;

  const resultStr = roundedBigInt.toString().padStart(SCALE_FACTOR() + 1, '0'); // SCALE_FACTOR decimal places + at least 1 integer place
  const integerPart = resultStr.slice(0, -SCALE_FACTOR()) || '0';
  const fractionalPart = resultStr.slice(-SCALE_FACTOR(), -SCALE_FACTOR() + decimalPlaces).padEnd(decimalPlaces, '0');

  return `${integerPart}.${fractionalPart}`;
}

// Ceil function
export function ceil(num: string | number): string {
  'worklet';
  const numStr = typeof num === 'number' ? num.toString() : num;

  if (!isNumberString(numStr)) {
    throw new Error('Argument must be a numeric string or number');
  }

  const [bigIntNum, decimalPlaces] = removeDecimal(numStr);
  const scaledBigIntNum = scaleUp(bigIntNum, decimalPlaces);

  const scaleFactor = BigInt(10) ** BigInt(SCALE_FACTOR());
  const ceilBigInt = ((scaledBigIntNum + scaleFactor - BigInt(1)) / scaleFactor) * scaleFactor;

  return formatResult(ceilBigInt);
}

// Floor function
export function floor(num: string | number): string {
  'worklet';
  const numStr = typeof num === 'number' ? num.toString() : num;

  if (!isNumberString(numStr)) {
    throw new Error('Argument must be a numeric string or number');
  }

  const [bigIntNum, decimalPlaces] = removeDecimal(numStr);
  const scaledBigIntNum = scaleUp(bigIntNum, decimalPlaces);

  const scaleFactor = BigInt(10) ** BigInt(SCALE_FACTOR());
  const floorBigInt = (scaledBigIntNum / scaleFactor) * scaleFactor;

  return formatResult(floorBigInt);
}

// Round function
export function round(num: string | number): string {
  'worklet';
  const numStr = typeof num === 'number' ? num.toString() : num;

  if (!isNumberString(numStr)) {
    throw new Error('Argument must be a numeric string or number');
  }

  const [bigIntNum, decimalPlaces] = removeDecimal(numStr);
  const scaledBigIntNum = scaleUp(bigIntNum, decimalPlaces);

  const scaleFactor = BigInt(10) ** BigInt(SCALE_FACTOR());
  const roundBigInt = ((scaledBigIntNum + scaleFactor / BigInt(2)) / scaleFactor) * scaleFactor;

  return formatResult(roundBigInt);
}
