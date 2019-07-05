import withViewLayoutProps from '@hocs/with-view-layout-props';
import PropTypes from 'prop-types';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { compose, pure } from 'recompact';
import { colors, margin, position } from '../../styles';
import { deviceUtils } from '../../utils';
import InnerBorder from '../InnerBorder';
import { Column } from '../layout';
import { ShadowStack } from '../shadow-stack';
import InvestmentCardHeader from './InvestmentCardHeader';

const InvestmentCardMargin = {
  horizontal: 19,
  vertical: 15,
};

const DefaultContainerHeight = InvestmentCardHeader.height;

const enhance = compose(
  withViewLayoutProps(({ height }) => ({ containerHeight: height || DefaultContainerHeight })),
  pure,
);

const InvestmentCard = enhance(({
  children,
  collapsed,
  containerHeight,
  gradientColors,
  headerProps,
  onLayout,
  shadows,
  ...props
}) => (
  <ShadowStack
    backgroundColor={gradientColors[0]}
    borderRadius={18}
    css={margin(InvestmentCardMargin.vertical, InvestmentCardMargin.horizontal)}
    height={containerHeight}
    shadows={shadows}
    width={deviceUtils.dimensions.width - (InvestmentCardMargin.horizontal * 2)}
    {...props}
  >
    <Column
      css={`
        background-color: ${gradientColors[0]};
        border-radius: 18;
        overflow: hidden;
        width: 100%;
      `}
      onLayout={onLayout}
    >
      <LinearGradient
        colors={gradientColors}
        end={{ x: 1, y: 0.5 }}
        pointerEvents="none"
        start={{ x: 0, y: 0.5 }}
        style={position.coverAsObject}
      />
      <InvestmentCardHeader
        {...headerProps}
        collapsed={collapsed}
      />
      {collapsed ? null : children}
      <InnerBorder radius={18} />
    </Column>
  </ShadowStack>
));

InvestmentCard.propTypes = {
  children: PropTypes.node,
  collapsed: PropTypes.bool,
  containerHeight: PropTypes.number,
  gradientColors: PropTypes.arrayOf(PropTypes.string).isRequired,
  headerProps: PropTypes.shape(InvestmentCardHeader.propTypes),
  onLayout: PropTypes.func.isRequired,
  shadows: PropTypes.arrayOf(PropTypes.array),
};

InvestmentCard.defaultProps = {
  containerHeight: DefaultContainerHeight,
  gradientColors: ['#F7FAFC', '#E0E6EC'],
  shadows: [
    [0, 3, 5, colors.dark, 0.04],
    [0, 6, 10, colors.dark, 0.04],
  ],
};

InvestmentCard.margin = InvestmentCardMargin;

export default InvestmentCard;
