import lang from 'i18n-js';
import { capitalize } from 'lodash';
import React, { Fragment, useMemo } from 'react';
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
  Stack,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import { useStepper } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { getExchangeIconUrl } from '@rainbow-me/utils';

const ExchangeIcon = ({ index = 1, icon, protocol }) => {
  const { colors } = useTheme();
  const [error, setError] = useState(false);

  return (
    <Fragment>
      {icon && !error ? (
        <ImgixImage
          onError={() => setError(true)}
          size={20}
          source={{ uri: icon }}
          style={{
            borderColor: colors.white,
            borderRadius: 10,
            borderWidth: 1.5,
            height: 20,
            width: 20,
            zIndex: index,
          }}
        />
      ) : (
        <Stack>
          <Box
            height={{ custom: 20 }}
            style={{
              backgroundColor: colors.exchangeFallback,
              borderColor: colors.white,
              borderRadius: 10,
              borderWidth: 1.5,
              zIndex: index,
            }}
            width={{ custom: 20 }}
          >
            <Text
              align="center"
              color="secondary80"
              size="12px"
              weight="semibold"
            >
              {protocol?.substring(0, 1)}
            </Text>
          </Box>
        </Stack>
      )}
    </Fragment>
  );
};

const ExchangeIconStack = ({ protocols }) => {
  return (
    <Inline>
      {protocols?.icons?.map((icon, index) => {
        return (
          <Box
            key={`protocol-icon-${index}`}
            marginLeft={{ custom: -4 }}
            zIndex={protocols?.icons?.length - index}
          >
            <ExchangeIcon
              icon={icon}
              protocol={protocols?.name || protocols.names[index]}
            />
          </Box>
        );
      })}
    </Inline>
  );
};

export default function SwapDetailsExchangeRow(props) {
  const { protocols } = props;

  const steps = useMemo(() => {
    const sortedProtocols = protocols?.sort((a, b) => b.part - a.part);
    const defaultCase = {
      icons: sortedProtocols.map(({ name }) => getExchangeIconUrl(name)),
      label: lang.t('expanded_state.swap_details.number_of_exchanges', {
        number: sortedProtocols?.length,
      }),
      names: sortedProtocols.map(({ name }) => name),
    };
    if (sortedProtocols.length === 1) {
      const protocol = sortedProtocols[0];
      return [
        {
          icons: [getExchangeIconUrl(protocol.name)],
          label: capitalize(protocol.name.replace('_', ' ')),
          name: protocol.name,
          part: convertAmountToPercentageDisplay(protocol.part),
        },
      ];
    }
    const mappedExchanges = sortedProtocols.map(protocol => {
      return {
        icons: [getExchangeIconUrl(protocol.name)],
        label: capitalize(protocol.name.replace('_', ' ')),
        name: protocol.name,
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
              <ExchangeIconStack protocols={steps[step]} />
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
            <ExchangeIcon
              icon={getExchangeIconUrl(protocols[0].name)}
              protocol={protocols[0].name}
            />
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
