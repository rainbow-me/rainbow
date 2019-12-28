//
//  TransactionListViewCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

class TransactionListViewCell: UITableViewCell {
  
  var transactionTypeLabelView = UILabel()

  override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
    super.init(style: style, reuseIdentifier: reuseIdentifier)
    addSubview(transactionTypeLabelView)
    configureTransactionTypeLabelView()
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func set(transaction: Transaction) {
    transactionTypeLabelView.text = transaction.type
  }
  
  func configureTransactionTypeLabelView() -> Void {
    transactionTypeLabelView.translatesAutoresizingMaskIntoConstraints = false
    transactionTypeLabelView.centerYAnchor.constraint(equalTo: centerYAnchor).isActive = true
    transactionTypeLabelView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 20).isActive = true
    transactionTypeLabelView.heightAnchor.constraint(equalToConstant: 80).isActive = true
    transactionTypeLabelView.adjustsFontSizeToFitWidth = true
  }
}
