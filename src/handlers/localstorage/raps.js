import { getGlobal, saveGlobal } from './common';

const LOCAL_RAPS = 'localRaps';

const rapsVersion = '0.2.1';

/**
 * @desc get raps
 * @return {Object}
 */
export const getRaps = () => getGlobal(LOCAL_RAPS, [], rapsVersion);

/**
 * @desc save raps
 */
export const saveRaps = raps => saveGlobal(LOCAL_RAPS, raps, rapsVersion);
