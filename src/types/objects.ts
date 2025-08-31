/**
 * **True if all keys in object `O` are optional.**
 */
export type AreAllKeysOptional<O extends object> = ExtractRequiredKeys<O> extends never ? true : false;

/**
 * Recursively makes all properties in `O` optional.
 */
export type DeepPartial<O extends object> = {
  [P in keyof O]?: O[P] extends object ? DeepPartial<O[P]> : O[P];
};

/**
 * Recursively requires all properties in `O`.
 */
export type DeepRequired<O extends object> = {
  [P in keyof O]-?: O[P] extends object ? DeepRequired<O[P]> : O[P];
};

/**
 * Empty object type (`Record<string, never>`).
 */
export type EmptyObject = Record<string, never>;

/**
 * Ensures that object `O` strictly matches `Shape`,
 * forbidding any extra properties.
 *
 * @example
 * ```ts
 * type Token = { address: string; chainId: ChainId };
 *
 * function setToken<T extends Token>(token: Exact<T, Token>): void {
 *   // ...
 * }
 *
 * // 🟢 Valid
 * setToken({ address: '0x123', chainId: 1 });
 *
 * // 🔴 Error
 * setToken({ address: '0x123', chainId: 1, foo: 'bar' });
 * ```
 */
export type Exact<O, Shape> = O extends object ? (O extends Shape ? (Exclude<keyof O, keyof Shape> extends never ? O : never) : never) : O;

/**
 * Extracts the keys of object `O` that are **optional**.
 */
export type ExtractOptionalKeys<O extends object> = Exclude<FlattenKeys<O>, ExtractRequiredKeys<O>>;

/**
 * Extracts the keys of object `O` that are **required**.
 */
export type ExtractRequiredKeys<O extends object> = [O] extends [infer U]
  ? U extends unknown
    ? {
        [K in keyof U]-?: EmptyObject extends Pick<U, K> ? never : K;
      }[keyof U]
    : never
  : never;

/**
 * Flattens the keys of object `O` to the union of its keys.
 */
export type FlattenKeys<O extends object> = O extends unknown ? keyof O : never;

/**
 * An object with unknown properties (`Record<string, unknown>`).
 */
export type UnknownObject = Record<string, unknown>;
