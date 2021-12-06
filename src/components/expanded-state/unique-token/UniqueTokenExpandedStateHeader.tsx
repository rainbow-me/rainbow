import { toLower } from 'lodash';
import React, { useCallback } from 'react';
import { Linking } from 'react-native';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { ContextMenuButton } from 'react-native-ios-context-menu';
import styled from 'styled-components';
import URL from 'url-parse';
import { buildUniqueTokenName } from '../../../helpers/assets';
import { ButtonPressAnimation } from '../../animations';
import { Column, ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import { Text, TruncatedText } from '../../text';
import saveToCameraRoll from './saveToCameraRoll';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/isSupporte... Remove this comment to see the full error message
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import {
  useAccountProfile,
  useClipboard,
  useDimensions,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ENS_NFT_CONTRACT_ADDRESS } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';
import {
  buildRainbowUrl,
  magicMemo,
  showActionSheetWithOptions,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/utils';

const AssetActionsEnum = {
  copyTokenID: 'copyTokenID',
  download: 'download',
  etherscan: 'etherscan',
  rainbowWeb: 'rainbowWeb',
};

const AssetActions = {
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
    actionTitle: 'View on Etherscan',
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
};

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
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'etherscan' does not exist on type '{ col... Remove this comment to see the full error message
  [FamilyActionsEnum.etherscan]: {
    actionKey: AssetActionsEnum.etherscan,
    actionTitle: 'View on Etherscan',
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

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const FamilyImageWrapper = styled.View`
  height: 20;
  margin-right: 7;
  shadow-color: ${({ theme: { colors } }: any) => colors.shadowBlack};
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

const UniqueTokenExpandedStateHeader = ({ asset, imageColor }: any) => {
  const { accountAddress, accountENS } = useAccountProfile();
  const { setClipboard } = useClipboard();
  const { width: deviceWidth } = useDimensions();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const formattedCollectionUrl = useMemo(() => {
    const { hostname } = new URL(asset.external_link);
    const { hostname: hostnameFallback } = new URL(
      asset.collection.external_url
    );
    const formattedUrl = hostname || hostnameFallback;
    return formattedUrl;
  }, [asset.collection.external_url, asset.external_link]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const familyMenuConfig = useMemo(() => {
    return {
      menuItems: [
        {
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
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useMemo'.
  const assetMenuConfig = useMemo(() => {
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
  }, [asset.id, isPhotoDownloadAvailable]);

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
        Linking.openURL(
          'https://etherscan.io/token/' +
            asset.asset_contract.address +
            '?a=' +
            asset.id
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
    const baseActions = [
      'View Collection',
      'Collection Website',
      'Twitter',
      'Discord',
    ];

    // @ts-expect-error ts-migrate(2363) FIXME: The right-hand side of an arithmetic operation mus... Remove this comment to see the full error message
    const twitterIndex = 2 - (!hasWebsite && 1);
    // @ts-expect-error ts-migrate(2363) FIXME: The right-hand side of an arithmetic operation mus... Remove this comment to see the full error message
    const discordIndex = 3 - (!hasWebsite && 1) - (!hasTwitter && 1);

    if (!hasWebsite) baseActions.splice(1, 1);
    if (!hasTwitter) baseActions.splice(twitterIndex, 1);
    if (!hasDiscord) baseActions.splice(discordIndex, 1);

    showActionSheetWithOptions(
      {
        options: baseActions,
        showSeparators: true,
        title: '',
      },
      (idx: any) => {
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
      'View on Etherscan',
      ...(isPhotoDownloadAvailable ? ['Save to Photos'] : []),
      'Copy Token ID',
    ];

    showActionSheetWithOptions(
      {
        options: androidContractActions,
        showSeparators: true,
        title: '',
      },
      (idx: any) => {
        if (idx === 0) {
          Linking.openURL(buildRainbowUrl(asset, accountENS, accountAddress));
        } else if (idx === 1) {
          Linking.openURL(
            'https://etherscan.io/token/' +
              asset.asset_contract.address +
              '?a=' +
              asset.id
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <HeadingColumn>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RowWithMargins margin={10}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column flex={1}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text color={colors.whiteLabel} size="big" weight="heavy">
              {buildUniqueTokenName(asset)}
            </Text>
          </Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ContextMenuButton
            activeOpacity={1}
            menuConfig={assetMenuConfig}
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
            {...(android ? { onPress: onPressAndroidAsset } : {})}
            isMenuPrimaryAction
            onPressMenuItem={handlePressAssetMenuItem}
            useActionSheetFallback={false}
            wrapNativeComponent
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ButtonPressAnimation scaleTo={0.75}>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text align="right" color={imageColor} size="big" weight="heavy">
                􀍡
              </Text>
            </ButtonPressAnimation>
          </ContextMenuButton>
        </RowWithMargins>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ContextMenuButton
          activeOpacity={0}
          menuConfig={familyMenuConfig}
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          {...(android ? { onPress: onPressAndroidFamily } : {})}
          isMenuPrimaryAction
          onPressMenuItem={handlePressFamilyMenuItem}
          useActionSheetFallback={false}
          wrapNativeComponent={false}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ButtonPressAnimation scaleTo={0.88}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Row align="center" marginTop={android ? -10 : 0}>
              {asset.familyImage ? (
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <FamilyImageWrapper>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <FamilyImage
                    source={{ uri: asset?.familyImage }}
                    style={position.cover}
                  />
                </FamilyImageWrapper>
              ) : null}
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <FamilyName deviceWidth={deviceWidth}>
                {asset.familyName}
              </FamilyName>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
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
