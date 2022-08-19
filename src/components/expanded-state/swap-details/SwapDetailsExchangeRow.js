import lang from 'i18n-js';
import { capitalize } from 'lodash';
import React, { Fragment, useMemo } from 'react';
import { convertAmountToPercentageDisplay } from '../../../helpers/utilities';
import Pill from '../../Pill';
import { ButtonPressAnimation } from '../../animations';
import { SwapDetailsLabel, SwapDetailsValue } from './SwapDetailsRow';
import {
  Bleed,
  Box,
  Column,
  Columns,
  Cover,
  Inline,
  Rows,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import { usePrevious, useStepper } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { getExchangeIconUrl, magicMemo } from '@rainbow-me/utils';

const parseExchangeName = name => {
  const networks = Object.keys(networkInfo).map(network =>
    network.toLowerCase()
  );

  return networks.some(network => name.toLowerCase().includes(network))
    ? name.slice(name.indexOf('_') + 1, name.length)
    : name;
};
const ExchangeIcon = magicMemo(
  function ExchangeIcon({ index = 1, icon, protocol }) {
    const { colors } = useTheme();
    const [error, setError] = useState(false);
    const previousIcon = usePrevious(icon);
    if (error && icon !== previousIcon) {
      setError(false);
    }

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
              alignHorizontal="center"
              alignVertical="center"
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
              <Cover alignHorizontal="center" alignVertical="center">
                <Box
                  style={
                    android && {
                      top: 1,
                    }
                  }
                >
                  <Text
                    align="center"
                    color="secondary80"
                    size="14px"
                    weight="semibold"
                  >
                    {protocol?.substring(0, 1)}
                  </Text>
                </Box>
              </Cover>
            </Box>
          </Stack>
        )}
      </Fragment>
    );
  },
  ['icon', 'protocol']
);

const ExchangeIconStack = magicMemo(
  ({ protocols }) => {
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
                protocol={protocols?.name ?? protocols.names[index]}
              />
            </Box>
          );
        })}
      </Inline>
    );
  },
  ['protocols']
);

export default function SwapDetailsExchangeRow({ protocols }) {
  const steps = useMemo(() => {
    const sortedProtocols = protocols?.sort((a, b) => b.part - a.part);
    const defaultCase = {
      icons: sortedProtocols.map(({ name }) =>
        getExchangeIconUrl(parseExchangeName(name))
      ),
      label: lang.t('expanded_state.swap_details.number_of_exchanges', {
        number: sortedProtocols?.length,
      }),
      names: sortedProtocols.map(({ name }) => name),
    };
    if (sortedProtocols.length === 1) {
      const protocol = sortedProtocols[0];
      const protocolName = parseExchangeName(protocol.name);

      return [
        {
          icons: [getExchangeIconUrl(protocolName)],
          label: capitalize(protocolName.replace('_', ' ')),
          name: protocolName.slice('_'),
          part: convertAmountToPercentageDisplay(protocol.part),
        },
      ];
    }
    const mappedExchanges = sortedProtocols.map(protocol => {
      const protocolName = parseExchangeName(protocol.name);
      const part = convertAmountToPercentageDisplay(protocol.part, 0, 3, true);

      return {
        icons: [getExchangeIconUrl(protocolName)],
        label: capitalize(protocolName.replace('_', ' ')),
        name: protocolName,
        part,
      };
    });
    return [defaultCase, ...mappedExchanges];
  }, [protocols]);

  const [step, nextStep] = useStepper(steps.length);
  const defaultColor = useForegroundColor('secondary');

  if (protocols?.length > 1) {
    return (
      <ButtonPressAnimation onPress={nextStep} scaleTo={1.06}>
        <Rows>
          <Columns alignHorizontal="right" alignVertical="center" space="4px">
            <Column>
              <SwapDetailsLabel>
                {lang.t('expanded_state.swap.swapping_via')}
              </SwapDetailsLabel>
            </Column>
            <Column width="content">
              <Box
                style={{
                  top: android ? -1.5 : 0,
                }}
              >
                <ExchangeIconStack protocols={steps[step]} />
              </Box>
            </Column>
            <Column width="content">
              <SwapDetailsValue>{steps[step].label}</SwapDetailsValue>
            </Column>
            {steps?.[step]?.part && (
              <Column width="content">
                <Bleed right="5px" vertical="6px">
                  <Pill
                    height={20}
                    style={{
                      lineHeight: android && 18,
                      top: android ? -1 : 0,
                    }}
                    textColor={defaultColor}
                  >
                    {steps[step].part}
                  </Pill>
                </Bleed>
              </Column>
            )}
          </Columns>
        </Rows>
      </ButtonPressAnimation>
    );
  } else if (protocols?.length > 0) {
    return (
      <Rows>
        <Columns alignVertical="center" space="4px">
          <Column>
            <SwapDetailsLabel>
              {lang.t('expanded_state.swap.swapping_via')}
            </SwapDetailsLabel>
          </Column>
          <Column width="content">
            <ExchangeIcon
              icon={getExchangeIconUrl(parseExchangeName(protocols[0].name))}
              protocol={parseExchangeName(protocols[0].name)}
            />
          </Column>
          <Column width="content">
            <SwapDetailsValue>{steps[step].label}</SwapDetailsValue>
          </Column>
          <Column width="content">
            <Bleed right="6px" vertical="6px">
              <Pill textColor={defaultColor}>{`${protocols[0].part}%`}</Pill>
            </Bleed>
          </Column>
        </Columns>
      </Rows>
    );
  }
  return null;
}
