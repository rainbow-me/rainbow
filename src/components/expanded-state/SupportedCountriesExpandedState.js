import lang from 'i18n-js';
import { values } from 'lodash';
import React from 'react';
import { FloatingEmojisTapper } from '../floating-emojis';
import { AssetPanel, FloatingPanels } from '../floating-panels';
import { Centered } from '../layout';
import { Text } from '../text';
import isNativeStackAvailable from '@/helpers/isNativeStackAvailable';
import { useDimensions } from '@/hooks';
import { wyreSupportedCountries } from '@/references';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { neverRerender } from '@/utils';

const Panel = styled(FloatingPanels)(
  ({ deviceDimensions: { isTallPhone, width } }) => ({
    marginBottom: (isTallPhone ? 90 : 45) + (isNativeStackAvailable ? 10 : 0),
    maxWidth: Math.min(270, width - 100),
  })
);

const FooterText = styled(Text).attrs({
  align: 'center',
  size: 'smedium',
})({
  marginTop: 12,
});

const TitleText = styled(Text).attrs({
  align: 'center',
  size: 'large',
  weight: 'bold',
})({
  marginBottom: 10,
});

const countries = values(wyreSupportedCountries).map(c =>
  c.name === 'United States'
    ? lang.t('expanded_state.supported_countries.us_except')
    : c.name.replace(/ /g, '\xa0')
);
const countriesList = `${countries.join(', ')}`;
const emojiArray = values(wyreSupportedCountries).map(c => c.emojiName);

const centeredStyles = padding.object(19, 30, 24);

const SupportCountriesExpandedState = () => {
  const deviceDimensions = useDimensions();

  const { colors } = useTheme();

  return (
    <Panel deviceDimensions={deviceDimensions}>
      <FloatingEmojisTapper
        disableRainbow
        distance={600}
        duration={600}
        emojis={emojiArray}
        opacityThreshold={0.75}
        scaleTo={0.5}
        size={40}
        wiggleFactor={0}
      >
        <AssetPanel>
          <Centered direction="column" style={centeredStyles}>
            <TitleText>
              {lang.t('expanded_state.supported_countries.supported_countries')}
            </TitleText>
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.6)}
              lineHeight={22}
              size="smedium"
            >
              {countriesList}
            </Text>
            <FooterText>🔜 🌍🌎🌏</FooterText>
          </Centered>
        </AssetPanel>
      </FloatingEmojisTapper>
    </Panel>
  );
};

export default neverRerender(SupportCountriesExpandedState);
