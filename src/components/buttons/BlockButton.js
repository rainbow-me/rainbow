import withViewLayoutProps from '@hocs/with-view-layout-props';
import PropTypes from 'prop-types';
import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import styled, { css } from 'styled-components/primitives';
import { colors, padding, position, shadow } from '../../styles';
import { Centered } from '../layout';
import { Text } from '../text';
import ButtonPressAnimation from './ButtonPressAnimation';

const BlockButtonBorderRadius = 14;
const BlockButtonHeight = 59;

const containerStyles = css`
  border-radius: ${BlockButtonBorderRadius};
  flex-grow: 0;
  height: ${BlockButtonHeight};
`;

const Container = styled(Centered)`
  ${containerStyles}
  ${padding(17, 0, 21)}
  overflow: hidden;
`;

const GradientBackground = styled(RadialGradient)`
  ${position.cover}
`;

const InnerBorder = styled.View`
  ${position.cover}
  border-color: ${colors.alpha(colors.black, 0.06)}
  border-radius: ${BlockButtonBorderRadius};
  border-width: 0.5;
`;

const Label = styled(Text).attrs({
  color: 'white',
  size: 'large',
  weight: 'medium',
})`
  margin-bottom: 2;
`;

const Shadow = styled.View`
  ${containerStyles}
  ${shadow.build(0, 6, 10, colors.alpha(colors.purple, 0.14))}
  ${shadow.build(0, 1, 18, colors.alpha(colors.purple, 0.12))}
  ${shadow.build(0, 3, 5, colors.alpha(colors.purple, 0.2))}
`;

const BlockButton = ({
  children,
  height,
  onLayout,
  width,
  ...props
}) => (
  <ButtonPressAnimation {...props}>
    <Shadow>
      <Container onLayout={onLayout}>
        <GradientBackground
          center={[0, (height / 2)]}
          colors={[colors.primaryBlue, '#006FFF']}
          radius={width}
        />
        <InnerBorder />
        <Label>
          {children}
        </Label>
      </Container>
    </Shadow>
  </ButtonPressAnimation>
);

BlockButton.propTypes = {
  children: PropTypes.node,
  height: PropTypes.number,
  onLayout: PropTypes.func,
  width: PropTypes.number,
};

export default withViewLayoutProps(({ width, height }) => ({ width, height }))(BlockButton);
