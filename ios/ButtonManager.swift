//
//  ButtonManager.swift
//  Rainbow
//
//  Created by Alexey Kureev on 17/01/2020.
//

@objc(ButtonManager)
final class ButtonManager: RCTViewManager {
  override func view() -> UIView! {
    return Button()
  }
}
