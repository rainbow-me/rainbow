import { useCallback, useEffect, useRef, useState } from 'react';

import { type Address } from 'viem';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { isPasskeyCancellation } from '../../services/cashPasskeyService';
import { linkWalletWithSignature, WalletSignatureError } from '../../services/walletLinkService';
import { getTelemetryErrorReason } from '../../utils/getTelemetryErrorReason';

export type WalletLinkState = 'idle' | 'linking' | 'linked' | 'error';

export type UseWalletLinkFlow = {
  state: WalletLinkState;
  confirm: () => void;
};

export function useWalletLinkFlow({ onLinked, walletAddress }: { onLinked: () => void; walletAddress: Address }): UseWalletLinkFlow {
  const [state, setState] = useState<WalletLinkState>('idle');
  const abortRef = useRef<AbortController | null>(null);

  const confirm = useCallback(async () => {
    // `linked` outlives the flow: the sheet is dismissing, and a tap landing in that window would
    // re-sign and re-POST an already-linked wallet.
    if (abortRef.current || state === 'linked') return;

    const controller = new AbortController();
    abortRef.current = controller;
    setState('linking');

    try {
      await linkWalletWithSignature(walletAddress, controller);
      if (controller.signal.aborted) return;
      setState('linked');
      analytics.track(analytics.event.cashWalletLinked);
      onLinked();
    } catch (e) {
      if (controller.signal.aborted) return;
      // A cancelled passkey and the signature stage both already spoke to the user; anything past
      // them is ours to surface.
      if (e instanceof WalletSignatureError || isPasskeyCancellation(e)) {
        setState('idle');
        return;
      }
      logger.error(new RainbowError('[useWalletLinkFlow]: Failed to link wallet', e));
      analytics.track(analytics.event.cashWalletLinkFailed, { reason: getTelemetryErrorReason(e) });
      // Recovered by confirming again rather than a dedicated retry: the timestamp is inside the
      // signed message, so replaying the old signature would land outside the server's skew window.
      setState('error');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [onLinked, state, walletAddress]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { state, confirm };
}
