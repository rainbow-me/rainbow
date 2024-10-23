type NonFalsy<T> = T extends false | 0 | '' | null | undefined | 0n ? never : T;

interface Array<T> {
  filter<S extends T>(predicate: BooleanConstructor, thisArg?: any): NonFalsy<S>[];
}

interface ReadonlyArray<T> {
  filter<S extends T>(predicate: BooleanConstructor, thisArg?: any): NonFalsy<S>[];
}
