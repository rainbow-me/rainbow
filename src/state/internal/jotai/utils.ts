import { DependencyList } from 'react';

export function isDependencyList<Selected>(
  arg: ((a: Selected, b: Selected) => boolean) | DependencyList | undefined
): arg is DependencyList {
  return Array.isArray(arg);
}
