/* eslint-disable no-console */
/* eslint-disable import/no-commonjs */
const { readdirSync, writeFileSync } = require('fs');
const sizeOf = require('image-size');
const {
  default: makeColorMoreChill,
  isBlackOrWhite,
} = require('make-color-more-chill');
const Vibrant = require('node-vibrant');

const start = Date.now();

const args = process.argv.slice(2);
const assets_dir = args[0];
console.log('Extracting metadata...');

const getDirectories = source =>
  readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const tokenAddresses = getDirectories(assets_dir);
let allItems = {};
const init = async () => {
  for (let i = 0; i < tokenAddresses.length; i++) {
    const address = tokenAddresses[i];
    const imageUrl = `https://raw.githubusercontent.com/rainbow-me/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
    let metadata = {};
    try {
      const filePath = `${assets_dir}/${address}/logo.png`;
      const { width, height } = sizeOf(filePath);
      metadata.dimensions = {
        height,
        isSquare: height === width,
        width,
      };

      const palette = await Vibrant.from(filePath).getPalette();
      const primaryColor = palette.Vibrant.hex;
      const secondaryColor = palette.Muted.hex;
      let color = makeColorMoreChill(primaryColor);
      if (isBlackOrWhite(secondaryColor)) {
        color = makeColorMoreChill(primaryColor);
      }
      if (isBlackOrWhite(primaryColor)) {
        color = makeColorMoreChill(secondaryColor);
      }
      if (color) {
        metadata.color = color;
      }
      // eslint-disable-next-line no-empty
    } catch (e) {
    } finally {
      allItems[imageUrl] = metadata;
    }
  }

  const data = JSON.stringify(allItems);
  writeFileSync('tokens-metadata.json', data);

  const end = Date.now();
  const time = (end - start) / 1000;
  console.log(`Processed ${tokenAddresses.length} images`);
  console.log(`Took ${time} seconds`);
};

init();
