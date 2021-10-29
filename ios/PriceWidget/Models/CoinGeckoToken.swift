//
//  CoinGeckoToken.swift
//  Rainbow
//
//  Created by Ben Goldberg on 11/2/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation

@available(iOS 14.0, *)
struct CoinGeckoToken: Codable {
  struct Platform: Codable {
    let ethereum: String
    let polygonPos: String?
    let avalanche: String?
    let harmonyShard0: String?
    let binanceSmartChain: String?
    let fantom: String?
    let xdai: String?
    let huobiToken: String?
    let sora: String?
    let arbitrumOne: String?
    let solana: String?
    let terra: String?
    let moonriver: String?
    let tron: String?
    let iotex: String?
    let okexChain: String?
    let binancecoin: String?
    let optimisticEthereum: String?
    let klayToken: String?
    let algorand: String?
    let osmosis: String?
    let eos: String?
    let nuls: String?
    let tomochain: String?
    let vechain: String?
    let celo: String?
    let kucoinCommunityChain: String?
    let stellar: String?
    let kardiachain: String?
    let neo: String?
    let waves: String?
    let ontology: String?
    let wanchain: String?
    let tezos: String?
    let rootstock: String?
    let polkadot: String?
    let zilliqa: String?

    private enum CodingKeys: String, CodingKey {
      case ethereum
      case polygonPos = "polygon-pos"
      case avalanche
      case harmonyShard0 = "harmony-shard-0"
      case binanceSmartChain = "binance-smart-chain"
      case fantom
      case xdai
      case huobiToken = "huobi-token"
      case sora
      case arbitrumOne = "arbitrum-one"
      case solana
      case terra
      case moonriver
      case tron
      case iotex
      case okexChain = "okex-chain"
      case binancecoin
      case optimisticEthereum = "optimistic-ethereum"
      case klayToken = "klay-token"
      case algorand
      case osmosis
      case eos
      case nuls
      case tomochain
      case vechain
      case celo
      case kucoinCommunityChain = "kucoin-community-chain"
      case stellar
      case kardiachain
      case neo
      case waves
      case ontology
      case wanchain
      case tezos
      case rootstock
      case polkadot
      case zilliqa
    }
  }

  let id: String
  let symbol: String
  let name: String
  let platforms: Platform
}
