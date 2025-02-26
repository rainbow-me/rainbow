// Utility function to remove the decimal point and keep track of the number of decimal places
function removeDecimalWorklet(num: string): [bigint, number] {
  'worklet';
  let decimalPlaces = 0;
  let bigIntNum: bigint;

  // Check if there's an exponent
  if (/[eE]/.test(num)) {
    const [base, exponent] = num.split(/[eE]/);
    const exp = Number(exponent);

    const parts = base.split('.');
    const baseDecimalPlaces = parts.length === 2 ? parts[1].length : 0;
    const bigIntBase = BigInt(parts.join('')); // "1.23" => BigInt("123")

    if (exp >= 0) {
      // Shift integer for e+ exponent, keep baseDecimalPlaces as is
      decimalPlaces = baseDecimalPlaces;
      bigIntNum = bigIntBase * BigInt(10) ** BigInt(exp);
    } else {
      // e- => increase decimalPlaces by abs(exp)
      decimalPlaces = baseDecimalPlaces - exp; // subtracting negative => plus
      bigIntNum = bigIntBase;
    }
  } else {
    // No exponent => fallback
    const parts = num.split('.');
    decimalPlaces = parts.length === 2 ? parts[1].length : 0;
    bigIntNum = BigInt(parts.join(''));
  }

  return [bigIntNum, decimalPlaces];
}

export const isNumberStringWorklet = (value: string): boolean => {
  'worklet';
  return /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(value);
};

const isZeroWorklet = (value: string): boolean => {
  'worklet';
  if (parseFloat(value) === 0) {
    return true;
  }
  return false;
};

