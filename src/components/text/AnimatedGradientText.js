import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { fonts, colors } from '../../styles';
import ColorChangeAnimation from '../animations/ColorChangeAnimation';
import Text from './Text';

const AnimatedChangeText = ({ value }) => {
  const [curValue, setCurValue] = useState(value);
  const [curValueStable, setCurValueStable] = useState(value);
  const [curValueChange, setCurValueChange] = useState('');

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

    const stable = nextValue.slice(0, changeIndex);
    const change = nextValue.slice(changeIndex);
    setCurValue(value);
    setCurValueStable(stable);
    setCurValueChange(change);
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
          // because of the rendering issue two separate components
          marginRight: -0.5,
        }}
      >
        {curValueStable}
      </Text>
      <ColorChangeAnimation valueString={curValueChange} />
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
