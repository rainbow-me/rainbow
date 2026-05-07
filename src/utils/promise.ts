import { RainbowError } from '@/logger';

const PromiseAllWithFails = async (promises: Promise<any>[]) =>
  Promise.all(promises.map((promise: any) => (promise?.catch ? promise.catch((error: any) => error) : promise)));

export function withTimeout<T>(promise: Promise<T>, duration: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new RainbowError(message)), duration);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

export default {
  PromiseAllWithFails,
};