// Utility function to scale the number up to 20 decimal places
export const scaleUpWorklet = (bigIntNum: bigint, decimalPlaces: number): bigint => {
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
export const toStringWorklet = (value: string | number): string => {
  'worklet';
  const string = typeof value === 'number' ? value.toString() : value;

  // Slice trailing decimal point if not followed by a number
  if (/^\d+\.$/.test(string)) return string.slice(0, -1);

  return string;
};

// Converts a numeric string to a scaled integer string, preserving the specified decimal places
export function toScaledIntegerWorklet(num: string, decimalPlaces = 18): string {
  'worklet';
  if (!isNumberStringWorklet(num)) {
    throw new Error('Argument must be a numeric string');
  }
  const [bigIntNum, numDecimalPlaces] = removeDecimalWorklet(num);
  const scaleFactor = BigInt(10) ** BigInt(decimalPlaces - numDecimalPlaces);
  const scaledIntegerBigInt = bigIntNum * scaleFactor;

  return scaledIntegerBigInt.toString();
}

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

// Returns the position of the first significant (non-zero) decimal digit
export function significantDecimalsWorklet(num: string | number): number {
  'worklet';
  const [rawBigInt, decimalPlaces] = removeDecimalWorklet(typeof num === 'number' ? num.toString() : num);

  if (rawBigInt === 0n || decimalPlaces <= 0) return 0;

  const bigIntNum = rawBigInt < 0n ? -rawBigInt : rawBigInt; // abs value
  const digitsStr = bigIntNum.toString();

  if (digitsStr.length < decimalPlaces) {
    const leadingZerosCount = decimalPlaces - digitsStr.length;
    for (let i = 0; i < digitsStr.length; i++) {
      if (digitsStr[i] !== '0') {
        // First non-zero digit
        return leadingZerosCount + i + 1;
      }
    }
    return 0;
  } else {
    const fractionalPart = digitsStr.slice(digitsStr.length - decimalPlaces);
    for (let i = 0; i < fractionalPart.length; i++) {
      if (fractionalPart[i] !== '0') {
        // First non-zero digit
        return i + 1;
      }
    }
    return 0; // No non-zero found => fractional is all zeros
  }
}

export function orderOfMagnitudeWorklet(num: string | number): number {
  'worklet';
  // If the value is 0, the log10 is -∞
  if (num === 0 || num === '0') return -Infinity;

  const [rawBigInt, rawDecimalPlaces] = removeDecimalWorklet(typeof num === 'number' ? num.toString() : num);

  if (rawBigInt === 0n) return -Infinity;

  const bigIntNum = rawBigInt < 0n ? -rawBigInt : rawBigInt; // abs value
  const digitsCount = bigIntNum.toString().length; // number of digits in the absolute value
  const decimalPlaces = rawDecimalPlaces; // positive => more fractional digits, negative => large integer

  // floor(log10(value)) = (digitsCount - 1) - decimalPlaces
  return digitsCount - 1 - decimalPlaces;
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

  // If exponent is negative => 1 / base^|exponent|
  if (lessThanWorklet(exponentStr, '0')) {
    return divWorklet('1', powWorklet(base, Math.abs(Number(exponentStr))));
  }

  // Now handle exponent≥1
  const [bigIntBase, decimalPlaces] = removeDecimalWorklet(baseStr);
  const exp = Number(exponentStr); // Assume integer exponent

  let result: bigint;
  if (decimalPlaces > 0) {
    const scaledBase = scaleUpWorklet(bigIntBase, decimalPlaces);
    const raw = scaledBase ** BigInt(exp);

    // We have exp*20 decimals in raw => we only want 20 decimals in final
    if (exp === 1) {
      result = raw;
    } else {
      const divisor = BigInt(10) ** BigInt(20 * (exp - 1));
      result = raw / divisor;
    }

    return formatResultWorklet(result);
  } else {
    // Integer base => bigInt^exponent
    result = bigIntBase ** BigInt(exp);
    return result.toString();
  }
}

// toFixed function
export function toFixedWorklet(num: string | number, decimalPlaces: number): string {
  'worklet';
  // Clamp to internal precision
  let safeDecimalPlaces = decimalPlaces;
  if (safeDecimalPlaces > 20) safeDecimalPlaces = 20;
  if (safeDecimalPlaces < 0) safeDecimalPlaces = 0;

  const numStr = toStringWorklet(num);

  if (!isNumberStringWorklet(numStr)) {
    throw new Error('Argument must be a numeric string or number');
  }

  const [bigIntNum, numDecimalPlaces] = removeDecimalWorklet(numStr);
  const scaledBigIntNum = scaleUpWorklet(bigIntNum, numDecimalPlaces);

  const scaleFactor = BigInt(10) ** BigInt(20 - decimalPlaces);
  const half = scaleFactor / BigInt(2);

  // Handle sign separately so we correctly round negative numbers
  const sign = scaledBigIntNum < 0n ? -1n : 1n;
  let absScaled = scaledBigIntNum * sign;
  absScaled = absScaled + half;
  absScaled = absScaled / scaleFactor;
  absScaled = absScaled * scaleFactor;
  const finalBigInt = absScaled * sign;

  // Convert to string and pad without the sign
  const isNegative = finalBigInt < 0n;
  const finalAbsStr = (isNegative ? -finalBigInt : finalBigInt).toString().padStart(20 + 1, '0');

  const integerPart = finalAbsStr.slice(0, -20) || '0';
  const fractionalPart = finalAbsStr.slice(-20, -20 + safeDecimalPlaces).padEnd(safeDecimalPlaces, '0');

  return (isNegative ? '-' : '') + integerPart + (safeDecimalPlaces ? '.' + fractionalPart : '');
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
  let scaled = scaleUpWorklet(bigIntNum, decimalPlaces);

  const scaleFactor = BigInt(10) ** BigInt(20);

  if (scaled >= 0n) {
    scaled += scaleFactor / 2n;
  } else {
    scaled -= scaleFactor / 2n; // negative => subtract half
  }

  const roundBigInt = (scaled / scaleFactor) * scaleFactor;
  return formatResultWorklet(roundBigInt);
}

export function minWorklet(numA: string | number, numB: string | number) {
  'worklet';
  return lessThanOrEqualToWorklet(numA, numB) ? numA : numB;
}

export function maxWorklet(numA: string | number, numB: string | number) {
  'worklet';
  return greaterThanOrEqualToWorklet(numA, numB) ? numA : numB;
}
