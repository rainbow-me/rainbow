/**
 * Source: https://github.com/Codex-Data/sdk/blob/dbd71244626d0e63437dbf021c20c8300b48945e/examples/codegen/src/gql/graphql.ts#L82
 */

type Maybe<T> = T | null;
type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  JSON: { input: any; output: any };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  join__FieldSet: { input: any; output: any };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  link__Import: { input: any; output: any };
};

export type BarsResponse = {
  __typename?: 'BarsResponse';
  /** The closing price. */
  c: Array<Maybe<Scalars['Float']['output']>>;
  /** The high price. */
  h: Array<Maybe<Scalars['Float']['output']>>;
  /** The low price. */
  l: Array<Maybe<Scalars['Float']['output']>>;
  /** The opening price. */
  o: Array<Maybe<Scalars['Float']['output']>>;
  /** The status code for the bar. `200` responses are `ok`. */
  s: Scalars['String']['output'];
  /** The timestamp for the bar. */
  t: Array<Scalars['Int']['output']>;
  /** The volume. */
  v: Array<Maybe<Scalars['Int']['output']>>;
  /** The volume with higher precision. */
  volume?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The volume in the native token for the network */
  volumeNativeToken?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};
