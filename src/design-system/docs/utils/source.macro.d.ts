export type Source<Value> = { code: string; value: Value };

export default function source<Value>(value: Value): Source<Value>;
