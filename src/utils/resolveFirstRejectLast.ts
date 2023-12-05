import { forEach } from 'lodash';

/**
 * Resolve the first Promise, Reject when all have failed
 *
 * This method accepts a list of promises and has them
 * compete in a horserace to determine which promise can
 * resolve first (similar to Promise.race). However, this
 * method differs why waiting to reject until ALL promises
 * have rejected, rather than waiting for the first.
 *
 * The return of this method is a promise that either resolves
 * to the first promises resolved value, or rejects with an arra
 * of errors (with indexes corresponding to the promises).
 *
 * @param {List<Promise>} promises list of promises to run
 */
export type Status<T> = {
  winner: T | null;
  errors: Array<number>;
};

export const resolveFirstRejectLast = <T>(promises: Array<Promise<T>>) => {
  return new Promise<T>((resolve, reject) => {
    let errorCount = 0;
    const status: Status<T> = {
      winner: null,
      errors: new Array(promises.length),
    };
    forEach(promises, (p, idx) => {
      p.then(
        resolved => {
          if (!status.winner) {
            status.winner = resolved;
            resolve(resolved);
          }
        },
        error => {
          status.errors[idx] = error;
          errorCount += 1;
          if (errorCount >= status.errors.length && !status.winner) {
            reject(status.errors);
          }
        }
      );
    });
  });
};
