//
//  TransactionRequestSection.swift
//  Rainbow
//
//  Created by Alexey Kureev on 25/01/2020.
//

import Foundation

class TransactionSection : TransactionSectionProtocol {
  var date: Date
  var data: [AnyObject]
  var type: TransactionSectionTypes = .transactions
  
  init(date: Date, data: [Transaction]) {
    self.date = date
    self.data = data
  }
}
