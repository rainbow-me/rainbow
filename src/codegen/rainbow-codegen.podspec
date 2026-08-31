require 'json'

Pod::Spec.new do |spec|
  spec.name         = "rainbow-codegen"
  spec.version      = "1.0.0"
  spec.summary      = "Rainbow Codegen"
  spec.license      = "MIT"

  spec.authors      = "Rainbow"
  spec.homepage     = "https://github.com/rainbow-me/rainbow"
  spec.platform     = :ios, "15.1"

  spec.module_name = "RainbowCodegen"
  spec.source       = { :git => "https://github.com/rainbow-me/rainbow.git", :tag => "#{spec.version}" }
  spec.source_files  = "ios/**/*.{h,m,mm,swift}"

  install_modules_dependencies(spec)
end
