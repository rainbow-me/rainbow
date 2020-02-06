//
//  RoundedCornerView.swift
//  Rainbow
//
//  Created by Wojciech Stanisz on 06/02/2020.
//  Copyright © 2020 Facebook. All rights reserved.
//

import UIKit

@IBDesignable
class RoundedCornerView: UIView {

    @IBInspectable var cornerRadius: CGFloat = 0 {
      didSet {
        layer.cornerRadius = cornerRadius
        layer.masksToBounds = cornerRadius > 0
      }
    }

}
