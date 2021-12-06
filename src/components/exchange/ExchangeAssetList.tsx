import { useIsFocused } from '@react-navigation/native';
import React, {
  forwardRef,
  Fragment,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
} from 'react';
import { Alert, Keyboard, SectionList } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../components/animations';
import { CoinRowHeight, ExchangeCoinRow } from '../coin-row';
import { ContactRow } from '../contacts';
import DiscoverSheetContext from '../discover-sheet/DiscoverSheetContext';
import { GradientText, Text } from '../text';
import { CopyToast, ToastPositionContainer } from '../toasts';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers' or its co... Remove this comment to see the full error message
import { TokenSectionTypes } from '@rainbow-me/helpers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { usePrevious } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { abbreviations, deviceUtils, magicMemo } from '@rainbow-me/utils';

const deviceWidth = deviceUtils.dimensions.width;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const HeaderTitleWrapper = styled.View``;

const contentContainerStyle = { paddingBottom: 9.5 };
const keyExtractor = ({ uniqueId }: any) => `ExchangeAssetList-${uniqueId}`;
const scrollIndicatorInsets = { bottom: 24 };
const getItemLayout = ({ showBalance }: any, index: any) => {
  const height = showBalance ? CoinRowHeight + 1 : CoinRowHeight;
  return {
    index,
    length: height,
    offset: height * index,
  };
};

function useSwapDetailsClipboardState() {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [copiedText, setCopiedText] = useState(undefined);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [copyCount, setCopyCount] = useState(0);
  const onCopySwapDetailsText = useCallback(text => {
    setCopiedText(abbreviations.formatAddressForDisplay(text));
    setCopyCount((count: any) => count + 1);
  }, []);
  return {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  };
}

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  height: 35px;
  width: 100%;
`;

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
  {
    footerSpacer,
    keyboardDismissMode = 'none',
    itemProps,
    items,
    onLayout,
    query,
    testID,
  }: any,
  ref: any
) => {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'sectionListRef' does not exist on type '... Remove this comment to see the full error message
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { sectionListRef = useRef() } = useContext(DiscoverSheetContext) || {};
  useImperativeHandle(ref, () => sectionListRef.current);
  const prevQuery = usePrevious(query);
  const { navigate } = useNavigation();
  const {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  } = useSwapDetailsClipboardState();

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

  const openVerifiedExplainer = useCallback(() => {
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, { type: 'verified' });
  }, [navigate]);

  const ExchangeAssetSectionListHeader = ({ section }: any) => {
    const TitleComponent = section.useGradientText
      ? HeaderTitleGradient
      : HeaderTitle;
    const isVerified = section.title === TokenSectionTypes.verifiedTokenSection;
    return section?.title ? (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <ButtonPressAnimation
        disabled={!isVerified}
        onPress={openVerifiedExplainer}
        scaleTo={0.96}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Header>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <HeaderBackground />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <HeaderTitleWrapper>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <TitleComponent color={section.color}>
              {`${section.title}${isVerified ? '  􀅵' : ' '}`}
            </TitleComponent>
          </HeaderTitleWrapper>
        </Header>
      </ButtonPressAnimation>
    ) : null;
  };

  // either show ENS row or Currency row
  const LineToRender = useCallback(
    ({ item }) => {
      return item.ens ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ContactRow
          accountType="contact"
          address={item.address}
          color={item.color}
          nickname={item.nickname}
          onPress={itemProps.onPress}
          showcaseItem={item}
          testID={testID}
        />
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ExchangeCoinRow
          {...itemProps}
          isVerified={item.isVerified}
          item={item}
          onCopySwapDetailsText={onCopySwapDetailsText}
          onUnverifiedTokenPress={handleUnverifiedTokenPress}
          testID={testID}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onCopySwapDetailsText]
  );
  const renderItemCallback = useCallback(
    ({ item, index, section }) => (
      // in the Discover screen search results, we mix in ENS rows with coin rows
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <LineToRender
        item={item}
        key={`${item.address}_${index}_${section.key}`}
      />
    ),
    []
  );

  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  const FooterSpacer = useCallback(() => (footerSpacer ? <Spacer /> : null), [
    footerSpacer,
  ]);

  const isFocused = useIsFocused();

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const sections = useMemo(() => items.map(createItem), [createItem, items]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ExchangeAssetSectionList
        ListFooterComponent={FooterSpacer}
        keyboardDismissMode={keyboardDismissMode}
        onLayout={onLayout}
        ref={sectionListRef}
        renderItem={renderItemCallback}
        renderSectionHeader={ExchangeAssetSectionListHeader}
        scrollsToTop={isFocused}
        sections={sections}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ToastPositionContainer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CopyToast copiedText={copiedText} copyCount={copyCount} />
      </ToastPositionContainer>
    </Fragment>
  );
};

export default magicMemo(forwardRef(ExchangeAssetList), ['items', 'query']);
