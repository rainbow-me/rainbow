import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { withNeverRerender } from '../../hoc';
import { exchangeModalBorderRadius } from '../../screens/ExchangeModal';
import { colors, position } from '../../styles';
import { EmptyAssetList } from '../asset-list';
import { Centered, ColumnWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import CurrencySelectModalHeader from './CurrencySelectModalHeader';
import ExchangeAssetList from './ExchangeAssetList';
import ExchangeSearch from './ExchangeSearch';

const NoResultMessageOffset =
  CurrencySelectModalHeader.height + ExchangeSearch.height;

const NoResultMessage = withNeverRerender(() => (
  <ColumnWithMargins
    {...position.centeredAsObject}
    margin={10}
    paddingBottom={NoResultMessageOffset}
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

const CurrencySelectionList = ({ listItems, renderItem, showList, type }) => {
  const showNoResults = listItems.length === 0;

  const [showSkeleton, setShowSkeleton] = useState(true);
  useEffect(() => {
    if (showSkeleton && !showList) {
      setShowSkeleton(true);
    }
  }, [showList, showSkeleton]);

  return (
    <View flex={1}>
      {showList && (
        <Centered flex={1}>
          {showNoResults ? (
            <NoResultMessage />
          ) : (
            <ExchangeAssetList
              items={listItems}
              onMount={() => setShowSkeleton(false)}
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
    </View>
  );
};

CurrencySelectionList.propTypes = {
  listItems: PropTypes.array,
  renderItem: PropTypes.func,
  showList: PropTypes.bool,
  type: PropTypes.string,
};

export default React.memo(CurrencySelectionList);
