// adapted from https://github.com/Girish-K/polyfill-Number.toLocaleString-with-Locales
export default function toLocaleStringPolyfill() {
  'use strict';
  // Got this from MDN:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString#Example:_Checking_for_support_for_locales_and_options_arguments
  const roundOff = function (number: any, precision: any) {
    return +(+number).toFixed(precision);
  };
  const replaceSeparators = function (sNum: any, separators: any) {
    sNum = '' + roundOff(sNum, 2);
    const sNumParts = sNum.split('.');
    if (!!separators && separators.thousands) {
      sNumParts[0] = sNumParts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + separators.thousands);
    } else if (!!separators && separators.hundreds) {
      sNumParts[0] = sNumParts[0].replace(/(\d)(?=(\d\d)+(?!\d))/g, '$1' + separators.hundreds);
    }
    sNum = sNumParts.join(separators.decimal);
    return sNum;
  };
  const getLast3Digits = function (sNum: any) {
    sNum = '' + roundOff(sNum, 3);
    const sNumParts = sNum.split('.');
    switch (sNumParts[0].length) {
      case 0:
        sNumParts[0] = '000';
        break;
      case 1:
        sNumParts[0] = '00' + sNumParts[0];
        break;
      case 2:
        sNumParts[0] = '0' + sNumParts[0];
        break;
    }
    sNum = sNumParts.join('.');
    return sNum;
  };
  const renderFormat = function (template: any, props: any) {
    for (const prop in props) {
      template = template.replace('{{' + prop + '}}', props[prop]);
    }
    return template;
  };
  const mapMatch = function (map: any, locale: any) {
    let match = locale;
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    const language = locale && locale.toLowerCase().match(/^\w+/);
    if (!map.hasOwnProperty(locale)) {
      if (map.hasOwnProperty(language)) {
        match = language;
      } else {
        match = 'en';
      }
    }
    return map[match];
  };
  const dotThousCommaDec = function (sNum: any) {
    const separators = {
      decimal: ',',
      thousands: '.',
    };
    return replaceSeparators(sNum, separators);
  };
  const commaThousDotDec = function (sNum: any) {
    const separators = {
      decimal: '.',
      thousands: ',',
    };
    return replaceSeparators(sNum, separators);
  };
  const spaceThousCommaDec = function (sNum: any) {
    const seperators = {
      decimal: ',',
      thousands: '\u00A0',
    };
    return replaceSeparators(sNum, seperators);
  };
  const spaceHundredsCommaThousCommaDec = function (sNum: any) {
    const hundredSeperators = {
        decimal: '.',
        hundreds: ',',
      },
      thoudandSeperators = {
        decimal: '.',
        thousands: ',',
      };
    sNum = +sNum;
    if (sNum >= 1000) {
      return replaceSeparators(Math.floor(sNum / 1000) + '', hundredSeperators) + ',' + getLast3Digits((sNum % 1000) + '');
    } else {
      return replaceSeparators(sNum + '', thoudandSeperators);
    }
  };
  const apostrophThousDotDec = function (sNum: any) {
    const seperators = {
      decimal: '.',
      thousands: '\u0027',
    };
    return replaceSeparators(sNum, seperators);
  };
  const transformForLocale = {
    'en': commaThousDotDec,
    'it': dotThousCommaDec,
    'fr': spaceThousCommaDec,
    'de': dotThousCommaDec,
    'de-DE': dotThousCommaDec,
    'de-AT': dotThousCommaDec,
    'de-CH': apostrophThousDotDec,
    'de-LI': apostrophThousDotDec,
    'de-BE': dotThousCommaDec,
    'hi-IN': spaceHundredsCommaThousCommaDec,
    'en-IN': spaceHundredsCommaThousCommaDec,
    'ro': dotThousCommaDec,
    'ro-RO': dotThousCommaDec,
    'hu': spaceThousCommaDec,
    'hu-HU': spaceThousCommaDec,
    'da-DK': dotThousCommaDec,
    'nb-NO': spaceThousCommaDec,
    'sv-SE': spaceThousCommaDec,
  };
  const currencyFormatMap = {
    'en': 'pre',
    'it': 'post',
    'fr': 'post',
    'de': 'post',
    'de-DE': 'post',
    'de-AT': 'prespace',
    'de-CH': 'prespace',
    'de-LI': 'post',
    'de-BE': 'post',
    'ro': 'post',
    'ro-RO': 'post',
    'hu': 'post',
    'hu-HU': 'post',
    'da-DK': 'post',
    'nb-NO': 'post',
    'sv-SE': 'post',
  };
  const currencySymbols = {
    afn: '؋',
    ars: '$',
    awg: 'ƒ',
    aud: '$',
    azn: '₼',
    bsd: '$',
    bbd: '$',
    byr: 'p.',
    bzd: 'BZ$',
    bmd: '$',
    bob: 'Bs.',
    bam: 'KM',
    bwp: 'P',
    bgn: 'лв',
    brl: 'R$',
    bnd: '$',
    khr: '៛',
    cad: '$',
    kyd: '$',
    clp: '$',
    cny: '¥',
    cop: '$',
    crc: '₡',
    hrk: 'kn',
    cup: '₱',
    czk: 'Kč',
    dkk: 'kr.',
    dop: 'RD$',
    xcd: '$',
    egp: '£',
    svc: '$',
    eek: 'kr',
    eur: '€',
    fkp: '£',
    fjd: '$',
    ghc: '¢',
    gip: '£',
    gtq: 'Q',
    ggp: '£',
    gyd: '$',
    hnl: 'L',
    hkd: '$',
    huf: 'Ft',
    isk: 'kr',
    inr: '₹',
    idr: 'Rp',
    irr: '﷼',
    imp: '£',
    ils: '₪',
    jmd: 'J$',
    jpy: '¥',
    jep: '£',
    kes: 'KSh',
    kzt: 'лв',
    kpw: '₩',
    krw: '₩',
    kgs: 'лв',
    lak: '₭',
    lvl: 'Ls',
    lbp: '£',
    lrd: '$',
    ltl: 'Lt',
    mkd: 'ден',
    myr: 'RM',
    mur: '₨',
    mxn: '$',
    mnt: '₮',
    mzn: 'MT',
    nad: '$',
    npr: '₨',
    ang: 'ƒ',
    nzd: '$',
    nio: 'C$',
    ngn: '₦',
    nok: 'kr',
    omr: '﷼',
    pkr: '₨',
    pab: 'B/.',
    pyg: 'Gs',
    pen: 'S/.',
    php: '₱',
    pln: 'zł',
    qar: '﷼',
    ron: 'lei',
    rub: '₽',
    shp: '£',
    sar: '﷼',
    rsd: 'Дин.',
    scr: '₨',
    sgd: '$',
    sbd: '$',
    sos: 'S',
    zar: 'R',
    lkr: '₨',
    sek: 'kr',
    chf: 'CHF',
    srd: '$',
    syp: '£',
    tzs: 'TSh',
    twd: 'NT$',
    thb: '฿',
    ttd: 'TT$',
    try: '',
    trl: '₤',
    tvd: '$',
    ugx: 'USh',
    uah: '₴',
    gbp: '£',
    usd: '$',
    uyu: '$U',
    uzs: 'лв',
    vef: 'Bs',
    vnd: '₫',
    yer: '﷼',
    zwd: 'Z$',
  };
  const currencyFormats = {
    pre: '{{code}}{{num}}',
    post: '{{num}} {{code}}',
    prespace: '{{code}} {{num}}',
  };

  Number.prototype.toLocaleString = function (locale: any, options: any) {
    if (locale && locale.length < 2) throw new RangeError('Invalid language tag: ' + locale);
    let sNum;
    if (!!options && options.minimumFractionDigits !== undefined) {
      sNum = this.toFixed(options.minimumFractionDigits);
    } else {
      sNum = this.toString();
    }
    sNum = mapMatch(transformForLocale, locale)(sNum, options);
    if (!!options && options.currency && options.style === 'currency') {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      const format = currencyFormats[mapMatch(currencyFormatMap, locale)];
      if (options.currencyDisplay === 'code') {
        sNum = renderFormat(format, {
          num: sNum,
          code: options.currency.toUpperCase(),
        });
      } else {
        sNum = renderFormat(format, {
          num: sNum,
          // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          code: currencySymbols[options.currency.toLowerCase()],
        });
      }
    }
    return '' + sNum;
  };
}
