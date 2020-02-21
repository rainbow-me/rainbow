import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { fonts, colors } from '../../styles';
import ColorChangeAnimation from '../animations/ColorChangeAnimation';

const AnimatedChangeText = ({ value }) => {
  const [index, setIndex] = useState(0);
  const [curValue, setCurValue] = useState(value);

  useEffect(() => {
    let changeIndex = null;
    const nextValue = String(value);
    const nextValueStringTable = String(curValue).split('');
    const curValueStringTable = String(nextValue).split('');
    for (let i = 0; i < curValueStringTable.length; i++) {
      if (curValueStringTable[i] != nextValueStringTable[i]) {
        changeIndex = i;
        break;
      }
    }

    setIndex(changeIndex);
    setCurValue(value);
  }, [value]);

  return (
    <View
      style={{
        flexDirection: 'row',
      }}
    >
      <Text
        style={{
          color: colors.blueGreyDark,
          fontSize: 16,
          fontWeight: fonts.weight.semibold,
          margin: 0,
        }}
      >
        $
      </Text>
      <ColorChangeAnimation
        basicColor={colors.blueGreyDark}
        changeColor={colors.chartGreen}
        animationDurations={{
          end: 1200,
          start: 120,
          timeout: 180,
        }}
        valueString={curValue}
        changeIndex={index}
        amountOfDigits={
          value.toString().length - Math.floor(value).toString().length - 1
        }
        animateNumberInterval={20}
      />
    </View>
  );
};

AnimatedChangeText.propTypes = {
  value: PropTypes.number,
};

AnimatedChangeText.defaultProps = {
  changeColor: '#FEBE44',
  color: '#2CCC00',
};

export default AnimatedChangeText;
