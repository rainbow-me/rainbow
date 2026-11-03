// ENS mainnet deployments: https://docs.ens.domains/learn/deployments/
export const ensContracts = {
  helper: '0x46ae127d14683ac74ef151e46ae2117a1a25c676',
  ethRegistry: '0xf60aba43e1f7f3dab1186ff03b561401c9df85e2',
  registrar: '0xd6d8369e55c94ae8afa714e6cf7ab5be54d5cc81',
  legacyRenewer: '0x56c447f308f463a01121c41e72b0e7e7557fcb68',
  resolverImplementation: '0x565b0f456a04ac9b48758190e90030623cff57c5',
  factory: '0x77510ba162dfea3d8989e3f0928a691b345730d2',
  legacyMirror: '0x394d8eb4a4fdf599384deab25f31d111d755c398',
  legacyRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  legacyRegistrar: '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
  nameWrapper: '0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401',
  reverseRegistrar: '0xa58e81fe9b61b5c3fe2afd33cf304c454abfc7cb',
} as const;

// Immutable timing parameters of the deployed mainnet registrar, in seconds.
export const ENS_MIN_COMMITMENT_AGE = 60;
export const ENS_MAX_COMMITMENT_AGE = 24 * 60 * 60;
