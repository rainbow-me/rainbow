import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { createElement, PureComponent } from 'react';
import stylePropType from 'react-style-proptype';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import ShadowItem from './ShadowItem';

const Container = styled.View`
  background-color: ${({ backgroundColor }) => backgroundColor || colors.transparent};
  border-radius: ${({ borderRadius }) => borderRadius};
`;

export default class ShadowStack extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    height: PropTypes.number.isRequired,
    itemStyles: stylePropType,
    overflow: PropTypes.oneOf(['hidden', 'scroll', 'visible']),
    renderItem: PropTypes.func,
    shadows: PropTypes.arrayOf(PropTypes.array).isRequired,
    style: stylePropType,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  }

  static defaultProps = {
    itemStyles: {},
    overflow: 'hidden',
    renderItem: ShadowItem,
    shadows: [],
  }

  renderShadowItem = (shadow, index) => {
    const { itemStyles, renderItem, ...props } = this.props;

    return createElement(renderItem, {
      ...omit(props, ['children', 'overflow', 'style']),
      key: `${shadow.join('-')}${index}`,
      shadow,
      style: itemStyles,
      zIndex: index + 2,
    });
  }

  render = () => {
    const {
      children,
      overflow,
      shadows,
      style,
      ...props
    } = this.props;

    return (
      <Container {...props} style={style} zIndex={1}>
        {shadows.map(this.renderShadowItem)}
        <Container
          {...props}
          css={position.cover}
          overflow={overflow}
          zIndex={shadows.length + 2}
        >
          {children}
        </Container>
      </Container>
    );
  }
}
