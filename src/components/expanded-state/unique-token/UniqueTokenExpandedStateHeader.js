import { startCase, toLower } from 'lodash';
import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import styled from 'styled-components';
import URL from 'url-parse';
import { buildUniqueTokenName } from '../../../helpers/assets';
import { ButtonPressAnimation } from '../../animations';
import { Column, ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import { Text, TruncatedText } from '../../text';
import saveToCameraRoll from './saveToCameraRoll';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import {
  useAccountProfile,
  useClipboard,
  useDimensions,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { ENS_NFT_CONTRACT_ADDRESS } from '@rainbow-me/references';
import { padding, position } from '@rainbow-me/styles';
import {
  buildRainbowUrl,
  ethereumUtils,
  magicMemo,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';

const AssetActionsEnum = {
  copyTokenID: 'copyTokenID',
  download: 'download',
  etherscan: 'etherscan',
  rainbowWeb: 'rainbowWeb',
};

const getAssetActions = network => ({
  [AssetActionsEnum.copyTokenID]: {
    actionKey: AssetActionsEnum.copyTokenID,
    actionTitle: 'Copy Token ID',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'square.on.square',
    },
  },
  [AssetActionsEnum.download]: {
    actionKey: AssetActionsEnum.download,
    actionTitle: 'Save to Photos',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'photo.on.rectangle.angled',
    },
  },
  [AssetActionsEnum.etherscan]: {
    actionKey: AssetActionsEnum.etherscan,
    actionTitle: `View on ${startCase(
      ethereumUtils.getBlockExplorer(network)
    )}`,
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'link',
    },
  },
  [AssetActionsEnum.rainbowWeb]: {
    actionKey: AssetActionsEnum.rainbowWeb,
    actionTitle: 'View on Web',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'safari.fill',
    },
  },
});

const FamilyActionsEnum = {
  collectionWebsite: 'collectionWebsite',
  discord: 'discord',
  twitter: 'twitter',
  viewCollection: 'viewCollection',
};

const FamilyActions = {
  [FamilyActionsEnum.viewCollection]: {
    actionKey: FamilyActionsEnum.viewCollection,
    actionTitle: 'View Collection',
    discoverabilityTitle: 'OpenSea',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'rectangle.grid.2x2.fill',
    },
  },
  [FamilyActionsEnum.collectionWebsite]: {
    actionKey: FamilyActionsEnum.collectionWebsite,
    actionTitle: 'Collection Website',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'safari.fill',
    },
  },
  [FamilyActionsEnum.discord]: {
    actionKey: FamilyActionsEnum.discord,
    actionTitle: 'Discord',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'ellipsis.bubble.fill',
    },
  },
  [FamilyActionsEnum.twitter]: {
    actionKey: FamilyActionsEnum.twitter,
    actionTitle: 'Twitter',
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'at.circle.fill',
    },
  },
};

const paddingHorizontal = 24;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(21, paddingHorizontal, paddingHorizontal)};
`;

const FamilyName = styled(TruncatedText).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.whiteLabel, 0.5),
  size: 'lmedium',
  weight: 'bold',
}))`
  max-width: ${({ deviceWidth }) => deviceWidth - paddingHorizontal * 6};
`;

const FamilyImageWrapper = styled.View`
  height: 20;
  margin-right: 7;
  shadow-color: ${({ theme: { colors } }) => colors.shadowBlack};
  shadow-offset: 0 3px;
  shadow-opacity: 0.15;
  shadow-radius: 4.5px;
  width: 20;
`;

const FamilyImage = styled(ImgixImage)`
  ${position.cover};
  border-radius: 10;
`;

const HeadingColumn = styled(ColumnWithMargins).attrs({
  align: 'start',
  justify: 'start',
  margin: 6,
})`
  width: 100%;
