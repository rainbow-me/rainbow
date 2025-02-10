import { hydrate } from '@tanstack/react-query';
import { MMKV } from 'react-native-mmkv';
import { LogEntry, showLogSheet } from '@/components/debugging/LogSheet';
import { IS_DEV } from '@/env';
import isTestFlight from '@/helpers/isTestFlight';
import { RainbowError, logger } from '@/logger';
import { persistOptions, queryClient } from '@/react-query';
import { favoritesQueryKey } from '@/resources/favorites';
import { REACT_QUERY_STORAGE_ID } from '@/storage/legacy';

// ============ clearReactQueryCache =========================================== //

/**
 * Represents the entire persisted React Query cache.
 */
interface ReactQueryCache {
  data: {
    clientState: {
      queries: CachedQuery[];
    };
  };
}

/**
 * Represents an individual query record in the cache.
 */
interface CachedQuery {
  queryKey: string | object[];
  state?: {
    data: unknown;
    dataUpdatedAt?: number;
  };
}

/**
 * Clears the React Query cache, optionally preserving favorite-related queries.
 *
 * @param analyzeAfterClearing - If `true`, analyzes the cache after clearing. Defaults to `true` in dev and TestFlight envs.
 * @param onComplete - A callback function that is called after the cache is cleared.
 * @param preserveFavorites - If `true`, preserves favorites-related queries.
 * @returns A promise that resolves after the cache is cleared.
 */
export async function clearReactQueryCache({
  analyzeAfterClearing = IS_DEV || isTestFlight,
  onComplete,
  preserveFavorites = true,
}: {
  analyzeAfterClearing?: boolean;
  onComplete?: (deletedQueries: number, totalSizeMb: number) => void;
  preserveFavorites?: boolean;
} = {}): Promise<void> {
  let deletedQueries: number | null = null;
  let totalSizeMb: number | null = null;

  try {
    if (preserveFavorites) {
      const store = new MMKV({ id: REACT_QUERY_STORAGE_ID });
      const storedString = store.getString(REACT_QUERY_STORAGE_ID);
      if (!storedString) {
        devLog('No queries found in storage');
        return;
      }

      const parsedCache: ReactQueryCache = JSON.parse(storedString);
      const clientState = parsedCache.data.clientState;
      if (!clientState?.queries) {
        devLog('No queries found in clientState');
        return;
      }

      const { queries } = clientState;
      const favorites = queries.filter(query => isFavoritesQuery(query));

      devLog(`Found ${queries.length - favorites.length} queries to remove`);

      // Re-save only favorites data
      const filteredCache: ReactQueryCache = {
        ...parsedCache,
        data: {
          ...parsedCache.data,
          clientState: {
            ...clientState,
            queries: favorites,
          },
        },
      };

      store.set(REACT_QUERY_STORAGE_ID, JSON.stringify(filteredCache));
      queryClient.clear();

      if (analyzeAfterClearing || onComplete) {
        deletedQueries = queries.length - favorites.length;
        totalSizeMb = storedString.length / 1024 / 1024;
      }

      devLog('Successfully removed all queries (except favorites)');
    } else {
      // Completely delete all queries
      queryClient.clear();
      const store = new MMKV({ id: REACT_QUERY_STORAGE_ID });
      store.clearAll();
      devLog('Successfully deleted all queries');
    }

    await forceRehydrateQueryClient();
    onComplete?.(deletedQueries ?? 0, totalSizeMb ?? 0);

    // Optionally run analysis
    if (analyzeAfterClearing) {
      analyzeReactQueryStore({
        displayReport: true,
        transformReport: report => {
          // Insert deletion stats into the report
          if (report[1]) {
            const remainingQueries = parseFloat(report[1].title.split(' ')[1]);
            report[1].title = `Preserved ${remainingQueries} ${remainingQueries === 1 ? 'Query' : 'Queries'}`;
          }
          return [
            { title: '✅  React Query Cache Cleared', message: '' },
            { title: `Deleted ${deletedQueries ?? 0} Queries`, message: '' },
            { title: `Total Size Deleted: ${(totalSizeMb ?? 0).toFixed(2)} MB`, message: '' },
            ...report,
          ];
        },
      });
    }
  } catch (error) {
    if (preserveFavorites) {
      logger.error(
        new RainbowError('First attempt to clear React Query cache failed (preserveFavorites = true):', {
          cause: error,
        })
      );
      try {
        clearReactQueryCache({ preserveFavorites: false });
      } catch (retryError) {
        logger.error(
          new RainbowError('Second attempt to clear React Query cache failed (preserveFavorites = false):', {
            cause: retryError,
          })
        );
      }
    } else {
      logger.error(new RainbowError('Failed to clear React Query cache:', { cause: error }));
    }
  }
}

