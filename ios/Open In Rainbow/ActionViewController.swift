import UIKit
import MobileCoreServices

class ActionViewController: UIViewController {

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)

        print("in viewWillAppear")
        print(extensionContext?.inputItems)
        for item in extensionContext?.inputItems as? [NSExtensionItem] ?? [] {
            for provider in item.attachments ?? [] {

                if provider.hasItemConformingToTypeIdentifier(kUTTypeText as String) {
                    provider.loadItem(forTypeIdentifier: kUTTypeText as String, options: nil) { text, _ in
                        guard let text = text as? String else { return }
                        guard let url = URL(string: text) else {
                            return
                        }
                        self.launchBrowser(withUrl: url)
                    }
                    break
                }

                if provider.hasItemConformingToTypeIdentifier(kUTTypeURL as String) {
                    provider.loadItem(forTypeIdentifier: kUTTypeURL as String, options: nil) { url, _ in
                        guard let url = url as? URL else { return }
                        self.launchBrowser(withUrl: url)
                    }
                    break
                }

            }
        }
    }

    func launchBrowser(withUrl url: URL) {
        // Save the URL to the shared container
        let sharedDefaults = UserDefaults(suiteName: "group.me.rainbow")
        sharedDefaults?.set(url.absoluteString, forKey: "sharedURL")
        sharedDefaults?.synchronize()
        
        print("URL saved to shared container: \(url.absoluteString)")
        
        // Open the main app using a custom URL scheme
        let urlScheme = "rainbow://open?url=\(url.absoluteString)"
        if let appURL = URL(string: urlScheme) {
            print("Opening URL scheme: \(urlScheme)")
            self.extensionContext?.open(appURL, completionHandler: nil)
        } else {
            print("Failed to create URL from scheme: \(urlScheme)")
        }

        self.done()
    }

    func done() {
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
    
}