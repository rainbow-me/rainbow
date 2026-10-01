import { LayoutAnimation, Platform, type LayoutAnimationConfig, type ScrollViewProps } from 'react-native';

import { BaseItemAnimator, type RecyclerListViewProps } from 'recyclerlistview';

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
  private scrollOffset = 0;
  private viewportHeight = 0;
  private contentHeight = 0;

  /** Receives the scroll position from RecyclerListView. */
  readonly onScroll: NonNullable<RecyclerListViewProps['onScroll']> = (_event, _offsetX, offsetY) => {
    this.scrollOffset = offsetY;
  };

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
    const bottomIsVisible =
      this.scrollOffset > 0 &&
      this.viewportHeight > 0 &&
      this.contentHeight > 0 &&
      this.scrollOffset + this.viewportHeight >= this.contentHeight;

    LayoutAnimation.configureNext(bottomIsVisible ? EASING_ANIMATION : SPRING_ANIMATION);
  }
}
