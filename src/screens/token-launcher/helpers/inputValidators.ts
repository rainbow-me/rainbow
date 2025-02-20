import { MAX_NAME_LENGTH, MAX_SYMBOL_LENGTH, MAX_TOTAL_SUPPLY } from '../constants';

export type ValidationResult = { error: boolean; message?: string } | undefined;

export function validateNameWorklet(name: string): ValidationResult {
  'worklet';
  if (name.trim().length > MAX_NAME_LENGTH) {
    return { error: true, message: 'Too long, friend.' };
  }
  if (name.trim().length === 0) {
    return { error: true, message: 'Name is required' };
  }
}

export function validateSymbolWorklet(symbol: string): ValidationResult {
  'worklet';
  if (symbol.trim().length > MAX_SYMBOL_LENGTH) {
    return { error: true, message: 'Too long, friend.' };
  }
  if (symbol.trim().length === 0) {
    return { error: true, message: 'Symbol is required' };
  }
}

export function validateTotalSupplyWorklet(supply: number): ValidationResult {
  'worklet';
  if (supply > MAX_TOTAL_SUPPLY) {
    return { error: true, message: 'Too big.' };
  }
  if (supply <= 0) {
    return { error: true, message: 'Must be greater than 0' };
  }
}
