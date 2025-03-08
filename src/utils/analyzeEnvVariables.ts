import { logger, RainbowError } from '@/logger';
import {
  METADATA_BASE_URL,
  ARC_GRAPHQL_API_KEY,
  METADATA_GRAPHQL_API_KEY,
  ADDYS_API_KEY,
  ADDYS_BASE_URL,
  TOKEN_LAUNCHER_API_KEY,
  TOKEN_LAUNCHER_URL,
} from 'react-native-dotenv';
import { getRainbowMeteorologyApi } from '@/handlers/gasFees';
import { showLogSheet } from '@/components/debugging/LogSheet';
import { getAddysHttpClient } from '@/resources/addys/client';

/**
 * Analyzes environment variables and API clients in the app
 * Displays the results in a log sheet
 */
export const analyzeEnvVariables = () => {
  // Collect environment variables we know exist
  const envVars: Record<string, string> = {};

  // Add known environment variables
  if (METADATA_BASE_URL) envVars['METADATA_BASE_URL'] = METADATA_BASE_URL;
  if (METADATA_GRAPHQL_API_KEY) envVars['METADATA_GRAPHQL_API_KEY'] = METADATA_GRAPHQL_API_KEY;
  if (ADDYS_BASE_URL) envVars['ADDYS_BASE_URL'] = ADDYS_BASE_URL;
  if (ADDYS_API_KEY) envVars['ADDYS_API_KEY'] = ADDYS_API_KEY;
  if (TOKEN_LAUNCHER_URL) envVars['TOKEN_LAUNCHER_URL'] = TOKEN_LAUNCHER_URL;
  if (TOKEN_LAUNCHER_API_KEY) envVars['TOKEN_LAUNCHER_API_KEY'] = TOKEN_LAUNCHER_API_KEY;
  if (ARC_GRAPHQL_API_KEY) envVars['ARC_GRAPHQL_API_KEY'] = ARC_GRAPHQL_API_KEY;

  // Find all RainbowFetchClient instances in the app
  const fetchClients: Record<string, any> = {};

  // Add the known RainbowFetchClient from gasFees.ts
  try {
    const meteorologyApi = getRainbowMeteorologyApi();
    if (meteorologyApi) {
      fetchClients['rainbowMeteorologyApi'] = {
        baseURL: meteorologyApi.baseURL || 'undefined',
        // Access properties safely with type casting
        headers: (meteorologyApi as any).defaults?.headers || {},
        timeout: (meteorologyApi as any).defaults?.timeout,
      };
    }
  } catch (e) {
    logger.error(new RainbowError(`Error accessing meteorology API: ${e}`));
  }

  // Try to get other known clients if they exist in global scope
  try {
    // @ts-ignore - Global object access
    const globalClients = Object.keys(global)
      .filter(key => key.includes('Api') || key.includes('Client') || key.includes('Fetch'))
      .reduce((acc: Record<string, any>, key) => {
        try {
          // @ts-ignore - Global object access
          const client = global[key];
          if (client && typeof client === 'object') {
            if (client.baseURL) {
              acc[key] = {
                baseURL: client.baseURL,
                headers: client.defaults?.headers || {},
                timeout: client.defaults?.timeout,
              };
            } else if (client.defaults?.baseURL) {
              acc[key] = {
                baseURL: client.defaults.baseURL,
                headers: client.defaults?.headers || {},
                timeout: client.defaults?.timeout,
              };
            }
          }
        } catch (err) {
          // Ignore errors for individual clients
        }
        return acc;
      }, {});

    globalClients['addysHttpClient'] = getAddysHttpClient();

    Object.assign(fetchClients, globalClients);
  } catch (e) {
    logger.error(new RainbowError(`Error finding global RainbowFetchClients: ${e}`));
  }

  // Create formatted data for the log sheet
  const logEntries = [
    { title: '🔍 Environment Variables Analysis', message: '' },
    { title: 'Environment Variables', message: JSON.stringify(envVars, null, 2) },
    { title: 'Fetch Clients', message: JSON.stringify(fetchClients, null, 2) },
  ];

  // Show the log sheet with the data
  showLogSheet({ data: logEntries });

  // Also log to console for easier debugging
  console.log('[ENV VARIABLES ANALYSIS]', {
    envVars,
    fetchClients,
  });
};
