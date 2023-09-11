import lang from 'i18n-js';
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
} from '@/hooks';
import { RAINBOW_PROFILES_BASE_URL } from '@/references';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import * as i18n from '@/languages';

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
    <CoinDividerButtonLabel
      align="center"
      label={`􀈂 ${lang.t('button.share')}`}
      shareButton
    />
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
        ? lang.t('list.share.check_out_this_wallet', { showcaseUrl })
        : lang.t('list.share.check_out_my_wallet', { showcaseUrl }),
    };
    Share.share(shareOptions);
  }, [
    accountAddress,
    accountENS,
    initializeShowcaseIfNeeded,
    isReadOnlyWallet,
  ]);

  if (title === lang.t('pools.pools_title')) {
    return (
      <SavingsListHeader
        emoji="whale"
        isOpen={false}
        onPress={() => {}}
        savingsSumValue={totalValue}
        showSumValue
        title={lang.t('pools.pools_title')}
      />
    );
  } else {
    return (
      <Fragment>
        <Content>
          {title && (
            <Row align="center">
              {/* eslint-disable-next-line react/no-children-prop */}
              {createElement(titleRenderer, { children: title })}
              {title === i18n.t(i18n.l.account.tab_collectibles) && (
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
