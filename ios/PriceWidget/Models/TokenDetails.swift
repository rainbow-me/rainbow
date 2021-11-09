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
  public let address: String?

  init(name: String?, identifier: String?, symbol: String?, color: String?, address: String?) {
    self.name = name
    self.identifier = identifier
    self.symbol = symbol
    self.color = color
    self.address = address
  }
  
  private enum CodingKeys: String, CodingKey {
    case name = "name"
    case identifier = "id"
    case symbol = "symbol"
    case color = "color"
    case address = "address"
  }
}
