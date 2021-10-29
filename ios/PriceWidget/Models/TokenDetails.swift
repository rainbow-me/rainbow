//
//  TokenDetails.swift
//  Rainbow
//
//  Created by Ben Goldberg on 11/2/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation

@available(iOS 14.0, *)
public struct TokenDetails: Codable {
  public let name: String?
  public let identifier: String?
  public let symbol: String?
  public let color: String?
  public let isVerified: Bool?

  init(name: String?, identifier: String?, symbol: String?, color: String?, isVerified: Bool?) {
    self.name = name
    self.identifier = identifier
    self.symbol = symbol
    self.color = color
    self.isVerified = isVerified
  }
  
  private enum CodingKeys: String, CodingKey {
    case name = "name"
    case identifier = "id"
    case symbol = "symbol"
    case color = "color"
    case isVerified = "isVerified"
  }
}
