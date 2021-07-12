import axios from 'axios';
import { PREFS_ENDPOINT } from '../model/preferences';

export async function getProfileData(address) {
  const response = await axios({
    method: 'get',
    params: {
      address,
    },
    url: `${PREFS_ENDPOINT}/address`,
  });
  const profileData = response.data.data.profile;
  return profileData;
}

export async function getShowcaseTokens(address) {
  const response = await axios({
    method: 'get',
    params: {
      address,
    },
    url: `${PREFS_ENDPOINT}/address`,
  });
  const showcaseTokens = response.data.data.showcase.ids;
  return showcaseTokens;
}
