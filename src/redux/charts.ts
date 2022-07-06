import { mapValues, reverse, toLower } from 'lodash';
import { Dispatch } from 'redux';
import { AppGetState } from './store';
import ChartTypes, { ChartType } from '@rainbow-me/helpers/chartTypes';
import currenyTypes from '@rainbow-me/helpers/currencyTypes';
import { ETH_ADDRESS } from '@rainbow-me/references';

// -- Constants --------------------------------------- //

const CHARTS_UPDATE_CHART_TYPE = 'charts/CHARTS_UPDATE_CHART_TYPE';
const CHARTS_UPDATE = 'charts/CHARTS_UPDATE';
const CHARTS_UPDATE_USD_DAY = 'charts/CHARTS_UPDATE_USD_DAY';
const CHARTS_UPDATE_USD_MONTH = 'charts/CHARTS_UPDATE_USD_MONTH';

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
   * Data for the ETH-USD day chart.
   */
  chartsEthUSDDay: ChartDataPoints;

  /**
   * Data for the ETH-USD month chart.
   */
  chartsEthUSDMonth: ChartDataPoints;

  /**
   * The first store's selected chart type.
   */
  chartType: ChartType;

  /**
   * The second store's selected chart type.
   */
  chartType2: ChartType;

  /**
   * Whether or not the first store is fetching charts.
   */
  fetchingCharts: boolean;

  /**
   * Whether or not the second store is fetching charts.
   */
  fetchingCharts2: boolean;
}

/**
 * An action for the `charts` reducer.
 */
type ChartsAction =
  | ChartsUpdateChartTypeAction
  | ChartsUpdateAction
  | ChartsUpdateUsdDayAction
  | ChartsUpdateUsdMonthAction;

/**
 * The action for updating the current type of chart loaded.
 */
interface ChartsUpdateChartTypeAction {
  type: typeof CHARTS_UPDATE_CHART_TYPE;
  payload: ChartType;
  secondStore: boolean;
}

/**
 * The action for updating chart data.
 */
interface ChartsUpdateAction {
  type: typeof CHARTS_UPDATE;
  payload: ChartsState['charts'];
}

/**
 * The action for updating the ETH-USD day chart data.
 */
interface ChartsUpdateUsdDayAction {
  type: typeof CHARTS_UPDATE_USD_DAY;
  payload: ChartsState['chartsEthUSDDay'];
}

/**
 * The action for updating the ETH-USD month chart data.
 */
interface ChartsUpdateUsdMonthAction {
  type: typeof CHARTS_UPDATE_USD_MONTH;
  payload: ChartsState['chartsEthUSDMonth'];
}

/**
 * A message received from a chart data provider.
 */
interface ChartsReceivedMessage {
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
 * Updates the current chart type in state.
 *
 * @param chartType The new chart type.
 * @param secondStore Whether or not this change should update the second chart
 * store.
 */
export const chartsUpdateChartType = (
  chartType: ChartType,
  secondStore: boolean
) => (dispatch: Dispatch<ChartsUpdateChartTypeAction>) =>
  dispatch({
    payload: chartType,
    secondStore,
    type: CHARTS_UPDATE_CHART_TYPE,
  });

/**
 * Updates charts in state to reflect new data.
 *
 * @param message The `ChartsReceivedMessage`.
 */
export const assetChartsReceived = (message: ChartsReceivedMessage) => (
  dispatch: Dispatch<
    ChartsUpdateAction | ChartsUpdateUsdDayAction | ChartsUpdateUsdMonthAction
  >,
  getState: AppGetState
) => {
  const chartType = message?.meta?.charts_type;
  const { charts: existingCharts } = getState().charts;
  const assetCharts = message?.payload?.charts ?? {};
  const { nativeCurrency } = getState().settings;
  if (toLower(nativeCurrency) === message?.meta?.currency) {
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

  if (
    message?.meta?.currency === currenyTypes.usd &&
    assetCharts[ETH_ADDRESS]
  ) {
    if (message?.meta?.charts_type === ChartTypes.month) {
      dispatch({
        payload: reverse(assetCharts[ETH_ADDRESS]),
        type: CHARTS_UPDATE_USD_MONTH,
      });
    } else if (message?.meta?.charts_type === ChartTypes.day) {
      dispatch({
        payload: reverse(assetCharts[ETH_ADDRESS]),
        type: CHARTS_UPDATE_USD_DAY,
      });
    }
  }
};

// -- Reducer ----------------------------------------- //

const INITIAL_STATE: ChartsState = {
  charts: {},
  chartsEthUSDDay: [],
  chartsEthUSDMonth: [],
  chartType: DEFAULT_CHART_TYPE,
  chartType2: DEFAULT_CHART_TYPE,
  fetchingCharts: false,
  fetchingCharts2: false,
};

export default (
  state: ChartsState = INITIAL_STATE,
  action: ChartsAction
): ChartsState => {
  switch (action.type) {
    case CHARTS_UPDATE_CHART_TYPE:
      return {
        ...state,
        [action.secondStore ? 'chartType2' : 'chartType']: action.payload,
        [action.secondStore ? 'fetchingCharts2' : 'fetchingCharts']: true,
      };
    case CHARTS_UPDATE:
      return {
        ...state,
        charts: action.payload,
        fetchingCharts: false,
        fetchingCharts2: false,
      };
    case CHARTS_UPDATE_USD_DAY:
      return {
        ...state,
        chartsEthUSDDay: action.payload,
      };
    case CHARTS_UPDATE_USD_MONTH:
      return {
        ...state,
        chartsEthUSDMonth: action.payload,
      };
    default:
      return state;
  }
};
