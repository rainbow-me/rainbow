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
    
    transactionType.addCharacterSpacing(kernValue: 0.5)
    coinName.addCharacterSpacing(kernValue: 0.5)
    nativeDisplay.addCharacterSpacing()
    balanceDisplay.addCharacterSpacing()
    
    setStatusColor(transaction)
    setBottomRowStyles(transaction)
    setText(transaction)
    setIcon(transaction)

    if transaction.symbol != nil {
      if let img = UIImage.init(named: transaction.symbol.lowercased()) {
        coinImage.image = img
      } else {
        coinImage.image = generateTextImage(transaction.symbol)
        coinImage.layer.cornerRadius = coinImage.frame.width * 0.5
      }
    }
  }
  
  private func setIcon(_ transaction: Transaction) {
    if (transaction.pending) {
       transactionIcon.image = UIImage.init(named: "spinner");
       transactionIcon.image!.accessibilityIdentifier = "spinner"
       transactionIcon.rotate()
     } else if let image = UIImage.init(named: transaction.status.lowercased()) {
       if (transactionIcon.image != nil && transactionIcon.image?.accessibilityIdentifier == "spinner") {
         transactionIcon.stopRotating()
       }
       transactionIcon.image = image
       transactionIcon.image!.accessibilityIdentifier = "static";
     }

    // Savings Overrides
    if (transaction.status?.lowercased() ==  "deposited" || transaction.status?.lowercased() == "withdrew") {
      transactionIcon.image = UIImage.init(named: "sunflower")
    }
    
    // Swap Overrides
    if transaction.type?.lowercased() == "trade" && transaction.status?.lowercased() == "sent" {
        transactionIcon.image = UIImage.init(named: "swapped")
    }
    if transaction.status?.lowercased() == "swapping" {
        transactionIcon.image = UIImage.init(named: "swapping")
    }
    
    // Authorize Overrides
    if transaction.type?.lowercased() == "authorize" && transaction.status?.lowercased() == "approved" {
      transactionIcon.image = UIImage.init(named: "self")
    }
    
    transactionIcon.tintAdjustmentMode = .normal

  }
  
  private func setStatusColor(_ transaction: Transaction) {
    let transactionColors = UIColor.RainbowTheme.Transactions.self
    var color = transactionColors.blueGreyDark70
    
    if transaction.pending {
      if transaction.status.lowercased() == "swapping" {
        color = transactionColors.swapPurple
      } else {
        color = transactionColors.appleBlue
      }
    } else if transaction.isSwapped() {
      color = transactionColors.swapPurple
      transactionType.text = "Swapped"
      transactionType.addCharacterSpacing(kernValue: 0.5)
    }
    
    transactionIcon.tintColor = color
    transactionType.textColor = color
  }
  
  private func setBottomRowStyles(_ transaction: Transaction) {
    let transactionColors = UIColor.RainbowTheme.Transactions.self
    var coinNameColor = transactionColors.dark
    var nativeDisplayColor = transactionColors.blueGreyDark50
    var nativeDisplayFont = UIFont(name: "SFRounded-Regular", size: 16)
    
    if transaction.status.lowercased() == "sent" {
      nativeDisplayColor = transactionColors.dark
      nativeDisplay.text = "- " + transaction.nativeDisplay
      nativeDisplay.addCharacterSpacing()
    }
    if transaction.status.lowercased() == "received" || transaction.status.lowercased() == "purchased" {
      nativeDisplayColor = transactionColors.green
      nativeDisplayFont = UIFont(name: "SFRounded-Medium", size: 16)
    }
    if transaction.type == "trade" && transaction.status.lowercased() == "sent" {
      coinNameColor = transactionColors.blueGreyDark50
      nativeDisplayColor = transactionColors.dark
      nativeDisplay.text = "- " + transaction.nativeDisplay
      nativeDisplay.addCharacterSpacing()
    }
    if transaction.type == "trade" && transaction.status.lowercased() == "received" {
      nativeDisplayColor = transactionColors.swapPurple
      nativeDisplayFont = UIFont(name: "SFRounded-Medium", size: 16)
    }
    
    coinName.textColor = coinNameColor
    nativeDisplay.textColor = nativeDisplayColor
    nativeDisplay.font = nativeDisplayFont
  }

  private func setText(_ transaction: Transaction) {
    if let type = transaction.type {
      if (type.lowercased() == "deposit" || type.lowercased() == "withdraw") {
        if let status = transaction.status {
          if (status.lowercased() == "depositing" || status.lowercased() == "withdrawing" || status.lowercased() == "sending") {
            transactionType.text = " \(status.capitalized)";
            coinName.text = "\(transaction.symbol!)";
            transactionType.addCharacterSpacing(kernValue: 0.5);
            coinName.addCharacterSpacing(kernValue: 0.5);
          } else if (status.lowercased() == "deposited" || status.lowercased() == "withdrew") {
            transactionType.text = " Savings";
            coinName.text = "\(status.capitalized) \(transaction.symbol!)";
            transactionType.addCharacterSpacing(kernValue: 0.5);
            coinName.addCharacterSpacing(kernValue: 0.5);
          } else if (transaction.status.lowercased() == "failed") {
            coinName.text = "\(type.lowercased() == "withdraw" ? "Withdrew" : "Deposited") \(transaction.symbol!)";
            coinName.addCharacterSpacing(kernValue: 0.5);
          }
        }
      }
    }
  }
}
