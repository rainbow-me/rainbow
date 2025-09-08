import * as i18n from '@/languages';
import { findKey, isObjectLike, isString } from 'lodash';
import parseMilliseconds from 'parse-ms';
import { convertStringToNumber, omitBy } from './utilities';

const buildLocalizedTimeUnitString = ({ plural, short, unit }: { plural: boolean; short: boolean; unit: string }) => {
  const length = short ? 'short' : 'long';
  const plurality = plural ? 'plural' : 'singular';

  return i18n.t((i18n.l.time as Record<string, any>)[unit][length][plurality]);
};

const getHighestResolutionUnit = (timeUnitValues: any) => {
  const highestResolutionUnit = findKey(timeUnitValues) || 'seconds';
  return {
    unit: highestResolutionUnit,
    value: timeUnitValues[highestResolutionUnit] || 0,
  };
};

const isZero = (number: any) => number === 0;

/**
 * @desc get time string for minimal unit
 * @param {String} [value='']
 * @param {Boolean} [short=true]
 * @param {Boolean} [plural=false]
 * @return {String}
 */
export const getMinimalTimeUnitStringForMs = (value: string | number = 0, short = true, plural?: any) => {
  const ms = isObjectLike(value) || isString(value) ? convertStringToNumber(value) : value;

  const { days, hours, minutes, seconds } = parseMilliseconds(Number(ms));
  const parsedMs = omitBy({ days, hours, minutes, seconds }, isZero);

  const { unit: highestResolutionUnit, value: highestResolutionValue } = getHighestResolutionUnit(parsedMs);

  const label = buildLocalizedTimeUnitString({
    plural,
    short,
    unit: highestResolutionUnit,
  });

  return `${highestResolutionValue} ${label}`;
};
