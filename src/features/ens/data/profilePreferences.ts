import { getGlobal, saveGlobal } from '@/handlers/localstorage/common';

const ensSeenOnchainDataDisclaimerKey = 'ensProfile.seenOnchainDisclaimer';

export const getSeenOnchainDataDisclaimer = () => getGlobal(ensSeenOnchainDataDisclaimerKey, false);
export const saveSeenOnchainDataDisclaimer = (value: boolean) => saveGlobal(ensSeenOnchainDataDisclaimerKey, value);
