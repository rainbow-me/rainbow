import { type EthereumAddress } from '@/entities/wallet';
import { PreferenceActionType, setPreference } from '@/model/preferences';
import { lightModeThemeColors } from '@/styles/colors';
import { addressHashedEmoji } from '@/utils/profileUtils';

/** Initializes an account's profile color and symbol without awaiting persistence. */
export function initializeWalletProfilePreference(address: EthereumAddress, colorIndex: number): void {
  void setPreference(PreferenceActionType.init, 'profile', address, {
    accountColor: lightModeThemeColors.avatarBackgrounds[colorIndex],
    accountSymbol: addressHashedEmoji(address),
  });
}
