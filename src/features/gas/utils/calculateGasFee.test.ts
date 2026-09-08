import { calculateEstimatedGasFeeWorklet, calculateMaxGasFeeWorklet } from './calculateGasFee';

describe('gas fee calculations', () => {
  const eip1559GasSettings = {
    isEIP1559: true,
    maxBaseFee: '10',
    maxPriorityFee: '2',
  } as const;

  it('keeps the fee cap calculation for affordability checks', () => {
    expect(calculateMaxGasFeeWorklet(eip1559GasSettings, '100')).toBe('1200');
  });

  it('uses the current base fee for an expected EIP-1559 fee', () => {
    expect(calculateEstimatedGasFeeWorklet(eip1559GasSettings, '100', '4')).toBe('600');
  });

  it('does not estimate above the selected fee cap', () => {
    expect(calculateEstimatedGasFeeWorklet(eip1559GasSettings, '100', '20')).toBe('1200');
  });

  it('falls back to the fee cap when the current base fee is unavailable', () => {
    expect(calculateEstimatedGasFeeWorklet(eip1559GasSettings, '100', undefined)).toBe('1200');
  });

  it.each(['', ' ', 'Infinity'])('falls back to the fee cap when the current base fee is %p', currentBaseFee => {
    expect(calculateEstimatedGasFeeWorklet(eip1559GasSettings, '100', currentBaseFee)).toBe('1200');
  });

  it.each(['', ' ', 'Infinity'])('treats an invalid selected fee value %p as zero', maxBaseFee => {
    expect(calculateMaxGasFeeWorklet({ ...eip1559GasSettings, maxBaseFee }, '100')).toBe('200');
  });

  it('uses the selected gas price for legacy transactions', () => {
    expect(calculateEstimatedGasFeeWorklet({ isEIP1559: false, gasPrice: '5' }, '100', '4')).toBe('500');
  });
});
