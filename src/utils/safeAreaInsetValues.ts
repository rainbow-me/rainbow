import { IS_IOS } from '@/env';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import SafeAreaView from 'react-native-safe-area-view';

export default {
  bottom:
    (IS_IOS
      ? initialWindowMetrics?.insets.bottom
      : // @ts-expect-error ts-migrate(2339) FIXME: Property 'getInset' does not exist on type 'Compon... Remove this comment to see the full error message
        SafeAreaView.getInset('bottom')) ?? 0,
  left:
    (IS_IOS
      ? initialWindowMetrics?.insets.left
      : // @ts-expect-error ts-migrate(2339) FIXME: Property 'getInset' does not exist on type 'Compon... Remove this comment to see the full error message
        SafeAreaView.getInset('left')) ?? 0,
  right:
    (IS_IOS
      ? initialWindowMetrics?.insets.right
      : // @ts-expect-error ts-migrate(2339) FIXME: Property 'getInset' does not exist on type 'Compon... Remove this comment to see the full error message
        SafeAreaView.getInset('right')) ?? 0,
  top:
    (IS_IOS
      ? initialWindowMetrics?.insets.top
      : // @ts-expect-error ts-migrate(2339) FIXME: Property 'getInset' does not exist on type 'Compon... Remove this comment to see the full error message
        SafeAreaView.getInset('top')) ?? 0,
};
