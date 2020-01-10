//
//  TransactionListViewHeader.swift
//  Rainbow
//
//  Created by Alexey Kureev on 10/01/2020.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

class TransactionListViewHeader : UIView {
    
    @IBOutlet weak var accountAddress: UILabel!
    @IBOutlet weak var copyAddress: UIButton!
    @IBOutlet weak var receive: UIButton!
    
}

extension UIView {
    class func fromNib<T: UIView>() -> T {
        return Bundle(for: T.self).loadNibNamed(String(describing: T.self), owner: nil, options: nil)![0] as! T
    }
}
