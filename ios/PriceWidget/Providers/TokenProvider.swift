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
  
  private init() {}
  
  public func getTokens() -> [String: TokenDetails] {
    var addressTokenMap = [String: TokenDetails]()
    let coinGeckoTokenList = getCoinGeckoTokenList()
    let rainbowTokenList = getRainbowTokenList()
    
    if (coinGeckoTokenList != nil && rainbowTokenList != nil) {
      rainbowTokenList!.tokens.forEach {
        if ($0.extensions != nil && $0.extensions!.color != nil) {
          addressTokenMap[$0.address.lowercased()] = TokenDetails(name: $0.name, coinGeckoId: nil, symbol: $0.symbol, color: $0.extensions!.color!, address: $0.address)
        } else {
          addressTokenMap[$0.address.lowercased()] = TokenDetails(name: $0.name, coinGeckoId: nil, symbol: $0.symbol, color: nil, address: $0.address)
        }
      }
      coinGeckoTokenList!.forEach {
        if let address = $0.platforms.ethereum {
          if (!address.isEmpty) {
            let incompleteToken = addressTokenMap[address.lowercased()]
            if (incompleteToken != nil) {
              addressTokenMap[address.lowercased()] = TokenDetails(name: incompleteToken!.name, coinGeckoId: $0.id, symbol: incompleteToken!.symbol, color: incompleteToken!.color, address: incompleteToken!.address)
            }
          }
        }
      }
    }
    addressTokenMap["eth"] = Constants.eth
    return addressTokenMap.filter { $0.value.coinGeckoId != nil }
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
