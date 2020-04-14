import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import FastImage from 'react-native-fast-image';
import ShadowStack from 'react-native-shadow-stack';
import { colors, position } from '../../styles';
import { initials } from '../../utils';
import { Centered } from '../layout';
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
  };

  static defaultProps = {
    backgroundColor: colors.dark,
    borderRadius: RVLIBorderRadius,
    size: CoinIcon.size,
  };

  state = {
    error: null,
  };

  static size = CoinIcon.size;

  handleError = error => this.setState({ error });

  renderFallbackText = bg => (
    <Text
      align="center"
      color={colors.getFallbackTextColor(bg)}
      size="smedium"
      weight="semibold"
    >
      {initials(this.props.dappName)}
    </Text>
  );

  renderImage = () => (
    <FastImage
      onError={this.handleError}
      source={{
        priority:
          FastImage.priority[
            this.props.shouldPrioritizeImageLoading ? 'high' : 'low'
          ],
        uri: this.props.imageUrl,
      }}
      style={position.sizeAsObject('100%')}
    />
  );

  render = () => {
    const {
      backgroundColor,
      borderRadius,
      imageUrl,
      showLargeShadow,
      size,
      ...props
    } = this.props;

    // When dapps have no icon the bg is transparent
    const bg =
      backgroundColor === 'transparent' ? colors.white : backgroundColor;

    return (
      <ShadowStack
        {...props}
        {...position.sizeAsObject(size)}
        backgroundColor={bg}
        borderRadius={borderRadius}
        shadows={RVLIShadows[showLargeShadow ? 'large' : 'default']}
        shouldRasterizeIOS
      >
        <Centered style={{ ...position.sizeAsObject(size), bg }}>
          {imageUrl && !this.state.error
            ? this.renderImage()
            : this.renderFallbackText(bg)}
        </Centered>
      </ShadowStack>
    );
  };
}
