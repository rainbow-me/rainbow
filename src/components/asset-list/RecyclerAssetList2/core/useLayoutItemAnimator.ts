import { useMemo, type MutableRefObject } from 'react';
import { LayoutAnimation, Platform, type LayoutAnimationConfig } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BaseItemAnimator } from 'recyclerlistview';

import deviceUtils from '@/utils/deviceUtils';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';

import { ListFooterHeight } from '../../../list/ListFooter';
import { SectionHeaderHeight } from './ViewDimensions';
import { type RecyclerListViewRef } from './ViewTypes';

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
    springDamping: Platform.OS === 'ios' ? 1 : 3,
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

    const globalDeviceDimensions = deviceUtils.dimensions.height - this.topMargin - SectionHeaderHeight - 10;
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

const FloatingActionButtonSize = 56;
const FabWrapperBottomPosition = 21 + safeAreaInsetValues.bottom;
const FabSizeWithPadding = FloatingActionButtonSize + FabWrapperBottomPosition * 2;

export default function useLayoutItemAnimator(
  ref: MutableRefObject<RecyclerListViewRef | undefined>,
  topMarginRef: MutableRefObject<number>
) {
  const insets = useSafeAreaInsets();
  const paddingBottom = insets.bottom + FabSizeWithPadding - ListFooterHeight - FloatingActionButtonSize / 2;
  return useMemo(() => new LayoutItemAnimator(paddingBottom, topMarginRef, ref), [paddingBottom, ref, topMarginRef]);
}
