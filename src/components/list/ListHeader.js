import React, { createElement, Fragment } from 'react';
import { Share } from 'react-native';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import CoinDividerButtonLabel from '../coin-divider/CoinDividerButtonLabel';
import { ContextMenu } from '../context-menu';
import { Column, Row } from '../layout';
import { SavingsListHeader } from '../savings';
import { H1 } from '../text';
import {
  useAccountProfile,
  useAccountSettings,
  useDimensions,
  useWallets,
  useWebData,
} from '@rainbow-me/hooks';
import { RAINBOW_PROFILES_BASE_URL } from '@rainbow-me/references';
import { padding } from '@rainbow-me/styles';
import styled from 'rainbowed-components';

export const ListHeaderHeight = 50;

const ShareCollectiblesBPA = styled(ButtonPressAnimation)({
  backgroundColor: ({ theme: { colors } }) =>
    colors.alpha(colors.blueGreyDark, 0.06),
  borderRadius: 15,
  height: 30,
  justifyContent: 'center',
  maxWidth: 90,
  paddingBottom: 5,
  paddingTop: 5,
  width: 90,
});

const ShareCollectiblesButton = ({ onPress }) => (
  <ShareCollectiblesBPA onPress={onPress} scale={0.9}>
    <CoinDividerButtonLabel align="center" label="􀈂 Share" shareButton />
  </ShareCollectiblesBPA>
);

const Content = styled(Row).attrs(({ theme: { colors } }) => ({
  align: 'center',
  backgroundColor: colors.white,
  justify: 'space-between',
}))({
  ...padding.object(5, 19),
  height: ListHeaderHeight,
  width: '100%',
});

const StickyBackgroundBlocker = styled.View({
  backgroundColor: ({ theme: { colors } }) => colors.white,
  height: ({ isEditMode }) => (isEditMode ? ListHeaderHeight : 0),
  top: ({ isEditMode }) => (isEditMode ? -40 : 0),
  width: ({ deviceDimensions }) => deviceDimensions.width,
});

export default function ListHeader({
  children,
  contextMenuOptions,
  isCoinListEdited,
  showDivider = true,
  title,
  titleRenderer = H1,
  totalValue,
}) {
  const deviceDimensions = useDimensions();
  const { colors, isDarkMode } = useTheme();
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
        <Content>
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
        {
          /* 
           The divider shows up as a white line in dark mode (android)
           so we won't render it till we figure it out why
          */
          showDivider && !(android && isDarkMode) && (
            <Divider color={colors.rowDividerLight} />
          )
        }
        <StickyBackgroundBlocker
          deviceDimensions={deviceDimensions}
          isEditMode={isCoinListEdited}
        />
      </Fragment>
    );
  }
}
