import withViewLayoutProps from '@hocs/with-view-layout-props';
import PropTypes from 'prop-types';
import React, { useState, useRef } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { compose, pure } from 'recompact';
import { colors, margin, position } from '../../styles';
import { deviceUtils } from '../../utils';
import InnerBorder from '../InnerBorder';
import { Column } from '../layout';
import { ShadowStack } from '../shadow-stack';
import InvestmentCardHeader from './InvestmentCardHeader';
import { Transitioning, Transition } from 'react-native-reanimated';
import { ButtonPressAnimation } from '../animations';
import { withOpenInvestmentCards } from '../../hoc';

const InvestmentCardMargin = {
  horizontal: 19,
  vertical: 15,
};

const DefaultContainerHeight = InvestmentCardHeader.height;

const enhance = compose(
  withViewLayoutProps(({ height }) => ({ containerHeight: height || DefaultContainerHeight })),
  pure,
);

const InvestmentCard = ({
  children,
  collapsed,
  containerHeight,
  gradientColors,
  headerProps,
  onLayout,
  shadows,
  setOpenInvestmentCards,
  openInvestmentCards,
  ...props
}) => {
  const transition = <Transition.Change interpolation="easeInOut" durationMs={200} />;

  let [perc, setPerc] = useState(114);
  const ref = useRef();

  const onPress = () => {
    setOpenInvestmentCards({ index: 0, state: !openInvestmentCards[0] });
    ref.current.animateNextTransition();
    setPerc(perc == 114 ? 50 : 114);
  }

  return (
    <Transitioning.View
      ref={ref}
      transition={transition}
    >
      <ShadowStack
        backgroundColor={gradientColors[0]}
        borderRadius={18}
        css={margin(InvestmentCardMargin.vertical, InvestmentCardMargin.horizontal)}
        childrenWrapperStyle={{justifyContent: `flex-start`}}
        height={perc}
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
          justify-content: flex-start;
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
          <ButtonPressAnimation scaleTo={0.96} onPress={onPress}>
            <InvestmentCardHeader
              {...headerProps}
              collapsed={collapsed}
            />
          </ButtonPressAnimation>
          {children}
          <InnerBorder radius={18} />
        </Column>
      </ShadowStack>
    </Transitioning.View>
  )};

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
    [0, 1, 3, colors.dark, 0.00],
    [0, 4, 6, colors.dark, 0.00],
  ],
};

InvestmentCard.margin = InvestmentCardMargin;

export default withOpenInvestmentCards(InvestmentCard);
