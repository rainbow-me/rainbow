interface RainbowTokenList {
    Parent: {
        name: string,
        timestamp: Date,
        logoURI: string,
        version: {
            major: number,
            minor: number,
            patch: number,
        }
        keywords: string [],
        tokens: RainbowToken [],
    }
}

interface RainbowToken {
    address: string,
    chainId: number,
    decimals: number,
    name: string,
    extensions: {
        color: string,
        isRainbowCurated: boolean,
        isVerified: boolean,
    }
}