import { filter, get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import {
  InteractionManager,
  Linking,
  Share,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { compose, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { Icon } from '../components/icons';
import { Centered, Column, Row } from '../components/layout';
import { Text, TruncatedText } from '../components/text';
import { UniqueTokenImage } from '../components/unique-token';
import { buildUniqueTokenName } from '../helpers/assets';
import { withAccountAssets } from '../hoc';
import { colors, padding, position } from '../styles';
import { deviceUtils } from '../utils';

const ActionIcon = styled(Icon).attrs({
  color: colors.sendScreen.brightBlue,
})`
  ${position.size(21)};
`;

const AssetTitleRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 20)}
  margin-bottom: 5px;
`;

const AssetSubtitleRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 20)}
  margin-bottom: 20px;
  opacity: 0.6;
`;

const AssetActionRow = styled(TouchableOpacity).attrs({ activeOpacity: 0.5 })`
  ${padding(20, 20)}
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
`;

const Border = styled(Row)`
  background-color: ${colors.blueGreyLight};
  height: 2px;
  opacity: 0.03;
  width: 100%;
`;

const BackgroundButton = styled(TouchableOpacity)`
  ${position.cover}
  z-index: 0;
`;

const Container = styled(Centered).attrs({ direction: 'column' })`
  ${padding(0, 15)}
  background-color: transparent;
  height: 100%;
`;

const FloatingContainerPaddingX = 20;

const FloatingContainer = styled(Column)`
  ${padding(FloatingContainerPaddingX, 0)}
  background-color: ${({ color }) => color || colors.white};
  border-radius: 12px;
  height: ${({ size }) => size || 'auto'};
  margin-bottom: ${({ marginBottom }) => (marginBottom ? `${marginBottom}px` : '0px')};
  padding-bottom: 0px;
  width: 100%;
  z-index: 1;
`;

const Name = styled(TruncatedText).attrs({
  color: colors.blueGreyDark,
  family: 'SFProText',
  size: 'larger',
  weight: 'semibold',
})`
  flex: 1;
  padding-right: ${FloatingContainerPaddingX * 1.25};
`;

class ExpandedAssetScreen extends Component {
  static propTypes = {
    assets: PropTypes.array,
    navigation: PropTypes.object,
    selectedAsset: PropTypes.object,
    subtitle: PropTypes.string,
    type: PropTypes.string,
    uniqueTokens: PropTypes.array,
  };

  static defaultProps = {
    assets: [],
    uniqueTokens: [],
  };

  onPressSend = () => {
    const { navigation, selectedAsset } = this.props;

    navigation.goBack();

    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('SendScreen', { asset: selectedAsset.symbol });
    });
  };

  onPressShare = () => {
    const { selectedAsset, type } = this.props;

    if (type === 'token') {
      Share.share({
        title: `Share ${selectedAsset.name} Info`,
        url: `https://coinmarketcap.com/currencies/${selectedAsset.name}`,
      });
    } else if (type === 'unique_token') {
      Share.share({
        title: `Share ${selectedAsset.name} Info`,
        url: `https://opensea.io/assets/${selectedAsset.contractAddress}/${selectedAsset.id}`,
      });
    }
  };

  onPressView = () => {
    const { selectedAsset, type } = this.props;

    if (type === 'token') {
      Linking.openURL(`https://coinmarketcap.com/currencies/${selectedAsset.name}`);
    } else if (type === 'unique_token') {
      Linking.openURL(`https://opensea.io/assets/${selectedAsset.contractAddress}/${selectedAsset.id}`);
    }
  };

  render() {
    const {
      navigation,
      selectedAsset,
      subtitle,
      type,
    } = this.props;

    return (
      <Container>
        <StatusBar barStyle="light-content" />
        <BackgroundButton onPress={() => navigation.goBack()} />
        {type === 'unique_token' ? (
          <FloatingContainer
            color={selectedAsset.background || colors.lightestGrey}
            marginBottom={20}
            size={deviceUtils.dimensions.width - 60}
          >
            <UniqueTokenImage
              backgroundColor={selectedAsset.background}
              imageUrl={selectedAsset.imagePreviewUrl}
              item={selectedAsset}
              size={deviceUtils.dimensions.width - 60}
            />
          </FloatingContainer>
        ) : null}
        <FloatingContainer color={colors.white}>
          <AssetTitleRow>
            <Name>
              {(type === 'unique_token')
                ? buildUniqueTokenName(selectedAsset)
                : get(selectedAsset, 'name')
              }
            </Name>
            <Text
              color={colors.blueGreyDark}
              family="SFProText"
              size="larger"
              weight="semibold"
            >
              {get(selectedAsset, 'native.price.display')}
            </Text>
          </AssetTitleRow>
          <AssetSubtitleRow>
            <Text
              color={colors.blueGreyDark}
              family="SFMono"
              size="smedium"
              weight="regular"
            >
              {subtitle}
            </Text>
            {type === 'token' ? (
              <Text
                color={colors.blueGreyDark}
                family="SFMono"
                size="smedium"
                weight="regular"
              >
                Price
              </Text>
            ) : null}
          </AssetSubtitleRow>
          <Border />
          {type === 'unique_token' && (
            <Fragment>
              <AssetActionRow onPress={this.onPressView}>
                <Text
                  color={colors.sendScreen.brightBlue}
                  family="SFProText"
                  size="bmedium"
                  weight="semibold"
                >
                  View on OpenSea
                </Text>
                <ActionIcon name="compass" />
              </AssetActionRow>
              <Border />
            </Fragment>
          )}
          {type === 'token' ? (
            <AssetActionRow onPress={this.onPressSend}>
              <Text
                color={colors.sendScreen.brightBlue}
                family="SFProText"
                size="bmedium"
                weight="semibold"
              >
                Send to...
              </Text>
              <ActionIcon name="send" />
            </AssetActionRow>
          ) : (
            <AssetActionRow onPress={this.onPressShare}>
              <Text
                color={colors.sendScreen.brightBlue}
                family="SFProText"
                size="bmedium"
                weight="semibold"
              >
                Share
              </Text>
              <ActionIcon name="share" />
            </AssetActionRow>
          )}
        </FloatingContainer>
      </Container>
    );
  }
}

export default compose(
  withAccountAssets,
  withProps(({ assets, navigation, uniqueTokens }) => {
    const { name, type } = navigation.state.params;

    let selectedAsset = {};

    if (type === 'token') {
      [selectedAsset] = filter(assets, (asset) => asset.symbol === name);
    } else if (type === 'unique_token') {
      [selectedAsset] = filter(uniqueTokens, (asset) => asset.name === name);
    }

    let subtitle = '';

    if (type === 'token') {
      subtitle = get(selectedAsset, 'balance.display');
    } else if (type === 'unique_token') {
      const hasName = get(selectedAsset, 'name');
      subtitle = hasName
        ? `${selectedAsset.contractName} #${selectedAsset.id}`
        : selectedAsset.contractName;
    }

    return {
      selectedAsset,
      subtitle,
      type,
    };
  }),
)(ExpandedAssetScreen);
