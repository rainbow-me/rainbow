import { MutableRefObject, useMemo } from 'react';
import { LayoutAnimation, LayoutAnimationConfig } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BaseItemAnimator } from 'recyclerlistview';
import { FabWrapperBottomPosition, FloatingActionButtonSize } from '../../../fab';
import { ListFooter } from '../../../list';
import { AssetListHeaderHeight } from '../../AssetListHeader';
import { RecyclerListViewRef } from './ViewTypes';
import { deviceUtils } from '@/utils';

const easingAnimation: LayoutAnimationConfig = {
  duration: 250,
  update: {
    delay: 10,
    type: 'easeInEaseOut',
  },
};

const springAnimation: LayoutAnimationConfig = {
  duration: 200,
  update: {
    initialVelocity: 0,
    springDamping: ios ? 1 : 3,
    type: LayoutAnimation.Types.spring,
  },
};

class LayoutItemAnimator extends BaseItemAnimator {
  paddingBottom: number;
  topMargin: number;
  ref: RecyclerListViewRef | undefined;
  constructor(paddingBottom: number, topMargin: MutableRefObject<number>, ref: MutableRefObject<RecyclerListViewRef | undefined>) {
    super();
    this.paddingBottom = paddingBottom;
    this.topMargin = topMargin.current;
    this.ref = ref.current;
  }

  animateDidMount = () => undefined;
  animateShift = () => false;
  animateWillMount = () => undefined;
  animateWillUnmount = () => undefined;

  animateWillUpdate = () => {
    const hasScrollOffset = !!this.ref?.getCurrentScrollOffset;
    const hasContentDimension = !!this.ref?.getContentDimension;

    const globalDeviceDimensions = deviceUtils.dimensions.height - this.topMargin - AssetListHeaderHeight - 10;
    const shouldConfigureNext =
      hasScrollOffset &&
      hasContentDimension &&
      this.ref &&
      this.ref.getCurrentScrollOffset() > 0 &&
      this.ref.getContentDimension().height < this.ref.getCurrentScrollOffset() + globalDeviceDimensions + this.paddingBottom;

    if (shouldConfigureNext) {
      LayoutAnimation.configureNext(easingAnimation);
    } else {
      LayoutAnimation.configureNext(springAnimation);
    }
  };
}

const FabSizeWithPadding = FloatingActionButtonSize + FabWrapperBottomPosition * 2;

export default function useLayoutItemAnimator(
  ref: MutableRefObject<RecyclerListViewRef | undefined>,
  topMarginRef: MutableRefObject<number>
) {
  const insets = useSafeAreaInsets();
  const paddingBottom =
    insets.bottom +
    FabSizeWithPadding -
    // @ts-ignore
    ListFooter.height -
    FloatingActionButtonSize / 2;
  return useMemo(() => new LayoutItemAnimator(paddingBottom, topMarginRef, ref), [paddingBottom, ref, topMarginRef]);
}
