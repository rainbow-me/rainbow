import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { withProps } from 'recompact';
import { Transition, Transitioning } from 'react-native-reanimated';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { colors, padding } from '../../styles';
import { Column, ColumnWithMargins } from '../layout';
import { SheetHandle } from '../sheet';
import { Rounded } from '../text';

const SubTitle = withProps({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  letterSpacing: 'uppercase',
  size: 'smedium',
  uppercase: true,
  weight: 'semibold',
})(Rounded);

const Title = withProps({
  align: 'center',
  letterSpacing: 'looseyGoosey',
  lineHeight: 'loose',
  size: 'large',
  weight: 'bold',
})(Rounded);

const duration = 200;
const transition = (
  <Transition.Sequence>
    <Transition.Out durationMs={duration} interpolation="easeOut" type="slide-bottom" />
    <Transition.Change durationMs={0} interpolation="easeInOut" />
    <Transition.In durationMs={duration} interpolation="easeOut" type="slide-bottom" />
  </Transition.Sequence>
);

const AddCashHeader = ({ limitDaily, limitYearly }) => {
  const ref = useRef();
  const [showDailyLimit, toggleShowDailyLimit] = useState(true);

  const toggle = () => {
    toggleShowDailyLimit(show => !show);
    if (ref.current) {
      ref.current.animateNextTransition();
    }
  }

  useEffect(() => {
    const interval = setInterval(toggle, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Column align="center" paddingVertical={isNativeStackAvailable ? 6 : 8}>
      <SheetHandle />
      <ColumnWithMargins margin={4} paddingTop={7}>
        <Title>Add Cash</Title>
        <Transitioning.View ref={ref} transition={transition}>
          {showDailyLimit ? (
            <SubTitle>{`Up to $${limitDaily} daily`}</SubTitle>
          ) : (
            <SubTitle>{`Up to $${limitYearly} yearly`}</SubTitle>
          )}
        </Transitioning.View>
      </ColumnWithMargins>
    </Column>
  );
}

AddCashHeader.propTypes = {
  limitDaily: PropTypes.number,
  limitYearly: PropTypes.number,
};

export default AddCashHeader;
