import { values } from 'lodash';
import React from 'react';
import { StyleSheet } from 'react-native';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { useDimensions } from '../../hooks';
import { supportedCountries } from '../../references/wyre/supportedCountries';
import { colors, fonts, padding } from '../../styles';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { FloatingEmojis, FloatingEmojisTapHandler } from '../floating-emojis';
import { Centered } from '../layout';
import { Text } from '../text';
import FloatingPanels from './FloatingPanels';
import { AssetPanel } from './asset-panel';

const modalWidth = Math.min(270, deviceUtils.dimensions.width - 100);
const sx = StyleSheet.create({
  body: {
    color: colors.alpha(colors.blueGreyDark, 0.6),
    fontSize: parseFloat(fonts.size.smedium),
    lineHeight: 22,
    textAlign: 'center',
  },

  footer: {
    fontSize: parseFloat(fonts.size.smedium),
    marginTop: 12,
    textAlign: 'center',
  },

  title: {
    fontSize: parseFloat(fonts.size.large),
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});

const countries = values(supportedCountries).map(c =>
  c.name == 'United States'
    ? 'United\xa0States (except CT, HI, NC, NH, NY, VA, VT)'
    : c.name.replace(/ /g, '\xa0')
);
const countriesList = `${countries.join(', ')}`;
const emojiArray = values(supportedCountries).map(c => c.emojiName);

const SupportCountriesExpandedState = () => {
  const { isTallPhone } = useDimensions();
  const modalMargin =
    (isTallPhone ? 90 : 45) + (isNativeStackAvailable ? 10 : 0);

  return (
    <FloatingPanels marginBottom={modalMargin} maxWidth={modalWidth}>
      <FloatingEmojis
        disableRainbow
        distance={600}
        duration={600}
        emojis={emojiArray}
        opacityThreshold={0.75}
        scaleTo={0.5}
        size={40}
        wiggleFactor={0}
      >
        {({ onNewEmoji }) => (
          <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
            <ButtonPressAnimation scaleTo={1.01}>
              <AssetPanel>
                <Centered css={padding(19, 30, 24)} direction="column">
                  <Text style={sx.title}>Supported Countries</Text>
                  <Text style={sx.body}>{countriesList}</Text>
                  <Text style={sx.footer}>🔜 🌍🌎🌏</Text>
                </Centered>
              </AssetPanel>
            </ButtonPressAnimation>
          </FloatingEmojisTapHandler>
        )}
      </FloatingEmojis>
    </FloatingPanels>
  );
};

export default SupportCountriesExpandedState;
