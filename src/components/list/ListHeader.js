import React, { createElement, Fragment } from 'react';
import { Share } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import CoinDividerButtonLabel from '../coin-divider/CoinDividerButtonLabel';
import { ContextMenu } from '../context-menu';
import { Column, Row } from '../layout';
import SavingsListHeader from '../savings/SavingsListHeader';
import { H1 } from '../text';
import {
  useAccountProfile,
  useAccountSettings,
  useDimensions,
  useWallets,
  useWebData,
} from '@rainbow-me/hooks';
import { RAINBOW_PROFILES_BASE_URL } from '@rainbow-me/references';
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

const ShareCollectiblesButton = ({ onPress }) => (
  <ShareCollectiblesBPA onPress={onPress} scale={0.9}>
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

const StickyBackgroundBlocker = styled.View`
  background-color: ${({ theme: { colors } }) => colors.transparent};
  height: ${({ isEditMode }) => (isEditMode ? ListHeaderHeight : 0)};
  top: ${({ isEditMode }) => (isEditMode ? -40 : 0)};
  width: ${({ deviceDimensions }) => deviceDimensions.width};
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
}) {
  const deviceDimensions = useDimensions();
  const { colors } = useTheme();
  const { isReadOnlyWallet } = useWallets();
  const { accountAddress } = useAccountSettings();
  const { accountENS } = useAccountProfile();
  const { initializeShowcaseIfNeeded } = useWebData();

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
      <Fragment>
        <BackgroundGradient />
        <Content isSticky={isSticky}>
          {title && (
            <Row align="center">
              {createElement(titleRenderer, { children: title })}
              {title === 'Collectibles' && (
                <Column align="flex-end" flex={1}>
                  <ShareCollectiblesButton
                    onPress={() =>
                      handleShare(isReadOnlyWallet, accountAddress)
                    }
                  />
                </Column>
              )}
              <ContextMenu marginTop={3} {...contextMenuOptions} />
            </Row>
          )}
          {children}
        </Content>
        {showDivider && <Divider color={colors.rowDividerLight} />}
        {!isSticky && title !== 'Balances' && (
          <StickyBackgroundBlocker
            deviceDimensions={deviceDimensions}
            isEditMode={isCoinListEdited}
          />
        )}
      </Fragment>
    );
  }
}
