import { memoFn } from '@/utils/memoFn';

import buildLayoutStyles from './buildLayoutStyles';

export default function padding(...options) {
  return buildLayoutStyles(options, 'padding', true);
}

padding.object = memoFn((...options) => {
  return buildLayoutStyles.object(options, 'padding');
});
