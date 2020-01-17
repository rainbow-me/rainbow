//
//  ButtonManager.swift
//  Rainbow
//
//  Created by Alexey Kureev on 17/01/2020.
//  Copyright © 2020 Facebook. All rights reserved.
//

@objc(ButtonManager)
final class ButtonManager: RCTViewManager {
  override func view() -> UIView! {
    return Button()
  }
}
