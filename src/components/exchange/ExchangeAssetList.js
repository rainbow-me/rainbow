import { useIsFocused } from '@react-navigation/native';
import React, {
  forwardRef,
  Fragment,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  InteractionManager,
  Keyboard,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { ButtonPressAnimation } from '../../components/animations';
import useAccountSettings from '../../hooks/useAccountSettings';
import FastCurrencySelectionRow from '../asset-list/RecyclerAssetList2/FastComponents/FastCurrencySelectionRow';
import { CoinRowHeight } from '../coin-row';
import { ContactRow } from '../contacts';
import DiscoverSheetContext from '../discover-sheet/DiscoverSheetContext';
import { GradientText, Text } from '../text';
import { CopyToast, ToastPositionContainer } from '../toasts';
import contextMenuProps from './exchangeAssetRowContextMenuProps';
import { TokenSectionTypes } from '@/helpers';
import {
  useAndroidScrollViewGestureHandler,
  usePrevious,
  useUserLists,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import store from '@/redux/store';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { useTheme } from '@/theme';
import { abbreviations, deviceUtils, haptics, magicMemo } from '@/utils';

const deviceWidth = deviceUtils.dimensions.width;

const Header = styled.View({
  position: 'relative',
  ...padding.object(11, 0, 2.5, 19),
});

const HeaderBackground = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: [colors.white, colors.alpha(colors.white, 0)],
    end: { x: 0.5, y: 1 },
    locations: [0.55, 1],
    start: { x: 0.5, y: 0 },
  })
)({
  height: 40,
  position: 'absolute',
  width: deviceWidth,
});

const HeaderTitle = styled(Text).attrs(({ color, theme: { colors } }) => ({
  color: color || colors.blueGreyDark50,
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  weight: 'heavy',
}))({});

const HeaderTitleGradient = styled(GradientText).attrs({
  colors: ['#6AA2E3', '#FF54BB', '#FFA230'],
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  steps: [0, 0.2867132868, 1],
  weight: 'heavy',
})({});

const HeaderTitleWrapper = styled.View({});

const contentContainerStyle = { paddingBottom: 9.5 };
const scrollIndicatorInsets = { bottom: 24 };
const keyExtractor = ({ uniqueId }) => `ExchangeAssetList-${uniqueId}`;

const getItemLayout = ({ showBalance }, index) => {
  const height = showBalance ? CoinRowHeight + 1 : CoinRowHeight;
  return {
    index,
    length: height,
    offset: height * index,
  };
};

function useSwapDetailsClipboardState() {
  const [copiedText, setCopiedText] = useState(undefined);
  const [copyCount, setCopyCount] = useState(0);
  const onCopySwapDetailsText = useCallback(text => {
    setCopiedText(abbreviations.formatAddressForDisplay(text));
    setCopyCount(count => count + 1);
  }, []);
  return {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  };
}

const Spacer = styled.View({
  height: 35,
  width: '100%',
});

const ExchangeAssetSectionList = styled(SectionList).attrs({
  alwaysBounceVertical: true,
  contentContainerStyle,
  directionalLockEnabled: true,
  getItemLayout,
  keyboardShouldPersistTaps: 'always',
  keyExtractor,
  scrollIndicatorInsets,
  windowSize: 7,
})({
  height: '100%',
});

function renderItem({ item }) {
  if (item.ens) {
    // TODO RNBW-3676
    return (
      <ContactRow
        accountType="contact"
        address={item.address}
        color={item.color}
        nickname={item.nickname}
        onPress={item.onPress}
        showcaseItem={item}
        testID={item.testID}
      />
    );
  }
  return <FastCurrencySelectionRow item={item} />;
}

