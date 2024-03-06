import React from 'react';
import { ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import chroma from 'chroma-js';

import { IS_IOS } from '@/env';
import { Box, Text, Inline, Bleed, useBackgroundColor } from '@/design-system';
import { Network } from '@/helpers/networkTypes';
import ChainBadge from '@/components/coin-icon/ChainBadge';

import { Ramp as RampLogo } from '@/components/icons/svg/Ramp';
import { Ratio as RatioLogo } from '@/components/icons/svg/Ratio';
import { Coinbase as CoinbaseLogo } from '@/components/icons/svg/Coinbase';
import { Moonpay as MoonpayLogo } from '@/components/icons/svg/Moonpay';

import { FiatProviderName } from '@/entities/f2c';
import { convertAPINetworkToInternalNetwork } from '@/screens/AddCash/utils';
import { ProviderConfig, CalloutType, PaymentMethod } from '@/screens/AddCash/types';
import * as i18n from '@/languages';
import { EthCoinIcon } from '@/components/coin-icon/EthCoinIcon';

type PaymentMethodConfig = {
  name: string;
  icon: string;
};

const providerLogos = {
  [FiatProviderName.Ramp]: RampLogo,
  [FiatProviderName.Coinbase]: CoinbaseLogo,
  [FiatProviderName.Moonpay]: MoonpayLogo,
};

const paymentMethodConfig: {
  [key in PaymentMethod]: PaymentMethodConfig;
} = {
  [PaymentMethod.DebitCard]: {
    name: 'Card',
    icon: '􀍯',
  },
  [PaymentMethod.CreditCard]: {
    name: 'Card',
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

function getPaymentMethodConfigs(paymentMethods: { type: PaymentMethod }[]) {
  const methods: PaymentMethodConfig[] = [];
  const types = paymentMethods.map(method => method.type);
  const debit = types.includes(PaymentMethod.DebitCard);
  const credit = types.includes(PaymentMethod.CreditCard);
  const bank = types.includes(PaymentMethod.Bank);
  const apple = types.includes(PaymentMethod.ApplePay);
  const google = types.includes(PaymentMethod.GooglePay);

  // card first
  if (debit || credit) methods.push(paymentMethodConfig[PaymentMethod.DebitCard]);

  // then bank
  if (bank) methods.push(paymentMethodConfig[PaymentMethod.Bank]);

  // and if no card, then show platform specific ones if avail
  if (!(debit || credit) && (apple || google)) {
    if (apple) methods.push(paymentMethodConfig[PaymentMethod.ApplePay]);

    if (google) methods.push(paymentMethodConfig[PaymentMethod.GooglePay]);
  }

  return methods;
}

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
            {network !== Network.mainnet ? <ChainBadge network={network} position="relative" size="small" /> : <EthCoinIcon size={20} />}
          </Box>
        );
      })}
    </Box>
  );
}

export function ProviderCard({ config }: { config: ProviderConfig }) {
  const backgroundColor = useBackgroundColor('surfaceSecondaryElevated');
  const backgroundColorAlpha = React.useMemo(() => {
    return `rgba(${chroma(backgroundColor).rgb()},0)`;
  }, [backgroundColor]);
  const Logo = React.useMemo(() => providerLogos[config.id], [config.id]);

  return (
    <Box
      background="surfaceSecondaryElevated"
      paddingTop="20px"
      paddingHorizontal="20px"
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
          <Logo width={14} height={14} color={config.metadata.accentForegroundColor || 'white'} />
        </Box>
        <Box paddingLeft="8px">
          <Text size="20pt" weight="heavy" color="label">
            {config.content.title}
          </Text>
        </Box>
      </Inline>

      <Box paddingTop="8px" paddingBottom="20px">
        <Text size="17pt" weight="semibold" color="labelSecondary">
          {config.content.description}
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
            bottom: 20,
          }}
          start={{ x: 0, y: 0.5 }}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Box flexDirection="row" paddingHorizontal="20px" paddingBottom="20px">
            {config.content.callouts.map(callout => {
              let title = '';
              let content = null;

              switch (callout.type) {
                case CalloutType.Rate: {
                  title = i18n.t(i18n.l.wallet.add_cash_v2.fees_title);
                  content = (
                    <Box flexDirection="row" alignItems="center" paddingTop="12px">
                      <Text size="15pt" weight="bold" color="label">
                        {callout.value}
                      </Text>
                    </Box>
                  );
                  break;
                }
                case CalloutType.InstantAvailable: {
                  title = i18n.t(i18n.l.wallet.add_cash_v2.instant_title);
                  content = (
                    <Box flexDirection="row" alignItems="center" paddingTop="12px">
                      <Text size="12pt" weight="bold" color={{ custom: config.metadata.accentColor }}>
                        􀋦
                      </Text>
                      <Box paddingLeft="2px">
                        <Text size="15pt" weight="bold" color="label">
                          {callout.value || 'Yes'}
                        </Text>
                      </Box>
                    </Box>
                  );
                  break;
                }
                case CalloutType.PaymentMethods: {
                  const methods = getPaymentMethodConfigs(callout.methods);
                  const multi = methods.length > 1;
                  title = multi ? i18n.t(i18n.l.wallet.add_cash_v2.methods_title) : i18n.t(i18n.l.wallet.add_cash_v2.method_title);
                  content = (
                    <Box flexDirection="row">
                      {methods.map(m => {
                        return (
                          <Box key={m.name} flexDirection="row" alignItems="center" paddingTop="12px" paddingRight="4px">
                            <Text size="13pt" weight="bold" color={{ custom: config.metadata.accentColor }}>
                              {m.icon}
                            </Text>

                            {!multi && (
                              <Box paddingLeft="4px">
                                <Text size="15pt" weight="bold" color="label">
                                  {m.name}
                                </Text>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  );
                  break;
                }
                case CalloutType.Networks: {
                  title =
                    callout.networks.length > 1
                      ? i18n.t(i18n.l.wallet.add_cash_v2.networks_title)
                      : i18n.t(i18n.l.wallet.add_cash_v2.network_title);
                  content = (
                    <Box flexDirection="row" alignItems="center" paddingTop="8px">
                      <NetworkIcons
                        /* @ts-ignore */
                        networks={callout.networks.map(convertAPINetworkToInternalNetwork).filter(Boolean)}
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
            bottom: 20,
          }}
          start={{ x: 0, y: 0.5 }}
        />
      </Bleed>
    </Box>
  );
}
