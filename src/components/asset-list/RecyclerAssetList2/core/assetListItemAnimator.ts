import { type RefObject } from 'react';
import { LayoutAnimation, Platform, type LayoutAnimationConfig, type ScrollViewProps } from 'react-native';

import { BaseItemAnimator } from 'recyclerlistview';

import { type RecyclerListViewRef } from './ViewTypes';

const EASING_ANIMATION: LayoutAnimationConfig = {
  duration: 250,
  update: {
    delay: 10,
    type: 'easeInEaseOut',
  },
};

const SPRING_ANIMATION: LayoutAnimationConfig = {
  duration: 200,
  update: {
    initialVelocity: 0,
    springDamping: Platform.OS === 'ios' ? 1 : 3,
    type: LayoutAnimation.Types.spring,
  },
};

/** Selects the row-update animation from the list's current scroll position. */
export class AssetListItemAnimator extends BaseItemAnimator {
  private viewportHeight = 0;
  private contentHeight = 0;

  constructor(private readonly listRef: RefObject<RecyclerListViewRef | undefined>) {
    super();
  }

  /** Measures the native viewport and full content, including headers and padding. */
  readonly scrollViewProps: Pick<ScrollViewProps, 'onLayout' | 'onContentSizeChange'> = {
    onLayout: ({ nativeEvent }) => {
      this.viewportHeight = nativeEvent.layout.height;
    },
    onContentSizeChange: (_width, height) => {
      this.contentHeight = height;
    },
  };

  override animateWillUpdate(): void {
    const scrollOffset = this.listRef.current?.getCurrentScrollOffset() ?? 0;
    const bottomIsVisible =
      scrollOffset > 0 && this.viewportHeight > 0 && this.contentHeight > 0 && scrollOffset + this.viewportHeight >= this.contentHeight;

    LayoutAnimation.configureNext(bottomIsVisible ? EASING_ANIMATION : SPRING_ANIMATION);
  }
}
