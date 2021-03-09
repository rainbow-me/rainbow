import { LayoutAnimation } from 'react-native';
import { BaseItemAnimator } from 'recyclerlistview';
import { ViewTypes } from '../RecyclerViewTypes';
import RecyclerAssetListSharedState from './RecyclerAssetListSharedState';

export default class LayoutItemAnimator extends BaseItemAnimator {
  paddingBottom: number;
  constructor(paddingBottom: number) {
    super();
    this.paddingBottom = ViewTypes.FOOTER.calculateHeight({
      paddingBottom: paddingBottom || 0,
    });
  }

  animateDidMount = () => undefined;
  animateShift = () => false;
  animateWillMount = () => undefined;
  animateWillUnmount = () => undefined;

  animateWillUpdate = () => {
    const { rlv } = RecyclerAssetListSharedState;
    const hasScrollOffset = !!rlv?.getCurrentScrollOffset;
    const hasContentDimension = !!rlv?.getContentDimension;

    const x =
      hasScrollOffset &&
      hasContentDimension &&
      rlv.getContentDimension().height <
        rlv.getCurrentScrollOffset() +
          RecyclerAssetListSharedState.globalDeviceDimensions +
          this.paddingBottom &&
      rlv.getCurrentScrollOffset() > 0;

    if (x) {
      LayoutAnimation.configureNext({
        duration: 250,
        update: {
          delay: 10,
          type: 'easeInEaseOut',
        },
      });
    } else {
      LayoutAnimation.configureNext({
        duration: 200,
        update: {
          initialVelocity: 0,
          springDamping: 1,
          type: LayoutAnimation.Types.spring,
        },
      });
    }
  };
}
