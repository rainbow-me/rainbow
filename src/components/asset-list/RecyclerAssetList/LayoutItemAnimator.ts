import { LayoutAnimation } from 'react-native';
import { BaseItemAnimator, RecyclerListView } from 'recyclerlistview';
import {
  RecyclerListViewProps,
  RecyclerListViewState,
} from 'recyclerlistview/dist/reactnative/core/RecyclerListView';
import { ViewTypes } from '../RecyclerViewTypes';
import RecyclerAssetListSharedState from './RecyclerAssetListSharedState';

export default class LayoutItemAnimator extends BaseItemAnimator {
  rlv: React.LegacyRef<
    RecyclerListView<RecyclerListViewProps, RecyclerListViewState>
  >;
  paddingBottom: number;
  constructor(
    rlv: React.LegacyRef<
      RecyclerListView<RecyclerListViewProps, RecyclerListViewState>
    >,
    paddingBottom: number
  ) {
    super();
    this.rlv = rlv;
    this.paddingBottom = ViewTypes.FOOTER.calculateHeight({
      paddingBottom: paddingBottom || 0,
    });
  }

  animateDidMount = () => undefined;
  animateShift = () => false;
  animateWillMount = () => undefined;
  animateWillUnmount = () => undefined;

  animateWillUpdate = () => {
    if (
      this.rlv &&
      this.rlv.getContentDimension().height <
        this.rlv.getCurrentScrollOffset() +
          RecyclerAssetListSharedState.globalDeviceDimensions +
          this.paddingBottom &&
      this.rlv.getCurrentScrollOffset() > 0
    ) {
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
