import { type Surface } from '@/features/placements/surfaces/types';
import * as i18n from '@/languages';

export function resolveLabel(surface: Surface): string {
  const translated = i18n.t(`discover.${surface.id}`, { defaultValue: '' });
  return translated || surface.label || surface.id;
}
