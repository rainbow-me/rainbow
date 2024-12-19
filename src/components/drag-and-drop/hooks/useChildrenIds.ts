import React, { Children, ReactNode, useMemo } from 'react';
import type { UniqueIdentifier } from '../types';

export const useChildrenIds = (children: ReactNode): UniqueIdentifier[] => {
  return useMemo(() => {
    const ids = Children.map(children, child => {
      if (React.isValidElement(child)) {
        return (child.props as { id?: UniqueIdentifier }).id;
      }
      return null;
    });

    return ids ? ids.filter(Boolean) : [];
  }, [children]);
};
