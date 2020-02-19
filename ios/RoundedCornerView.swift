//
//  RoundedCornerView.swift
//  Rainbow
//
//  Created by Wojciech Stanisz on 06/02/2020.
//  Copyright © 2020 Rainbow. All rights reserved.
//

import UIKit

@IBDesignable
class UIRoundedCornerView: UIButton {
    @IBInspectable var cornerRadius: CGFloat = 0 {
      didSet {
        layer.cornerRadius = cornerRadius
        layer.masksToBounds = cornerRadius > 0
      }
    }

}
