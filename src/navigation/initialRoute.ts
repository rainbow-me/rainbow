import { createContext } from 'react';
import type Routes from './routesNames';

export type InitialRoute = typeof Routes.WELCOME_SCREEN | typeof Routes.SWIPE_LAYOUT | null;

export const InitialRouteContext = createContext<InitialRoute>(null);
