//
//  TransactionListViewCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//

import UIKit

class MyBoundedLabel: UILabel {
  override func drawText(in rect: CGRect) {
    super.drawText(in: rect.insetBy(dx: 2.0, dy: 2.0))
  }
}

class TransactionListViewCell: TransactionListBaseCell {
  
  @IBOutlet weak var transactionType: UILabel!
  @IBOutlet weak var transactionIcon: UIImageView!
  @IBOutlet weak var coinName: UILabel!
  @IBOutlet weak var balanceDisplay: UILabel!
  @IBOutlet weak var nativeDisplay: UILabel!
  @IBOutlet weak var coinImage: UIImageView!
  
  override func awakeFromNib() {
    super.awakeFromNib()
    addShadowLayer(coinImage)
  }
  
  func set(transaction: Transaction) {
    transactionType.text = transaction.status
    coinName.text = transaction.coinName
    nativeDisplay.text = transaction.nativeDisplay
    balanceDisplay.text = transaction.balanceDisplay
    
    if let image = UIImage.init(named: transaction.status.lowercased()) {
      transactionIcon.image = image
      transactionIcon.tintAdjustmentMode = .normal
    }
    
    setStatusColor(transaction)
    setCellColors(transaction)
    
    if transaction.symbol != nil {
      if let img = UIImage.init(named: transaction.symbol.lowercased()) {
        coinImage.image = img
      } else {
        coinImage.image = generateTextImage(transaction.symbol)
        coinImage.layer.cornerRadius = coinImage.frame.width * 0.5
      }
    }
    
    // Savings override
    if(transaction.type.lowercased() == "deposit" || transaction.type.lowercased() == "withdraw"){
      
      if(transaction.status.lowercased() == "deposited" || transaction.status.lowercased() == "withdrew"){
        transactionIcon.image = UIImage.init(named: "sunflower")
        transactionType.text = " Savings";
        coinName.text = transaction.status.capitalized + " " + transaction.coinName;
      } else if(transaction.status.lowercased() == "failed"){
        coinName.text = (transaction.type.lowercased() == "withdraw" ? "Withdrew" : "Deposited") + " " + transaction.coinName;
      }
    }
  }
  
  private func setStatusColor(_ transaction: Transaction) {
    let transactionColors = UIColor.RainbowTheme.Transactions.self
    var color = transactionColors.blueGreyMediumLight
    
    if transaction.pending {
      color = transactionColors.primaryBlue
    } else if transaction.type == "trade" {
      if transaction.status.lowercased() == "sent" {
        color = transactionColors.dodgerBlue
        transactionIcon.image = UIImage.init(named: "swapped")
        transactionType.text = "Swapped"
      }
    } else if(transaction.status.lowercased() == "approved"){
      transactionIcon.image = UIImage.init(named: "self")
    }
    
    
    
    transactionIcon.tintColor = color
    transactionType.textColor = color
  }
  
  private func setCellColors(_ transaction: Transaction) {
    coinName.alpha = 1.0
    nativeDisplay.alpha = 1.0
    
    if transaction.type == "trade" {
      if transaction.status.lowercased() == "sent" {
        coinName.alpha = 0.5
        nativeDisplay.alpha = 0.5
      }
    }
    
    switch transaction.status {
    case "Sent":
      nativeDisplay.textColor = UIColor.RainbowTheme.Transactions.dark
      nativeDisplay.text = "- " + transaction.nativeDisplay
      break
    case "Received":
      nativeDisplay.textColor = UIColor.RainbowTheme.Transactions.limeGreen
      break
    default:
      break
    }
  }
}
