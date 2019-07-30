import PropTypes from 'prop-types';
import React, { useState, useRef } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { View } from 'react-native';
import { Transitioning, Transition } from 'react-native-reanimated';
import { colors, position } from '../../styles';
import InnerBorder from '../InnerBorder';
import { Column } from '../layout';
import InvestmentCardHeader from './InvestmentCardHeader';
import { ButtonPressAnimation } from '../animations';
import { withOpenInvestmentCards } from '../../hoc';

const InvestmentCardMargin = {
  horizontal: 19,
  vertical: 15,
};

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
  uniqueId,
  isCollapsible,
  ...props
}) => {
  const transition = <Transition.Change interpolation="easeInOut" durationMs={200} />;

  const [perc, setPerc] = useState(collapsed ? InvestmentCardHeader.height : containerHeight);
  const ref = useRef();

  const onPress = () => {
    setOpenInvestmentCards({ index: uniqueId, state: !openInvestmentCards[uniqueId] });
    ref.current.animateNextTransition();
    setPerc(!openInvestmentCards[uniqueId] ? InvestmentCardHeader.height : containerHeight);
  };

  return (
    <Transitioning.View
      ref={ref}
      transition={transition}
    >
      <View
        style={{
          borderRadius: 18,
          height: perc + InvestmentCardMargin.vertical * 2,
          overflow: 'hidden',
          paddingBottom: InvestmentCardMargin.vertical,
          paddingLeft: InvestmentCardMargin.horizontal,
          paddingRight: InvestmentCardMargin.horizontal,
          paddingTop: InvestmentCardMargin.vertical,
          shadowColor: colors.dark,
          shadowOffset: { height: 1, width: 0 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
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
            shadowOpacity: 1,
            shadowRadius: 10,
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
          <ButtonPressAnimation scaleTo={0.96} onPress={onPress} disabled={!headerProps.isCollapsible}>
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
  );
};

InvestmentCard.propTypes = {
  children: PropTypes.node,
  collapsed: PropTypes.bool,
  containerHeight: PropTypes.number,
  gradientColors: PropTypes.arrayOf(PropTypes.string).isRequired,
  headerProps: PropTypes.shape(InvestmentCardHeader.propTypes),
  isCollapsible: PropTypes.bool,
  onLayout: PropTypes.func.isRequired,
  openInvestmentCards: PropTypes.bool,
  setOpenInvestmentCards: PropTypes.func,
  shadows: PropTypes.arrayOf(PropTypes.array),
  uniqueId: PropTypes.string,
};

InvestmentCard.defaultProps = {
  containerHeight: InvestmentCardHeader.height,
  gradientColors: ['#F7FAFC', '#E0E6EC'],
  shadows: [
    [0, 1, 3, colors.dark, 0.08],
    [0, 4, 6, colors.dark, 0.04],
  ],
};

InvestmentCard.margin = InvestmentCardMargin;

export default withOpenInvestmentCards(InvestmentCard);
