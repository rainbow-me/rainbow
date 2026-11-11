import { createContext } from 'react';

import Routes from './routesNames';

export type InitialRoute = typeof Routes.WELCOME_SCREEN | typeof Routes.SWIPE_LAYOUT;

export const InitialRouteContext = createContext<InitialRoute>(Routes.WELCOME_SCREEN);
