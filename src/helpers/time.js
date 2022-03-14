import lang from 'i18n-js';
import { findKey, isObjectLike, isString, omitBy, pick } from 'lodash';
import parseMilliseconds from 'parse-ms';
import { format, fromUnixTime } from 'date-fns';
import { convertStringToNumber } from './utilities';

const MinimalTimeUnitWhitelist = ['days', 'hours', 'minutes', 'seconds'];

const buildLocalizedTimeUnitString = ({ plural, short, unit }) => {
  const length = short ? 'short' : 'long';
  const plurality = plural ? 'plural' : 'singular';

  return lang.t(`time.${unit}.${length}.${plurality}`);
};

const getHighestResolutionUnit = timeUnitValues => {
  const highestResolutionUnit = findKey(timeUnitValues) || 'seconds';
  return {
    unit: highestResolutionUnit,
    value: timeUnitValues[highestResolutionUnit] || 0,
  };
};

const isZero = number => number === 0;

/**
 * @desc get time string for minimal unit
 * @param {String} [value='']
 * @param {Boolean} [short=true]
 * @param {Boolean} [plural=false]
 * @return {String}
 */
export const getMinimalTimeUnitStringForMs = (
  value = 0,
  short = true,
  plural
) => {
  const ms =
    isObjectLike(value) || isString(value)
      ? convertStringToNumber(value)
      : value;

  const parsedMs = omitBy(
    pick(parseMilliseconds(Number(ms)), MinimalTimeUnitWhitelist),
    isZero
  );

  const {
    unit: highestResolutionUnit,
    value: highestResolutionValue,
  } = getHighestResolutionUnit(parsedMs);

  const label = buildLocalizedTimeUnitString({
    plural,
    short,
    unit: highestResolutionUnit,
  });

  return `${highestResolutionValue} ${label}`;
};

export const connectionTimestamp = handshake => {
  const ms = Number(handshake) / 1000000; // convert from microseconds to milliseconds
  const timestamp = format(fromUnixTime(ms), 'MMM d, yyyy · h:mm a');

  return timestamp;
};
