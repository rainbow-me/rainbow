import React from 'react';
import { Text } from 'react-primitives';

const unicodeValue = '\u2014';

const EmDash = props => <Text {...props}>{unicodeValue}</Text>;
EmDash.unicode = unicodeValue;
export default EmDash;
