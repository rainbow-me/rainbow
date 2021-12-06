import { values } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { FloatingEmojisTapper } from '../floating-emojis';
import { AssetPanel, FloatingPanels } from '../floating-panels';
import { Centered } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/isNativeSt... Remove this comment to see the full error message
import isNativeStackAvailable from '@rainbow-me/helpers/isNativeStackAvailable';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { wyreSupportedCountries } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { neverRerender } from '@rainbow-me/utils';

const Panel = styled(FloatingPanels)`
  margin-bottom: ${({ deviceDimensions: { isTallPhone } }) =>
    (isTallPhone ? 90 : 45) + (isNativeStackAvailable ? 10 : 0)};
  max-width: ${({ deviceDimensions: { width } }) => Math.min(270, width - 100)};
`;

const FooterText = styled(Text).attrs({
  align: 'center',
  size: 'smedium',
})`
  margin-top: 12;
`;

const TitleText = styled(Text).attrs({
  align: 'center',
  size: 'large',
  weight: 'bold',
})`
  margin-bottom: 10;
`;

const countries = values(wyreSupportedCountries).map(c =>
  c.name === 'United States'
    ? 'United\xa0States (except Texas and New York)'
    : c.name.replace(/ /g, '\xa0')
);
const countriesList = `${countries.join(', ')}`;
const emojiArray = values(wyreSupportedCountries).map(c => c.emojiName);

const SupportCountriesExpandedState = () => {
  const deviceDimensions = useDimensions();

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Panel deviceDimensions={deviceDimensions}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AssetPanel>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Centered css={padding(19, 30, 24)} direction="column">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <TitleText>Supported Countries</TitleText>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.6)}
              lineHeight={22}
              size="smedium"
            >
              {countriesList}
            </Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <FooterText>🔜 🌍🌎🌏</FooterText>
          </Centered>
        </AssetPanel>
      </FloatingEmojisTapper>
    </Panel>
  );
};

export default neverRerender(SupportCountriesExpandedState);
