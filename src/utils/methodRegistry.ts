import { Contract } from '@ethersproject/contracts';
import { isEmpty } from 'lodash';
import { web3Provider } from '../handlers/web3';
import namesOverrides from '../references/method-names-overrides.json';
import methodRegistryABI from '../references/method-registry-abi.json';
import { metadataClient } from '@rainbow-me/apollo/client';
import { CONTRACT_FUNCTION } from '@rainbow-me/apollo/queries';

const METHOD_REGISTRY_ADDRESS = '0x44691B39d1a75dC4E0A0346CBB15E310e6ED1E86';

export const methodRegistryLookupAndParse = async (
  methodSignatureBytes: any
) => {
  let signature = '';

  const response = await metadataClient.queryWithTimeout(
    {
      query: CONTRACT_FUNCTION,
      variables: {
        chainID: 1,
        hex: methodSignatureBytes,
      },
    },
    800
  );

  if (!isEmpty(response?.data?.contractFunction?.text)) {
    signature = response.data.contractFunction.text;
  } else {
    const registry = new Contract(
      METHOD_REGISTRY_ADDRESS,
      methodRegistryABI,
      web3Provider
    );

    signature = await registry.entries(methodSignatureBytes);
  }

  const rawName = signature.match(new RegExp('^([^)(]*)\\((.*)\\)([^)(]*)$'));
  let parsedName;

  if (rawName) {
    parsedName =
      rawName[1].charAt(0).toUpperCase() +
      rawName[1]
        .slice(1)
        .split(/(?=[A-Z]{1})/)
        .join(' ');

    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    if (namesOverrides[parsedName]) {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      parsedName = namesOverrides[parsedName];
    }
  } else {
    parsedName = '';
  }

  const match = signature.match(
    new RegExp(rawName[1] + '\\(+([a-z1-9,()]+)\\)')
  );

  let args = [];
  if (match) {
    args = match[1].match(/[A-z1-9]+/g).map((arg: any) => {
      return { type: arg };
    });
  }

  return {
    args,
    name: parsedName,
  };
};
