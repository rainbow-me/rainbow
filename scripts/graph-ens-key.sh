#!/bin/bash

source .env
GRAPHQL_CONFIG_FILE="src/graphql/config.js"

sed -i$(if [[ "$OSTYPE" == "darwin"* ]]; then echo " ''"; fi) "s|url: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens',|url: 'https://gateway-arbitrum.network.thegraph.com/api/$GRAPH_ENS_API_KEY/subgraphs/id/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH',|" "$GRAPHQL_CONFIG_FILE"
