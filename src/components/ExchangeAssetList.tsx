import { useIsFocused } from '@react-navigation/native';
import React, {
  ForwardRefRenderFunction,
  MutableRefObject,
  ReactElement,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { InteractionManager, Keyboard, SectionList, SectionListData } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { ButtonPressAnimation } from '@/components/animations';
import useAccountSettings from '@/hooks/useAccountSettings';
import FastCurrencySelectionRow from '@/components/asset-list/RecyclerAssetList2/FastComponents/FastCurrencySelectionRow';
import { ContactRow } from '@/components/contacts';
import { GradientText } from '@/components/text';
import { CopyToast, ToastPositionContainer } from '@/components/toasts';
import contextMenuProps from '@/components/exchangeAssetRowContextMenuProps';
import { IS_ANDROID, IS_IOS } from '@/env';
import { TokenSectionTypes } from '@/helpers';
import { useAndroidScrollViewGestureHandler, usePrevious } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { useTheme } from '@/theme';
import { abbreviations, deviceUtils, magicMemo } from '@/utils';
import { Box, Text } from '@/design-system';
import { colors, Colors } from '@/styles';
import ExchangeTokenRow from '@/components/ExchangeTokenRow';
import { SwappableAsset } from '@/entities';
import { toggleFavorite, useFavorites } from '@/resources/favorites';

export interface EnrichedExchangeAsset extends SwappableAsset {
  ens: boolean;
  color: string;
  nickname: string;
  onPress: (el: ReactElement) => void;
  testID: string;
  useGradientText: boolean;
  title?: string;
  key: string;
  disabled?: boolean;
}

const deviceWidth = deviceUtils.dimensions.width;

const HeaderBackground = styled(LinearGradient).attrs(({ theme: { colors } }: { theme: { colors: Colors } }) => ({
  colors: [colors.white, colors.alpha(colors.white, 0)],
  end: { x: 0.5, y: 1 },
  locations: [0.65, 1],
  start: { x: 0.5, y: 0 },
}))({
  height: 40,
  position: 'absolute',
  width: deviceWidth,
});

const HeaderTitleGradient = styled(GradientText).attrs({
  colors: ['#6AA2E3', '#FF54BB', '#FFA230'],
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  steps: [0, 0.2867132868, 1],
  weight: 'heavy',
})({});

const contentContainerStyle = { paddingBottom: 9.5 };
const scrollIndicatorInsets = { bottom: 24 };
const keyExtractor = ({ uniqueId }: { uniqueId: string }) => `ExchangeAssetList-${uniqueId}`;

function useSwapDetailsClipboardState() {
  const [copiedText, setCopiedText] = useState<string>();
  const [copyCount, setCopyCount] = useState(0);
  const onCopySwapDetailsText = useCallback((text: string) => {
    setCopiedText(abbreviations.formatAddressForDisplay(text));
    setCopyCount(count => count + 1);
  }, []);
  return {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  };
}

function renderItem({ item }: { item: EnrichedExchangeAsset }) {
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

function renderExchangeItem({ item }: { item: EnrichedExchangeAsset }) {
  return <ExchangeTokenRow item={item} />;
}

interface ExchangeAssetListProps {
  footerSpacer: boolean;
  keyboardDismissMode?: 'none' | 'interactive' | 'on-drag';
  itemProps: {
    onPress: (item: any) => void;
    showBalance: boolean;
    showFavoriteButton: boolean;
  };
  items: { data: EnrichedExchangeAsset[]; title: string }[];
  onLayout?: () => void;
  query: string;
  testID: string;
  isExchangeList?: boolean;
}

const ExchangeAssetSectionListHeader = memo(function ExchangeAssetSectionListHeader({
  openVerifiedExplainer,
  section,
}: {
  openVerifiedExplainer: () => void;
  section: SectionListData<EnrichedExchangeAsset>;
}) {
  const TitleComponent = section.useGradientText
    ? HeaderTitleGradient
    : ({ children, color, testID }: { children: ReactElement; color: string; testID: string }) => (
        <Text size="14px / 19px (Deprecated)" weight="heavy" color={{ custom: color || colors.blueGreyDark50 }} testID={testID}>
          {children}
        </Text>
      );
  const isVerified = section.title === TokenSectionTypes.verifiedTokenSection;
  return section?.title ? (
    <ButtonPressAnimation disabled={!isVerified} onPress={openVerifiedExplainer} scaleTo={0.96}>
      <Box paddingTop={section.useGradientText ? '10px' : { custom: 14 }} paddingBottom="4px" paddingLeft="20px">
        <HeaderBackground />
        <Box>
          <TitleComponent color={section.color} testID={section.key}>
            {`${section.title}${isVerified ? '  􀅵' : ' '}`}
          </TitleComponent>
        </Box>
      </Box>
    </ButtonPressAnimation>
  ) : null;
});

const ExchangeAssetList: ForwardRefRenderFunction<SectionList, ExchangeAssetListProps> = (
  { footerSpacer, keyboardDismissMode = 'none', itemProps, items, onLayout, query, testID, isExchangeList },
  ref
) => {
  const sectionListRef = ref as MutableRefObject<SectionList>;
  useImperativeHandle(ref, () => sectionListRef.current as SectionList);
  const prevQuery = usePrevious(query);
  const { getParent: dangerouslyGetParent, navigate } = useNavigation();
  const { copiedText, copyCount, onCopySwapDetailsText } = useSwapDetailsClipboardState();

  // Scroll to top once the query is cleared
  if (prevQuery && prevQuery.length && !query.length) {
    setTimeout(() => {
      sectionListRef.current?.scrollToLocation({
        animated: true,
        itemIndex: 0,
        sectionIndex: 0,
        viewOffset: 0,
        viewPosition: 0,
      });
    }, 100);
  }

  const handleUnverifiedTokenPress = useCallback(
    (item: SwappableAsset) => {
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
    navigation: dangerouslyGetParent?.(),
  });

  const openVerifiedExplainer = useCallback(() => {
    Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, { type: 'verified' });
  }, [navigate]);

  const FooterSpacer = useCallback(() => (footerSpacer ? <Box width="full" height={{ custom: 35 }} /> : null), [footerSpacer]);

  const isFocused = useIsFocused();

  const theme = useTheme();
  const { favoritesMetadata } = useFavorites();
  const { nativeCurrency, nativeCurrencySymbol } = useAccountSettings();
  const [localFavorite, setLocalFavorite] = useState<Record<string, boolean | undefined> | undefined>(() =>
    Object.keys(favoritesMetadata).reduce((acc: Record<string, boolean | undefined>, curr: string) => {
      acc[curr] = favoritesMetadata[curr].favorite;
      return acc;
    }, {})
  );

  const enrichedItems = useMemo(
    () =>
      items.map(({ data, ...item }) => ({
        ...item,
        data: data.map(rowData => ({
          ...rowData,
          contextMenuProps: contextMenuProps(rowData, onCopySwapDetailsText),
          nativeCurrency,
          nativeCurrencySymbol,
          onCopySwapDetailsText,
          onPress: (givenItem: ReactElement) => {
            if (rowData.ens) {
              return itemProps.onPress(givenItem);
            }

            if (rowData.isVerified || itemProps.showBalance) {
              itemProps.onPress(rowData);
            } else {
              handleUnverifiedTokenPress(rowData);
            }
          },
          showBalance: itemProps.showBalance,
          showFavoriteButton: itemProps.showFavoriteButton,
          testID,
          theme,
          toggleFavorite: (onNewEmoji: () => void) => {
            setLocalFavorite(prev => {
              const address = rowData.address;
              const newValue = !prev?.[address];
              toggleFavorite(address);
              if (newValue) {
                IS_IOS && onNewEmoji();
                triggerHaptics('notificationSuccess');
              } else {
                triggerHaptics('selection');
              }

              return {
                ...prev,
                [address]: newValue,
              };
            });
          },
        })),
      })),
    [handleUnverifiedTokenPress, itemProps, items, nativeCurrency, nativeCurrencySymbol, onCopySwapDetailsText, testID, theme]
  );

  // we don't wanna cause recreating of everything if only local fav is changing
  const itemsWithFavorite = useMemo(
    () =>
      enrichedItems.map(({ data, ...item }) => ({
        ...item,
        data: data.map(rowData => ({
          ...rowData,
          favorite: !!localFavorite?.[rowData.address] || false,
        })),
      })),
    [enrichedItems, localFavorite]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<EnrichedExchangeAsset> }) => (
      <ExchangeAssetSectionListHeader openVerifiedExplainer={openVerifiedExplainer} section={section} />
    ),
    [openVerifiedExplainer]
  );

  return (
    <>
      <Box width="full" height="full">
        <SectionList
          alwaysBounceVertical
          contentContainerStyle={contentContainerStyle}
          directionalLockEnabled
          ListFooterComponent={FooterSpacer}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={keyboardDismissMode}
          onLayout={onLayout}
          onScroll={IS_ANDROID ? onScroll : undefined}
          ref={sectionListRef}
          renderItem={isExchangeList ? renderExchangeItem : renderItem}
          renderSectionHeader={renderSectionHeader}
          scrollsToTop={isFocused}
          sections={itemsWithFavorite}
          keyExtractor={keyExtractor}
          scrollIndicatorInsets={scrollIndicatorInsets}
        />
      </Box>

      <ToastPositionContainer>
        <CopyToast copiedText={copiedText} copyCount={copyCount} />
      </ToastPositionContainer>
    </>
  );
};

export default magicMemo(forwardRef(ExchangeAssetList), ['items', 'query', 'itemProps']);
