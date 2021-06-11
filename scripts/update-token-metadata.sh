git clone https://github.com/trustwallet/assets assets-tmp
node ./scripts/extract-metadata.js assets-tmp/blockchains/ethereum/assets/
mv -f tokens-metadata.json ./src/references/meta/tokens-metadata.json
rm -rf assets-tmp