import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  TokenNetworks: any;
};

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type Contract = {
  __typename?: 'Contract';
  address: Scalars['String'];
  chainID: Scalars['Int'];
  name: Scalars['String'];
};

export type ContractFunction = {
  __typename?: 'ContractFunction';
  chainID: Scalars['Int'];
  hex: Scalars['String'];
  humanText: Scalars['String'];
  text: Scalars['String'];
};

export type EnsProfile = {
  __typename?: 'ENSProfile';
  address: Scalars['String'];
  chainID: Scalars['Int'];
  name: Scalars['String'];
  resolverAddress: Scalars['String'];
  reverseResolverAddress: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  contract?: Maybe<Contract>;
  contractFunction?: Maybe<ContractFunction>;
  reverseResolveENSProfile?: Maybe<EnsProfile>;
  token?: Maybe<Token>;
};


export type QueryContractArgs = {
  address: Scalars['String'];
  chainID: Scalars['Int'];
};


export type QueryContractFunctionArgs = {
  chainID: Scalars['Int'];
  hex: Scalars['String'];
};


export type QueryReverseResolveEnsProfileArgs = {
  address: Scalars['String'];
  chainID: Scalars['Int'];
};


export type QueryTokenArgs = {
  address: Scalars['String'];
  chainID: Scalars['Int'];
  currency?: InputMaybe<Scalars['String']>;
};

export type Token = {
  __typename?: 'Token';
  circulatingSupply?: Maybe<Scalars['Float']>;
  description?: Maybe<Scalars['String']>;
  links?: Maybe<TokenLinks>;
  marketCap?: Maybe<Scalars['Float']>;
  name: Scalars['String'];
  networks: Scalars['TokenNetworks'];
  symbol: Scalars['String'];
  volume1d?: Maybe<Scalars['Float']>;
};

export type TokenLink = {
  __typename?: 'TokenLink';
  url: Scalars['String'];
};

export type TokenLinks = {
  __typename?: 'TokenLinks';
  facebook?: Maybe<TokenLink>;
  homepage?: Maybe<TokenLink>;
  reddit?: Maybe<TokenLink>;
  telegram?: Maybe<TokenLink>;
  twitter?: Maybe<TokenLink>;
};

export type GetContractFunctionQueryVariables = Exact<{
  chainID: Scalars['Int'];
  hex: Scalars['String'];
}>;


export type GetContractFunctionQuery = { __typename?: 'Query', contractFunction?: { __typename?: 'ContractFunction', text: string } | null };


export const GetContractFunctionDocument = gql`
    query getContractFunction($chainID: Int!, $hex: String!) {
  contractFunction(chainID: $chainID, hex: $hex) {
    text
  }
}
    `;
export type Requester<C = {}, E = unknown> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R> | AsyncIterable<R>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    getContractFunction(variables: GetContractFunctionQueryVariables, options?: C): Promise<GetContractFunctionQuery> {
      return requester<GetContractFunctionQuery, GetContractFunctionQueryVariables>(GetContractFunctionDocument, variables, options) as Promise<GetContractFunctionQuery>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;