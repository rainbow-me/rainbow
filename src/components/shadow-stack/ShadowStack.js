import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import ShadowItem from './ShadowItem';

const ChildrenWrapper = styled.View`
  ${position.cover};
  background-color: ${colors.white};
  border-radius: ${({ borderRadius }) => borderRadius};
  overflow: hidden;
`;

const ShadowStackContainer = styled.View`
  background-color: ${colors.white};
  border-radius: ${({ borderRadius }) => borderRadius};
  height: ${({ height }) => height};
  width: ${({ width }) => width};
  z-index: 1;
`;

export default class ShadowStack extends PureComponent {
  static propTypes = {
    borderRadius: PropTypes.number,
    children: PropTypes.node,
    height: PropTypes.number,
    shadows: PropTypes.arrayOf(PropTypes.string),
    width: PropTypes.number,
  }

  static defaultProps = {
    shadows: [],
  }

  renderItem = (shadow, index) => (
    <ShadowItem
      {...omit(this.props, ['children', 'shadows'])}
      key={shadow}
      shadow={shadow}
      style={{ zIndex: index + 2 }}
    />
  )

  render = () => {
    const { children, shadows, ...props } = this.props;

    return (
      <ShadowStackContainer {...props}>
        {shadows.map(this.renderItem)}
        <ChildrenWrapper {...props} style={{ zIndex: shadows.length + 2 }}>
          {children}
        </ChildrenWrapper>
      </ShadowStackContainer>
    );
  }
}
