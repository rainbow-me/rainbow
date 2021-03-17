import { getLocal, saveLocal } from '@rainbow-me/handlers/localstorage/common';
const CHARTS = 'charts';

/**
 * @desc get charts
 * @param  {String}   [chartsAddress]
 */
export const getAccountChartsPerAddress = chartsAddress =>
  getLocal(`${CHARTS}${chartsAddress}`);
/**
 * @desc save charts data
 * @param  {Object}   [charts]
 * @param  {String}   [chartsAddress]
 */
export const saveAccountChartsPerAddress = (charts, chartsAddress) =>
  saveLocal(`${CHARTS}${chartsAddress}`, charts);
