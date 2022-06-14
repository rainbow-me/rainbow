import lang from 'i18n-js';
import { startCase, toLower } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { Linking, View } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import URL from 'url-parse';
import { buildUniqueTokenName } from '../../../helpers/assets';
import { ButtonPressAnimation } from '../../animations';
import saveToCameraRoll from './saveToCameraRoll';
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
} from '@rainbow-me/design-system';
import { UniqueAsset } from '@rainbow-me/entities';
import { Network } from '@rainbow-me/helpers';
import {
  useAccountProfile,
  useClipboard,
  useDimensions,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { ENS_NFT_CONTRACT_ADDRESS } from '@rainbow-me/references';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import {
  buildRainbowUrl,
  ethereumUtils,
  magicMemo,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';
import { getFullResUrl } from '@rainbow-me/utils/getFullResUrl';
import isSVGImage from '@rainbow-me/utils/isSVG';

const AssetActionsEnum = {
  copyTokenID: 'copyTokenID',
  download: 'download',
  etherscan: 'etherscan',
  rainbowWeb: 'rainbowWeb',
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
    discoverabilityTitle: lang.t('expanded_state.unique_expanded.opensea'),
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
}

const UniqueTokenExpandedStateHeader = ({
  asset,
}: UniqueTokenExpandedStateHeaderProps) => {
  const { accountAddress, accountENS } = useAccountProfile();
  const { setClipboard } = useClipboard();
  const { width: deviceWidth } = useDimensions();

  const formattedCollectionUrl = useMemo(() => {
    // @ts-expect-error external_link could be null or undefined?
    const { hostname } = new URL(asset.external_link);
    const { hostname: hostnameFallback } = new URL(
      // @ts-expect-error external_url could be null or undefined?
      asset.collection.external_url
    );
    const formattedUrl = hostname || hostnameFallback;
    return formattedUrl;
  }, [asset.collection.external_url, asset.external_link]);

  const familyMenuConfig = useMemo(() => {
    return {
      menuItems: [
        ...(!asset?.isPoap
          ? [
              {
                ...FamilyActions[FamilyActionsEnum.viewCollection],
              },
            ]
          : []),
        ...(asset.external_link || asset.collection.external_url
          ? [
              {
                ...FamilyActions[FamilyActionsEnum.collectionWebsite],
                discoverabilityTitle: formattedCollectionUrl,
              },
            ]
          : []),
        ...(asset.collection.twitter_username
          ? [
              {
                ...FamilyActions[FamilyActionsEnum.twitter],
              },
            ]
          : []),
        ...(asset.collection.discord_url
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
    asset.collection.discord_url,
    asset.collection.external_url,
    asset.collection.twitter_username,
    asset.external_link,
    asset?.isPoap,
    formattedCollectionUrl,
  ]);

  // @ts-expect-error image_url could be null or undefined?
  const isSVG = isSVGImage(asset.image_url);
  const isENS =
    toLower(asset.asset_contract.address) === toLower(ENS_NFT_CONTRACT_ADDRESS);

  const isPhotoDownloadAvailable = !isSVG && !isENS;
  const assetMenuConfig = useMemo(() => {
    // @ts-expect-error network could be undefined?
    const AssetActions = getAssetActions(asset?.network);
    return {
      menuItems: [
        {
          ...AssetActions[AssetActionsEnum.rainbowWeb],
          discoverabilityTitle: 'rainbow.me',
        },
        {
          ...AssetActions[AssetActionsEnum.etherscan],
        },
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
      ],
      menuTitle: '',
    };
  }, [asset.id, asset?.network, isPhotoDownloadAvailable]);

  const handlePressFamilyMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === FamilyActionsEnum.viewCollection) {
        Linking.openURL(
          'https://opensea.io/collection/' +
            asset.collection.slug +
            '?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW'
        );
      } else if (actionKey === FamilyActionsEnum.collectionWebsite) {
        // @ts-expect-error external_link and external_url could be null or undefined?
        Linking.openURL(asset.external_link || asset.collection.external_url);
      } else if (actionKey === FamilyActionsEnum.twitter) {
        Linking.openURL(
          'https://twitter.com/' + asset.collection.twitter_username
        );
      } else if (
        actionKey === FamilyActionsEnum.discord &&
        asset.collection.discord_url
      ) {
        Linking.openURL(asset.collection.discord_url);
      }
    },
    [asset]
  );

  const handlePressAssetMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === AssetActionsEnum.etherscan) {
        ethereumUtils.openNftInBlockExplorer(
          // @ts-expect-error address could be undefined?
          asset.asset_contract.address,
          asset.id,
          asset?.network
        );
      } else if (actionKey === AssetActionsEnum.rainbowWeb) {
        Linking.openURL(buildRainbowUrl(asset, accountENS, accountAddress));
      } else if (actionKey === AssetActionsEnum.copyTokenID) {
        setClipboard(asset.id);
      } else if (actionKey === AssetActionsEnum.download) {
        saveToCameraRoll(getFullResUrl(asset.image_original_url));
      }
    },
    [accountAddress, accountENS, asset, setClipboard]
  );

  const onPressAndroidFamily = useCallback(() => {
    const hasWebsite = !!(asset.external_link || asset.collection.external_url);
    const hasTwitter = !!asset.collection.twitter_username;
    const hasDiscord = !!asset.collection.discord_url;
    const hasCollection = !!asset.collection.slug;
    const baseActions = [
      lang.t('expanded_state.unique_expanded.view_collection'),
      lang.t('expanded_state.unique_expanded.collection_website'),
      lang.t('expanded_state.unique_expanded.twitter'),
      lang.t('expanded_state.unique_expanded.discord'),
    ];
    const websiteIndex = 1 - (!hasCollection ? 1 : 0);
    const twitterIndex = 2 - (!hasWebsite ? 1 : 0);
    const discordIndex = 3 - (!hasWebsite ? 1 : 0) - (!hasTwitter ? 1 : 0);

    if (!hasCollection) baseActions.splice(1, 1);
    if (!hasWebsite) baseActions.splice(websiteIndex, 1);
    if (!hasTwitter) baseActions.splice(twitterIndex, 1);
    if (!hasDiscord) baseActions.splice(discordIndex, 1);

    showActionSheetWithOptions(
      {
        options: baseActions,
        showSeparators: true,
        title: '',
      },
      (idx: number) => {
        if (idx === 0) {
          Linking.openURL(
            'https://opensea.io/collection/' +
              asset.collection.slug +
              '?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW'
          );
        }
        if (idx === 1) {
          if (hasWebsite) {
            Linking.openURL(
              // @ts-expect-error external_link and external_url could be null or undefined?
              asset.external_link || asset.collection.external_url
            );
          } else if (hasTwitter && twitterIndex === 1) {
            Linking.openURL(
              'https://twitter.com/' + asset.collection.twitter_username
            );
          } else if (hasDiscord && discordIndex === 1) {
            Linking.openURL(
              'https://twitter.com/' + asset.collection.twitter_username
            );
          }
        }
        if (idx === 2) {
          if (hasTwitter && twitterIndex === 2) {
            Linking.openURL(
              'https://twitter.com/' + asset.collection.twitter_username
            );
          } else if (hasDiscord && discordIndex === 2) {
            Linking.openURL(
              'https://twitter.com/' + asset.collection.twitter_username
            );
          }
        }
        if (idx === 3 && asset.collection.discord_url) {
          Linking.openURL(asset.collection.discord_url);
        }
      }
    );
  }, [
    asset.collection.discord_url,
    asset.collection.external_url,
    asset.collection.slug,
    asset.collection.twitter_username,
    asset.external_link,
  ]);

  const onPressAndroidAsset = useCallback(() => {
    const androidContractActions = [
      lang.t('expanded_state.unique_expanded.view_on_web'),
      lang.t('expanded_state.unique_expanded.view_on_block_explorer', {
        blockExplorerName: startCase(
          // @ts-expect-error network could be undefined?
          ethereumUtils.getBlockExplorer(asset?.network)
        ),
      }),
      ...(isPhotoDownloadAvailable
        ? ([lang.t('expanded_state.unique_expanded.save_to_photos')] as const)
        : []),
      lang.t('expanded_state.unique_expanded.copy_token_id'),
    ] as const;

    showActionSheetWithOptions(
      {
        options: androidContractActions,
        showSeparators: true,
        title: '',
      },
      (idx: number) => {
        if (idx === 0) {
          Linking.openURL(buildRainbowUrl(asset, accountENS, accountAddress));
        } else if (idx === 1) {
          ethereumUtils.openNftInBlockExplorer(
            // @ts-expect-error address could be undefined?
            asset.asset_contract.address,
            asset.id,
            asset?.network
          );
        } else if (isPhotoDownloadAvailable ? idx === 3 : idx === 2) {
          setClipboard(asset.id);
        } else if (idx === 2) {
          saveToCameraRoll(getFullResUrl(asset.image_original_url));
        }
      }
    );
  }, [
    accountAddress,
    accountENS,
    asset,
    isPhotoDownloadAvailable,
    setClipboard,
  ]);

  const overflowMenuHitSlop: Space = '15px';
  const familyNameHitSlop: Space = '19px';

  return (
    <Stack space="15px">
      <Columns space="24px">
        <Heading containsEmoji size="23px" weight="heavy">
          {buildUniqueTokenName(asset)}
        </Heading>
        <Column width="content">
          <Bleed space={overflowMenuHitSlop}>
            <ContextMenuButton
              menuConfig={assetMenuConfig}
              {...(android ? { onPress: onPressAndroidAsset } : {})}
              isMenuPrimaryAction
              onPressMenuItem={handlePressAssetMenuItem}
              useActionSheetFallback={false}
            >
              <ButtonPressAnimation scaleTo={0.75}>
                <Inset space={overflowMenuHitSlop}>
                  <Text color="accent" size="23px" weight="heavy">
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
                  {asset.familyImage ? (
                    <Bleed vertical="6px">
                      <FamilyImageWrapper>
                        <FamilyImage source={{ uri: asset.familyImage }} />
                      </FamilyImageWrapper>
                    </Bleed>
                  ) : null}
                  <Inline space="4px" wrap={false}>
                    <View
                      style={{
                        maxWidth: deviceWidth - paddingHorizontal * 6,
                      }}
                    >
                      <Text color="secondary50" numberOfLines={1} weight="bold">
                        {asset.familyName}
                      </Text>
                    </View>
                    <Text color="secondary50" weight="bold">
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
