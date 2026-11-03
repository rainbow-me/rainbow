import { time } from '@/framework/core/utils/time';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import { normalizeEnsName } from '../../core/name';
import { validateENS } from '../../utils/records';
import { readEnsRegistration } from '../registration';

export const useEnsSearchStore = createQueryCollectionStore({
  key: (input: { name: string; duration: number; renew?: boolean }) => `${input.name}:${input.duration}:${input.renew ?? false}`,
  fetcher: async (input, signal) => {
    const validation = validateENS(input.name + '.eth', { includeSubdomains: false });
    if (!validation.valid) return { valid: false as const, code: validation.code, hint: validation.hint };

    const name = normalizeEnsName(input.name);
    const registration = await readEnsRegistration(name + '.eth', input.duration, input.renew ?? false, signal);
    return { valid: true as const, ...registration, name: name + '.eth' };
  },
  retry: false,
  staleTime: Infinity,
  cacheTime: time.minutes(5),
});
