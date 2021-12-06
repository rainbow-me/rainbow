import React, { createElement, Fragment } from 'react';
import { Share } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../coin-divider/CoinDividerButtonLabel' wa... Remove this comment to see the full error message
import CoinDividerButtonLabel from '../coin-divider/CoinDividerButtonLabel';
import { ContextMenu } from '../context-menu';
import { Column, Row } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../savings/SavingsListHeader' was resolved... Remove this comment to see the full error message
import SavingsListHeader from '../savings/SavingsListHeader';
import { H1 } from '../text';
import {
  useAccountProfile,
  useAccountSettings,
  useDimensions,
  useWallets,
  useWebData,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { RAINBOW_PROFILES_BASE_URL } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';

export const ListHeaderHeight = 50;

const BackgroundGradient = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: [
      colors.listHeaders.firstGradient,
      colors.listHeaders.secondGradient,
      colors.listHeaders.thirdGradient,
    ],
    end: { x: 0, y: 0 },
    pointerEvents: 'none',
    start: { x: 0, y: 0.5 },
  })
)`
  ${position.cover};
`;

const ShareCollectiblesBPA = styled(ButtonPressAnimation)`
  background-color: ${({ theme: { colors } }) =>
    colors.alpha(colors.blueGreyDark, 0.06)};
  border-radius: 15;
  height: 30;
  justify-content: center;
  max-width: 90;
  padding-bottom: 5;
  padding-top: 5;
  width: 90;
`;

const ShareCollectiblesButton = ({ onPress }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <ShareCollectiblesBPA onPress={onPress} scale={0.9}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <CoinDividerButtonLabel align="center" label="􀈂 Share" shareButton />
  </ShareCollectiblesBPA>
);

const Content = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(5, 19)};
  background-color: ${({ isSticky, theme: { colors } }) =>
    isSticky ? colors.white : colors.transparent};
  height: ${ListHeaderHeight};
  width: 100%;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const StickyBackgroundBlocker = styled.View`
  background-color: ${({ theme: { colors } }: any) => colors.transparent};
  height: ${({ isEditMode }: any) => (isEditMode ? ListHeaderHeight : 0)};
  top: ${({ isEditMode }: any) => (isEditMode ? -40 : 0)};
  width: ${({ deviceDimensions }: any) => deviceDimensions.width};
`;

export default function ListHeader({
  children,
  contextMenuOptions,
  isCoinListEdited,
  isSticky,
  showDivider = true,
  title,
  titleRenderer = H1,
  totalValue,
}: any) {
  const deviceDimensions = useDimensions();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const { isReadOnlyWallet } = useWallets();
  const { accountAddress } = useAccountSettings();
  const { accountENS } = useAccountProfile();
  const { initializeShowcaseIfNeeded } = useWebData();

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useCallback'.
  const handleShare = useCallback(() => {
    if (!isReadOnlyWallet) {
      initializeShowcaseIfNeeded();
    }
    const showcaseUrl = `${RAINBOW_PROFILES_BASE_URL}/${
      accountENS || accountAddress
    }`;
    const shareOptions = {
      message: isReadOnlyWallet
        ? `Check out this wallet's collectibles on 🌈 Rainbow at ${showcaseUrl}`
        : `Check out my collectibles on 🌈 Rainbow at ${showcaseUrl}`,
    };
    Share.share(shareOptions);
  }, [
    accountAddress,
    accountENS,
    initializeShowcaseIfNeeded,
    isReadOnlyWallet,
  ]);

  if (title === 'Pools') {
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <SavingsListHeader
        emoji="whale"
        isOpen={false}
        onPress={() => {}}
        savingsSumValue={totalValue}
        showSumValue
        title="Pools"
      />
    );
  } else {
    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Fragment>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BackgroundGradient />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Content isSticky={isSticky}>
          {title && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Row align="center">
              {createElement(titleRenderer, { children: title })}
              {title === 'Collectibles' && (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <Column align="flex-end" flex={1}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <ShareCollectiblesButton
                    onPress={() =>
                      handleShare(isReadOnlyWallet, accountAddress)
                    }
                  />
                </Column>
              )}
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <ContextMenu marginTop={3} {...contextMenuOptions} />
            </Row>
          )}
          {children}
        </Content>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        {showDivider && <Divider color={colors.rowDividerLight} />}
        {!isSticky && title !== 'Balances' && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <StickyBackgroundBlocker
            deviceDimensions={deviceDimensions}
            isEditMode={isCoinListEdited}
          />
        )}
      </Fragment>
    );
  }
}
