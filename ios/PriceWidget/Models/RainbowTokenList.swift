//
//  RainbowTokenList.swift
//  Rainbow
//
//  Created by Ben Goldberg on 11/2/21.
//

import Foundation

@available(iOS 14.0, *)
struct RainbowTokenList: Codable {
  struct Token: Codable {
    struct Extension: Codable {
      let color: String?
      let isRainbowCurated: Bool?
      let isVerified: Bool?
      let shadowColor: String?
      
      private enum CodingKeys: String, CodingKey {
        case color = "color"
        case isRainbowCurated = "isRainbowCurated"
        case isVerified = "isVerified"
        case shadowColor = "shadowColor"
      }
    }

    let address: String
    let chainID: Int
    let decimals: Int
    let name: String
    let symbol: String
    let extensions: Extension?

    private enum CodingKeys: String, CodingKey {
      case address = "address"
      case chainID = "chainId"
      case decimals = "decimals"
      case name = "name"
      case symbol = "symbol"
      case extensions = "extensions"
    }
  }

  struct Version: Codable {
    let major: Int
    let minor: Int
    let patch: Int
    
    private enum CodingKeys: String, CodingKey {
      case major = "major"
      case minor = "minor"
      case patch = "patch"
    }
  }

  let keywords: [String]
  let logoURI: String
  let name: String
  let timestamp: String
  let tokens: [Token]
  let version: Version
  
  private enum CodingKeys: String, CodingKey {
    case keywords = "keywords"
    case logoURI = "logoURI"
    case name = "name"
    case timestamp = "timestamp"
    case tokens = "tokens"
    case version = "version"
  }
}