// ============ forceRehydrateQueryClient ====================================== //

/**
 * Reloads the latest persisted React Query data from MMKV and rehydrates the query client.
 * @returns A promise that resolves after the query client is rehydrated.
 */
export async function forceRehydrateQueryClient(): Promise<void> {
  try {
    const persistedClient = await persistOptions.persister.restoreClient();
    if (persistedClient?.clientState) {
      hydrate(queryClient, persistedClient.clientState);
      devLog('✅ [forceRehydrateQueryClient] Query client successfully rehydrated from persisted state');
    } else {
      devLog('❌ [forceRehydrateQueryClient] No persisted state found for rehydration');
    }
  } catch (error) {
    logger.error(
      new RainbowError('[forceRehydrateQueryClient] Error during forced React Query rehydration:', {
        cause: error,
      })
    );
  }
}

// ============ analyzeReactQueryStore ========================================= //

interface QueryInfo {
  lastUpdated?: number;
  queryKey: string | object[];
  size: number;
  type: string;
}

/**
 * Analyzes the persisted React Query cache and logs the results.
 * Note: This is a development tool and should not be used in production.
 *
 * @param displayReport - Whether to display a sheet containing analysis results. Defaults to false in production, true in dev/testflight.
 * @param logExtendedBreakdown - Whether to log an extended breakdown of queries. Defaults to true.
 * @param logQueryDataShape - Whether to log the shape of the persisted data. Defaults to false.
 * @param transformReport - A function that transforms the report array before display. Defaults to no transformation.
 * @returns A formatted report array or undefined if not displayed.
 */
export function analyzeReactQueryStore({
  displayReport = IS_DEV || isTestFlight,
  logExtendedBreakdown = true,
  logQueryDataShape: logQueryDataShapeParam = false,
  transformReport = report => report,
}: {
  displayReport?: boolean;
  logExtendedBreakdown?: boolean;
  logQueryDataShape?: boolean;
  transformReport?: (report: LogEntry[]) => LogEntry[];
} = {}): ReturnType<typeof formatReport> | undefined {
  if (!IS_DEV && !isTestFlight) return;

  devLog('\n[React Query Store Analysis]');
  const report: Report | null = displayReport ? { title: { title: '🔦  React Query Analysis', message: '' } } : null;

  // Get the React Query cache directly from MMKV
  const store = new MMKV({ id: REACT_QUERY_STORAGE_ID });
  const storedData = store.getString(REACT_QUERY_STORAGE_ID);

  if (!storedData) {
    devLog('No React Query cache found');
    if (displayReport) {
      showLogSheet({
        data: transformReport([{ title: 'React Query Analysis', message: 'No React Query cache found' }]),
      });
    }
    return;
  }

  try {
    const parsedCache: ReactQueryCache = JSON.parse(storedData);

    // Optionally log the data shape
    if (logQueryDataShapeParam) logQueryDataShape(parsedCache);

    // Extract queries or early exit if none
    const clientState = parsedCache.data.clientState;
    if (!clientState?.queries) {
      devLog('No queries found in clientState');
      if (displayReport) {
        showLogSheet({
          data: transformReport([{ title: 'React Query Analysis', message: 'No queries found in the cache' }]),
        });
      }
      return;
    }

    const queries = clientState.queries;
    devLog(`\nFound ${queries.length} ${queries.length === 1 ? 'query' : 'queries'}`);
    if (report) {
      report.numberOfQueries = {
        title: `Found ${queries.length} ${queries.length === 1 ? 'Query' : 'Queries'}`,
        message: '',
      };
    }

    // Build an array of QueryInfo objects
    const querySizes = queries.map(query => {
      const dataString = JSON.stringify(query.state?.data || {});
      return {
        size: dataString.length,
        queryKey: query.queryKey,
        lastUpdated: query.state?.dataUpdatedAt,
        type: Array.isArray(query.queryKey) && query.queryKey.length > 1 ? String(query.queryKey[1]) : 'Unknown',
      };
    });

    // Group queries by type
    const sizeByType = buildSizeByType(querySizes);

    // Report total size
    logTotalSize(querySizes, report);

    // Report size by type
    logSizeByType(sizeByType, report);

    // Report query size distribution
    logQuerySizeDistribution(querySizes, report);

    // Extended breakdown: Top 10 largest by aggregated type size
    if (logExtendedBreakdown) logTop10BySize(sizeByType, report);

    // Top 10 queries by number of cache entries
    logTop10ByEntries(querySizes, report);

    // Finally, display the analysis if requested
    if (report) {
      showLogSheet({ data: transformReport(formatReport(report)) });
      return formatReport(report);
    }
  } catch (error) {
    devLog('Error analyzing queries:', error);
    if (error instanceof Error) {
      devLog('Error message:', error.message);
      devLog('Error stack:', error.stack);
    }
  }
}

