type Listener<Payload> = (payload: Payload) => void;

export const createEventBus = <Schema extends Record<string, unknown>>() => {
  const listeners = new Map<keyof Schema, Set<Listener<Schema[keyof Schema]>>>();

  return {
    on<Key extends keyof Schema>(event: Key, listener: Listener<Schema[Key]>) {
      const bucket = listeners.get(event) ?? new Set<Listener<Schema[Key]>>();
      bucket.add(listener);
      listeners.set(event, bucket as Set<Listener<Schema[keyof Schema]>>);
      return () => {
        bucket.delete(listener);
        if (!bucket.size) listeners.delete(event);
      };
    },
    emit<Key extends keyof Schema>(event: Key, payload?: undefined extends Schema[Key] ? Schema[Key] | undefined : Schema[Key]) {
      const bucket = listeners.get(event);
      bucket?.forEach(listener => listener(payload as Schema[Key]));
    },
    removeAllListeners<Key extends keyof Schema>(event?: Key) {
      if (event) {
        listeners.delete(event);
        return;
      }
      listeners.clear();
    },
  };
};
