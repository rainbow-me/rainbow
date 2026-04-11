import { memoFn } from '@/utils/memoFn';

import buildLayoutStyles from './buildLayoutStyles';

export default function margin(...options) {
  return buildLayoutStyles(options, 'margin', true);
}

margin.object = memoFn((...options) => {
  return buildLayoutStyles.object(options, 'margin');
});
