import buildLayoutStyles from './buildLayoutStyles';
import { memoFn } from '@/utils/memoFn';

export default function margin(...options) {
  return buildLayoutStyles(options, 'margin', true);
}

margin.object = memoFn((...options) => {
  return buildLayoutStyles.object(options, 'margin');
});
