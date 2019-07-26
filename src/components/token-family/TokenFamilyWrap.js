import { times } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { View } from 'react-primitives';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
import { createSelector } from 'reselect';
import { withOpenFamilyTabs, withFabSendAction } from '../../hoc';
import { colors } from '../../styles';
import { FadeInAnimation } from '../animations';
import { UniqueTokenRow } from '../unique-token';
import TokenFamilyHeader from './TokenFamilyHeader';

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
  childrenAmount,
  familyImage,
  familyName,
  highlight,
  isOpen,
  item,
  onPressFamilyHeader,
  renderCollectibleItem,
}) => (
  <View backgroundColor={colors.white}>
    <TokenFamilyHeader
      childrenAmount={childrenAmount}
      familyImage={familyImage}
      familyName={familyName}
      highlight={highlight}
      isOpen={isOpen}
      onHeaderPress={onPressFamilyHeader}
    />
    {isOpen && times(item.length, renderCollectibleItem)}
  </View>
);

TokenFamilyWrap.propTypes = {
  childrenAmount: PropTypes.number,
  familyImage: PropTypes.string,
  familyName: PropTypes.string,
  highlight: PropTypes.bool,
  isOpen: PropTypes.bool,
  item: PropTypes.array,
  onPressFamilyHeader: PropTypes.func,
  renderCollectibleItem: PropTypes.func,
};

TokenFamilyWrap.getHeight = getHeight;

const familyIdSelector = state => state.familyId;
const openFamilyTabsSelector = state => state.openFamilyTabs;

const isFamilyOpenSelector = (familyId, openFamilyTabs) => ({
  isOpen: openFamilyTabs && openFamilyTabs[familyId],
});

const withFamilyOpenStateProps = createSelector(
  [familyIdSelector, openFamilyTabsSelector],
  isFamilyOpenSelector,
);

export default compose(
  withFabSendAction,
  withOpenFamilyTabs,
  withProps(withFamilyOpenStateProps),
  withHandlers({
    onPressFamilyHeader: ({ familyId, isOpen, setOpenFamilyTabs }) => () => (
      setOpenFamilyTabs({
        index: familyId,
        state: !isOpen,
      })
    ),
    /* eslint-disable react/display-name */
    renderCollectibleItem: ({ familyId, item }) => (index) => (
      <FadeInAnimation duration={100} key={`uniqueTokenRow_${familyId}_${index}_fadeIn`}>
        <EnhancedUniqueTokenRow
          assetType="unique_token"
          item={item[index]}
          key={`uniqueTokenRow_${familyId}_${index}`}
        />
      </FadeInAnimation>
    ),
    /* eslint-enable react/display-name */
  }),
  onlyUpdateForKeys([
    'childrenAmount',
    'highlight',
    'isOpen',
    'uniqueId',
  ]),
)(TokenFamilyWrap);
