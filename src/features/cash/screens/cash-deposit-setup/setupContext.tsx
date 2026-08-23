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

export function createSetupContext() {
  const inputs = new Map<CashDepositSetupRoute, TextInput>();
  let deferredInputRoute: CashDepositSetupRoute | undefined;
  let suspendedInput: ReturnType<typeof TextInput.State.currentlyFocusedInput> | null = null;

  const cardFormStore = createBaseStore<{ isReady: boolean; isVisa: boolean }>(() => ({ isReady: false, isVisa: false }));
  let cardForm: BivoSecureStore | undefined;

  function getCardForm(): BivoSecureStore {
    return (cardForm ??= new BivoSecureStore(BIVO_VAULT_ID, BIVO_ENV));
  }

  function refreshCardFormReadiness(): void {
    const isReady = cardFormStore.getState().isVisa && !getCardForm().isSubmitDisabled(CARD_FIELDS);
    cardFormStore.setState(state => {
      if (state.isReady === isReady) return state;
      return { ...state, isReady };
    });
  }

  function handlePageActivated(route: CashDepositSetupRoute): void {
    if (!selectIsSetupScreenActive(useNavigationStore.getState())) return;

    deferredInputRoute = undefined;
    const input = inputs.get(route);

    if (!input) {
      Keyboard.dismiss();
    } else if (Keyboard.isVisible() || TextInput.State.currentlyFocusedInput()) {
      // Transfer focus before an already presented keyboard can begin dismissing.
      if (!input.isFocused()) input.focus();
    } else {
      deferredInputRoute = route;
    }
  }

  function handleProgressSettled(route: CashDepositSetupRoute) {
    if (deferredInputRoute !== route || useCashDepositSetupNavigationStore.getState().activeRoute !== route) {
      return;
    }

    deferredInputRoute = undefined;
    const input = inputs.get(route);

    if (input && !input.isFocused()) input.focus();
  }

  return {
    getCardForm,
    handlePageActivated,
    handleProgressSettled,
    registerInput: (route: CashDepositSetupRoute, input: TextInput | null): void => {
      if (input) inputs.set(route, input);
      else inputs.delete(route);
    },
    handleScreenActivity: (active: boolean): void => {
      if (active) {
        const input = suspendedInput;
        suspendedInput = null;
        if (input) TextInput.State.focusTextInput(input);
      } else {
        suspendedInput = TextInput.State.currentlyFocusedInput();
        Keyboard.dismiss();
      }
    },
    onCardTypeChange: (cardType: string): void => {
      cardFormStore.setState(state => {
        const isVisa = cardType === 'visa';
        if (state.isVisa === isVisa) return state;
        return { ...state, isVisa };
      });
    },
    refreshCardFormReadiness,
    useActionStore: createSetupActionStore(getCardForm, cardFormStore),
    useCardFormStore: cardFormStore,
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

/**
 * Native entry and sheet dismissal expose the screen route;
 * virtual navigation exposes its active step.
 */
function selectIsSetupScreenActive({ isRouteActive }: NavigationState): boolean {
  return isRouteActive(Routes.CASH_DEPOSIT_SETUP_SCREEN) || isRouteActive(useCashDepositSetupNavigationStore.getState().activeRoute);
}
