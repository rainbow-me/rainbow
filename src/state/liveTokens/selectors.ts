import { type TokenData } from './types';

export function selectMidPrice(token: TokenData): string {
  return token.midPrice ?? token.price;
}

export function select24hChange(token: TokenData): string {
  return token.change.change24hPct;
}
