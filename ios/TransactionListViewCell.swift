//
//  TransactionListViewCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

import UIKit

class TransactionListViewCell: UITableViewCell {
    
    @IBOutlet weak var transactionType: UILabel!
    @IBOutlet weak var coinName: UILabel!
    @IBOutlet weak var balanceDisplay: UILabel!
    @IBOutlet weak var nativeDisplay: UILabel!
    @IBOutlet weak var coinImage: UIImageView!
  
    func set(transaction: Transaction) {
        transactionType.text = transaction.type
        coinName.text = transaction.coinName
        nativeDisplay.text = transaction.nativeDisplay
        balanceDisplay.text = transaction.balanceDisplay
          
        if transaction.coinImage != nil {
            // Load image
            DispatchQueue.global().async {
                let url = URL(string: transaction.coinImage!)
                let data = try? Data(contentsOf: url!)

                DispatchQueue.main.async {
                    self.coinImage.image = UIImage(data: data!)
                }
            }
        }
    }
}
