import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { memo, useEffect, useRef, useState } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import { withNeverRerender } from '../../hoc';
import { colors, position } from '../../styles';
import { isNewValueForObjectPaths } from '../../utils';
import { EmptyAssetList } from '../asset-list';
import { Centered, ColumnWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import CurrencySelectModalHeader from './CurrencySelectModalHeader';
import ExchangeAssetList from './ExchangeAssetList';
import ExchangeSearch from './ExchangeSearch';

const skeletonTransition = (
  <Transition.Sequence>
    <Transition.Out interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={0.001} interpolation="easeOut" />
    <Transition.In durationMs={0.001} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

const NoResultMessage = withNeverRerender(() => (
  <ColumnWithMargins
    {...position.centeredAsObject}
    margin={3}
    paddingBottom={CurrencySelectModalHeader.height + ExchangeSearch.height / 2}
  >
    <Centered>
      <Emoji lineHeight="none" name="ghost" size={42} />
    </Centered>
    <Text
      color={colors.alpha(colors.blueGreyDark, 0.4)}
      size="lmedium"
      weight="medium"
    >
      Nothing here!
    </Text>
  </ColumnWithMargins>
));

const CurrencySelectionList = ({
  itemProps,
  listItems,
  loading,
  showList,
  query,
}) => {
  const skeletonTransitionRef = useRef();
  const [showSkeleton, setShowSkeleton] = useState(true);
  const showNoResults = get(listItems, '[0].data', []).length === 0;

  useEffect(() => {
    if (showSkeleton && !loading) {
      skeletonTransitionRef.current.animateNextTransition();
      setShowSkeleton(false);
    }
  }, [loading, showSkeleton]);

  return (
    <Transitioning.View
      flex={1}
      ref={skeletonTransitionRef}
      transition={skeletonTransition}
    >
      {showList && (
        <Centered flex={1}>
          {showNoResults ? (
            <NoResultMessage />
          ) : (
            <ExchangeAssetList
              itemProps={itemProps}
              items={listItems}
              query={query}
            />
          )}
        </Centered>
      )}
      {(showSkeleton || !showList) && (
        <EmptyAssetList
          {...position.coverAsObject}
          backgroundColor={colors.white}
          pointerEvents="none"
        />
      )}
    </Transitioning.View>
  );
};

CurrencySelectionList.propTypes = {
  itemProps: PropTypes.object,
  listItems: PropTypes.array,
  query: PropTypes.string,
  showList: PropTypes.bool,
};

const propsAreEqual = (...props) =>
  !isNewValueForObjectPaths(...props, ['listItems', 'showList']);

export default memo(CurrencySelectionList, propsAreEqual);
