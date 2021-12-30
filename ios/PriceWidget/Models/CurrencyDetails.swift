//
//  CurrencyDetails.swift
//  Rainbow
//
//  Created by Ben Goldberg on 11/24/21.
//  Copyright © 2021 Rainbow. All rights reserved.
//

import Foundation

@available(iOS 14.0, *)
struct CurrencyDetails: Equatable {
  let identifier: String
  let display: String
  let symbol: String
  let rank: Int

  init(identifier: String, display: String, symbol: String, rank: Int) {
    self.identifier = identifier
    self.display = display
    self.symbol = symbol
    self.rank = rank
  }
}
