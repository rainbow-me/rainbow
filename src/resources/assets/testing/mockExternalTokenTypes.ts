const tokenTypes = new Map<string, string | null | Promise<string | null>>();

/** The metadata type the mocked external token query returns for `address`. Unset addresses are `none`. */
export function setExternalTokenType(address: string, type: string | null | Promise<string | null>) {
  tokenTypes.set(address, type);
}

export function resetExternalTokenTypes() {
  tokenTypes.clear();
}

export function getExternalTokenType(address: string): string | null | Promise<string | null> {
  return tokenTypes.has(address) ? (tokenTypes.get(address) ?? null) : 'none';
}
