import PropTypes from 'prop-types';
import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { SectionList } from 'react-native-gesture-handler';
import { usePrevious } from '../../hooks';
import { exchangeModalBorderRadius } from '../../screens/ExchangeModal';
import { isNewValueForObjectPaths } from '../../utils';
import { CoinRow, ExchangeCoinRow } from '../coin-row';
import { Text } from '../text';
import { colors, fonts } from '../../styles';

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
    fontWeight: fonts.weight.semibold,
    opacity: 0.4,
  },
});

const contentContainerStyle = {
  paddingBottom: exchangeModalBorderRadius,
};

const scrollIndicatorInsets = {
  bottom: exchangeModalBorderRadius,
};

const getItemLayout = ({ showBalance }, index) => {
  const height = showBalance ? CoinRow.height + 1 : CoinRow.height;

  return {
    index,
    length: height,
    offset: height * index,
  };
};

const keyExtractor = ({ uniqueId }) => `ExchangeAssetList-${uniqueId}`;

const ExchangeAssetList = ({ itemProps, items, onLayout, query }) => {
  const sectionListRef = useRef();
  const prevQuery = usePrevious(query);

  // Scroll to top once the query is cleared
  if (prevQuery && prevQuery.length && !query.length) {
    sectionListRef.current.scrollToLocation({
      animated: true,
      itemIndex: 0,
      sectionIndex: 0,
      viewOffset: 0,
      viewPosition: 0,
    });
  }

  const createItem = useCallback(item => Object.assign(item, itemProps), [
    itemProps,
  ]);

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
      alwaysBounceVertical
      contentContainerStyle={contentContainerStyle}
      directionalLockEnabled
      getItemLayout={getItemLayout}
      height="100%"
      initialNumToRender={8}
      keyboardDismissMode="none"
      keyboardShouldPersistTaps="always"
      keyExtractor={keyExtractor}
      onLayout={onLayout}
      ref={sectionListRef}
      renderItem={renderItemCallback}
      renderSectionHeader={renderSectionHeaderCallback}
      scrollEventThrottle={32}
      scrollIndicatorInsets={scrollIndicatorInsets}
      sections={items.map(createItem)}
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

const propsAreEqual = (...props) =>
  !isNewValueForObjectPaths(...props, ['items', 'query']);

export default React.memo(ExchangeAssetList, propsAreEqual);