const ExchangeAssetList = (
  {
    footerSpacer,
    keyboardDismissMode = 'none',
    itemProps,
    items,
    onLayout,
    query,
    testID,
  },
  ref
) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { sectionListRef = useRef() } = useContext(DiscoverSheetContext) || {};
  useImperativeHandle(ref, () => sectionListRef.current);
  const prevQuery = usePrevious(query);
  const { dangerouslyGetParent, navigate } = useNavigation();
  const {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  } = useSwapDetailsClipboardState();
  const { updateList } = useUserLists();

  // Scroll to top once the query is cleared
  if (prevQuery && prevQuery.length && !query.length) {
    sectionListRef.current?.scrollToLocation({
      animated: true,
      itemIndex: 0,
      sectionIndex: 0,
      viewOffset: 0,
      viewPosition: 0,
    });
  }

  const handleUnverifiedTokenPress = useCallback(
    item => {
      Keyboard.dismiss();
      navigate(Routes.EXPLAIN_SHEET, {
        asset: item,
        onClose: () => {
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              itemProps.onPress(item);
            }, 250);
          });
        },
        type: 'unverified',
      });
    },
    [itemProps, navigate]
  );

  const { onScroll } = useAndroidScrollViewGestureHandler({
    navigation: dangerouslyGetParent(),
  });

  const openVerifiedExplainer = useCallback(() => {
    Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, { type: 'verified' });
  }, [navigate]);

  const ExchangeAssetSectionListHeader = ({ section }) => {
    const TitleComponent = section.useGradientText
      ? HeaderTitleGradient
      : HeaderTitle;
    const isVerified = section.title === TokenSectionTypes.verifiedTokenSection;
    return section?.title ? (
      <ButtonPressAnimation
        disabled={!isVerified}
        onPress={openVerifiedExplainer}
        scaleTo={0.96}
      >
        <Header>
          <HeaderBackground />
          <HeaderTitleWrapper>
            <TitleComponent color={section.color} testID={section.key}>
              {`${section.title}${isVerified ? '  􀅵' : ' '}`}
            </TitleComponent>
          </HeaderTitleWrapper>
        </Header>
      </ButtonPressAnimation>
    ) : null;
  };

  const FooterSpacer = useCallback(() => (footerSpacer ? <Spacer /> : null), [
    footerSpacer,
  ]);

  const isFocused = useIsFocused();

  const theme = useTheme();

  const { nativeCurrency, nativeCurrencySymbol } = useAccountSettings();
  const [localFavorite, setLocalFavorite] = useState(() => {
    const meta = store.getState().uniswap.favoritesMeta;
    if (!meta) {
      return;
    }
    return Object.keys(meta).reduce((acc, curr) => {
      acc[curr] = meta[curr].favorite;
      return acc;
    }, {});
  });

  const enrichedItems = useMemo(
    () =>
      items.map(({ data, ...item }) => ({
        ...item,
        data: data.map(rowData => ({
          ...rowData,
          contextMenuProps: contextMenuProps(
            rowData ?? store.getState().data.genericAssets?.[rowData.uniqueId],
            onCopySwapDetailsText
          ),
          nativeCurrency,
          nativeCurrencySymbol,
          onAddPress: () => {
            itemProps.onActionAsset(
              rowData ?? store.getState().data.genericAssets?.[rowData.uniqueId]
            );
          },
          onCopySwapDetailsText,
          onPress: givenItem => {
            if (rowData.ens) {
              return itemProps.onPress(givenItem);
            }
            const asset = store.getState().data.genericAssets?.[
              rowData.uniqueId
            ];
            if (rowData.isVerified || itemProps.showBalance) {
              itemProps.onPress(rowData ?? asset);
            } else {
              handleUnverifiedTokenPress(rowData || asset);
            }
          },
          showAddButton: itemProps.showAddButton,
          showBalance: itemProps.showBalance,
          showFavoriteButton: itemProps.showFavoriteButton,
          testID,
          theme,
          toggleFavorite: onNewEmoji => {
            setLocalFavorite(prev => {
              const newValue = !prev[rowData.address];
              updateList(rowData?.address, 'favorites', newValue);
              if (newValue) {
                ios && onNewEmoji();
                haptics.notificationSuccess();
              } else {
                haptics.selection();
              }

              return {
                ...prev,
                [rowData.address]: newValue,
              };
            });
          },
        })),
      })),
    [
      handleUnverifiedTokenPress,
      itemProps,
      items,
      nativeCurrency,
      nativeCurrencySymbol,
      onCopySwapDetailsText,
      testID,
      theme,
      updateList,
    ]
  );

  // we don't wanna cause recreating of everything if only local fav is changing
  const itemsWithFavorite = useMemo(
    () =>
      enrichedItems.map(({ data, ...item }) => ({
        ...item,
        data: data.map(rowData => ({
          ...rowData,
          favorite: !!localFavorite[rowData.address] || false,
        })),
      })),
    [enrichedItems, localFavorite]
  );

  return (
    <Fragment>
      <View style={sx.wrapper}>
        <ExchangeAssetSectionList
          ListFooterComponent={FooterSpacer}
          keyboardDismissMode={keyboardDismissMode}
          onLayout={onLayout}
          onScroll={android ? onScroll : undefined}
          ref={sectionListRef}
          renderItem={renderItem}
          renderSectionHeader={ExchangeAssetSectionListHeader}
          scrollsToTop={isFocused}
          sections={itemsWithFavorite}
        />
      </View>

      <ToastPositionContainer>
        <CopyToast copiedText={copiedText} copyCount={copyCount} />
      </ToastPositionContainer>
    </Fragment>
  );
};

const sx = StyleSheet.create({
  wrapper: { height: '100%', width: '100%' },
});

export default magicMemo(forwardRef(ExchangeAssetList), ['items', 'query']);
