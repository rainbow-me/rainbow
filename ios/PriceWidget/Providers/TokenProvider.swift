//
//  TokenProvider.swift
//  Rainbow
//
//  Created by Ben Goldberg on 10/28/21.
//

import Foundation
import SwiftUI
import UIKit

@available(iOS 14.0, *)
final class TokenProvider {
  
  static let shared = TokenProvider()
  
  struct TokenListBundle {
    let allTokens: [String: TokenDetails]
    let topTokens: [TokenDetails]
    let otherTokens: [TokenDetails]

    init(allTokens: [String: TokenDetails], topTokens: [TokenDetails], otherTokens: [TokenDetails]) {
      self.allTokens = allTokens
      self.topTokens = topTokens
      self.otherTokens = otherTokens
    }
  }

  
  public func getTokens() -> TokenListBundle {
    var rainbowAddressTokenMap = [String: TokenDetails]()
    var finalAddressTokenMap = [String: TokenDetails]()
    var topTokens = [Constants.eth]
    var otherTokens = [TokenDetails]()
    let coinGeckoTokenList = getCoinGeckoTokenList()
    let rainbowTokenList = getRainbowTokenList()
    let top100Addresses = Constants.topTokenAddresses
    
    if (coinGeckoTokenList != nil && rainbowTokenList != nil) {
      rainbowTokenList!.tokens.forEach {
        let lowercasedAddress = $0.address.lowercased()
        if let color = $0.extensions?.color {
          rainbowAddressTokenMap[lowercasedAddress] = TokenDetails(name: $0.name, coinGeckoId: nil, symbol: $0.symbol, color: color, address: $0.address)
        } else {
          rainbowAddressTokenMap[lowercasedAddress] = TokenDetails(name: $0.name, coinGeckoId: nil, symbol: $0.symbol, color: nil, address: $0.address)
        }
      }
      coinGeckoTokenList!.forEach {
        if let address = $0.platforms.ethereum?.lowercased() {
          if (!address.isEmpty) {
            let incompleteToken = rainbowAddressTokenMap[address]
            if (incompleteToken != nil) {
              let token = TokenDetails(name: incompleteToken!.name, coinGeckoId: $0.id, symbol: incompleteToken!.symbol, color: incompleteToken!.color, address: incompleteToken!.address)
              finalAddressTokenMap[address] = token
              if (top100Addresses.keys.contains(address)) {
                topTokens.append(token)
              } else {
                otherTokens.append(token)
              }
            }
          }
        }
      }
    }
    finalAddressTokenMap[Constants.eth.address!] = Constants.eth
    return TokenListBundle(allTokens: finalAddressTokenMap, topTokens: topTokens, otherTokens: otherTokens)
  }

  private func getCoinGeckoTokenList() -> [CoinGeckoToken]? {
    let url = URL(string: "https://api.coingecko.com/api/v3/coins/list?include_platform=true")!
    
    let semaphore = DispatchSemaphore(value: 0)
    
    var tokenList: [CoinGeckoToken]?
    
    let task = URLSession.shared.dataTask(with: url, completionHandler: {(data, response, error) -> Void in
      if let data = data {
        if let response = try? JSONDecoder().decode([CoinGeckoToken].self, from: data) {
          tokenList = response
        }
      }
      semaphore.signal()
    })
    task.resume()
    semaphore.wait(wallTimeout: .distantFuture)
    return tokenList
  }
  
  private func getRainbowTokenList() -> RainbowTokenList? {
    let url = URL(string: "https://metadata.p.rainbow.me/token-list/rainbow-token-list.json")!
    
    let semaphore = DispatchSemaphore(value: 0)
    
    var tokenList: RainbowTokenList?
    
    let task = URLSession.shared.dataTask(with: url, completionHandler: {(data, response, error) -> Void in
      if let data = data {
        if let response = try? JSONDecoder().decode(RainbowTokenList.self, from: data) {
          tokenList = response
        }
      }
      semaphore.signal()
    })
    task.resume()
    semaphore.wait(wallTimeout: .distantFuture)
    return tokenList
  }
}
