import * as React from 'react';
import { Inset } from '@/design-system';

export function CardRowWrapper({ children }: { children: React.ReactNode }) {
  return <Inset horizontal="20px">{children}</Inset>;
}
