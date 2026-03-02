require 'json'

Pod::Spec.new do |spec|
  spec.name         = "react-native-cool-modals"
  spec.version      = "1.0.0"
  spec.summary      = "react-native-cool-modals"
  spec.license      = "MIT"

  spec.authors      = "Rainbow"
  spec.homepage     = "https://github.com/rainbow-me/rainbow"
  spec.platform     = :ios, "15.1"

  spec.module_name          = "RNCoolModals"
  spec.source               = { :git => "https://github.com/rainbow-me/rainbow.git", :tag => "#{spec.version}" }
  spec.source_files         = "ios/**/*.{h,m,mm,swift}"
  spec.private_header_files = "ios/**/*.h"

  install_modules_dependencies(spec)

  spec.subspec "common" do |ss|
      ss.source_files         = ["common/cpp/**/*.{cpp,h}", "cpp/**/*.{cpp,h}"]
      ss.project_header_files = "common/cpp/**/*.h", "cpp/**/*.h" # Don't expose C++ headers publicly to allow importing framework into Swift files
      ss.header_dir           = "react_native_cool_modals"
      ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/common/cpp\"" }
  end

  spec.dependency "PanModal"
end
