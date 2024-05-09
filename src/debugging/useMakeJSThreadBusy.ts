import { useEffect } from 'react';

const fibonacci = (num: number) => {
  let a = 1,
    b = 0,
    temp;

  while (num >= 0) {
    temp = a;
    a = a + b;
    b = temp;
    // eslint-disable-next-line no-param-reassign
    num = num - 1;
  }

  return b;
};

export const useMakeJSThreadBusy = () =>
  useEffect(() => {
    setInterval(() => {
      console.log('🛑 Now blocking the JS thread 🛑');
      // eslint-disable-next-line no-constant-condition
      while (true) {
        fibonacci(10000);
      }
    }, 2000);
  }, []);
