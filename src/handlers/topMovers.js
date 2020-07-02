import axios from 'axios';
import logger from 'logger';

const api = axios.create({
  baseURL: 'https://dapple.rainbow.me/get_top_movers',
  headers: {
    Accept: 'application/json',
  },
  timeout: 20000, // 20 secs
});

export const apiGetTopMovers = async () => {
  try {
    const { data } = await api.get();
    return data;
  } catch (error) {
    logger.log('Error getting top movers', error);
    throw error;
  }
};
