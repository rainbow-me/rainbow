import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styled from 'styled-components/primitives';
import { compose, withProps } from 'recompact';
import { filter, get } from 'lodash';
import { InteractionManager, Linking, Share, StatusBar, TouchableOpacity } from 'react-native';

import { colors, padding, position } from '../styles';
import { ButtonPressAnimation } from '../components/buttons';
import { Column, Row } from '../components/layout';
import { Text } from '../components/text';
import { Icon } from '../components/icons';
import { UniqueTokenImage } from '../components/unique-token';
import { withAccountAssets } from '../hoc';
import { deviceUtils } from '../utils';

const ActionIcon = styled(Icon).attrs({
  color: colors.sendScreen.brightBlue,
})`
  height: 21px;
  width: 21px;
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

const AssetActionRow = styled(ButtonPressAnimation)`
  ${padding(20, 20)}
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const Border = styled(Row)`
  background-color: ${colors.blueGreyLight};
  height: 2px;
  width: 100%;
  opacity: 0.03;
`;

const BackgroundButton = styled(TouchableOpacity)`
  ${position.cover}
  z-index: 0;
`;

const Container = styled(Column).attrs({
  align: 'center',
  justify: 'center',
})`
  ${padding(0, 15)}
  background-color: transparent;
  height: 100%;
`;

const FloatingContainer = styled(Column)`
  ${padding(20, 0)}
  background-color: ${({ color }) => color || colors.white};
  width: 100%;
  border-radius: 12px;
  height: ${({ size }) => (size ? `${size - 60}px` : 'auto')};
  margin-bottom: ${({ marginBottom }) => (marginBottom ? `${marginBottom}px` : '0px')};
  padding-bottom: 0px;
  z-index: 1;
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
            color={selectedAsset.background}
            marginBottom={20}
            size={deviceUtils.dimensions.width}
          >
            <UniqueTokenImage
              backgroundColor={selectedAsset.background}
              imageUrl={selectedAsset.imagePreviewUrl}
              item={selectedAsset}
            />
          </FloatingContainer>
        ) : null}
        <FloatingContainer color={colors.white}>
          <AssetTitleRow>
            <Text
              color={colors.blueGreyDark}
              family="SFProText"
              size="larger"
              weight="semibold"
            >
              {get(selectedAsset, 'name')}
            </Text>
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
          <Border />
          <AssetActionRow onPress={this.onPressView}>
            <Text
              color={colors.sendScreen.brightBlue}
              family="SFProText"
              size="bmedium"
              weight="semibold"
            >
              View on {type === 'token' ? 'CoinMarketCap' : 'OpenSea'}
            </Text>
            <ActionIcon name="compass" />
          </AssetActionRow>
        </FloatingContainer>
      </Container>
    );
  }
}

export default compose(
  withAccountAssets,
  withProps(({ assets, navigation, uniqueTokens }) => {
    const type = get(navigation, 'state.params.type');
    const name = get(navigation, 'state.params.name');

    let selectedAsset = {};

    if (type === 'token') {
      [selectedAsset] = filter(assets, (asset) => asset.symbol === name);
    } else if (type === 'unique_token') {
      [selectedAsset] = filter(uniqueTokens, (asset) => asset.name === name);
    }

    const subtitle = type === 'token' ? get(selectedAsset, 'balance.display') : `${selectedAsset.contractName} #${selectedAsset.id}`;

    return {
      type,
      selectedAsset,
      subtitle,
    };
  }),
)(ExpandedAssetScreen);
