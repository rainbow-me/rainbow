import { mapValues, reverse } from 'lodash';
import { Dispatch } from 'redux';
import { AppGetState } from './store';
import ChartTypes, { ChartType } from '@/helpers/chartTypes';
import currenyTypes from '@/helpers/currencyTypes';
import { ETH_ADDRESS } from '@/references';

// -- Constants --------------------------------------- //

const CHARTS_UPDATE = 'charts/CHARTS_UPDATE';

export const DEFAULT_CHART_TYPE = ChartTypes.day;

// -- Actions ---------------------------------------- //

/**
 * A type used to represent chart data points.
 */
type ChartDataPoints = [number, number][];

/**
 * Represents the current `charts` state.
 */
interface ChartsState {
  /**
   * Data for charts in state, organized by address, then chart type, then
   * as an array of `[number, number]` tuples.
   */
  charts: {
    [key: string]: {
      [chartType in ChartType]: ChartDataPoints;
    };
  };

  /**
   * Whether or not the first store is fetching charts.
   */
  fetchingCharts: boolean;
}

/**
 * An action for the `charts` reducer.
 */
type ChartsAction = ChartsUpdateAction;

/**
 * The action for updating chart data.
 */
interface ChartsUpdateAction {
  type: typeof CHARTS_UPDATE;
  payload: ChartsState['charts'];
}

/**
 * A message received from a chart data provider.
 */
export interface ChartsReceivedMessage {
  meta?: {
    charts_type?: ChartType;
    currency?: string;
  };
  payload: {
    charts: {
      [key: string]: [number, number][];
    };
  };
}

/**
 * Updates charts in state to reflect new data.
 *
 * @param message The `ChartsReceivedMessage`.
 */
export const assetChartsReceived = (message: ChartsReceivedMessage) => (dispatch: Dispatch<ChartsUpdateAction>, getState: AppGetState) => {
  const chartType = message?.meta?.charts_type;
  const { charts: existingCharts } = getState().charts;
  const assetCharts = message?.payload?.charts ?? {};
  const { nativeCurrency } = getState().settings;

  if (nativeCurrency.toLowerCase() === message?.meta?.currency) {
    const newChartData = mapValues(assetCharts, (chartData, address) => {
      if (chartType) {
        return {
          ...existingCharts[address],
          // .slice to prevent mutation
          [chartType]: reverse(chartData?.slice()),
        };
      }
      return {
        ...existingCharts[address],
      };
    });

    const updatedCharts = {
      ...existingCharts,
      ...newChartData,
    };
    dispatch({
      payload: updatedCharts,
      type: CHARTS_UPDATE,
    });
  }
};

// -- Reducer ----------------------------------------- //

const INITIAL_STATE: ChartsState = {
  charts: {},
  fetchingCharts: false,
};

export default (state: ChartsState = INITIAL_STATE, action: ChartsAction): ChartsState => {
  switch (action.type) {
    case CHARTS_UPDATE:
      return {
        ...state,
        charts: action.payload,
        fetchingCharts: false,
      };
    default:
      return state;
  }
};
