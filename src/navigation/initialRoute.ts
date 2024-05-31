import { createContext } from 'react';
import Routes from './routesNames';

export const InitialRouteContext = createContext<string>(Routes.WELCOME_SCREEN);
