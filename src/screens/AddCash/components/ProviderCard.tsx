import React from 'react';
import { ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import chroma from 'chroma-js';

import { IS_IOS } from '@/env';
import { Box, Text, Inline, Bleed, useBackgroundColor } from '@/design-system';
import { Ramp as RampLogo } from '@/components/icons/svg/Ramp';
import { AssetType } from '@/entities';
import { ETH_ADDRESS, ETH_SYMBOL } from '@/references';
import { Network } from '@/helpers/networkTypes';
import ChainBadge from '@/components/coin-icon/ChainBadge';
import { CoinIcon } from '@/components/coin-icon';
import { ButtonPressAnimation } from '@/components/animations';

import { FiatProviderName } from '@/entities/f2c';
import { convertAPINetworkToInternalNetwork } from '@/screens/AddCash/utils';
import {
  ProviderConfig,
  CalloutType,
  PaymentMethod,
} from '@/screens/AddCash/types';

const providerNames = {
  [FiatProviderName.Ramp]: 'Ramp',
};

const providerDescriptions = {
  [FiatProviderName.Ramp]: `Works with any US card, and many international payment methods.`,
};

const providerLogos = {
  [FiatProviderName.Ramp]: RampLogo,
};

const paymentMethodConfig = {
  [PaymentMethod.DebitCard]: {
    name: 'Debit',
    icon: '􀍯',
  },
  [PaymentMethod.CreditCard]: {
    name: 'Credit',
    icon: '􀍯',
  },
  [PaymentMethod.Bank]: {
    name: 'Bank',
    icon: '􀤨',
  },
  [PaymentMethod.ApplePay]: {
    name: 'Apple Pay',
    icon: '􀣺',
  },
  [PaymentMethod.GooglePay]: {
    name: 'Google Pay',
    icon: '􀍯',
  },
};

function NetworkIcons({ networks }: { networks: Network[] }) {
  return (
    <Box flexDirection="row" alignItems="center">
      {networks.map((network, index) => {
        return (
          <Box
            key={`availableNetwork-${network}`}
            marginTop={{ custom: -2 }}
            marginLeft={{ custom: index > 0 ? -6 : 0 }}
            style={{
              position: 'relative',
              zIndex: networks.length - index,
              borderRadius: 30,
            }}
          >
            {network !== Network.mainnet ? (
              <ChainBadge
                assetType={network}
                position="relative"
                size="small"
              />
            ) : (
              <CoinIcon
                address={ETH_ADDRESS}
                size={20}
                symbol={ETH_SYMBOL}
                type={AssetType.token}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export function ProviderCard({
  config,
  onPress,
}: {
  config: ProviderConfig;
  onPress?: () => void;
}) {
  const backgroundColor = useBackgroundColor('surfaceSecondaryElevated');
  const backgroundColorAlpha = React.useMemo(() => {
    return `rgba(${chroma(backgroundColor).rgb()},0)`;
  }, [backgroundColor]);
  const Logo = React.useMemo(() => providerLogos[config.name], [config.name]);
  const handleOnPress = React.useCallback(() => {
    onPress?.();
  }, [onPress]);

  return (
    <ButtonPressAnimation onPress={handleOnPress}>
      <Box
        background="surfaceSecondaryElevated"
        padding="20px"
        borderRadius={20}
        shadow="12px"
        style={{ flex: IS_IOS ? 0 : undefined }}
      >
        <Inline alignVertical="center">
          <Box
            borderRadius={24}
            height={{ custom: 24 }}
            width={{ custom: 24 }}
            style={{ backgroundColor: config.metadata.accentColor }}
            alignItems="center"
            justifyContent="center"
          >
            <Logo width={14} height={14} color="white" />
          </Box>
          <Box paddingLeft="8px">
            <Text size="20pt" weight="heavy" color="label">
              {providerNames[config.name]}
            </Text>
          </Box>
        </Inline>

        <Box paddingTop="8px" paddingBottom="20px">
          <Text size="17pt" weight="semibold" color="labelSecondary">
            {providerDescriptions[config.name]}
          </Text>
        </Box>

        <Bleed horizontal="20px">
          <LinearGradient
            colors={[backgroundColor, backgroundColorAlpha]}
            end={{ x: 1, y: 0.5 }}
            style={{
              position: 'absolute',
              height: '100%',
              left: 0,
              width: 20,
              zIndex: 1,
            }}
            start={{ x: 0, y: 0.5 }}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Box flexDirection="row" paddingHorizontal="20px">
              {config.callouts.map(callout => {
                let title = '';
                let content = null;

                switch (callout.type) {
                  case CalloutType.Rate: {
                    title = 'Fee';
                    content = (
                      <Box
                        flexDirection="row"
                        alignItems="center"
                        paddingTop="12px"
                      >
                        <Text size="15pt" weight="bold" color="label">
                          {callout.value}
                        </Text>
                      </Box>
                    );
                    break;
                  }
                  case CalloutType.InstantAvailable: {
                    title = 'Instant';
                    content = (
                      <Box
                        flexDirection="row"
                        alignItems="center"
                        paddingTop="12px"
                      >
                        <Text
                          size="12pt"
                          weight="bold"
                          color={{ custom: config.metadata.accentColor }}
                        >
                          􀋦
                        </Text>
                        <Box paddingLeft="4px">
                          <Text size="15pt" weight="bold" color="label">
                            {callout.value || 'Yes'}
                          </Text>
                        </Box>
                      </Box>
                    );
                    break;
                  }
                  case CalloutType.PaymentMethods: {
                    title = callout.methods.length > 1 ? 'Methods' : 'Method';
                    content = (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        {callout.methods.map(method => {
                          const methodConfig = paymentMethodConfig[method.type];

                          return (
                            <Box
                              key={method.type}
                              flexDirection="row"
                              alignItems="center"
                              paddingTop="12px"
                              paddingRight="8px"
                            >
                              <Text
                                size="12pt"
                                weight="bold"
                                color={{ custom: config.metadata.accentColor }}
                              >
                                {methodConfig.icon}
                              </Text>
                              <Box paddingLeft="4px">
                                <Text size="15pt" weight="bold" color="label">
                                  {methodConfig.name}
                                </Text>
                              </Box>
                            </Box>
                          );
                        })}
                      </ScrollView>
                    );
                    break;
                  }
                  case CalloutType.Networks: {
                    title =
                      callout.networks.length > 1 ? 'Networks' : 'Network';
                    content = (
                      <Box
                        flexDirection="row"
                        alignItems="center"
                        paddingTop="8px"
                      >
                        <NetworkIcons
                          /* @ts-ignore */
                          networks={callout.networks
                            .map(convertAPINetworkToInternalNetwork)
                            .filter(Boolean)}
                        />
                      </Box>
                    );
                  }
                }

                return (
                  <Box key={callout.type} paddingRight="16px">
                    <Text size="13pt" weight="semibold" color="labelTertiary">
                      {title}
                    </Text>

                    {content}
                  </Box>
                );
              })}
            </Box>
          </ScrollView>

          <LinearGradient
            colors={[backgroundColorAlpha, backgroundColor]}
            end={{ x: 1, y: 0.5 }}
            style={{
              position: 'absolute',
              height: '100%',
              right: 0,
              width: 20,
              zIndex: 1,
            }}
            start={{ x: 0, y: 0.5 }}
          />
        </Bleed>
      </Box>
    </ButtonPressAnimation>
  );
}
