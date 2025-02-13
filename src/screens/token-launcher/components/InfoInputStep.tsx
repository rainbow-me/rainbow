import React, { useRef } from 'react';
import { Bleed, Box, Text } from '@/design-system';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { FOOTER_HEIGHT } from './TokenLauncherFooter';
import { TOKEN_LAUNCHER_HEADER_HEIGHT } from './TokenLauncherHeader';
import { SingleFieldInput, SingleFieldInputRef } from './SingleFieldInput';
import { TokenLogo } from './TokenLogo';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { NetworkField } from './NetworkField';
import { LinksSection } from './LinksSection';
import { DescriptionField } from './DescriptionField';
import { DEFAULT_TOTAL_SUPPLY, MAX_NAME_LENGTH, MAX_SYMBOL_LENGTH, MAX_TOTAL_SUPPLY } from '../constants';
import { TokenAllocationSection } from './TokenAllocationSection';
import { useAnimatedRef } from 'react-native-reanimated';
import { TextInput } from 'react-native';

function TotalSupplyInput() {
  const setTotalSupply = useTokenLauncherStore(state => state.setTotalSupply);
  const formattedTotalSupply = useTokenLauncherStore(state => state.formattedTotalSupply());

  return (
    <SingleFieldInput
      onInputChange={text => {
        setTotalSupply(parseInt(text.trim()));
      }}
      validationWorklet={text => {
        'worklet';
        if (parseInt(text.trim()) > MAX_TOTAL_SUPPLY) {
          return { error: true, message: `Too big.` };
        }
      }}
      inputMode="numeric"
      title="Total Supply"
      subtitle={formattedTotalSupply}
      defaultValue={DEFAULT_TOTAL_SUPPLY.toString()}
    />
  );
}

function SymbolInput() {
  const setSymbol = useTokenLauncherStore(state => state.setSymbol);
  const inputRef = useRef<SingleFieldInputRef>(null);

  return (
    <SingleFieldInput
      ref={inputRef}
      validationWorklet={text => {
        'worklet';
        if (text.trim().length > MAX_SYMBOL_LENGTH) {
          return { error: true, message: `Too long, friend.` };
        }
      }}
      onInputChange={text => {
        const noSpaces = text.replace(/\s/g, '');
        inputRef.current?.setNativeProps({ text: noSpaces });
        setSymbol(noSpaces);
      }}
      spellCheck={false}
      inputStyle={{ textTransform: 'uppercase' }}
      autoCapitalize="characters"
      title="Ticker"
      placeholder="$NAME"
    />
  );
}

function NameInput() {
  const setName = useTokenLauncherStore(state => state.setName);

  return (
    <SingleFieldInput
      validationWorklet={text => {
        'worklet';
        if (text.trim().length > MAX_NAME_LENGTH) {
          return { error: true, message: `Too long, friend.` };
        }
      }}
      onInputChange={text => {
        setName(text);
      }}
      spellCheck={false}
      autoCapitalize="sentences"
      title="Name"
      placeholder="Enter coin name"
    />
  );
}

export function InfoInputStep() {
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
      bottomOffset={FOOTER_HEIGHT + 36}
      extraKeyboardSpace={FOOTER_HEIGHT}
      // extraKeyboardSpace={-(TOKEN_PREVIEW_BAR_HEIGHT + safeAreaInsetValues.bottom)}
    >
      <Box width="full" gap={8} alignItems="center" paddingHorizontal="20px">
        <Box paddingBottom={'16px'}>
          <TokenLogo />
        </Box>
        <Box gap={16} width="full" paddingVertical="20px">
          <Text color="labelSecondary" size="13pt" weight="heavy">
            {'Required Info'}
          </Text>
          <Box gap={8}>
            <SymbolInput />
            <NameInput />
            <TotalSupplyInput />
            <NetworkField />
          </Box>
        </Box>
        {/* <Bleed horizontal={'20px'}> */}
        <Box height={1} width="full" backgroundColor="rgba(245, 248, 255, 0.06)" />
        {/* </Bleed> */}
        <Box gap={16} width="full" paddingVertical="20px">
          <Text color="labelSecondary" size="13pt" weight="heavy">
            {'About'}
          </Text>
          <Box gap={8} width={'full'}>
            <DescriptionField />
            <LinksSection />
          </Box>
        </Box>
        <Box height={1} width="full" backgroundColor="rgba(245, 248, 255, 0.06)" />
        <TokenAllocationSection />
      </Box>
    </KeyboardAwareScrollView>
  );
}