/**
 * Logs the shape of the React Query cache.
 */
function logQueryDataShape(parsedCache: ReactQueryCache) {
  const analyzeShape = (obj: unknown, depth = 0): string => {
    if (depth > 10) return 'Exceeds Maximum Depth';
    if (obj === null) return 'null';

    if (Array.isArray(obj)) {
      if (!obj.length) return 'empty[]';
      return `Array(${obj.length})<${analyzeShape(obj[0], depth + 1)}>`;
    }

    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (!entries.length) return '{}';
      const indent = ' '.repeat((depth + 1) * 2);
      const mapped = entries.map(([key, value]) => `${indent}${key}: ${analyzeShape(value, depth + 1)}`).join(',\n');
      return `{\n${mapped}\n${' '.repeat(depth * 2)}}`;
    }

    return typeof obj;
  };

  devLog('Shape:', analyzeShape(parsedCache));
}

/**
 * Builds a record of type -> { totalSize, queries[] } from an array of QueryInfo objects.
 */
function buildSizeByType(querySizes: QueryInfo[]): Record<string, { totalSize: number; queries: QueryInfo[] }> {
  return querySizes.reduce<Record<string, { totalSize: number; queries: QueryInfo[] }>>((acc, entry) => {
    if (!acc[entry.type]) acc[entry.type] = { totalSize: 0, queries: [] };
    acc[entry.type].totalSize += entry.size;
    acc[entry.type].queries.push(entry);
    return acc;
  }, {});
}

/**
 * Logs the total size, adds it to the report, and returns its numerical value.
 */
function logTotalSize(querySizes: QueryInfo[], report: Report | null): number {
  const totalSize = querySizes.reduce((sum, q) => sum + q.size, 0);
  const sizeMbString = (totalSize / (1024 * 1024)).toFixed(2);
  devLog(`\nTotal Size: ${sizeMbString} MB`);
  if (report) report.totalSize = { title: `Total Size: ${sizeMbString} MB`, message: '' };
  return totalSize;
}

/**
 * Logs size by query type, sorted descending by total size.
 */
function logSizeByType(sizeByType: Record<string, { totalSize: number; queries: QueryInfo[] }>, report: Record<string, LogEntry> | null) {
  devLog('\nSize by Query Type:');
  if (report) report.sizeByType = { title: 'Size by Query Type', message: '' };

  Object.entries(sizeByType)
    .sort(([, a], [, b]) => b.totalSize - a.totalSize)
    .forEach(([type, { totalSize }]) => {
      const sizeMb = (totalSize / (1024 * 1024)).toFixed(2);
      devLog(`${type}: ${sizeMb} MB`);
      if (report) report.sizeByType.message += `${type}: ${sizeMb} MB\n`;
    });
}

/**
 * Logs query size distribution in defined buckets (<10KB, 10-100KB, etc.).
 */
function logQuerySizeDistribution(querySizes: QueryInfo[], report: Report | null) {
  const sizeRanges = {
    '1MB+': 0,
    '500KB-1MB': 0,
    '100KB-500KB': 0,
    '10KB-100KB': 0,
    '<10KB': 0,
  };

  querySizes.forEach(q => {
    const sizeKB = q.size / 1024;
    if (sizeKB >= 1024) sizeRanges['1MB+'] += 1;
    else if (sizeKB >= 500) sizeRanges['500KB-1MB'] += 1;
    else if (sizeKB >= 100) sizeRanges['100KB-500KB'] += 1;
    else if (sizeKB >= 10) sizeRanges['10KB-100KB'] += 1;
    else sizeRanges['<10KB'] += 1;
  });

  devLog('\nQuery Size Distribution:');
  const logEntry: LogEntry = { title: 'Query Size Distribution', message: '' };

  Object.entries(sizeRanges).forEach(([range, count]) => {
    devLog(`${range}: ${count} ${count === 1 ? 'query' : 'queries'}`);
    if (report) logEntry.message += `${range}: ${count} ${count === 1 ? 'query' : 'queries'}\n`;
  });

  if (report) report.querySizeDistribution = logEntry;
}

/**
 * Logs the top 10 queries by size per query type.
 */
