import React from 'react';
import { StyleSheet, Text } from 'react-native';
import FloatingPanels from './FloatingPanels';
import { AssetPanel } from './asset-panel';
import { Centered } from '../layout';
import { padding } from '../../styles';
import { deviceUtils } from '../../utils';

const sx = StyleSheet.create({
  text: {
    fontSize: 13,
    fontWeight: 'normal',
    lineHeight: 20,
    textAlign: 'center',
  },

  title: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

const SupportCountriesExpandedState = () => {
  return (
    <FloatingPanels maxWidth={deviceUtils.dimensions.width - 110}>
      <AssetPanel>
        <Centered css={padding(24, 25)} direction="column">
          <Text style={sx.title}>List of supported countries</Text>
          <Text style={sx.text}>
            Australia, Austria, Belgium, Canada, Czech Republic, Denmark,
            Estonia, Finland, France, Germany, Greece, Hong Kong, Ireland,
            Italy, Latvia, Lithuania, Luxembourg, Mexico, The Netherlands, New
            Zealand, Norway, Poland, Portugal, Slovakia, Slovenia, Spain,
            Sweden, Switzerland, United States.
          </Text>
        </Centered>
      </AssetPanel>
    </FloatingPanels>
  );
};

export default SupportCountriesExpandedState;
