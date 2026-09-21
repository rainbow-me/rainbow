import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { type Selection } from '@/features/sports/core/generated/sports';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { currentColors } from '@/theme/currentColors';

let pendingEntry: AbortController | undefined;

/** Opens a Sports game or its exact offer after fresh financial hydration. */
export async function navigateToPolymarketSportsGame({
  gameId,
  selection,
  fromRoute,
}: {
  gameId: string;
  selection?: Selection;
  fromRoute: RootStackParamList[typeof Routes.POLYMARKET_NEW_POSITION_SHEET]['fromRoute'];
}): Promise<void> {
  pendingEntry?.abort();
  const abortController = new AbortController();
  pendingEntry = abortController;
  const routeKey = Navigation.getActiveRoute()?.key;
  const isCurrent = () => !abortController.signal.aborted && Navigation.getActiveRoute()?.key === routeKey;
  const unsubscribe = useNavigationStore.subscribe(
    state => state.activeRoute,
    () => abortController.abort()
  );
  abortController.signal.addEventListener('abort', unsubscribe, { once: true });

  try {
    const eventId = selection?.eventId ?? gameId;
    const { data } = await rainbowFetch<RawPolymarketEvent>(`${POLYMARKET_GAMMA_API_URL}/events/${eventId}`, { abortController });
    if (!isCurrent()) return;
    if (data.id !== eventId) throw new Error('Polymarket returned a different event.');

    const event = await processRawPolymarketEvent(data);
    if (!isCurrent()) return;

    if (!selection) {
      Navigation.navigateIfCurrent(isCurrent, Routes.POLYMARKET_EVENT_SCREEN, { eventId, event });
      return;
    }

    const market = event.markets.find(market => market.id === selection.marketId);
    const outcome = market?.outcomes[selection.outcomeIndex];
    if (
      !market ||
      !market.active ||
      market.closed ||
      market.archived ||
      market.acceptingOrders === false ||
      !outcome ||
      market.clobTokenIds[selection.outcomeIndex] !== selection.tokenId
    ) {
      throw new Error('The selected Polymarket outcome is no longer available.');
    }

    Navigation.navigateIfCurrent(isCurrent, Routes.POLYMARKET_NEW_POSITION_SHEET, {
      event,
      market,
      outcomeIndex: selection.outcomeIndex,
      outcomeColor: getOutcomeColor({
        market,
        outcome,
        outcomeIndex: selection.outcomeIndex,
        isDarkMode: currentColors.theme === 'dark',
        teams: event.teams,
      }),
      fromRoute,
    });
  } catch (error) {
    if (isCurrent()) throw error;
  } finally {
    unsubscribe();
    abortController.signal.removeEventListener('abort', unsubscribe);
    if (pendingEntry === abortController) pendingEntry = undefined;
  }
}
