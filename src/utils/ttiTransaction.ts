import * as Sentry from '@sentry/react-native';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Transaction } from '@sentry/types';

let ttiTransaction: Transaction | null = null;

export function startMeasuringTimeToInteractive() {
  if (ttiTransaction === null) {
    global.console.log('Started measuring TTI');
    ttiTransaction = Sentry.startTransaction({
      name: 'Time To Interactive',
      op: 'tti',
    });
  }
}

export function finishMeasuringTimeToInteractive() {
  if (ttiTransaction !== null) {
    global.console.log('Finished measuring TTI');
    ttiTransaction.finish();
    ttiTransaction = null;
  }
}
