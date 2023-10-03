import lang from 'i18n-js';
import { capitalize } from 'lodash';
import React, { Fragment, useMemo } from 'react';
import { CROSSCHAIN_SWAPS, useExperimentalFlag } from '@/config';
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
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { usePrevious, useStepper } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { getExchangeIconUrl, magicMemo } from '@/utils';
import { SocketBridges } from '@/references/swap/bridges';
import { RainbowNetworks } from '@/networks';

const parseExchangeName = name => {
  const networks = RainbowNetworks.map(network => network.name.toLowerCase());

  const removeNetworks = name =>
    networks.some(network => name.toLowerCase().includes(network))
      ? name.slice(name.indexOf('_') + 1, name.length)
      : name;

  const removeBridge = name => name.replace('-bridge', '');

  return removeNetworks(removeBridge(name));
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
                    color="secondary80 (Deprecated)"
                    size="14px / 19px (Deprecated)"
                    weight="semibold"
                  >
                    {typeof protocol === 'string'
                      ? protocol?.substring(0, 1)?.toUpperCase()
                      : 'U'}
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
                protocol={
                  protocols?.name || protocols.names[index] || 'Unknown'
                }
              />
            </Box>
          );
        })}
      </Inline>
    );
  },
  ['protocols']
);

const CrossChainIconStack = magicMemo(
  ({ protocols }) => {
    return (
      <Inline>
        {protocols?.icons?.map((icon, index) => {
          return (
            <Inline key={`protocol-icon-${index}`} marginLeft={{ custom: 0 }}>
              <ExchangeIcon
                icon={icon}
                protocol={
                  protocols?.name || protocols.names[index] || 'Unknown'
                }
              />

              {index < protocols?.icons.length - 1 && (
                <Box paddingTop="6px">
                  <Text
                    color="secondary50 (Deprecated)"
                    size="11pt"
                    weight="semibold"
                  >
                    􀆊
                  </Text>
                </Box>
              )}
            </Inline>
          );
        })}
      </Inline>
    );
  },
  ['protocols']
);

export default function SwapDetailsExchangeRow({ routes, protocols, testID }) {
  const bridges = routes?.[0]?.usedBridgeNames;

  const steps = useMemo(() => {
    const sortedProtocols = protocols?.sort((a, b) => b.part - a.part);
    const defaultCase = {
      icons: sortedProtocols.map(({ name }) =>
        getExchangeIconUrl(parseExchangeName(name))
      ),
      label: lang.t(
        bridges
          ? 'expanded_state.swap_details.number_of_steps'
          : 'expanded_state.swap_details.number_of_exchanges',
        {
          number: sortedProtocols?.length,
        }
      ),
      names: sortedProtocols.map(({ name }) => name),
    };
    if (sortedProtocols.length === 1) {
      const protocol = sortedProtocols[0];
      const protocolName = parseExchangeName(protocol.name);
      const isBridge = bridges?.includes(protocol.name);

      return [
        {
          icons: [getExchangeIconUrl(protocolName)],
          label: capitalize(protocolName.replace('_', ' ')),
          name: SocketBridges[protocol.name] ?? protocolName.slice('_'),
          action: isBridge
            ? lang.t('expanded_state.swap.bridge')
            : lang.t('expanded_state.swap.swap'),
          part: convertAmountToPercentageDisplay(protocol.part),
        },
      ];
    }
    const mappedExchanges = sortedProtocols.map(protocol => {
      const protocolName = parseExchangeName(protocol.name);
      const part = convertAmountToPercentageDisplay(protocol.part, 0, 3, true);
      const isBridge = bridges?.includes(protocol.name);

      return {
        icons: [getExchangeIconUrl(protocolName)],
        label: capitalize(protocolName.replace('_', ' ')),
        name: SocketBridges[protocol.name] ?? protocolName.slice('_'),
        isBridge,
        action: isBridge
          ? lang.t('expanded_state.swap.bridge')
          : lang.t('expanded_state.swap.swap'),
        part,
      };
    });
    return [defaultCase, ...mappedExchanges];
  }, [bridges, protocols]);

  const [step, nextStep] = useStepper(steps.length);
  const defaultColor = useForegroundColor('secondary (Deprecated)');

  if (protocols?.length > 1) {
    return (
      <Bleed vertical="8px">
        <ButtonPressAnimation
          testID={`${testID}`}
          onPress={nextStep}
          scaleTo={1.06}
          style={{
            // enlarge tap target
            paddingVertical: 8,
          }}
        >
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
                <Bleed vertical="10px">
                  {bridges ? (
                    <CrossChainIconStack protocols={steps[step]} />
                  ) : (
                    <ExchangeIconStack protocols={steps[step]} />
                  )}
                </Bleed>
              </Box>
            </Column>
            <Column width="content">
              <SwapDetailsValue>{steps[step].label}</SwapDetailsValue>
            </Column>
            {(steps?.[step]?.part || steps?.[step]?.action) && (
              <Column width="content">
                <Bleed right="5px (Deprecated)" vertical="6px">
                  <Pill
                    height={20}
                    style={{
                      lineHeight: android && 18,
                      top: android ? -1 : 0,
                    }}
                    textColor={defaultColor}
                  >
                    {bridges ? steps[step].action : steps[step].part}
                  </Pill>
                </Bleed>
              </Column>
            )}
          </Columns>
        </ButtonPressAnimation>
      </Bleed>
    );
  } else if (protocols?.length > 0) {
    return (
      <Columns alignVertical="center" space="4px" testID={testID}>
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
            <Bleed vertical="10px">
              <ExchangeIcon
                icon={getExchangeIconUrl(parseExchangeName(protocols[0].name))}
                protocol={parseExchangeName(protocols[0].name)}
              />
            </Bleed>
          </Box>
        </Column>
        <Column width="content">
          <SwapDetailsValue>{steps[step].label}</SwapDetailsValue>
        </Column>
        <Column width="content">
          <Bleed right="6px" vertical="10px">
            <Pill
              height={20}
              style={{
                lineHeight: 20,
              }}
              textColor={defaultColor}
            >{`${protocols[0].part}%`}</Pill>
          </Bleed>
        </Column>
      </Columns>
    );
  }
  return null;
}
