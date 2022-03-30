import lang from 'i18n-js';
import { capitalize } from 'lodash';
import React, { useMemo } from 'react';
import Pill from '../../Pill';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { Bleed, Box, useForegroundColor } from '@rainbow-me/design-system';
import { useStepper } from '@rainbow-me/hooks';

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
    const mappedExchanges = sortedProtocols.map(protocol => {
      return {
        icons: [protocol.name],
        label: capitalize(protocol.name.replace('_', ' ')),
        part: protocol.part,
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
          <SwapDetailsValue>{steps[step].label}</SwapDetailsValue>
          {steps[step].part && (
            <Bleed top="5px">
              <Pill textColor={defaultColor}>{`${steps[step].part}%`}</Pill>
            </Bleed>
          )}
        </SwapDetailsRow>
      </ButtonPressAnimation>
    );
  } else if (protocols?.length > 0) {
    return (
      <SwapDetailsRow label={lang.t('expanded_state.swap.swapping_via')}>
        <SwapDetailsValue>
          {capitalize(protocols[0].name.replace('_', ' '))}
        </SwapDetailsValue>
        <Bleed top="5px">
          <Box>
            <Pill textColor={defaultColor}>{`${protocols[0].part}%`}</Pill>
          </Box>
        </Bleed>
      </SwapDetailsRow>
    );
  }
  return null;
}
