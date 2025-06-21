import lang from 'i18n-js';
import { startCase } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import URL from 'url-parse';
import { ButtonPressAnimation } from '../../animations';
import saveToCameraRoll from './saveToCameraRoll';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { Bleed, Column, Columns, Heading, Inline, Inset, Space, Stack, Text } from '@/design-system';
import { UniqueAsset } from '@/entities';
import { useClipboard, useDimensions, useHiddenTokens, useShowcaseTokens } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { useNavigation } from '@/navigation/Navigation';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { ethereumUtils, isLowerCaseMatch, magicMemo, showActionSheetWithOptions } from '@/utils';
import { getFullResUrl } from '@/utils/getFullResUrl';
import { refreshNFTContractMetadata, reportNFT } from '@/resources/nfts/simplehash';
import { ContextCircleButton } from '@/components/context-menu';
import { IS_ANDROID, IS_IOS } from '@/env';
import { ChainId } from '@/state/backendNetworks/types';
import { openInBrowser } from '@/utils/openInBrowser';
import { buildUniqueTokenName } from '@/helpers/assets';

const AssetActionsEnum = {
  copyTokenID: 'copyTokenID',
  download: 'download',
  etherscan: 'etherscan',
  hide: 'hide',
  rainbowWeb: 'rainbowWeb',
  opensea: 'opensea',
  looksrare: 'looksrare',
  refresh: 'refresh',
  report: 'report',
} as const;

const getAssetActions = ({ chainId }: { chainId: ChainId }) =>
  ({
    [AssetActionsEnum.copyTokenID]: {
      actionKey: AssetActionsEnum.copyTokenID,
      actionTitle: lang.t('expanded_state.unique_expanded.copy_token_id'),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'square.on.square',
      },
    },
    [AssetActionsEnum.download]: {
      actionKey: AssetActionsEnum.download,
      actionTitle: lang.t('expanded_state.unique_expanded.save_to_photos'),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'photo.on.rectangle.angled',
      },
    },
    [AssetActionsEnum.etherscan]: {
      actionKey: AssetActionsEnum.etherscan,
      actionTitle: lang.t('expanded_state.unique_expanded.view_on_block_explorer', {
        blockExplorerName: startCase(ethereumUtils.getBlockExplorer({ chainId })),
      }),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'link',
      },
    },
    [AssetActionsEnum.rainbowWeb]: {
      actionKey: AssetActionsEnum.rainbowWeb,
      actionTitle: lang.t('expanded_state.unique_expanded.view_on_web'),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'safari.fill',
      },
    },
    [AssetActionsEnum.hide]: {
      actionKey: AssetActionsEnum.hide,
      actionTitle: lang.t('expanded_state.unique_expanded.hide'),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'eye',
      },
    },
    [AssetActionsEnum.opensea]: {
      actionKey: AssetActionsEnum.opensea,
      actionTitle: 'OpenSea',
      icon: {
        iconType: 'ASSET',
        iconValue: 'opensea',
      },
    },
    [AssetActionsEnum.refresh]: {
      actionKey: AssetActionsEnum.refresh,
      actionTitle: lang.t('expanded_state.unique_expanded.refresh'),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'arrow.clockwise',
      },
    },
    [AssetActionsEnum.report]: {
      actionKey: AssetActionsEnum.report,
      actionTitle: lang.t('expanded_state.unique_expanded.report'),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'exclamationmark.triangle',
      },
    },
    [AssetActionsEnum.looksrare]: {
      actionKey: AssetActionsEnum.looksrare,
      actionTitle: 'LooksRare',
      icon: {
        iconType: 'ASSET',
        iconValue: 'looksrare',
      },
    },
  }) as const;

const FamilyActionsEnum = {
  collectionWebsite: 'collectionWebsite',
  discord: 'discord',
  twitter: 'twitter',
  viewCollection: 'viewCollection',
} as const;

const FamilyActions = {
  [FamilyActionsEnum.viewCollection]: {
    actionKey: FamilyActionsEnum.viewCollection,
    actionTitle: lang.t('expanded_state.unique_expanded.view_collection'),
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'rectangle.grid.2x2.fill',
    },
  },
  [FamilyActionsEnum.collectionWebsite]: {
    actionKey: FamilyActionsEnum.collectionWebsite,
    actionTitle: lang.t('expanded_state.unique_expanded.collection_website'),
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'safari.fill',
    },
  },
  [FamilyActionsEnum.discord]: {
    actionKey: FamilyActionsEnum.discord,
    actionTitle: lang.t('expanded_state.unique_expanded.discord'),
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'ellipsis.bubble.fill',
    },
  },
  [FamilyActionsEnum.twitter]: {
    actionKey: FamilyActionsEnum.twitter,
    actionTitle: lang.t('expanded_state.unique_expanded.twitter'),
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'at.circle.fill',
    },
  },
} as const;

