import withViewLayoutProps from '@hocs/with-view-layout-props';
import PropTypes from 'prop-types';
import React, { useState, useRef } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { compose, pure } from 'recompact';
import { colors, margin, position, shadow as shadowUtil } from '../../styles';
import { deviceUtils } from '../../utils';
import InnerBorder from '../InnerBorder';
import { Column } from '../layout';
import { ShadowStack } from '../shadow-stack';
import InvestmentCardHeader from './InvestmentCardHeader';
import { Transitioning, Transition } from 'react-native-reanimated';
import { ButtonPressAnimation } from '../animations';
import { withOpenInvestmentCards } from '../../hoc';
import { View } from 'react-native';

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
  openHeight,
  ...props
}) => {
  const transition = <Transition.Change interpolation="easeInOut" durationMs={200} />;

  let [perc, setPerc] = useState(openHeight);
  const ref = useRef();

  const onPress = () => {
    setOpenInvestmentCards({ index: 0, state: !openInvestmentCards[0] });
    ref.current.animateNextTransition();
    setPerc(perc == openHeight ? InvestmentCardHeader.height : openHeight);
  }

  return (
    <Transitioning.View
      ref={ref}
      transition={transition}
    >
      <View
        style={{ 
          paddingLeft: InvestmentCardMargin.horizontal,
          paddingRight: InvestmentCardMargin.horizontal,
          paddingTop: InvestmentCardMargin.vertical,
          paddingBottom: InvestmentCardMargin.vertical,
          shadowColor: colors.dark,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3, 
          height: perc + InvestmentCardMargin.vertical * 2 , 
          overflow: 'hidden', 
          borderRadius: 18
        }}
      >
          <Column
            css={`
            background-color: ${gradientColors[0]};
            border-radius: 18;
            overflow: hidden;
            width: 100%;
            justify-content: flex-start;
            height: 100%;
          `}
          style={{ 
            shadowColor: 'black',
          shadowRadius: 10,
          shadowOpacity: 1,
        }}
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
      </View>
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
    [0, 1, 3, colors.dark, 0.08],
    [0, 4, 6, colors.dark, 0.04],
  ],
};

InvestmentCard.margin = InvestmentCardMargin;

export default withOpenInvestmentCards(InvestmentCard);
