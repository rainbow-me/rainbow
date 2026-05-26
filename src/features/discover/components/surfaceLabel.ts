import { type Surface } from '@/features/placements/surfaces/types';
import * as i18n from '@/languages';

export function getSurfaceLabel(surface: Pick<Surface, 'id' | 'label'>): string {
  const backendLabel = surface.label || surface.id;
  const i18nLabel = i18n.t(`discover.sections.${surface.id}`, { defaultValue: '' });

  if (!i18nLabel) return backendLabel;
  return i18nLabel === backendLabel ? i18nLabel : backendLabel;
}
