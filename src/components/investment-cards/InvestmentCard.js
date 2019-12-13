import PropTypes from 'prop-types';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { View } from 'react-native';
import { compose, withHandlers } from 'recompact';
import { withOpenInvestmentCards } from '../../hoc';
import { colors, position } from '../../styles';
import InnerBorder from '../InnerBorder';
import { Column } from '../layout';
import { ButtonPressAnimation, SizeToggler } from '../animations';
import InvestmentCardHeader from './InvestmentCardHeader';
import UniswapInvestmentCard from './UniswapInvestmentCard';
import InvestmentCardWrap from './InvestmentCard';

const InvestmentCardBorderRadius = 18;

const InvestmentCardMargin = {
  horizontal: 19,
  vertical: 15,
};

const enhance = compose(
  withOpenInvestmentCards,
  withHandlers({
    onPress: ({
      openInvestmentCards,
      setOpenInvestmentCards,
      uniqueId,
    }) => () => {
      setOpenInvestmentCards({
        index: uniqueId,
        state: !openInvestmentCards[uniqueId],
      });
    },
  })
);

const InvestmentCard = enhance(
  ({
    children,
    collapsed,
    containerHeight,
    gradientColors,
    headerProps,
    isExpandedState,
    onLayout,
    onPress,
    openInvestmentCards,
    uniqueId,
  }) => (
    <View
      style={
        headerProps.isCollapsible && {
          height:
            UniswapInvestmentCard.height +
            2 * InvestmentCardWrap.margin.vertical +
            20,
        }
      }
    >
      <View
        paddingHorizontal={
          isExpandedState ? 0 : InvestmentCardMargin.horizontal
        }
        paddingVertical={InvestmentCardMargin.vertical}
        style={{
          shadowColor: colors.dark,
          shadowOffset: { height: 2, width: 0 },
          shadowOpacity: 0.08,
          shadowRadius: 3,
        }}
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
                colors={gradientColors}
                end={{ x: 1, y: 0.5 }}
                pointerEvents="none"
                start={{ x: 0, y: 0.5 }}
                style={position.coverAsObject}
              />
              <ButtonPressAnimation
                disabled={!headerProps.isCollapsible}
                onPress={onPress}
                scaleTo={0.98}
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
    </View>
  )
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
