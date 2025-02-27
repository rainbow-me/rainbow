/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { BACKEND_NETWORKS_QUERY } = require('../src/resources/metadata/sharedQueries');
require('dotenv').config();
const fs = require('fs-extra');

/**
 * Fetches data from the GraphQL API and saves it to a JSON file.
 */
async function fetchData() {
  const url = `${process.env.METADATA_BASE_URL_STAGING}/v1/graph`;
  console.log(url);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: BACKEND_NETWORKS_QUERY,
      variables: { device: 'APP', includeTestnets: true },
    }),
  });

  const { data } = await response.json();
  const filePath = path.join(__dirname, '../src/references/networks.json');

  await fs.ensureFile(filePath);
  await fs.writeJson(filePath, data);
}

async function main() {
  try {
    console.log('Fetching networks ...');
    await fetchData();
    console.log('Networks data fetched and available.');
    process.exit(0);
  } catch (error) {
    console.error('Error fetching networks data:', error);
    process.exit(1);
  }
}

main();
