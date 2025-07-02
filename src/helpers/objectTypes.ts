/**
 * Object helpers: type safe versions of:
 *
 *   - Object.entries - objectEntries
 *   - Object.fromEntries - objectFromEntries
 *   - Object.keys - objectKeys
 */

type ObjectType = Record<PropertyKey, unknown>;

type PickByValue<ObjectT, ValueT> = // From https://stackoverflow.com/a/55153000
  Pick<ObjectT, { [K in keyof ObjectT]: ObjectT[K] extends ValueT ? K : never }[keyof ObjectT]>;

type ObjectEntries<ObjectT> = // From https://stackoverflow.com/a/60142095
  { [K in keyof ObjectT]: [keyof PickByValue<ObjectT, ObjectT[K]>, ObjectT[K]] }[keyof ObjectT][];

// eslint-disable-next-line @typescript-eslint/ban-types
export const objectKeys = <O extends Object>(obj: O) => Object.keys(obj) as Array<keyof O>;

export function objectEntries<ObjectT extends ObjectType>(obj: ObjectT): ObjectEntries<ObjectT> {
  return Object.entries(obj) as ObjectEntries<ObjectT>;
}

type EntriesType = [PropertyKey, unknown][] | ReadonlyArray<readonly [PropertyKey, unknown]>;

type DeepWritable<ObjectT> = { -readonly [P in keyof ObjectT]: DeepWritable<ObjectT[P]> };
type UnionToIntersection<UnionT> = // From https://stackoverflow.com/a/50375286
  (UnionT extends any ? (k: UnionT) => void : never) extends (k: infer I) => void ? I : never;

type UnionObjectFromArrayOfPairs<ArrayT extends EntriesType> =
  DeepWritable<ArrayT> extends (infer R)[] ? (R extends [infer key, infer val] ? { [prop in key & PropertyKey]: val } : never) : never;
type MergeIntersectingObjects<ObjT> = { [key in keyof ObjT]: ObjT[key] };
type EntriesToObject<ArrayT extends EntriesType> = MergeIntersectingObjects<UnionToIntersection<UnionObjectFromArrayOfPairs<ArrayT>>>;

export function objectFromEntries<ArrayT extends EntriesType>(arr: ArrayT): EntriesToObject<ArrayT> {
  return Object.fromEntries(arr) as EntriesToObject<ArrayT>;
}

export function objectMapValues<ObjectT extends ObjectType, MappedT>(
  obj: ObjectT,
  mapper: (value: ObjectT[keyof ObjectT], key: keyof ObjectT) => MappedT
): { [K in keyof ObjectT]: MappedT } {
  const result = {} as { [K in keyof ObjectT]: MappedT };
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = mapper(obj[key], key);
    }
  }
  return result;
}
