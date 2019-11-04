import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import { withNeverRerender } from '../../hoc';
import { exchangeModalBorderRadius } from '../../screens/ExchangeModal';
import { colors, position } from '../../styles';
import { EmptyAssetList } from '../asset-list';
import { Centered, ColumnWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import CurrencySelectModalHeader from './CurrencySelectModalHeader';
import ExchangeAssetList from './ExchangeAssetList';
import ExchangeSearch from './ExchangeSearch';

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

const skeletonTransition = (
  <Transition.Sequence>
    <Transition.Out interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={0.001} interpolation="easeOut" />
    <Transition.In durationMs={0.001} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

const CurrencySelectionList = ({ listItems, renderItem, showList, type }) => {
  const skeletonTransitionRef = useRef();
  const [showSkeleton, setShowSkeleton] = useState(true);

  const showNoResults = listItems.length === 0;

  const onListMount = () => {
    if (showSkeleton && showList) {
      skeletonTransitionRef.current.animateNextTransition();
      setShowSkeleton(false);
    }
  };

  useEffect(() => {
    if (!showSkeleton && !showList) {
      setShowSkeleton(true);
    }
  }, [showList, showSkeleton]);

  return (
    <Transitioning.View
      flex={1}
      key={`TransitionView-${type}`}
      ref={skeletonTransitionRef}
      transition={skeletonTransition}
    >
      {showList && (
        <Centered flex={1}>
          {showNoResults ? (
            <NoResultMessage />
          ) : (
            <ExchangeAssetList
              items={listItems}
              onMount={onListMount}
              key={`ExchangeAssetListCurrencySelectionModal-${type}`}
              renderItem={renderItem}
              scrollIndicatorInsets={{
                bottom: exchangeModalBorderRadius,
              }}
            />
          )}
        </Centered>
      )}
      {(showSkeleton || !showList) && (
        <EmptyAssetList
          {...position.coverAsObject}
          backgroundColor={colors.white}
          key={`EmptyAssetList-${type}`}
          pointerEvents="none"
        />
      )}
    </Transitioning.View>
  );
};

CurrencySelectionList.propTypes = {
  listItems: PropTypes.array,
  renderItem: PropTypes.func,
  showList: PropTypes.bool,
  type: PropTypes.string,
};

export default React.memo(CurrencySelectionList);
