//
//  TransactionRequestSection.swift
//  Rainbow
//
//  Created by Alexey Kureev on 25/01/2020.
//

import Foundation

class TransactionRequestSection : TransactionSectionProtocol {
  var date: Date? = Date()
  var data: [AnyObject]
  var type: TransactionSectionTypes = .requests
  var name: String? = nil
  
  init(data: [TransactionRequest]) {
    self.data = data
  }
}
