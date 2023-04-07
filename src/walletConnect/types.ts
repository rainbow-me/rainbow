export type AuthRequestAuthenticateResult = {
  success: boolean;
};

export type AuthRequestAuthenticateSignature = (props: {
  address: string;
}) => Promise<AuthRequestAuthenticateResult>;
