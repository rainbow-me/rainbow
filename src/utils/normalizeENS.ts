// ENS string normalization taken from https://github.com/ensdomains/eth-ens-namehash/blob/master/index.js
import uts46 from 'idna-uts46-hx';

export default function normalizeENS(name: string) {
  try {
    return uts46.toUnicode(name, { useStd3ASCII: true });
  } catch (err) {
    return name;
  }
}
