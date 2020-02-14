import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SectionList } from 'react-native-gesture-handler';
import { exchangeModalBorderRadius } from '../../screens/ExchangeModal';
import { CoinRow, ExchangeCoinRow } from '../coin-row';
import { Text } from '../text';
import { colors } from '../../styles';

const styles = StyleSheet.create({
  headerStyle: {
    backgroundColor: colors.white,
    flex: 1,
    paddingBottom: 6,
    paddingHorizontal: 19,
    paddingTop: 12,
  },
  headerStyleText: {
    color: colors.blueGreyDark,
    fontSize: 12,
    opacity: 0.4,
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

const ExchangeAssetList = ({ itemProps, items, onLayout, query }) => {
  // Scroll to top once the query is cleared
  const scrollView = useRef();
  const prevQueryRef = useRef();
  useEffect(() => {
    prevQueryRef.current = query;
  });
  const prevQuery = prevQueryRef.current;
  if (prevQuery && prevQuery.length && !query.length) {
    scrollView.current.scrollToLocation({
      animated: true,
      itemIndex: 0,
      sectionIndex: 0,
      viewOffset: 0,
      viewPosition: 0,
    });
  }

  const renderItemCallback = useCallback(
    ({ item }) => <ExchangeCoinRow {...itemProps} item={item} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const renderSectionHeaderCallback = useCallback(
    ({ section }) =>
      section.title ? (
        <View style={styles.headerStyle}>
          <Text style={styles.headerStyleText}>{section.title}</Text>
        </View>
      ) : null,
    []
  );

  return (
    <SectionList
      ref={scrollView}
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
      renderItem={renderItemCallback}
      renderSectionHeader={renderSectionHeaderCallback}
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
  query: PropTypes.string,
};

const propsAreEqual = (prev, next) => {
  return prev.items.length === next.items.length && prev.query === next.query;
};

export default React.memo(ExchangeAssetList, propsAreEqual);
