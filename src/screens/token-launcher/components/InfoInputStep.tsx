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
import { COLLAPSABLE_FIELD_ANIMATION, DEFAULT_TOTAL_SUPPLY } from '../constants';
import { TokenAllocationSection } from './TokenAllocationSection';
import Animated from 'react-native-reanimated';
import { validateNameWorklet, validateSymbolWorklet, validateTotalSupplyWorklet } from '../helpers/inputValidators';

function TotalSupplyInput() {
  const setTotalSupply = useTokenLauncherStore(state => state.setTotalSupply);
  const formattedTotalSupply = useTokenLauncherStore(state => state.formattedTotalSupply());

  return (
    <SingleFieldInput
      onInputChange={text => {
        setTotalSupply(parseInt(text.trim()) || 0);
      }}
      validationWorklet={text => {
        'worklet';
        return validateTotalSupplyWorklet(parseInt(text.trim()) || 0);
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
      validationWorklet={validateSymbolWorklet}
      onInputChange={text => {
        setSymbol(text);
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
      validationWorklet={validateNameWorklet}
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

function RequiredInfoSection() {
  return (
    <Box paddingTop={'20px'} gap={16} width="full">
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
  );
}

function AboutSection() {
  return (
    <Box gap={16}>
      <Text color="labelSecondary" size="13pt" weight="heavy">
        {'About'}
      </Text>
      <Box gap={8} width={'full'}>
        <DescriptionField />
        <LinksSection />
      </Box>
    </Box>
  );
}

function Separator() {
  return (
    <Bleed horizontal={'20px'}>
      <Box paddingVertical={'20px'} justifyContent="center" alignItems="center">
        <Box height={1} width="full" backgroundColor="rgba(245, 248, 255, 0.06)" />
      </Box>
    </Bleed>
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
      <Box width="full" alignItems="center" paddingBottom={'20px'} paddingHorizontal="20px">
        <Box paddingBottom={'16px'}>
          <TokenLogo />
        </Box>
        <RequiredInfoSection />
        <Animated.View style={{ width: '100%' }} layout={COLLAPSABLE_FIELD_ANIMATION}>
          <Separator />
          <AboutSection />
        </Animated.View>
        <Animated.View style={{ width: '100%' }} layout={COLLAPSABLE_FIELD_ANIMATION}>
          <Separator />
          <TokenAllocationSection />
        </Animated.View>
      </Box>
    </KeyboardAwareScrollView>
  );
}
