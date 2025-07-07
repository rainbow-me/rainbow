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
import { InteractionManager, Keyboard, SectionList, SectionListData, StyleSheet } from 'react-native';
import { triggerHaptics } from 'react-native-turbo-haptics';
import useAccountSettings from '@/hooks/useAccountSettings';
import FastCurrencySelectionRow from '@/components/asset-list/RecyclerAssetList2/FastComponents/FastCurrencySelectionRow';
import { ContactRow } from '@/components/contacts';
import { GradientText } from '@/components/text';
import { CopyToast, ToastPositionContainer } from '@/components/toasts';
import contextMenuProps from '@/components/exchangeAssetRowContextMenuProps';
import { IS_ANDROID, IS_IOS } from '@/env';
import { useAndroidScrollViewGestureHandler, usePrevious } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { abbreviations, magicMemo } from '@/utils';
import { Box, globalColors, Text, useColorMode } from '@/design-system';
import { colors } from '@/styles';
import ExchangeTokenRow from '@/components/ExchangeTokenRow';
import { SwappableAsset } from '@/entities';
import { toggleFavorite, useFavorites } from '@/resources/favorites';
import ConditionalWrap from 'conditional-wrap';
import { EasingGradient } from './easing-gradient/EasingGradient';
import { Navigation, useNavigation } from '@/navigation';

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
  section,
}: {
  section: SectionListData<EnrichedExchangeAsset>;
}) {
  const { isDarkMode } = useColorMode();

  if (!section.title) return null;

  const backgroundColor = isDarkMode ? globalColors.grey100 : '#FBFCFD';

  return (
    <Box backgroundColor={backgroundColor} height={25}>
      <EasingGradient
        startColor={backgroundColor}
        endColor={backgroundColor}
        startOpacity={1}
        endOpacity={0}
        style={styles.headerEasingGradient}
      />
      <Box paddingLeft="20px" height="full" width="full" justifyContent="center">
        <ConditionalWrap
          condition={section.useGradientText}
          wrap={children => (
            <GradientText colors={['#6AA2E3', '#FF54BB', '#FFA230']} locations={[0, 0.2867132868, 1]}>
              {children}
            </GradientText>
          )}
        >
          <Text size="15pt" weight="heavy" color={{ custom: section.color || colors.blueGreyDark50 }} testID={section.key}>
            {section.title}
          </Text>
        </ConditionalWrap>
      </Box>
    </Box>
  );
});

const ExchangeAssetList: ForwardRefRenderFunction<SectionList, ExchangeAssetListProps> = (
  { footerSpacer, keyboardDismissMode = 'none', itemProps, items, onLayout, query, testID, isExchangeList },
  ref
) => {
  const sectionListRef = ref as MutableRefObject<SectionList>;
  useImperativeHandle(ref, () => sectionListRef.current as SectionList);
  const prevQuery = usePrevious(query);
  const { getParent: dangerouslyGetParent } = useNavigation();
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
      Navigation.handleAction(Routes.EXPLAIN_SHEET, {
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
    [itemProps]
  );

  const { onScroll } = useAndroidScrollViewGestureHandler({
    navigation: dangerouslyGetParent?.(),
  });

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
    ({ section }: { section: SectionListData<EnrichedExchangeAsset> }) => <ExchangeAssetSectionListHeader section={section} />,
    []
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

const styles = StyleSheet.create({
  headerEasingGradient: {
    position: 'absolute',
    height: 15,
    bottom: -15,
    left: 0,
    right: 0,
  },
});

export default magicMemo(forwardRef(ExchangeAssetList), ['items', 'query', 'itemProps']);
