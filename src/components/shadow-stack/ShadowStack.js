import { omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import stylePropType from 'react-style-proptype';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import ShadowItem from './ShadowItem';

const ChildrenWrapper = styled.View`
  ${position.cover};
  background-color: ${colors.transparent};
  border-radius: ${({ borderRadius }) => borderRadius};
  overflow: hidden;
`;

const ShadowStackContainer = styled.View`
  ${({ height }) => (height ? `height: ${height};` : '')}
  ${({ width }) => (width ? `width: ${width};` : '')}
  background-color: ${colors.transparent};
  border-radius: ${({ borderRadius }) => borderRadius};
  z-index: 1;
`;

const ShadowItemPropBlacklist = ['children', 'shadowProps', 'shadows', 'style'];

export default class ShadowStack extends PureComponent {
  static propTypes = {
    borderRadius: PropTypes.number,
    children: PropTypes.node,
    childrenWrapperStyle: stylePropType,
    height: PropTypes.number,
    shadowProps: PropTypes.object,
    shadows: PropTypes.arrayOf(PropTypes.array).isRequired,
    style: stylePropType,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  };

  static defaultProps = {
    borderRadius: 0,
    shadows: [],
  };

  renderItem = (shadow, index) => (
    <ShadowItem
      {...omit(this.props, ShadowItemPropBlacklist)}
      key={`${shadow.join('-')}${index}`}
      shadow={shadow}
      zIndex={index + 2}
      {...this.props.shadowProps}
    />
  );

  render = () => {
    const {
      children,
      childrenWrapperStyle,
      shadows,
      style,
      ...props
    } = this.props;

    return (
      <ShadowStackContainer {...props} style={style}>
        {shadows.map(this.renderItem)}
        <ChildrenWrapper
          {...props}
          style={[childrenWrapperStyle, { zIndex: shadows.length + 2 }]}
        >
          {children}
        </ChildrenWrapper>
      </ShadowStackContainer>
    );
  };
}
