import {
  convertStringToNumber,
  divide,
  formatFixedDecimals,
  multiply,
} from './utilities';
import timeUnits from '../references/time-units.json';
import lang from '../languages';

/**
 * @desc get time string for minimal unit
 * @param {String} [value='']
 * @param {String} [unit='ms']
 * @param {Boolean} [short=false]
 * @return {String}
 */
export const getTimeString = (value = '', unit = 'ms', short = false) => {
  if (!value) return null;
  let _value = convertStringToNumber(value);
  let _unit = '';
  let _unitShort = '';
  if (_value) {
    if (unit === 'miliseconds' || unit === 'ms') {
      if (_value === 1) {
        _unit = lang.t('time.milisecond');
        _unitShort = lang.t('time.ms');
      } else if (
        _value >= timeUnits.ms.second
        && _value < timeUnits.ms.minute
      ) {
        _value = formatFixedDecimals(divide(_value, timeUnits.ms.second), 2);
        if (_value === 1) {
          _unit = lang.t('time.second');
          _unitShort = lang.t('time.sec');
        } else {
          _unit = lang.t('time.seconds');
          _unitShort = lang.t('time.secs');
        }
      } else if (_value >= timeUnits.ms.minute && _value < timeUnits.ms.hour) {
        _value = formatFixedDecimals(divide(_value, timeUnits.ms.minute), 2);
        if (_value === 1) {
          _unit = lang.t('time.minute');
          _unitShort = lang.t('time.min');
        } else {
          _unit = lang.t('time.minutes');
          _unitShort = lang.t('time.mins');
        }
      } else if (_value >= timeUnits.ms.hour && _value < timeUnits.ms.day) {
        _value = formatFixedDecimals(divide(_value, timeUnits.ms.hour), 2);
        if (_value === 1) {
          _unit = lang.t('time.hour');
          _unitShort = lang.t('time.hr');
        } else {
          _unit = lang.t('time.hours');
          _unitShort = lang.t('time.hrs');
        }
      } else if (_value >= timeUnits.ms.day) {
        _value = formatFixedDecimals(divide(_value, timeUnits.ms.day), 2);
        if (_value === 1) {
          _unit = lang.t('time.day');
          _unitShort = lang.t('time.day');
        } else {
          _unit = lang.t('time.days');
          _unitShort = lang.t('time.days');
        }
      } else {
        _unit = lang.t('time.miliseconds');
        _unitShort = lang.t('time.ms');
      }
    } else if (unit === 'seconds' || unit === 'secs') {
      if (_value === 1) {
        _unit = lang.t('time.second');
        _unitShort = lang.t('time.sec');
      } else if (_value < 1) {
        _value = formatFixedDecimals(multiply(_value, timeUnits.ms.second));
        if (_value === 1) {
          _unit = lang.t('time.milisecond');
          _unitShort = lang.t('time.ms');
        } else {
          _unit = lang.t('time.miliseconds');
          _unitShort = lang.t('time.ms');
        }
      } else if (
        _value >= timeUnits.secs.minute
        && _value < timeUnits.secs.hour
      ) {
        _value = formatFixedDecimals(divide(_value, timeUnits.secs.minute), 2);
        if (_value === 1) {
          _unit = lang.t('time.minute');
          _unitShort = lang.t('time.min');
        } else {
          _unit = lang.t('time.minutes');
          _unitShort = lang.t('time.mins');
        }
      } else if (_value >= timeUnits.secs.hour && _value < timeUnits.secs.day) {
        _value = formatFixedDecimals(divide(_value, timeUnits.secs.hour), 2);
        if (_value === 1) {
          _unit = lang.t('time.hour');
          _unitShort = lang.t('time.hr');
        } else {
          _unit = lang.t('time.hours');
          _unitShort = lang.t('time.hrs');
        }
      } else if (_value >= timeUnits.secs.day) {
        _value = formatFixedDecimals(divide(_value, timeUnits.secs.day), 2);
        if (_value === 1) {
          _unit = lang.t('time.day');
          _unitShort = lang.t('time.day');
        } else {
          _unit = lang.t('time.days');
          _unitShort = lang.t('time.days');
        }
      } else {
        _unit = lang.t('time.seconds');
        _unitShort = lang.t('time.secs');
      }
    } else if (unit === 'minutes' || unit === 'mins') {
      if (_value === 1) {
        _unit = lang.t('time.minute');
        _unitShort = lang.t('time.min');
      } else if (_value < 1) {
        _value = formatFixedDecimals(multiply(_value, timeUnits.secs.minute));
        if (_value === 1) {
          _unit = lang.t('time.second');
          _unitShort = lang.t('time.sec');
        } else {
          _unit = lang.t('time.seconds');
          _unitShort = lang.t('time.secs');
        }
      } else if (_value > timeUnits.mins.hour && _value < timeUnits.mins.day) {
        _value = formatFixedDecimals(divide(_value, timeUnits.mins.hour), 2);
        if (_value === 1) {
          _unit = lang.t('time.hour');
          _unitShort = lang.t('time.hr');
        } else {
          _unit = lang.t('time.hours');
          _unitShort = lang.t('time.hrs');
        }
      } else if (_value >= timeUnits.mins.day) {
        _value = formatFixedDecimals(divide(_value, timeUnits.mins.day), 2);
        if (_value === 1) {
          _unit = lang.t('time.day');
          _unitShort = lang.t('time.day');
        } else {
          _unit = lang.t('time.days');
          _unitShort = lang.t('time.days');
        }
      } else {
        _unit = lang.t('time.minutes');
        _unitShort = lang.t('time.mins');
      }
    }
  }
  if (short) {
    return `${_value} ${_unitShort}`;
  }
  return `${_value} ${_unit}`;
};
