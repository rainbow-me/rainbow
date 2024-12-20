#!/bin/bash

# Prompt for network details
read -p "Enter the network name (case sensitive): " networkName
read -p "Enter the chain ID (number): " chainId
read -p "Enter the light mode color (hex): " lightColor
read -p "Enter the dark mode color (hex): " darkColor

# Create imagesets
mkdir -p "ios/Images.xcassets/badges/${networkName}.imageset"
mkdir -p "ios/Images.xcassets/badges/${networkName}Badge.imageset"
mkdir -p "ios/Images.xcassets/badges/${networkName}BadgeDark.imageset"
mkdir -p "ios/Images.xcassets/badges/${networkName}BadgeLarge.imageset"
mkdir -p "ios/Images.xcassets/badges/${networkName}BadgeLargeDark.imageset"
mkdir -p "ios/Images.xcassets/badges/${networkName}BadgeNoShadow.imageset"

# Create Contents.json for each imageset
for suffix in "" "Badge" "BadgeDark" "BadgeLarge" "BadgeLargeDark" "BadgeNoShadow"; do
  cat > "ios/Images.xcassets/badges/${networkName}${suffix}.imageset/Contents.json" << EOF
{
  "images" : [
    {
      "filename" : "${networkName}${suffix}.png",
      "idiom" : "universal",
      "scale" : "1x"
    },
    {
      "filename" : "${networkName}${suffix}@2x.png",
      "idiom" : "universal", 
      "scale" : "2x"
    },
    {
      "filename" : "${networkName}${suffix}@3x.png",
      "idiom" : "universal",
      "scale" : "3x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF
done

# Update en_US.json
# Using perl for more precise JSON manipulation
perl -i -0pe 's/("explain":\s*{)/$1\n      "'$networkName'": {\n        "text": "",\n        "title": "What'\''s '$networkName'?"\n      },/m' src/languages/en_US.json

# Update types.ts
# Add to Network enum
sed -i '' "/export enum Network {/a\\
  ${networkName} = '${networkName}',
" src/chains/types.ts

# Add to ChainId enum
sed -i '' "/export enum ChainId {/a\\
  ${networkName} = ${chainId},
" src/chains/types.ts

# Update colors.ts for light mode - look for the first networkColors declaration
sed -i '' "/^  let networkColors = {/a\\
    [ChainId.${networkName}]: '${lightColor}',
" src/styles/colors.ts

# Update colors.ts for dark mode - look specifically in the darkMode if block
sed -i '' "/if (darkMode) {/,/^  }/ {
    /networkColors = {/a\\
      [ChainId.${networkName}]: '${darkColor}',
}" src/styles/colors.ts

echo "Network ${networkName} has been added!"
echo "Note: You'll need to add the actual badge images to the imageset directories"
echo "Don't forget to run prettier to format the modified files"