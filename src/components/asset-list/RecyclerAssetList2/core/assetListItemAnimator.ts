import { LayoutAnimation, Platform, type LayoutAnimationConfig } from 'react-native';

import { BaseItemAnimator } from 'recyclerlistview';

const SPRING_ANIMATION: LayoutAnimationConfig = {
  duration: 200,
  update: {
    initialVelocity: 0,
    springDamping: Platform.OS === 'ios' ? 1 : 3,
    type: LayoutAnimation.Types.spring,
  },
};

class AssetListItemAnimator extends BaseItemAnimator {
  override animateWillUpdate(): void {
    LayoutAnimation.configureNext(SPRING_ANIMATION);
  }
}

/** Applies the asset list's spring animation to row updates. */
export const assetListItemAnimator = new AssetListItemAnimator();
