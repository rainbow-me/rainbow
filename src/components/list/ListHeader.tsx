import lang from 'i18n-js';
import React, { Fragment, PropsWithChildren, useCallback } from 'react';
import { Share, View } from 'react-native';
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
import * as ls from '@/storage';
import { CollectibleSortByOptions } from '@/storage/schema';
import { ListHeaderMenu } from './ListHeaderMenu';
import { useTheme } from '@/theme';
import { Inline, Bleed } from '@/design-system';

export const ListHeaderHeight = 50;

const ShareCollectiblesBPA = styled(ButtonPressAnimation)({
  backgroundColor: ({ theme: { colors } }: any) =>
    colors.alpha(colors.blueGreyDark, 0.06),
  borderRadius: 15,
  height: 30,
  justifyContent: 'center',
  paddingBottom: 5,
  paddingTop: 5,
  paddingHorizontal: 10,
});

type ShareCollectibleButtonProps = {
  onPress: () => void;
};

const ShareCollectiblesButton = ({ onPress }: ShareCollectibleButtonProps) => (
  <ShareCollectiblesBPA onPress={onPress} scale={0.9}>
    <CoinDividerButtonLabel
      isVisible={false}
      align="center"
      label={`􀈂`}
      shareButton
    />
  </ShareCollectiblesBPA>
);

const Content = styled(Row).attrs(({ theme: { colors } }: any) => ({
  align: 'center',
  backgroundColor: colors.white,
  justify: 'space-between',
}))({
  ...padding.object(5, 19),
  height: ListHeaderHeight,
  width: '100%',
});

const StickyBackgroundBlocker = styled(View)({
  backgroundColor: ({ theme: { colors } }: any) => colors.white,
  height: ({ isEditMode }: any) => (isEditMode ? ListHeaderHeight : 0),
  top: ({ isEditMode }: any) => (isEditMode ? -40 : 0),
  width: ({ deviceDimensions }: any) => deviceDimensions.width,
});

type ListHeaderProps = {
  contextMenuOptions?: any;
  isCoinListEdited: boolean;
  showDivider?: boolean;
  title: string;
  totalValue: string;
  collectibleSortBy: CollectibleSortByOptions;
} & PropsWithChildren;

export default function ListHeader({
  children,
  contextMenuOptions,
  isCoinListEdited,
  showDivider = true,
  title,
  totalValue,
  collectibleSortBy,
}: ListHeaderProps) {
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
              <Inline alignVertical="center" space={{ custom: 6 }}>
                <H1 ellipsizeMode="tail" numberOfLines={1}>
                  {title}
                </H1>
                {title === i18n.t(i18n.l.account.tab_collectibles) && (
                  <Bleed vertical="10px">
                    <ShareCollectiblesButton onPress={handleShare} />
                  </Bleed>
                )}
              </Inline>
              {title === i18n.t(i18n.l.account.tab_collectibles) && (
                <Column align="flex-end" flex={1}>
                  <ListHeaderMenu
                    selected={{
                      actionKey: collectibleSortBy,
                      actionTitle: CollectibleSortByOptions[collectibleSortBy],
                    }}
                    menuItems={Object.entries(CollectibleSortByOptions).map(
                      ([key, value]) => ({
                        actionKey: key,
                        actionTitle: value,
                        menuState: collectibleSortBy === key ? 'on' : 'off',
                      })
                    )}
                    selectItem={item => {
                      ls.collectibleSortBy.set(
                        ['sortBy'],
                        item as CollectibleSortByOptions
                      );
                    }}
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
