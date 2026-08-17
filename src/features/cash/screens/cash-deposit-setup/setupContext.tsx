import { createContext, useCallback, useContext, type ReactNode, type RefCallback } from 'react';
import { Keyboard, TextInput } from 'react-native';

import { BivoSecureStore } from '@bivoglobal/payment-react-native';
import { createBaseStore, useListen } from '@storesjs/stores';
import { BIVO_ENV, BIVO_VAULT_ID } from 'react-native-dotenv';

import { useRoute } from '@/navigation/RouteContext';
import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute } from '@/navigation/types';
import { useNavigationStore, type NavigationState } from '@/state/navigation/navigationStore';

import { useCashDepositSetupNavigationStore } from './cashDepositSetupNavigator';
import { createSetupActionStore } from './setupAction';

export const CARD_FIELD = {
  number: 'card',
  expiry: 'exp',
  cvc: 'cvv',
  zip: 'zip',
} as const;

const CARD_FIELDS = Object.values(CARD_FIELD);

type SetupContextValue = ReturnType<typeof createSetupContext>;

const SetupContext = createContext<SetupContextValue | null>(null);

function selectIsSetupScreenActive({ isRouteActive }: NavigationState): boolean {
  // Native entry and sheet dismissal expose the screen route; virtual navigation exposes its active step.
  return isRouteActive(Routes.CASH_DEPOSIT_SETUP_SCREEN) || isRouteActive(useCashDepositSetupNavigationStore.getState().activeRoute);
}

export function createSetupContext() {
  const inputs = new Map<CashDepositSetupRoute, TextInput>();
  let suspendedInput: ReturnType<typeof TextInput.State.currentlyFocusedInput> | null = null;
  let cardForm: BivoSecureStore | undefined;
  let isVisa = false;
  const getCardForm = () => (cardForm ??= new BivoSecureStore(BIVO_VAULT_ID, BIVO_ENV));
  const cardFormStore = createBaseStore<{ isReady: boolean }>(() => ({ isReady: false }));
  const refreshCardFormReadiness = () => {
    const isReady = isVisa && !getCardForm().isSubmitDisabled(CARD_FIELDS);
    if (cardFormStore.getState().isReady !== isReady) cardFormStore.setState({ isReady });
  };

  function focusInput(route: CashDepositSetupRoute) {
    if (!selectIsSetupScreenActive(useNavigationStore.getState())) return;
    const input = inputs.get(route);
    if (input) {
      if (!input.isFocused()) input.focus();
    } else {
      Keyboard.dismiss();
    }
  }

  return {
    focusInput,
    getCardForm,
    registerInput: (route: CashDepositSetupRoute, input: TextInput | null) => {
      if (input) inputs.set(route, input);
      else inputs.delete(route);
    },
    handleScreenActivity: (active: boolean) => {
      if (active) {
        const input = suspendedInput;
        suspendedInput = null;
        if (input) TextInput.State.focusTextInput(input);
      } else {
        suspendedInput = TextInput.State.currentlyFocusedInput();
        Keyboard.dismiss();
      }
    },
    onCardTypeChange: (cardType: string) => {
      // Bivo calls onStateChange immediately after this for the same edit; that callback publishes readiness.
      isVisa = cardType === 'visa';
    },
    refreshCardFormReadiness,
    useActionStore: createSetupActionStore(getCardForm, cardFormStore),
  };
}

export function SetupProvider({ children, value }: { children: ReactNode; value: SetupContextValue }) {
  useListen(useNavigationStore, selectIsSetupScreenActive, value.handleScreenActivity);
  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
}

export function useSetupContext(): SetupContextValue {
  const context = useContext(SetupContext);
  if (!context) throw new Error('useSetupContext must be used within SetupProvider.');
  return context;
}

export function useSetupInputRef(): RefCallback<TextInput> {
  const { registerInput } = useSetupContext();
  const { name: route } = useRoute<CashDepositSetupRoute>();
  return useCallback(input => registerInput(route, input), [registerInput, route]);
}
