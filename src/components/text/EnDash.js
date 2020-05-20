import React from 'react';
import { Text } from 'react-primitives';

const unicodeValue = '\u2013';

const EnDash = props => <Text {...props}>{unicodeValue}</Text>;
EnDash.unicode = unicodeValue;
export default EnDash;