`;

const UniqueTokenExpandedStateHeader = ({ asset, imageColor }) => {
  const { accountAddress, accountENS } = useAccountProfile();
  const { setClipboard } = useClipboard();
  const { width: deviceWidth } = useDimensions();
  const { colors } = useTheme();

  const formattedCollectionUrl = useMemo(() => {
    const { hostname } = new URL(asset.external_link);
    const { hostname: hostnameFallback } = new URL(
      asset.collection.external_url
    );
    const formattedUrl = hostname || hostnameFallback;
    return formattedUrl;
  }, [asset.collection.external_url, asset.external_link]);

  const familyMenuConfig = useMemo(() => {
    return {
      menuItems: [
        !asset?.isPoap && {
          ...FamilyActions[FamilyActionsEnum.viewCollection],
        },
        (asset.external_link || asset.collection.external_url) && {
          ...FamilyActions[FamilyActionsEnum.collectionWebsite],
          discoverabilityTitle: formattedCollectionUrl,
        },
        asset.collection.twitter_username && {
          ...FamilyActions[FamilyActionsEnum.twitter],
        },
        asset.collection.discord_url && {
          ...FamilyActions[FamilyActionsEnum.discord],
        },
      ],
      menuTitle: '',
    };
  }, [asset, formattedCollectionUrl]);

  const isSVG = isSupportedUriExtension(asset.image_url, ['.svg']);
  const isENS =
    toLower(asset.asset_contract.address) === toLower(ENS_NFT_CONTRACT_ADDRESS);

  const isPhotoDownloadAvailable = !isSVG && !isENS;
  const assetMenuConfig = useMemo(() => {
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
        Linking.openURL(asset.external_link || asset.collection.external_url);
      } else if (actionKey === FamilyActionsEnum.twitter) {
        Linking.openURL(
          'https://twitter.com/' + asset.collection.twitter_username
        );
      } else if (actionKey === FamilyActionsEnum.discord) {
        Linking.openURL(asset.collection.discord_url);
      }
    },
    [asset]
  );

  const handlePressAssetMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === AssetActionsEnum.etherscan) {
        ethereumUtils.openNftInBlockExplorer(
          asset.asset_contract.address,
          asset.id,
          asset?.network
        );
      } else if (actionKey === AssetActionsEnum.rainbowWeb) {
        Linking.openURL(buildRainbowUrl(asset, accountENS, accountAddress));
      } else if (actionKey === AssetActionsEnum.copyTokenID) {
        setClipboard(asset.id);
      } else if (actionKey === AssetActionsEnum.download) {
        saveToCameraRoll(asset.image_url);
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
      'View Collection',
      'Collection Website',
      'Twitter',
      'Discord',
    ];
    const websiteIndex = 1 - (!hasCollection && 1);
    const twitterIndex = 2 - (!hasWebsite && 1);
    const discordIndex = 3 - (!hasWebsite && 1) - (!hasTwitter && 1);

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
      idx => {
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
        if (idx === 3) {
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
      'View On Web',
      `View on ${startCase(ethereumUtils.getBlockExplorer(asset?.network))}`,
      ...(isPhotoDownloadAvailable ? ['Save to Photos'] : []),
      'Copy Token ID',
    ];

    showActionSheetWithOptions(
      {
        options: androidContractActions,
        showSeparators: true,
        title: '',
      },
      idx => {
        if (idx === 0) {
          Linking.openURL(buildRainbowUrl(asset, accountENS, accountAddress));
        } else if (idx === 1) {
          ethereumUtils.openNftInBlockExplorer(
            asset.asset_contract.address,
            asset.id,
            asset?.network
          );
        } else if (isPhotoDownloadAvailable ? idx === 3 : idx === 2) {
          setClipboard(asset.id);
        } else if (idx === 2) {
          saveToCameraRoll(asset.image_url);
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

  return (
    <Container>
      <HeadingColumn>
        <RowWithMargins margin={10}>
          <Column flex={1}>
            <Text color={colors.whiteLabel} size="big" weight="heavy">
              {buildUniqueTokenName(asset)}
            </Text>
          </Column>
          <ContextMenuButton
            activeOpacity={1}
            menuConfig={assetMenuConfig}
            {...(android ? { onPress: onPressAndroidAsset } : {})}
            isMenuPrimaryAction
            onPressMenuItem={handlePressAssetMenuItem}
            useActionSheetFallback={false}
            wrapNativeComponent
          >
            <ButtonPressAnimation scaleTo={0.75}>
              <Text align="right" color={imageColor} size="big" weight="heavy">
                􀍡
              </Text>
            </ButtonPressAnimation>
          </ContextMenuButton>
        </RowWithMargins>
        <ContextMenuButton
          activeOpacity={0}
          menuConfig={familyMenuConfig}
          {...(android ? { onPress: onPressAndroidFamily } : {})}
          isMenuPrimaryAction
          onPressMenuItem={handlePressFamilyMenuItem}
          useActionSheetFallback={false}
          wrapNativeComponent={false}
        >
          <ButtonPressAnimation scaleTo={0.88}>
            <Row align="center" marginTop={android ? -10 : 0}>
              {asset.familyImage ? (
                <FamilyImageWrapper>
                  <FamilyImage
                    source={{ uri: asset?.familyImage }}
                    style={position.cover}
                  />
                </FamilyImageWrapper>
              ) : null}
              <FamilyName deviceWidth={deviceWidth}>
                {asset.familyName}
              </FamilyName>
              <Text
                color={colors.alpha(colors.whiteLabel, 0.5)}
                size="lmedium"
                weight="bold"
              >
                {' 􀆊'}
              </Text>
            </Row>
          </ButtonPressAnimation>
        </ContextMenuButton>
      </HeadingColumn>
    </Container>
  );
};

export default magicMemo(UniqueTokenExpandedStateHeader, 'asset');