const paddingHorizontal = 24;

const FamilyImageWrapper = styled(View)({
  height: 20,
  // @ts-expect-error missing theme types
  shadowColor: ({ theme: { colors } }) => colors.shadowBlack,
  shadowOffset: { height: 3, width: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 4.5,
  width: 20,
});

const FamilyImage = styled(ImgixImage)({
  ...position.coverAsObject,
  borderRadius: 10,
});

interface UniqueTokenExpandedStateHeaderProps {
  asset: UniqueAsset;
  hideNftMarketplaceAction: boolean;
  isSupportedOnRainbowWeb: boolean;
  rainbowWebUrl: string;
  isModificationActionsEnabled?: boolean;
  onRefresh: () => void;
  onReport: () => void;
}

const UniqueTokenExpandedStateHeader = ({
  asset,
  hideNftMarketplaceAction,
  isSupportedOnRainbowWeb,
  rainbowWebUrl,
  isModificationActionsEnabled = true,
  onRefresh,
  onReport,
}: UniqueTokenExpandedStateHeaderProps) => {
  const { setClipboard } = useClipboard();
  const { width: deviceWidth } = useDimensions();
  const { showcaseTokens, removeShowcaseToken } = useShowcaseTokens();
  const { hiddenTokens, addHiddenToken, removeHiddenToken } = useHiddenTokens();
  const isHiddenAsset = useMemo(
    () => !!hiddenTokens.find(token => isLowerCaseMatch(token, asset.uniqueId)),
    [hiddenTokens, asset.uniqueId]
  );
  const isShowcaseAsset = useMemo(
    () => !!showcaseTokens.find(token => isLowerCaseMatch(token, asset.uniqueId)),
    [showcaseTokens, asset.uniqueId]
  );
  const { goBack } = useNavigation();

  const formattedCollectionUrl = useMemo(() => {
    if (!asset.websiteUrl && !asset.collectionUrl) return;

    const { hostname } = new URL(asset.websiteUrl || asset.collectionUrl || '');
    return hostname;
  }, [asset.websiteUrl, asset.collectionUrl]);

  const familyMenuConfig = useMemo(() => {
    return {
      menuItems: [
        ...(!hideNftMarketplaceAction
          ? [
              {
                ...FamilyActions[FamilyActionsEnum.viewCollection],
                discoverabilityTitle: asset.marketplaceName ?? '',
              },
            ]
          : []),
        ...(asset.websiteUrl
          ? [
              {
                ...FamilyActions[FamilyActionsEnum.collectionWebsite],
                discoverabilityTitle: formattedCollectionUrl,
              },
            ]
          : []),
        ...(asset.twitterUrl
          ? [
              {
                ...FamilyActions[FamilyActionsEnum.twitter],
              },
            ]
          : []),
        ...(asset.discordUrl
          ? [
              {
                ...FamilyActions[FamilyActionsEnum.discord],
              },
            ]
          : []),
      ],
      menuTitle: '',
    };
  }, [asset.discordUrl, asset.websiteUrl, asset.twitterUrl, asset.marketplaceName, hideNftMarketplaceAction, formattedCollectionUrl]);

  const isSVG = asset.images.mimeType?.includes('image/svg');
  const isENS = asset.type === 'ens';

  const isPhotoDownloadAvailable = !isSVG && !isENS;
  const assetMenuConfig = useMemo(() => {
    const AssetActions = getAssetActions({ chainId: asset.chainId });

    return {
      menuItems: [
        {
          ...AssetActions[AssetActionsEnum.refresh],
        },
        {
          ...AssetActions[AssetActionsEnum.report],
        },
        ...(isModificationActionsEnabled
          ? [
              {
                ...AssetActions[AssetActionsEnum.hide],
                actionTitle: isHiddenAsset
                  ? lang.t('expanded_state.unique_expanded.unhide')
                  : lang.t('expanded_state.unique_expanded.hide'),
                icon: {
                  ...AssetActions[AssetActionsEnum.hide].icon,
                  iconValue: isHiddenAsset ? 'eye' : 'eye.slash',
                },
              },
            ]
          : []),
        ...(isPhotoDownloadAvailable
          ? [
              {
                ...AssetActions[AssetActionsEnum.download],
              },
            ]
          : []),
        {
          ...AssetActions[AssetActionsEnum.copyTokenID],
          discoverabilityTitle: asset.tokenId.length > 15 ? `${asset.tokenId.slice(0, 15)}...` : asset.tokenId,
        },
        ...(isSupportedOnRainbowWeb
          ? [
              {
                ...AssetActions[AssetActionsEnum.rainbowWeb],
                discoverabilityTitle: 'rainbow.me',
              },
            ]
          : []),
        {
          ...AssetActions[AssetActionsEnum.etherscan],
        },
        ...(asset.chainId === ChainId.mainnet
          ? [
              {
                menuTitle: lang.t('expanded_state.unique_expanded.view_on_marketplace'),
                menuItems: [AssetActions.opensea, AssetActions.looksrare],
              },
            ]
          : []),
      ],
      menuTitle: '',
    };
  }, [asset.tokenId, asset.chainId, isModificationActionsEnabled, isHiddenAsset, isPhotoDownloadAvailable, isSupportedOnRainbowWeb]);

  const handlePressFamilyMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: any) => {
      if (actionKey === FamilyActionsEnum.viewCollection && asset.marketplaceUrl) {
        openInBrowser(asset.marketplaceUrl);
      } else if (actionKey === FamilyActionsEnum.collectionWebsite) {
        const websiteUrl = asset.websiteUrl || asset.collectionUrl;
        if (websiteUrl) {
          openInBrowser(websiteUrl);
        }
      } else if (actionKey === FamilyActionsEnum.twitter && asset.twitterUrl) {
        openInBrowser(asset.twitterUrl, false);
      } else if (actionKey === FamilyActionsEnum.discord && asset.discordUrl) {
        openInBrowser(asset.discordUrl, false);
      }
    },
    [asset.discordUrl, asset.websiteUrl, asset.twitterUrl, asset.marketplaceUrl, asset.collectionUrl]
  );

  const handlePressAssetMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }: any) => {
      if (actionKey === AssetActionsEnum.etherscan) {
        ethereumUtils.openNftInBlockExplorer({
          contractAddress: asset.contractAddress,
          tokenId: asset.tokenId,
          chainId: asset.chainId,
        });
      } else if (actionKey === AssetActionsEnum.rainbowWeb) {
        openInBrowser(rainbowWebUrl);
      } else if (actionKey === AssetActionsEnum.opensea) {
        openInBrowser(`https://opensea.io/assets/${asset.contractAddress}/${asset.tokenId}`);
      } else if (actionKey === AssetActionsEnum.looksrare) {
        openInBrowser(`https://looksrare.org/collections/${asset.contractAddress}/${asset.tokenId}`);
      } else if (actionKey === AssetActionsEnum.copyTokenID) {
        setClipboard(asset.tokenId);
      } else if (actionKey === AssetActionsEnum.download) {
        if (asset?.images.highResUrl) {
          const fullResUrl = getFullResUrl(asset.images.highResUrl);
          fullResUrl && saveToCameraRoll(fullResUrl);
        }
      } else if (actionKey === AssetActionsEnum.hide) {
        if (isHiddenAsset) {
          removeHiddenToken(asset);
        } else {
          addHiddenToken(asset);

          if (isShowcaseAsset) {
            removeShowcaseToken(asset.uniqueId);
          }
        }

        goBack();
      } else if (actionKey === AssetActionsEnum.refresh) {
        refreshNFTContractMetadata(asset).then(onRefresh);
      } else if (actionKey === AssetActionsEnum.report) {
        reportNFT(asset).then(onReport);
      }
    },
    [
      asset,
      rainbowWebUrl,
      setClipboard,
      isHiddenAsset,
      goBack,
      removeHiddenToken,
      addHiddenToken,
      isShowcaseAsset,
      removeShowcaseToken,
      onRefresh,
      onReport,
    ]
  );

  const onPressAndroidFamily = useCallback(() => {
    const hasCollection = !!asset.marketplaceUrl;
    const hasWebsite = !!(asset.websiteUrl || asset.collectionUrl);
    const hasTwitter = !!asset.twitterUrl;
    const hasDiscord = !!asset.discordUrl;

    const baseActions = [
      ...(hasCollection ? [lang.t('expanded_state.unique_expanded.view_collection')] : []),
      ...(hasWebsite ? [lang.t('expanded_state.unique_expanded.collection_website')] : []),
      ...(hasTwitter ? [lang.t('expanded_state.unique_expanded.twitter')] : []),
      ...(hasDiscord ? [lang.t('expanded_state.unique_expanded.discord')] : []),
    ];

    const collectionIndex = hasCollection ? 0 : -1;
    const websiteIndex = hasWebsite ? collectionIndex + 1 : collectionIndex;
    const twitterIndex = hasTwitter ? websiteIndex + 1 : websiteIndex;
    const discordIndex = hasDiscord ? twitterIndex + 1 : twitterIndex;

    showActionSheetWithOptions(
      {
        options: baseActions,
        title: '',
      },
      idx => {
        if (idx === collectionIndex && asset.marketplaceUrl) {
          openInBrowser(asset.marketplaceUrl);
        } else if (idx === websiteIndex) {
          openInBrowser(asset.websiteUrl || asset.collectionUrl);
        } else if (idx === twitterIndex) {
          openInBrowser(asset.twitterUrl, false);
        } else if (idx === discordIndex && asset.discordUrl) {
          openInBrowser(asset.discordUrl, false);
        }
      }
    );
  }, [asset.discordUrl, asset.websiteUrl, asset.twitterUrl, asset.marketplaceUrl, asset.collectionUrl]);

  const overflowMenuHitSlop: Space = '15px (Deprecated)';
  const familyNameHitSlop: Space = '19px (Deprecated)';

  const assetMenuOptions = useMemo(() => {
    return assetMenuConfig?.menuItems?.filter(item => 'actionTitle' in item).map(item => item.actionTitle) ?? [];
  }, [assetMenuConfig]);

  return (
    <Stack space="15px (Deprecated)">
      <Columns space="24px">
        <Heading containsEmoji color="primary (Deprecated)" size="23px / 27px (Deprecated)" weight="heavy">
          {buildUniqueTokenName({
            collectionName: asset.collectionName ?? '',
            tokenId: asset.tokenId,
            name: asset.name ?? '',
            uniqueId: asset.uniqueId,
          })}
        </Heading>
        <Column width="content">
          <Bleed space={overflowMenuHitSlop}>
            {/* NOTE: Necessary since other context menu overflows off screen on android */}
            {IS_ANDROID && (
              <ContextCircleButton
                testID="unique-token-expanded-state-context-menu-button"
                options={assetMenuOptions}
                onPressActionSheet={(index: number) => {
                  const actionItems = (assetMenuConfig?.menuItems || []).filter(item => 'actionTitle' in item);
                  const actionKey = actionItems[index];
                  if (!actionKey) return;
                  handlePressAssetMenuItem({
                    nativeEvent: { actionKey: actionKey.actionKey },
                  });
                }}
              >
                <ButtonPressAnimation scaleTo={0.75}>
                  <Inset space={overflowMenuHitSlop}>
                    <Text color="accent" size="23px / 27px (Deprecated)" weight="heavy">
                      􀍡
                    </Text>
                  </Inset>
                </ButtonPressAnimation>
              </ContextCircleButton>
            )}
            {IS_IOS && (
              <ContextMenuButton
                menuConfig={assetMenuConfig}
                isMenuPrimaryAction
                onPressMenuItem={handlePressAssetMenuItem}
                testID="unique-token-expanded-state-context-menu-button"
                useActionSheetFallback={false}
              >
                <ButtonPressAnimation scaleTo={0.75}>
                  <Inset space={overflowMenuHitSlop}>
                    <Text color="accent" size="23px / 27px (Deprecated)" weight="heavy">
                      􀍡
                    </Text>
                  </Inset>
                </ButtonPressAnimation>
              </ContextMenuButton>
            )}
          </Bleed>
        </Column>
      </Columns>
      <Inline wrap={false}>
        <Bleed space={familyNameHitSlop}>
          <ContextMenuButton
            menuConfig={familyMenuConfig}
            {...(android ? { onPress: onPressAndroidFamily, isAnchoredToRight: true } : {})}
            isMenuPrimaryAction
            onPressMenuItem={handlePressFamilyMenuItem}
            useActionSheetFallback={false}
          >
            <ButtonPressAnimation scaleTo={0.88}>
              <Inset space={familyNameHitSlop}>
                <Inline alignVertical="center" space="6px" wrap={false}>
                  {asset.collectionImageUrl ? (
                    <Bleed vertical="6px">
                      <FamilyImageWrapper>
                        <FamilyImage size={30} source={{ uri: asset.collectionImageUrl }} />
                      </FamilyImageWrapper>
                    </Bleed>
                  ) : null}
                  <Inline space="4px" wrap={false}>
                    <View
                      style={{
                        maxWidth: deviceWidth - paddingHorizontal * 6,
                      }}
                    >
                      <Text color="secondary50 (Deprecated)" numberOfLines={1} size="16px / 22px (Deprecated)" weight="bold">
                        {asset.collectionName}
                      </Text>
                    </View>
                    <Text color="secondary50 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
                      􀆊
                    </Text>
                  </Inline>
                </Inline>
              </Inset>
            </ButtonPressAnimation>
          </ContextMenuButton>
        </Bleed>
      </Inline>
    </Stack>
  );
};

export default magicMemo(UniqueTokenExpandedStateHeader, 'asset');
