//
//  Theme.swift
//  Rainbow
//
//  Created by Alexey Kureev on 16/01/2020.
//

extension UIColor {
  struct RainbowTheme {
    static var isDarkMode = false;
    struct Transactions {
      static var appleBlue: UIColor {
        return isDarkMode ? TransactionsDark.appleBlue : TransactionsLight.appleBlue
      }
      static var blueGreyDark: UIColor {
        return isDarkMode ? TransactionsDark.blueGreyDark : TransactionsLight.blueGreyDark
      }
      static var blueGreyDark30: UIColor {
        return isDarkMode ? TransactionsDark.blueGreyDark30 : TransactionsLight.blueGreyDark30
      }
      static var blueGreyDark35: UIColor {
        return isDarkMode ? TransactionsDark.blueGreyDark35 : TransactionsLight.blueGreyDark35
      }
      static var blueGreyDark40: UIColor {
        return isDarkMode ? TransactionsDark.blueGreyDark40 : TransactionsLight.blueGreyDark40
      }
      static var blueGreyDark50: UIColor {
        return isDarkMode ? TransactionsDark.blueGreyDark50 : TransactionsLight.blueGreyDark50
      }
      static var blueGreyDark70: UIColor {
        return isDarkMode ? TransactionsDark.blueGreyDark70 : TransactionsLight.blueGreyDark70
      }
      static var dark: UIColor {
        return isDarkMode ? TransactionsDark.dark : TransactionsLight.dark
      }
      static var green: UIColor {
        return isDarkMode ? TransactionsDark.green : TransactionsLight.green
      }
      static var rowDivider: UIColor {
        return isDarkMode ? TransactionsDark.rowDivider : TransactionsLight.rowDivider
      }
      static var rowDividerLight: UIColor {
        return isDarkMode ? TransactionsDark.rowDividerLight : TransactionsLight.rowDividerLight
      }
      static var swapPurple: UIColor {
        return isDarkMode ? TransactionsDark.swapPurple : TransactionsLight.swapPurple
      }
      static var white: UIColor {
        return isDarkMode ? TransactionsDark.white : TransactionsLight.white
      }
    }
    struct TransactionsDark {
      static let appleBlue = UIColor(red: 0.05, green: 0.46, blue: 0.99, alpha: 1.00)
      static let blueGreyDark = UIColor(red: 0.88, green: 0.91, blue: 1.00, alpha: 1.00)
      static let blueGreyDark30 = UIColor(red: 0.23, green: 0.24, blue: 0.27, alpha: 1.00) //FIXME
      static let blueGreyDark35 = UIColor(red: 0.47, green: 0.49, blue: 0.55, alpha: 1.00) // FIXME
      static let blueGreyDark40 = UIColor(red: 0.47, green: 0.49, blue: 0.55, alpha: 1.00) // FIXME
      static let blueGreyDark50 = UIColor(red: 0.47, green: 0.49, blue: 0.55, alpha: 1.00)
      static let blueGreyDark70 = UIColor(red: 0.47, green: 0.49, blue: 0.55, alpha: 1.00) //FIXME
      static let dark = UIColor(red: 0.88, green: 0.91, blue: 1.00, alpha: 1.00)
      static let green = UIColor(red: 0.00, green: 0.82, blue: 0.27, alpha: 1.00)
      static let rowDivider = UIColor(red: 0.24, green: 0.26, blue: 0.32, alpha: 0.07)
      static let rowDividerLight = UIColor(red: 0.24, green: 0.26, blue: 0.32, alpha: 0.01)
      static let swapPurple = UIColor(red:0.34, green:0.36, blue:1.00, alpha:1.0)
      static let white = UIColor(red: 0.07, green: 0.07, blue: 0.10, alpha: 1.00)
    }
    struct TransactionsLight {
      static let appleBlue = UIColor(red:0.05, green:0.46, blue:0.99, alpha:1.00)
      static let blueGreyDark = UIColor(red:0.24, green:0.26, blue:0.32, alpha:1.0)
      static let blueGreyDark30 = UIColor(red:0.24, green:0.26, blue:0.32, alpha:0.3)
      static let blueGreyDark35 = UIColor(red:0.24, green:0.26, blue:0.32, alpha:0.35)
      static let blueGreyDark40 = UIColor(red:0.24, green:0.26, blue:0.32, alpha:0.4)
      static let blueGreyDark50 = UIColor(red:0.24, green:0.26, blue:0.32, alpha:0.5)
      static let blueGreyDark70 = UIColor(red:0.24, green:0.26, blue:0.32, alpha:0.7)
      static let dark = UIColor(red:0.15, green:0.16, blue:0.18, alpha:1.0)
      static let green = UIColor(red:0.25, green:0.80, blue:0.09, alpha:1.0)
      static let rowDivider = UIColor(red:0.24, green:0.26, blue:0.32, alpha:0.03)
      static let rowDividerLight = UIColor(red:0.24, green:0.26, blue:0.32, alpha:0.02)
      static let swapPurple = UIColor(red:0.34, green:0.36, blue:1.00, alpha:1.0)
      static let white = UIColor.white
    }
  }
}
