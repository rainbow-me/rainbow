source "${BASH_SOURCE%/*}/../.env"
wget -O "${BASH_SOURCE%/*}/../src/references/rainbow-token-list/rainbow-token-list.json" "${RAINBOW_LEAN_TOKEN_LIST_URL}"
