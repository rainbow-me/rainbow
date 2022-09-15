import buildLayoutStyles from './buildLayoutStyles';
import { memoFn } from '@/utils/memoFn';

export default function padding(...options) {
  return buildLayoutStyles(options, 'padding', true);
}

padding.object = memoFn((...options) => {
  return buildLayoutStyles.object(options, 'padding');
});
