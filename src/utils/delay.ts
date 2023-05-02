/**
 * @desc Promise that will resolve after the ms interval
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
