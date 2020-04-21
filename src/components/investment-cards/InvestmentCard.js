import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useOpenInvestmentCards } from '../../hooks';
import { colors, position, shadow } from '../../styles';
import { ButtonPressAnimation, SizeToggler } from '../animations';
import { Column, InnerBorder } from '../layout';
import InvestmentCardHeader from './InvestmentCardHeader';

const InvestmentCardBorderRadius = 24.5;

const InvestmentCardMargin = {
  horizontal: 19,
  vertical: 15,
};

const gradientStops = {
  end: { x: 1, y: 0.5 },
  start: { x: 0, y: 0.5 },
};

const sx = StyleSheet.create({
  container: {
    ...shadow.buildAsObject(0, 2, 3, colors.dark, 0.08),
    flex: 0,
  },
});

// eslint-disable-next-line react/display-name
const InvestmentCard = React.forwardRef(
  (
    {
      children,
      collapsed,
      containerHeight,
      gradientColors,
      headerProps,
      isExpandedState,
      onLayout,
      uniqueId,
    },
    ref
  ) => {
    const {
      openInvestmentCards,
      setOpenInvestmentCards,
    } = useOpenInvestmentCards();

    const handlePress = useCallback(
      () =>
        setOpenInvestmentCards({
          index: uniqueId,
          state: !openInvestmentCards[uniqueId],
        }),
      [openInvestmentCards, setOpenInvestmentCards, uniqueId]
    );

    return (
      <View
        height={containerHeight + 2 * InvestmentCardMargin.vertical + 20}
        paddingHorizontal={
          isExpandedState ? 0 : InvestmentCardMargin.horizontal
        }
        paddingVertical={InvestmentCardMargin.vertical}
        ref={ref}
        style={sx.container}
      >
        <SizeToggler
          endingWidth={InvestmentCardHeader.height}
          startingWidth={containerHeight}
          toggle={openInvestmentCards[uniqueId]}
        >
          <View borderRadius={InvestmentCardBorderRadius} overflow="hidden">
            <Column
              {...position.sizeAsObject('100%')}
              backgroundColor={gradientColors[0]}
              borderRadius={InvestmentCardBorderRadius}
              justify="start"
              onLayout={onLayout}
            >
              <LinearGradient
                {...gradientStops}
                colors={gradientColors}
                pointerEvents="none"
                style={position.coverAsObject}
              />
              <ButtonPressAnimation
                disabled={!headerProps.isCollapsible}
                onPress={handlePress}
                scaleTo={1.03}
              >
                <InvestmentCardHeader {...headerProps} collapsed={collapsed} />
              </ButtonPressAnimation>
              {children}
              <InnerBorder
                opacity={0.04}
                radius={InvestmentCardBorderRadius}
                width={0.5}
              />
            </Column>
          </View>
        </SizeToggler>
      </View>
    );
  }
);

InvestmentCard.propTypes = {
  children: PropTypes.node,
  collapsed: PropTypes.bool,
  containerHeight: PropTypes.number,
  gradientColors: PropTypes.arrayOf(PropTypes.string).isRequired,
  headerProps: PropTypes.shape(InvestmentCardHeader.propTypes),
  isExpandedState: PropTypes.bool,
  onLayout: PropTypes.func,
  onPress: PropTypes.func,
  openInvestmentCards: PropTypes.bool,
  uniqueId: PropTypes.string,
};

InvestmentCard.defaultProps = {
  containerHeight: InvestmentCardHeader.height,
  gradientColors: ['#F7FAFC', '#E0E6EC'],
};

InvestmentCard.margin = InvestmentCardMargin;

export default InvestmentCard;
