import lang from 'i18n-js';
import { capitalize } from 'lodash';
import React, { useMemo } from 'react';
import { convertAmountToPercentageDisplay } from '../../../helpers/utilities';
import Pill from '../../Pill';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import {
  Bleed,
  Box,
  Column,
  Columns,
  Inline,
  useForegroundColor,
} from '@rainbow-me/design-system';
import { useStepper } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';

const UniswapUri = 'https://cloud.skylarbarrera.com/Oval.png';

const ExchangeIcon = ({ index, protocol }) => {
  const { colors } = useTheme();
  return (
    <ImgixImage
      size={22}
      source={{ uri: UniswapUri }}
      style={{
        borderColor: colors.white,
        borderRadius: 10,
        borderWidth: 1.5,
        height: 19,
        width: 19,
        zIndex: index,
      }}
    />
  );
};

const ExchangeIconStack = ({ protocols }) => {
  return (
    <Inline>
      {protocols?.map((protocol, index) => (
        <Box
          key={protocol}
          marginLeft={{ custom: -4 }}
          zIndex={protocols.length - index}
        >
          <ExchangeIcon index={protocols.length - index} protocol={protocol} />
        </Box>
      ))}
    </Inline>
  );
};

export default function SwapDetailsExchangeRow(props) {
  const { protocols } = props;

  const steps = useMemo(() => {
    const sortedProtocols = protocols?.sort((a, b) => b.part - a.part);
    const defaultCase = {
      icons: sortedProtocols.map(({ name }) => name),
      label: lang.t('expanded_state.swap_details.number_of_exchanges', {
        number: sortedProtocols?.length,
      }),
    };
    if (sortedProtocols.length === 1) {
      const protocol = sortedProtocols[0];
      return [
        {
          icons: [protocol.name],
          label: capitalize(protocol.name.replace('_', ' ')),
          part: convertAmountToPercentageDisplay(protocol.part),
        },
      ];
    }
    const mappedExchanges = sortedProtocols.map(protocol => {
      return {
        icons: [protocol.name],
        label: capitalize(protocol.name.replace('_', ' ')),
        part: convertAmountToPercentageDisplay(protocol.part),
      };
    });
    return [defaultCase, ...mappedExchanges];
  }, [protocols]);

  const [step, nextStep] = useStepper(steps.length);
  const defaultColor = useForegroundColor('secondary');

  if (protocols?.length > 1) {
    return (
      <ButtonPressAnimation onPress={nextStep} scaleTo={1.06}>
        <SwapDetailsRow
          label={lang.t('expanded_state.swap.swapping_via')}
          truncated={false}
        >
          <Columns alignHorizontal="right" alignVertical="center" space="4px">
            <Column width="content">
              <ExchangeIconStack protocols={steps[step].icons} />
            </Column>
            <Column width="content">
              <SwapDetailsValue>{steps[step].label}</SwapDetailsValue>
            </Column>
            {steps[step].part && (
              <Column width="content">
                <Bleed style={{ marginLeft: 10 }}>
                  <Pill textColor={defaultColor}>{steps[step].part}</Pill>
                </Bleed>
              </Column>
            )}
          </Columns>
        </SwapDetailsRow>
      </ButtonPressAnimation>
    );
  } else if (protocols?.length > 0) {
    return (
      <SwapDetailsRow label={lang.t('expanded_state.swap.swapping_via')}>
        <Columns alignVertical="center" space="4px">
          <Column width="content">
            <ExchangeIcon />
          </Column>
          <Column width="content">
            <SwapDetailsValue>{steps[step].label}</SwapDetailsValue>
          </Column>

          <Column width="content">
            <Pill textColor={defaultColor}>{`${protocols[0].part}%`}</Pill>
          </Column>
        </Columns>
      </SwapDetailsRow>
    );
  }
  return null;
}
