git clone https://github.com/rainbow-me/rainbow-token-list token-list-tmp
cd token-list-tmp && yarn && yarn build
cp -rf output/rainbow-token-list.json ../src/references/uniswap/rainbow-token-list.json
cd ..
rm -rf token-list-tmp