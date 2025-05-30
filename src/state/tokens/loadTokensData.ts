import { hiddenTokensLoadState } from '../../redux/hiddenTokens';
import { showcaseTokensLoadState } from '../../redux/showcaseTokens';
import { logger } from '@/logger';
import store from '../../redux/store';

export const loadTokensData = async () => {
  logger.debug('[useloadTokensData]: Load wallet account data');
  store.dispatch(showcaseTokensLoadState());
  store.dispatch(hiddenTokensLoadState());
};
