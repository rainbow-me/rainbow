//
//  TransactionViewModelProtocol.swift
//  Rainbow
//
//  Created by Alexey Kureev on 24/01/2020.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

protocol TransactionViewModelProtocol {
  var type: TransactionSectionTypes { get }
  var rowCount: Int { get }
  var sectionTitle: String? { get }
}

extension TransactionViewModelProtocol {
  var rowCount: Int {
    return 1
  }
}
