import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import styled from 'styled-components';
import URL from 'url-parse';
import { buildUniqueTokenName } from '../../../helpers/assets';
import { ButtonPressAnimation } from '../../animations';
import { Column, ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import { Text, TruncatedText } from '../../text';
import { useAccountProfile, useDimensions } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { padding, position } from '@rainbow-me/styles';
import {
  buildRainbowUrl,
  magicMemo,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';
import logger from 'logger';

const AssetActionsEnum = {
  etherscan: 'etherscan',
  rainbowWeb: 'rainbowWeb',
};

const AssetActions = {
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
      ],
      menuTitle: '',
    };
  }, []);

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
      }
    },
    [accountAddress, accountENS, asset]
  );

  const onPressAndroid = useCallback(() => {
    const blockExplorerText = 'View on Etherscan';
    const androidContractActions = [
      'Copy Contract Address',
      blockExplorerText,
      'Cancel',
    ];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 2,
        options: androidContractActions,
        showSeparators: true,
        title: '',
      },
      idx => {
        if (idx === 0) {
          logger.log('menu0');
        }
        if (idx === 1) {
          logger.log('menu1');
        }
      }
    );
  }, []);

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
            {...(android ? { onPress: onPressAndroid } : {})}
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
          {...(android ? { onPress: onPressAndroid } : {})}
          isMenuPrimaryAction
          onPressMenuItem={handlePressFamilyMenuItem}
          useActionSheetFallback={false}
          wrapNativeComponent={false}
        >
          <ButtonPressAnimation scaleTo={0.88}>
            <Row>
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
