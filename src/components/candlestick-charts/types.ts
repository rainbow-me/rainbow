export type Bar = {
  /** Close price */
  c: number;
  /** High price */
  h: number;
  /** Low price */
  l: number;
  /** Open price */
  o: number;
  /** Timestamp */
  t: number;
  /** Volume */
  v: number;
};

export type BarsResponse = {
  /** Close prices */
  c: number[];
  /** High prices */
  h: number[];
  /** Low prices */
  l: number[];
  /** Open prices */
  o: number[];
  /** Timestamps */
  t: number[];
  /** Volumes */
  v: number[];
};

export function transformBarsResponseToBars(resp: BarsResponse): Bar[] {
  return resp.t.map((t, i) => ({
    c: resp.c[i],
    h: resp.h[i],
    l: resp.l[i],
    o: resp.o[i],
    t: t,
    v: resp.v[i],
  }));
}
