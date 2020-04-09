import React from 'react';
import { values } from 'lodash';
import { StyleSheet, Text } from 'react-native';
import FloatingPanels from './FloatingPanels';
import { AssetPanel } from './asset-panel';
import { supportedCountries } from '../../references/wyre/supportedCountries';
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

const countries = values(supportedCountries).map(c => c.name);
const countriesList = `${countries.join(', ')}.`;

const SupportCountriesExpandedState = () => {
  return (
    <FloatingPanels maxWidth={deviceUtils.dimensions.width - 110}>
      <AssetPanel>
        <Centered css={padding(24, 25)} direction="column">
          <Text style={sx.title}>List of supported countries</Text>
          <Text style={sx.text}>{countriesList}</Text>
        </Centered>
      </AssetPanel>
    </FloatingPanels>
  );
};

export default SupportCountriesExpandedState;
