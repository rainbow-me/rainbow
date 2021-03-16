import { useIsFocused } from '@react-navigation/native';
import React, {
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
} from 'react';
import { Alert, SectionList } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { CoinRowHeight, ExchangeCoinRow } from '../coin-row';
import DiscoverSheetContext from '../discover-sheet/DiscoverSheetContext';
import { GradientText, Text } from '../text';
import { usePrevious } from '@rainbow-me/hooks';
import { padding } from '@rainbow-me/styles';
import { deviceUtils, magicMemo } from '@rainbow-me/utils';

const deviceWidth = deviceUtils.dimensions.width;

const Header = styled.View`
  ${padding(11, 0, 2.5, 19)};
  position: relative;
`;

const HeaderBackground = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: [colors.white, colors.alpha(colors.white, 0)],
    end: { x: 0.5, y: 1 },
    locations: [0.55, 1],
    start: { x: 0.5, y: 0 },
  })
)`
  height: 40px;
  position: absolute;
  width: ${deviceWidth};
`;

const HeaderTitle = styled(Text).attrs(({ color, theme: { colors } }) => ({
  color: color || colors.blueGreyDark50,
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  weight: 'heavy',
}))``;

const HeaderTitleGradient = styled(GradientText).attrs({
  colors: ['#6AA2E3', '#FF54BB', '#FFA230'],
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  steps: [0, 0.2867132868, 1],
  weight: 'heavy',
})``;

const HeaderTitleWrapper = styled.View`
  width: ${android ? '150' : '143'}px;
`;

const ExchangeAssetSectionListHeader = ({ section }) => {
  const TitleComponent = section.useGradientText
    ? HeaderTitleGradient
    : HeaderTitle;
  return section?.title ? (
    <Header>
      <HeaderBackground />
      <HeaderTitleWrapper>
        <TitleComponent color={section.color}>{section.title}</TitleComponent>
      </HeaderTitleWrapper>
    </Header>
  ) : null;
};

const contentContainerStyle = { paddingBottom: 9.5 };
const keyExtractor = ({ uniqueId }) => `ExchangeAssetList-${uniqueId}`;
const scrollIndicatorInsets = { bottom: 24 };
const getItemLayout = ({ showBalance }, index) => {
  const height = showBalance ? CoinRowHeight + 1 : CoinRowHeight;
  return {
    index,
    length: height,
    offset: height * index,
  };
};

const ExchangeAssetSectionList = styled(SectionList).attrs({
  alwaysBounceVertical: true,
  contentContainerStyle,
  directionalLockEnabled: true,
  getItemLayout,
  initialNumToRender: 10,
  keyboardShouldPersistTaps: 'always',
  keyExtractor,
  maxToRenderPerBatch: 50,
  scrollEventThrottle: 32,
  scrollIndicatorInsets,
  windowSize: 41,
})`
  height: 100%;
`;

const ExchangeAssetList = (
  { itemProps, items, onLayout, query, testID, keyboardDismissMode = 'none' },
  ref
) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { sectionListRef = useRef() } = useContext(DiscoverSheetContext) || {};
  useImperativeHandle(ref, () => sectionListRef.current);
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

  const handleUnverifiedTokenPress = useCallback(
    item => {
      Alert.alert(
        `Unverified Token`,
        'This token has not been verified! Rainbow surfaces all tokens that exist on Uniswap. Anyone can create a token, including fake versions of existing tokens and tokens that claim to represent projects that do not have a token. Please do your own research and be careful when interacting with unverified tokens!',
        [
          {
            onPress: () => itemProps.onPress(item),
            text: `Proceed Anyway`,
          },
          {
            style: 'cancel',
            text: 'Go Back',
          },
        ]
      );
    },
    [itemProps]
  );

  const renderItemCallback = useCallback(
    ({ item }) => (
      <ExchangeCoinRow
        {...itemProps}
        isVerified={item.isVerified}
        item={item}
        onUnverifiedTokenPress={handleUnverifiedTokenPress}
        testID={testID}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const isFocused = useIsFocused();

  return (
    <ExchangeAssetSectionList
      keyboardDismissMode={keyboardDismissMode}
      onLayout={onLayout}
      ref={sectionListRef}
      renderItem={renderItemCallback}
      renderSectionHeader={ExchangeAssetSectionListHeader}
      scrollsToTop={isFocused}
      sections={items.map(createItem)}
    />
  );
};

export default magicMemo(forwardRef(ExchangeAssetList), ['items', 'query']);
