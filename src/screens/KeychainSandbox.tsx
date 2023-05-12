import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, StatusBar } from 'react-native';
import { SlackSheet } from '@/components/sheet';
import { useDimensions } from '@/hooks';
import { BackgroundProvider, Box, Text } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_ANDROID, IS_IOS } from '@/env';
import * as keychain from '@/keychain';

export const KeychainSandbox: React.FC = () => {
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();
  const [lastValue, setLastValue] = useState<string>('');

  React.useEffect(() => {
    if (lastValue) {
      setTimeout(() => {
        setLastValue('');
      }, 5_000);
    }
  }, [lastValue]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        // @ts-expect-error JS component
        <SlackSheet
          backgroundColor={backgroundColor}
          additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
          {...(IS_IOS && { height: '100%' })}
          contentHeight={height - top}
          scrollEnabled
        >
          <Box padding="20px">
            <Box paddingBottom="20px">
              <Text size="15pt" weight="bold" color="label">
                {lastValue || 'awaiting...'}
              </Text>
            </Box>

            <Pressable
              onPress={async () => {
                keychain.set(
                  'keychain_sandbox_private',
                  'private value',
                  await keychain.getPrivateAccessControlOptions()
                );
              }}
            >
              <Box paddingBottom="12px">
                <Text size="30pt" weight="bold" color="label">
                  Set private value
                </Text>
              </Box>
            </Pressable>

            <Pressable
              onPress={async () => {
                const result = await keychain.get('keychain_sandbox_private', {
                  authenticationPrompt: 'Auth plz',
                });
                setLastValue(result.value!);
              }}
            >
              <Box paddingBottom="12px">
                <Text size="30pt" weight="bold" color="label">
                  Get private value
                </Text>
              </Box>
            </Pressable>
          </Box>
        </SlackSheet>
      )}
    </BackgroundProvider>
  );
};
