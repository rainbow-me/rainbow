import lang from 'i18n-js';
import { startCase } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { Linking, View } from 'react-native';
import URL from 'url-parse';
import { buildUniqueTokenName } from '../../../helpers/assets';
import { ButtonPressAnimation } from '../../animations';
import saveToCameraRoll from './saveToCameraRoll';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import {
  Bleed,
  Column,
  Columns,
  Heading,
  Inline,
  Inset,
  Space,
  Stack,
  Text,
} from '@/design-system';
import { Network } from '@/helpers';
import {
  useClipboard,
  useDimensions,
  useHiddenTokens,
  useShowcaseTokens,
} from '@/hooks';
import { ImgixImage } from '@/components/images';
import { useNavigation } from '@/navigation/Navigation';
import { ENS_NFT_CONTRACT_ADDRESS } from '@/references';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { ethereumUtils, magicMemo, showActionSheetWithOptions } from '@/utils';
import { NFT } from '@/resources/nfts/types';
import { SVG_MIME_TYPE } from '@/resources/nfts/simplehash/utils';
import { refreshNFTContractMetadata } from '@/resources/nfts/simplehash';

const AssetActionsEnum = {
  copyTokenID: 'copyTokenID',
  download: 'download',
  etherscan: 'etherscan',
  hide: 'hide',
  rainbowWeb: 'rainbowWeb',
  opensea: 'opensea',
  looksrare: 'looksrare',
  refresh: 'refresh',
} as const;

const getAssetActions = (network: Network) =>
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
      actionTitle: lang.t(
        'expanded_state.unique_expanded.view_on_block_explorer',
        {
          blockExplorerName: startCase(ethereumUtils.getBlockExplorer(network)),
        }
      ),
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
    [AssetActionsEnum.refresh]: {
      actionKey: AssetActionsEnum.refresh,
      actionTitle: lang.t('expanded_state.unique_expanded.refresh'),
      icon: {
        iconType: 'SYSTEM',
        iconValue: 'arrow.clockwise',
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
    [AssetActionsEnum.looksrare]: {
      actionKey: AssetActionsEnum.looksrare,
      actionTitle: 'LooksRare',
      icon: {
        iconType: 'ASSET',
        iconValue: 'looksrare',
      },
    },
  } as const);

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
  asset: NFT;
  hideNftMarketplaceAction: boolean;
  isSupportedOnRainbowWeb: boolean;
  rainbowWebUrl: string;
  isModificationActionsEnabled?: boolean;
}

