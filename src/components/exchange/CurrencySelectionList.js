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
    margin={10}
    paddingBottom={CurrencySelectModalHeader.height + ExchangeSearch.height}
  >
    <Centered>
      <Emoji lineHeight="none" name="ghost" size="h1" />
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

const CurrencySelectionList = ({ itemProps, listItems, showList, query }) => {
  const skeletonTransitionRef = useRef();
  const [showSkeleton, setShowSkeleton] = useState(true);

  const showNoResults = get(listItems, '[0].data', []).length === 0;

  useEffect(() => {
    if (!showSkeleton && !showList) {
      setShowSkeleton(true);
    }
  }, [showList, showSkeleton]);

  const onListLayout = () => {
    if (showSkeleton && showList) {
      skeletonTransitionRef.current.animateNextTransition();
      setShowSkeleton(false);
    }
  };

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
              onLayout={onListLayout}
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
  !isNewValueForObjectPaths(...props, ['listItems', 'showList', 'query']);

export default memo(CurrencySelectionList, propsAreEqual);
