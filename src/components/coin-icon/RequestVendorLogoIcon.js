import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import FastImage from 'react-native-fast-image';
import { colors, position } from '../../styles';
import { initials } from '../../utils';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { Text } from '../text';
import CoinIcon from './CoinIcon';

const RVLIBorderRadius = 16.25;
const RVLIShadows = {
  default: [
    [0, 4, 6, colors.dark, 0.04],
    [0, 1, 3, colors.dark, 0.08],
  ],
  large: [
    [0, 8, 11, colors.dark, 0.04],
    [0, 2, 6, colors.dark, 0.08],
  ],
};

export default class RequestVendorLogoIcon extends PureComponent {
  static propTypes = {
    backgroundColor: PropTypes.string,
    borderRadius: PropTypes.number,
    dappName: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    shouldPrioritizeImageLoading: PropTypes.bool,
    showLargeShadow: PropTypes.bool,
    size: PropTypes.number.isRequired,
  }

  static defaultProps = {
    backgroundColor: colors.dark,
    borderRadius: RVLIBorderRadius,
    size: CoinIcon.size,
  }

  static size = CoinIcon.size;

  state = {
    error: null,
  }

  handleError = error => this.setState({ error })

  renderFallbackText = () => (
    <Text
      color={colors.getFallbackTextColor(this.props.backgroundColor)}
      size="large"
      style={{ marginBottom: 2 }}
      weight="medium"
    >
      {initials(this.props.dappName)}
    </Text>
  )

  renderImage = () => (
    <FastImage
      onError={this.handleError}
      source={{
        priority: FastImage.priority[this.props.shouldPrioritizeImageLoading ? 'high' : 'low'],
        uri: this.props.imageUrl,
      }}
      style={position.sizeAsObject('100%')}
    />
  )

  render = () => {
    const {
      backgroundColor,
      borderRadius,
      imageUrl,
      showLargeShadow,
      size,
      ...props
    } = this.props;

    return (
      <ShadowStack
        {...props}
        {...position.sizeAsObject(size)}
        backgroundColor={backgroundColor}
        borderRadius={borderRadius}
        shadows={RVLIShadows[showLargeShadow ? 'large' : 'default']}
        shouldRasterizeIOS
      >
        <Centered style={{ ...position.sizeAsObject(size), backgroundColor }}>
          {(imageUrl && !this.state.error)
            ? this.renderImage()
            : this.renderFallbackText()
          }
        </Centered>
      </ShadowStack>
    );
  }
}
