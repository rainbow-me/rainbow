import type { Position, ProtocolGroup, RainbowPosition, RainbowDapp } from '../types';
import { initializePositionTotals } from './totals';
import { logger } from '@/logger';

/**
 * Group positions by canonical protocol name
 */
export function groupByCanonicalProtocol(positions: Position[]): ProtocolGroup {
  const grouped: ProtocolGroup = {};

  positions.forEach(position => {
    const canonicalName = position.canonicalProtocolName;

    // Initialize new protocol group if needed
    if (!grouped[canonicalName]) {
      grouped[canonicalName] = {
        type: canonicalName,
        protocol_version: position.protocolVersion,
        chainIds: [],
        deposits: [],
        pools: [],
        stakes: [],
        borrows: [],
        rewards: [],
        totals: initializePositionTotals(),
        dapp: position.dapp
          ? {
              name: position.dapp.name || '',
              url: position.dapp.url || '',
              icon_url: position.dapp.iconUrl || '',
              colors: position.dapp.colors || { primary: '#000000', fallback: '#808080', shadow: '#000000' },
            }
          : generateDefaultDapp(position),
      };
    }

    // Track multi-chain presence
    trackChainPresence(grouped[canonicalName], position.chainId);

    // Update protocol version if newer
    if (position.protocolVersion && !grouped[canonicalName].protocol_version) {
      grouped[canonicalName].protocol_version = position.protocolVersion;
    }

    // Update DApp metadata if better quality
    if (position.dapp && (!grouped[canonicalName].dapp || !grouped[canonicalName].dapp.icon_url)) {
      grouped[canonicalName].dapp = {
        name: position.dapp.name || '',
        url: position.dapp.url || '',
        icon_url: position.dapp.iconUrl || '',
        colors: position.dapp.colors || { primary: '#000000', fallback: '#808080', shadow: '#000000' },
      };
    }
  });

  logger.debug('[Protocol Grouping] Grouped positions by protocol', {
    protocolCount: Object.keys(grouped).length,
    protocols: Object.keys(grouped),
  });

  return grouped;
}

/**
 * Track which chains a protocol has positions on
 */
function trackChainPresence(position: RainbowPosition, chainId: number): void {
  if (!position.chainIds.includes(chainId)) {
    position.chainIds.push(chainId);
    position.chainIds.sort((a, b) => a - b); // Keep chains sorted
  }
}

/**
 * Generate default DApp metadata if missing
 */
function generateDefaultDapp(position: Position): RainbowDapp {
  return {
    name: position.protocolName || position.canonicalProtocolName,
    url: '',
    icon_url: '',
    colors: {
      primary: '#000000',
      fallback: '#808080',
      shadow: '#000000',
    },
  };
}

/**
 * Normalize protocol name for consistency
 */
function normalizeProtocolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[-_\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
