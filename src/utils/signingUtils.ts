// This function removes all the keys from the message that are not present in the types
// preventing a know phising attack where the signature process could allow malicious DApps
// to trick users into signing an EIP-712 object different from the one presented
// in the signature approval preview. Consequently, users were at risk of unknowingly
// transferring control of their ERC-20 tokens, NFTs, etc to adversaries by signing
// hidden Permit messages.

// For more info read https://www.coinspect.com/wallet-EIP-712-injection-vulnerability/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sanitizeTypedData = (data: any) => {
  if (data.types[data.primaryType].length > 0) {
    // Extract all the valid permit types for the primary type
    const permitPrimaryTypes: string[] = data.types[data.primaryType].map((type: { name: string; type: string }) => type.name);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sanitizedMessage: any = {};
    // Extract all the message keys that matches the valid permit types
    Object.keys(data.message).forEach(key => {
      if (permitPrimaryTypes.includes(key)) {
        sanitizedMessage[key] = data.message[key];
      }
    });

    const sanitizedData = {
      ...data,
      message: sanitizedMessage,
    };

    return sanitizedData;
  }
  return data;
};
