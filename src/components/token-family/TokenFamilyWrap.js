import { withSafeTimeout } from '@hocs/safe-timers';
import { times } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { View } from 'react-primitives';
import {
  compose,
  lifecycle,
  onlyUpdateForKeys,
  withState,
  withHandlers,
  withProps,
} from 'recompact';
import { createSelector } from 'reselect';
import { withOpenFamilyTabs, withFabSendAction } from '../../hoc';
import { colors } from '../../styles';
import { FadeInAnimation } from '../animations';
import { UniqueTokenRow } from '../unique-token';
import TokenFamilyHeader from './TokenFamilyHeader';

export const TokenFamilyWrapPaddingTop = 6;

const EnhancedUniqueTokenRow = compose(
  withNavigation,
  withHandlers({
    onPress: ({ assetType, navigation }) => (item) => {
      navigation.navigate('ExpandedAssetScreen', {
        asset: item,
        type: assetType,
      });
    },
    onPressSend: ({ navigation }) => (asset) => {
      navigation.navigate('SendSheet', { asset });
    },
  }),
)(UniqueTokenRow);

const getHeight = (openFamilyTab) => (openFamilyTab ? UniqueTokenRow.height + 100 : 100);

const TokenFamilyWrap = ({
  areChildrenVisible,
  childrenAmount,
  familyId,
  familyImage,
  familyName,
  highlight,
  isFamilyOpen,
  item,
  marginTop,
  onPressFamilyHeader,
  renderCollectibleItem,
}) => (
  <View backgroundColor={colors.white} marginTop={marginTop} overflow="hidden">
    <TokenFamilyHeader
      childrenAmount={childrenAmount}
      familyImage={familyImage}
      familyName={familyName}
      highlight={highlight}
      isOpen={isFamilyOpen}
      onHeaderPress={onPressFamilyHeader}
    />
    {areChildrenVisible && (
      <FadeInAnimation
        duration={TokenFamilyHeader.animationDuration}
        key={`uniqueTokenRow_${familyId}_fadeIn`}
        style={{ paddingTop: TokenFamilyWrapPaddingTop }}
      >
        {times(item.length, renderCollectibleItem)}
      </FadeInAnimation>
    )}
  </View>
);

TokenFamilyWrap.propTypes = {
  areChildrenVisible: PropTypes.bool,
  childrenAmount: PropTypes.number,
  familyId: PropTypes.string,
  familyImage: PropTypes.string,
  familyName: PropTypes.string,
  highlight: PropTypes.bool,
  isFamilyOpen: PropTypes.bool,
  isOpen: PropTypes.bool,
  item: PropTypes.array,
  marginTop: PropTypes.number,
  onPressFamilyHeader: PropTypes.func,
  renderCollectibleItem: PropTypes.func,
};

TokenFamilyWrap.getHeight = getHeight;

const familyIdSelector = state => state.familyId;
const openFamilyTabsSelector = state => state.openFamilyTabs;

const isFamilyOpenSelector = (familyId, openFamilyTabs) => ({
  isFamilyOpen: openFamilyTabs && openFamilyTabs[familyId],
});

const withFamilyOpenStateProps = createSelector(
  [familyIdSelector, openFamilyTabsSelector],
  isFamilyOpenSelector,
);

export default compose(
  withSafeTimeout,
  withFabSendAction,
  withOpenFamilyTabs,
  withProps(withFamilyOpenStateProps),
  withState('areChildrenVisible', 'setAreChildrenVisible', false),
  withHandlers({
    onHideChildren: ({ areChildrenVisible, setAreChildrenVisible }) => () => {
      if (areChildrenVisible) {
        setAreChildrenVisible(false);
      }
    },
    onPressFamilyHeader: ({ familyId, isFamilyOpen, setOpenFamilyTabs }) => () => (
      setOpenFamilyTabs({
        index: familyId,
        state: !isFamilyOpen,
      })
    ),
    onShowChildren: ({ areChildrenVisible, setAreChildrenVisible }) => () => {
      if (!areChildrenVisible) {
        setAreChildrenVisible(true);
      }
    },
    /* eslint-disable react/display-name */
    renderCollectibleItem: ({ familyId, item }) => (index) => (
      <EnhancedUniqueTokenRow
        assetType="unique_token"
        item={item[index]}
        key={`uniqueTokenRow_${familyId}_${index}`}
      />
    ),
    /* eslint-enable react/display-name */
  }),
  lifecycle({
    componentDidUpdate() {
      if (!this.props.isFamilyOpen) {
        this.props.onHideChildren();
      } else if (!this.props.areChildrenVisible) {
        this.props.setSafeTimeout(this.props.onShowChildren, TokenFamilyHeader.animationDuration);
      }
    },
  }),
  onlyUpdateForKeys([
    'areChildrenVisible',
    'childrenAmount',
    'highlight',
    'marginTop',
    'isFamilyOpen',
    'uniqueId',
  ]),
)(TokenFamilyWrap);
