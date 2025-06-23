export const sleep = async (ms: number, signal?: AbortSignal): Promise<void> => {
  await new Promise(res => setTimeout(res, ms));
  if (signal?.aborted) {
    throw new AbortError();
  }
};

export class AbortError extends Error {
  constructor(message = '') {
    super(message);
    this.name = 'AbortError';
  }
}