function logTop10BySize(sizeByType: Record<string, { totalSize: number; queries: QueryInfo[] }>, report: Report | null) {
  devLog('\nTop 10 Largest Queries:');
  const logEntry: LogEntry = { title: 'Top 10 Largest Queries', message: '' };

  const sorted = Object.entries(sizeByType)
    .sort(([, a], [, b]) => b.totalSize - a.totalSize)
    .slice(0, 10);
  sorted.forEach(([type, { totalSize, queries }], index) => {
    // Find most recently updated query for this type
    const mostRecentQuery = queries.reduce((latest, current) => {
      if (!latest.lastUpdated) return current;
      if (!current.lastUpdated) return latest;
      return current.lastUpdated > latest.lastUpdated ? current : latest;
    }, queries[0]);

    devLog(`${index === 0 ? '' : '\n'}#${index + 1}:`);
    if (report) logEntry.message += `${index === 0 ? '' : '\n'}#${index + 1}:\n`;

    devLog(`Type: ${type}`);
    if (report) logEntry.message += `Type: ${type}\n`;

    const sizeStr = totalSize >= 1024 * 1024 ? (totalSize / (1024 * 1024)).toFixed(2) + ' MB' : (totalSize / 1024).toFixed(2) + ' KB';

    devLog(`Total Size: ${sizeStr}`);
    if (report) logEntry.message += `Total Size: ${sizeStr}\n`;

    devLog(`Query Key: ${JSON.stringify(mostRecentQuery.queryKey)}`);
    if (report) logEntry.message += `Example Query Key: ${JSON.stringify(mostRecentQuery.queryKey)}\n`;

    if (mostRecentQuery.lastUpdated) {
      const updatedAt = new Date(mostRecentQuery.lastUpdated).toLocaleString('en-US', {
        day: '2-digit',
        hour: '2-digit',
        hour12: true,
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      devLog(`Last Updated: ${updatedAt}`);
      if (report) logEntry.message += `Last Updated: ${updatedAt}\n`;
    }
  });

  if (report) report.top10BySize = logEntry;
}

/**
 * Logs the top 10 queries by number of cache entries per query type.
 */
function logTop10ByEntries(querySizes: QueryInfo[], report: Report | null) {
  const queryCountByType = querySizes.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.type] = (acc[entry.type] ?? 0) + 1;
    return acc;
  }, {});

  const sortedTypes = Object.entries(queryCountByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  let logEntry: LogEntry;

  devLog('\nTop 10 Queries by Entries:');
  if (report) logEntry = { title: 'Top 10 Queries by Entries', message: '' };

  sortedTypes.forEach(([type, count], index) => {
    devLog(`\n#${index + 1}:`);
    if (report) logEntry.message += `${index === 0 ? '' : '\n'}#${index + 1}:\n`;

    devLog(`Type: ${type}`);
    if (report) logEntry.message += `Type: ${type}\n`;

    devLog(`Number of Cache Entries: ${count}`);
    if (report) logEntry.message += `Number of Cache Entries: ${count}\n`;

    const exampleQuery = querySizes.find(q => q.type === type);
    if (exampleQuery) {
      devLog(`Example Query Key: ${JSON.stringify(exampleQuery.queryKey)}`);
      if (report) logEntry.message += `Example Query Key: ${JSON.stringify(exampleQuery.queryKey)}\n`;
    }

    if (report) report.top10ByEntries = logEntry;
  });
}

// ============ Utilities ====================================================== //

function isFavoritesQuery(query: CachedQuery): boolean {
  return (
    query.queryKey[1] === favoritesQueryKey[1] &&
    typeof query.queryKey[2] === 'object' &&
    'persisterVersion' in query.queryKey[2] &&
    query.queryKey[2].persisterVersion === favoritesQueryKey[2].persisterVersion
  );
}

/**
 * Logs messages to the console in dev mode only.
 */
function devLog(...args: Parameters<typeof console.log>) {
  if (IS_DEV) console.log(...args);
}

type Report = Partial<Record<ReportKeys, LogEntry>>;

/**
 * Ordered keys that may be present in the report.
 */
enum ReportKeys {
  title = 'title',
  numberOfQueries = 'numberOfQueries',
  totalSize = 'totalSize',
  querySizeDistribution = 'querySizeDistribution',
  sizeByType = 'sizeByType',
  top10BySize = 'top10BySize',
  top10ByEntries = 'top10ByEntries',
}

/**
 * Formats a report object into an ordered array based on REPORT_ORDER.
 */
function formatReport(report: Report): LogEntry[] {
  return Object.values(ReportKeys)
    .map(key => report[key])
    .filter(Boolean);
}
