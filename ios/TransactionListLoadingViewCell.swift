//
//  TransactionListLoadingViewCell.swift
//  Rainbow
//
//  Created by Bruno Andres Barbieri on 5/21/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import UIKit

class TransactionListLoadingViewCell: UITableViewCell {
  
    
    @IBOutlet weak var shimmeringView: FBShimmeringView!
    @IBOutlet weak var skeletonView: UIView!
    
    
    override func awakeFromNib() {
      super.awakeFromNib()
      shimmeringView.contentView = skeletonView
      shimmeringView.isShimmering = true;
      // settings
      shimmeringView.shimmeringPauseDuration = 0.1
      shimmeringView.shimmeringAnimationOpacity = 1
      shimmeringView.shimmeringOpacity = 0.5;
      shimmeringView.shimmeringSpeed = 150;
      shimmeringView.shimmeringHighlightLength = 0.25
      shimmeringView.shimmeringDirection = .right
     }
    
   

}
