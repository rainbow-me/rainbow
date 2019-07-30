import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import stylePropType from 'react-style-proptype';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import ShadowItem from './ShadowItem';

const ChildrenWrapper = styled.View`
  ${position.cover};
  background-color: ${({ backgroundColor }) => backgroundColor || colors.transparent};
  border-radius: ${({ borderRadius }) => borderRadius};
  overflow: hidden;
  justify-content: center;
  align-items: center;
`;

const ShadowStackContainer = styled.View`
  background-color: ${({ backgroundColor }) => backgroundColor || colors.transparent};
  border-radius: ${({ borderRadius }) => borderRadius};
  height: ${({ height }) => height};
  width: ${({ width }) => width};
  z-index: 1;
`;

const ShadowItemPropBlacklist = ['children', 'shadowProps', 'shadows', 'style'];

export default class ShadowStack extends PureComponent {
  static propTypes = {
    borderRadius: PropTypes.number.isRequired,
    children: PropTypes.node,
    height: PropTypes.number.isRequired,
    shadowProps: PropTypes.object,
    shadows: PropTypes.arrayOf(PropTypes.array).isRequired,
    style: stylePropType,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  }

  static defaultProps = {
    shadows: [],
  }

  renderItem = (shadow, index) => (
    <ShadowItem
      {...omit(this.props, ShadowItemPropBlacklist)}
      key={`${shadow.join('-')}${index}`}
      shadow={shadow}
      zIndex={index + 2}
      {...this.props.shadowProps}
    />
  )

  render = () => {
    const {
      children,
      shadows,
      style,
      ...props
    } = this.props;

    return (
      <ShadowStackContainer {...props} style={style}>
        {shadows.map(this.renderItem)}
        <ChildrenWrapper {...props} style={{ zIndex: shadows.length + 2 }}>
          {children}
        </ChildrenWrapper>
      </ShadowStackContainer>
    );
  }
}
