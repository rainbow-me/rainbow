import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { createElement, PureComponent } from 'react';
import stylePropType from 'react-style-proptype';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import ShadowItem from './ShadowItem';

const ChildrenWrapper = styled.View`
  ${position.cover};
  background-color: ${({ backgroundColor }) => backgroundColor || colors.transparent};
  border-radius: ${({ borderRadius }) => borderRadius};
  overflow: ${({ overflow }) => overflow};;
`;

const ShadowStackContainer = styled.View`
  background-color: ${({ backgroundColor }) => backgroundColor || colors.transparent};
  border-radius: ${({ borderRadius }) => borderRadius};
  height: ${({ height }) => height};
  width: ${({ width }) => width};
  z-index: 1;
`;

export default class ShadowStack extends PureComponent {
  static propTypes = {
    borderRadius: PropTypes.number.isRequired,
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
    overflow: 'hidden',
    renderItem: ShadowItem,
    shadows: [],
  }

  renderItem = (shadow, index) => {
    const {
      itemStyles,
      renderItem,
      ...props
    } = this.props;

    return createElement(renderItem, {
      ...omit(props, ['children', 'shadows', 'style']),
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
      <ShadowStackContainer {...props} style={style}>
        {shadows.map(this.renderItem)}
        <ChildrenWrapper
          {...props}
          overflow={overflow}
          style={{ zIndex: shadows.length + 2 }}
        >
          {children}
        </ChildrenWrapper>
      </ShadowStackContainer>
    );
  }
}
