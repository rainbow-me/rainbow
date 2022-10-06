import SafeAreaView from 'react-native-safe-area-view';

export default {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'getInset' does not exist on type 'Compon... Remove this comment to see the full error message
  bottom: SafeAreaView.getInset('bottom') || 0,
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'getInset' does not exist on type 'Compon... Remove this comment to see the full error message
  left: SafeAreaView.getInset('left') || 0,
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'getInset' does not exist on type 'Compon... Remove this comment to see the full error message
  right: SafeAreaView.getInset('right') || 0,
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'getInset' does not exist on type 'Compon... Remove this comment to see the full error message
  top: SafeAreaView.getInset('top') || 0,
};
