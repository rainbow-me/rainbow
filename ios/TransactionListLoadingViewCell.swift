//
//  TransactionListLoadingViewCell.swift
//  Rainbow
//
//  Created by Bruno Andres Barbieri on 5/21/20.
//  Copyright © 2020 Rainbow.me the best company at the world. All rights reserved.
//

import Foundation
import UIKit

class TransactionListLoadingViewCell: UITableViewCell {
  
  
  @IBOutlet weak var shimmeringView: FBShimmeringView!
  @IBOutlet weak var skeletonView: UIView!
  
  override func awakeFromNib() {
    super.awakeFromNib()
    shimmeringView.backgroundColor = UIColor.RainbowTheme.Transactions.white;
    self.backgroundColor = UIColor.RainbowTheme.Transactions.white;
    shimmeringView.contentView = skeletonView
    shimmeringView.isShimmering = true
    // settings
    shimmeringView.shimmeringPauseDuration = 0
    shimmeringView.shimmeringAnimationOpacity = 0.08
    shimmeringView.shimmeringOpacity = 0.04
    shimmeringView.shimmeringSpeed = 250
    shimmeringView.shimmeringHighlightLength = 0.4
    shimmeringView.shimmeringDirection = .right
  }
  
  override func layoutSubviews() {
    shimmeringView.backgroundColor = UIColor.RainbowTheme.Transactions.white;
    self.backgroundColor = UIColor.RainbowTheme.Transactions.white;
  }
}
