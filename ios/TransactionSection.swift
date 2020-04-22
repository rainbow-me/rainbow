//
//  TransactionRequestSection.swift
//  Rainbow
//
//  Created by Alexey Kureev on 25/01/2020.
//

import Foundation

class TransactionSection : TransactionSectionProtocol {
  var date: Date?
  var name: String?
  var data: [AnyObject]
  var type: TransactionSectionTypes = .transactions
  
  init(date: Date, data: [Transaction]) {
    self.date = date
    self.data = data
  }
  
  /**
   Initializer for the cases when "date" doesn't really matter.
   For example, "Pending" transaction section should be always on top
   and even though it assumes "date" is ~now, we are not really interested in it.
   */
  init(name: String, data: [Transaction]) {
    self.name = name
    self.data = data
  }
}
