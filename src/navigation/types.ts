import { createStackNavigator } from '@react-navigation/stack';

export type PartialNavigatorConfigOptions = Pick<
  Partial<Parameters<ReturnType<typeof createStackNavigator>['Screen']>[0]>,
  'options'
>;
