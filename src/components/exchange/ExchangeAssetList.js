import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
// import { FlatList } from 'react-native-gesture-handler';
import { exchangeModalBorderRadius } from '../../screens/ExchangeModal';
import { CoinRow, ExchangeCoinRow } from '../coin-row';
import { Text } from '../text';
import { colors } from '../../styles';

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: colors.white,
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
});

const getItemLayout = (_, index) => ({
  index,
  length: CoinRow.height,
  offset: CoinRow.height * index,
});

const keyExtractor = ({ uniqueId }) => `ExchangeAssetList-${uniqueId}`;

const contentContainerStyle = {
  paddingBottom: exchangeModalBorderRadius,
};

const scrollIndicatorInsets = {
  bottom: exchangeModalBorderRadius,
};

const ExchangeAssetList = ({ itemProps, items, onLayout }) => {
  const renderItemCallback = useCallback(
    ({ item }) => <ExchangeCoinRow {...itemProps} item={item} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  /*
  return (
    <FlatList
      alwaysBounceVertical
      contentContainerStyle={contentContainerStyle}
      data={items}
      directionalLockEnabled
      getItemLayout={getItemLayout}
      height="100%"
      initialNumToRender={8}
      keyboardDismissMode="none"
      keyboardShouldPersistTaps="always"
      keyExtractor={keyExtractor}
      onLayout={onLayout}
      removeClippedSubviews
      renderItem={renderItemCallback}
      scrollEventThrottle={32}
      scrollIndicatorInsets={scrollIndicatorInsets}
      windowSize={11}
    />
  );
  */

  console.log('ITEMS', items);
  return (
    <SectionList
      alwaysBounceVertical
      contentContainerStyle={contentContainerStyle}
      sections={items}
      directionalLockEnabled
      getItemLayout={getItemLayout}
      height="100%"
      initialNumToRender={8}
      keyboardDismissMode="none"
      keyboardShouldPersistTaps="always"
      keyExtractor={keyExtractor}
      onLayout={onLayout}
      removeClippedSubviews
      renderItem={renderItemCallback}
      renderSectionHeader={({ section }) => {
        if (section.title) {
          return (
            <View style={styles.headerStyle}>
              <Text>{section.title}</Text>
            </View>
          );
        } else {
          return null;
        }
      }}
      scrollEventThrottle={32}
      scrollIndicatorInsets={scrollIndicatorInsets}
      windowSize={11}
    />
  );
};

ExchangeAssetList.propTypes = {
  itemProps: PropTypes.object,
  items: PropTypes.array.isRequired,
  onLayout: PropTypes.func,
};

const propsAreEqual = (prev, next) => prev.items.length === next.items.length;

export default React.memo(ExchangeAssetList, propsAreEqual);
