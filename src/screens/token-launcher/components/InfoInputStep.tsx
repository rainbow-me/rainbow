import React from 'react';
import { Bleed, Box, Text } from '@/design-system';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { TOKEN_PREVIEW_BAR_HEIGHT } from './TokenPreviewBar';
import { safeAreaInsetValues } from '@/utils';
import { TOKEN_LAUNCHER_HEADER_HEIGHT } from './TokenLauncherHeader';
import { SingleFieldInput } from './SingleFieldInput';
import { TokenLogo } from './TokenLogo';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { CollapsableField } from './CollapsableField';
import Animated, { Layout } from 'react-native-reanimated';
import { NetworkField } from './NetworkField';
import { LinksSection } from './LinksSection';
import { DescriptionField } from './DescriptionField';

function TotalSupplyInput() {
  const setTotalSupply = useTokenLauncherStore(state => state.setTotalSupply);
  const formattedTotalSupply = useTokenLauncherStore(state => state.formattedTotalSupply());

  return (
    <SingleFieldInput
      onInputChange={text => {
        setTotalSupply(parseInt(text));
      }}
      inputMode="numeric"
      title="Total Supply"
      subtitle={formattedTotalSupply}
      placeholder="1,000,000"
    />
  );
}

export function InfoInputStep() {
  const setSymbol = useTokenLauncherStore(state => state.setSymbol);

  return (
    <KeyboardAwareScrollView
      contentOffset={{ x: 0, y: -TOKEN_LAUNCHER_HEADER_HEIGHT }}
      contentInset={{ top: TOKEN_LAUNCHER_HEADER_HEIGHT }}
      contentContainerStyle={{
        alignItems: 'center',
        alignSelf: 'stretch',
        flexGrow: 1,
        justifyContent: 'center',
      }}
      keyboardDismissMode="interactive"
      bottomOffset={TOKEN_PREVIEW_BAR_HEIGHT + 36}
      extraKeyboardSpace={TOKEN_PREVIEW_BAR_HEIGHT}
      // disableScrollOnKeyboardHide={true}
      // extraKeyboardSpace={-(TOKEN_PREVIEW_BAR_HEIGHT + safeAreaInsetValues.bottom)}
    >
      {/* <Animated.View style={{ width: '100%', flex: 1 }} layout={Layout.springify()}> */}
      <Box width="full" gap={8} alignItems="center" paddingHorizontal="20px">
        <Box paddingBottom={'16px'}>
          <TokenLogo />
        </Box>
        <Box gap={16} width="full" paddingVertical="20px">
          <Text color="labelSecondary" size="13pt" weight="heavy">
            Required Info
          </Text>
          <Box gap={8}>
            <SingleFieldInput
              validationWorklet={text => {
                'worklet';
                if (text.trim().length > 4) {
                  return 'Too long, friend';
                }
                return '';
              }}
              onInputChange={text => {
                setSymbol(text);
              }}
              inputStyle={{ textTransform: 'uppercase' }}
              autoCapitalize="characters"
              title="Ticker"
              placeholder="$NAME"
            />
            <SingleFieldInput title="Name" placeholder="Enter coin name" />
            <TotalSupplyInput />
            <NetworkField />
          </Box>
        </Box>
        {/* <Bleed horizontal={'20px'}> */}
        <Box height={1} width="full" backgroundColor="rgba(245, 248, 255, 0.06)" />
        {/* </Bleed> */}
        <Box gap={16} width="full" paddingVertical="20px">
          <Text color="labelSecondary" size="13pt" weight="heavy">
            Optional
          </Text>
          <Box gap={8} width={'full'}>
            <DescriptionField />
            <LinksSection />
          </Box>
        </Box>
        <Box height={1} width="full" backgroundColor="rgba(245, 248, 255, 0.06)" />
        <Box gap={16} width="full" paddingVertical="20px">
          <Text color="labelSecondary" size="13pt" weight="heavy">
            Token Allocation
          </Text>
          <Box gap={8} width={'full'}></Box>
        </Box>
      </Box>
      {/* </Animated.View> */}
    </KeyboardAwareScrollView>
  );
}