const UniqueTokenExpandedStateHeader = ({
  asset,
  hideNftMarketplaceAction,
  isSupportedOnRainbowWeb,
  rainbowWebUrl,
  isModificationActionsEnabled = true,
}: UniqueTokenExpandedStateHeaderProps) => {
  const { setClipboard } = useClipboard();
  const { width: deviceWidth } = useDimensions();
  const { showcaseTokens, removeShowcaseToken } = useShowcaseTokens();
  const { hiddenTokens, addHiddenToken, removeHiddenToken } = useHiddenTokens();
  const isHiddenAsset = useMemo(
    () => hiddenTokens.includes(asset.fullUniqueId) as boolean,
    [hiddenTokens, asset.fullUniqueId]
  );
  const isShowcaseAsset = useMemo(
    () => showcaseTokens.includes(asset.uniqueId) as boolean,
    [showcaseTokens, asset.uniqueId]
  );
  const { goBack } = useNavigation();

  const marketplace = asset?.marketplaces?.[0];

  const formattedCollectionUrl = useMemo(() => {
    // @ts-expect-error externalUrl could be null or undefined?
    const { hostname } = new URL(asset.externalUrl);
    const { hostname: hostnameFallback } = new URL(
      // @ts-expect-error external_url could be null or undefined?
      asset.collection.externalUrl
    );
    const formattedUrl = hostname || hostnameFallback;
    return formattedUrl;
  }, [asset.collection.externalUrl, asset.externalUrl]);

  const familyMenuConfig = useMemo(() => {
    return {
      menuItems: [
        ...(!hideNftMarketplaceAction
          ? [
              {
                ...FamilyActions[FamilyActionsEnum.viewCollection],
                discoverabilityTitle: marketplace?.name ?? '',
              },
            ]
          : []),
        ...(asset.externalUrl || asset.collection.externalUrl
          ? [
              {
                ...FamilyActions[FamilyActionsEnum.collectionWebsite],
                discoverabilityTitle: formattedCollectionUrl,
              },
            ]
          : []),
        ...(asset.collection.twitter
          ? [
              {
                ...FamilyActions[FamilyActionsEnum.twitter],
              },
            ]
          : []),
        ...(asset.collection.discord
          ? [
              {
                ...FamilyActions[FamilyActionsEnum.discord],
              },
            ]
          : []),
      ],
      menuTitle: '',
    };
  }, [
    asset.collection.discord,
    asset.collection.externalUrl,
    asset.collection.twitter,
    asset.externalUrl,
    formattedCollectionUrl,
    hideNftMarketplaceAction,
    marketplace?.name,
  ]);

  const isSVG = asset?.images?.mimeType === SVG_MIME_TYPE;
  const isENS =
    asset.asset_contract?.address?.toLowerCase() ===
    ENS_NFT_CONTRACT_ADDRESS.toLowerCase();

  const isPhotoDownloadAvailable = !isSVG && !isENS;
  const assetMenuConfig = useMemo(() => {
    const AssetActions = getAssetActions(asset.network);

    return {
      menuItems: [
        {
          ...AssetActions[AssetActionsEnum.refresh],
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
          discoverabilityTitle:
            asset.id.length > 15 ? `${asset.id.slice(0, 15)}...` : asset.id,
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
        ...(asset.network === Network.mainnet
          ? [
              {
                menuTitle: lang.t(
                  'expanded_state.unique_expanded.view_on_marketplace'
                ),
                menuItems: [AssetActions.opensea, AssetActions.looksrare],
              },
            ]
          : []),
      ],
      menuTitle: '',
    };
  }, [
    asset.id,
    asset?.network,
    isPhotoDownloadAvailable,
    isHiddenAsset,
    isModificationActionsEnabled,
    isSupportedOnRainbowWeb,
  ]);

  const handlePressFamilyMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (
        actionKey === FamilyActionsEnum.viewCollection &&
        marketplace?.collectionUrl
      ) {
        Linking.openURL(marketplace?.collectionUrl);
      } else if (actionKey === FamilyActionsEnum.collectionWebsite) {
        // @ts-expect-error external_link and external_url could be null or undefined?
        Linking.openURL(asset.externalUrl || asset.collection.externalUrl);
      } else if (actionKey === FamilyActionsEnum.twitter) {
        Linking.openURL('https://twitter.com/' + asset.collection.twitter);
      } else if (
        actionKey === FamilyActionsEnum.discord &&
        asset.collection.discord
      ) {
        Linking.openURL(asset.collection.discord);
      }
    },
    [
      asset.collection.discord,
      asset.collection.externalUrl,
      asset.collection.twitter,
      asset.externalUrl,
      marketplace?.collectionUrl,
    ]
  );

  const handlePressAssetMenuItem = useCallback(
    async ({ nativeEvent: { actionKey } }) => {
      if (actionKey === AssetActionsEnum.etherscan) {
        ethereumUtils.openNftInBlockExplorer(
          // @ts-expect-error address could be undefined?
          asset.asset_contract.address,
          asset.id,
          asset.network
        );
      } else if (actionKey === AssetActionsEnum.rainbowWeb) {
        Linking.openURL(rainbowWebUrl);
      } else if (actionKey === AssetActionsEnum.opensea) {
        Linking.openURL(
          `https://opensea.io/assets/${asset.asset_contract.address}/${asset.id}`
        );
      } else if (actionKey === AssetActionsEnum.looksrare) {
        Linking.openURL(
          `https://looksrare.org/collections/${asset.asset_contract.address}/${asset.id}`
        );
      } else if (actionKey === AssetActionsEnum.copyTokenID) {
        setClipboard(asset.id);
      } else if (actionKey === AssetActionsEnum.download) {
        saveToCameraRoll(asset?.images?.fullResPngUrl);
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
        await refreshNFTContractMetadata(asset);
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
    ]
  );

  const onPressAndroidFamily = useCallback(() => {
    const hasCollection = !!marketplace?.collectionUrl;
    const hasWebsite = !!(asset.externalUrl || asset.collection.externalUrl);
    const hasTwitter = !!asset.collection.twitter;
    const hasDiscord = !!asset.collection.discord;

    const baseActions = [
      ...(hasCollection
        ? [lang.t('expanded_state.unique_expanded.view_collection')]
        : []),
      ...(hasWebsite
        ? [lang.t('expanded_state.unique_expanded.collection_website')]
        : []),
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
        showSeparators: true,
        title: '',
      },
      (idx: number) => {
        if (idx === collectionIndex && marketplace?.collectionUrl) {
          Linking.openURL(marketplace?.collectionUrl);
        } else if (idx === websiteIndex) {
          Linking.openURL(
            // @ts-expect-error external_link and external_url could be null or undefined?
            asset.externalUrl || asset.collection.externalUrl
          );
        } else if (idx === twitterIndex) {
          Linking.openURL('https://twitter.com/' + asset.collection.twitter);
        } else if (idx === discordIndex && asset.collection.discord) {
          Linking.openURL(asset.collection.discord);
        }
      }
    );
  }, [
    asset.collection.discord,
    asset.collection.externalUrl,
    asset.collection.twitter,
    asset.externalUrl,
    marketplace?.collectionUrl,
  ]);

  const onPressAndroidAsset = useCallback(() => {
    const blockExplorerActionName = lang.t(
      'expanded_state.unique_expanded.view_on_block_explorer',
      {
        blockExplorerName: startCase(
          ethereumUtils.getBlockExplorer(asset.network)
        ),
      }
    );

    const androidContractActions = [
      ...(isSupportedOnRainbowWeb
        ? [lang.t('expanded_state.unique_expanded.view_on_web')]
        : []),
      blockExplorerActionName,
      ...(isPhotoDownloadAvailable
        ? ([lang.t('expanded_state.unique_expanded.save_to_photos')] as const)
        : []),
      lang.t('expanded_state.unique_expanded.copy_token_id'),
      ...(isModificationActionsEnabled
        ? [
            isHiddenAsset
              ? lang.t('expanded_state.unique_expanded.unhide')
              : lang.t('expanded_state.unique_expanded.hide'),
          ]
        : []),
      lang.t('expanded_state.unique_expanded.refresh'),
    ] as const;

    const rainbowWebIndex = isSupportedOnRainbowWeb ? 0 : -1;
    const blockExplorerIndex = rainbowWebIndex + 1;
    const photoDownloadIndex = isPhotoDownloadAvailable
      ? blockExplorerIndex + 1
      : blockExplorerIndex;
    const copyTokenIndex = photoDownloadIndex + 1;
    const hideTokenIndex = copyTokenIndex + 1;
    const refreshIndex = hideTokenIndex + 1;

    showActionSheetWithOptions(
      {
        options: androidContractActions,
        showSeparators: true,
        title: '',
      },
      async (idx: number) => {
        if (idx === rainbowWebIndex) {
          Linking.openURL(rainbowWebUrl);
        } else if (idx === blockExplorerIndex) {
          ethereumUtils.openNftInBlockExplorer(
            // @ts-expect-error address could be undefined?
            asset.asset_contract.address,
            asset.id,
            asset.network
          );
        } else if (idx === photoDownloadIndex) {
          saveToCameraRoll(asset?.images?.fullResPngUrl);
        } else if (idx === copyTokenIndex) {
          setClipboard(asset.id);
        } else if (idx === hideTokenIndex) {
          if (isHiddenAsset) {
            removeHiddenToken(asset);
          } else {
            addHiddenToken(asset);

            if (isShowcaseAsset) {
              removeShowcaseToken(asset.uniqueId);
            }
          }

          goBack();
        } else if (idx === refreshIndex) {
          await refreshNFTContractMetadata(asset);
        }
      }
    );
  }, [
    asset,
    isPhotoDownloadAvailable,
    isSupportedOnRainbowWeb,
    rainbowWebUrl,
    setClipboard,
    isHiddenAsset,
    isModificationActionsEnabled,
    isShowcaseAsset,
    addHiddenToken,
    removeHiddenToken,
    removeShowcaseToken,
    goBack,
  ]);

  const overflowMenuHitSlop: Space = '15px (Deprecated)';
  const familyNameHitSlop: Space = '19px (Deprecated)';

  return (
    <Stack space="15px (Deprecated)">
      <Columns space="24px">
        <Heading
          containsEmoji
          color="primary (Deprecated)"
          size="23px / 27px (Deprecated)"
          weight="heavy"
        >
          {buildUniqueTokenName(asset)}
        </Heading>
        <Column width="content">
          <Bleed space={overflowMenuHitSlop}>
            <ContextMenuButton
              menuConfig={assetMenuConfig}
              {...(android ? { onPress: onPressAndroidAsset } : {})}
              isMenuPrimaryAction
              onPressMenuItem={handlePressAssetMenuItem}
              testID="unique-token-expanded-state-context-menu-button"
              useActionSheetFallback={false}
            >
              <ButtonPressAnimation scaleTo={0.75}>
                <Inset space={overflowMenuHitSlop}>
                  <Text
                    color="accent"
                    size="23px / 27px (Deprecated)"
                    weight="heavy"
                  >
                    􀍡
                  </Text>
                </Inset>
              </ButtonPressAnimation>
            </ContextMenuButton>
          </Bleed>
        </Column>
      </Columns>
      <Inline wrap={false}>
        <Bleed space={familyNameHitSlop}>
          <ContextMenuButton
            menuConfig={familyMenuConfig}
            {...(android ? { onPress: onPressAndroidFamily } : {})}
            isMenuPrimaryAction
            onPressMenuItem={handlePressFamilyMenuItem}
            useActionSheetFallback={false}
          >
            <ButtonPressAnimation scaleTo={0.88}>
              <Inset space={familyNameHitSlop}>
                <Inline alignVertical="center" space="6px" wrap={false}>
                  {asset.collection?.imageUrl ? (
                    <Bleed vertical="6px">
                      <FamilyImageWrapper>
                        <FamilyImage
                          source={{ uri: asset.collection.imageUrl }}
                        />
                      </FamilyImageWrapper>
                    </Bleed>
                  ) : null}
                  <Inline space="4px" wrap={false}>
                    <View
                      style={{
                        maxWidth: deviceWidth - paddingHorizontal * 6,
                      }}
                    >
                      <Text
                        color="secondary50 (Deprecated)"
                        numberOfLines={1}
                        size="16px / 22px (Deprecated)"
                        weight="bold"
                      >
                        {asset.collection.name}
                      </Text>
                    </View>
                    <Text
                      color="secondary50 (Deprecated)"
                      size="16px / 22px (Deprecated)"
                      weight="bold"
                    >
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
