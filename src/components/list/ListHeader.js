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

export const ListHeaderHeight = 44;

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
  background-color: ${({ theme: { colors } }) => colors.blueGreyDarkLight};
  margin-right: 0;
  width: 90;
  height: 30;
  border-radius: 15;
  padding-left: 12;
  padding-right: 8;
  padding-top: 5;
  padding-bottom: 5;
  justify-content: center;
`;

const ShareCollectiblesButton = ({ onPress }) => (
  <ShareCollectiblesBPA onPress={onPress} scale={0.9}>
    <CoinDividerButtonLabel label="􀈂 Share" />
  </ShareCollectiblesBPA>
);

const Content = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 19, 2)};
  background-color: ${({ isSticky, theme: { colors } }) =>
    isSticky ? colors.white : colors.transparent};
  height: ${ListHeaderHeight};
  width: 100%;
`;

const StickyBackgroundBlocker = styled.View`
  background-color: ${({ theme: { colors } }) => colors.white};
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
          <Row align="center">
            {createElement(titleRenderer, { children: title })}
            {title === 'Collectibles' && (
              <Column align="flex-end" flex={1}>
                <ShareCollectiblesButton
                  onPress={() => handleShare(isReadOnlyWallet, accountAddress)}
                />
              </Column>
            )}
            <ContextMenu marginTop={3} {...contextMenuOptions} />
          </Row>
          {children}
        </Content>
        {showDivider && <Divider />}
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
