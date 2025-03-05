#!/bin/bash

source .env
GRAPHQL_CONFIG_FILE="src/graphql/config.js"

REPLACEMENT="s|url: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',|url: 'https://gateway-arbitrum.network.thegraph.com/api/$GRAPH_ENS_API_KEY/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH',|"

if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "$REPLACEMENT" "$GRAPHQL_CONFIG_FILE"
else
  sed -i "$REPLACEMENT" "$GRAPHQL_CONFIG_FILE"
fi
