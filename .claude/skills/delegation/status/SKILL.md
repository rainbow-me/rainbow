---
name: delegation-status
description: Fetch and display the current delegation state for a wallet address from the Rainbow Platform API
---

# Delegation Status Skill

This skill fetches the current delegation state for a wallet address using the Rainbow Platform API directly.

## Usage

When the user asks to check delegation state, fetch delegation status, or view smart wallet status for an address:

1. Extract the wallet address and optional chain ID from the user's request

   - If no address is provided, ask the user for it using `AskUserQuestion`
   - Validate the address format (should start with 0x and be 42 characters)
   - If a chain ID is mentioned, use the NetworkStatus endpoint
   - If no chain ID is specified, use the WalletStatus endpoint (all chains)

2. Create a Node.js script to fetch the delegation state:

   - Load environment variables from `.env` file
   - Use `PLATFORM_BASE_URL` and `PLATFORM_API_KEY`
   - Choose the appropriate endpoint:
     - **For all chains**: `${PLATFORM_BASE_URL}/v1/wallets/delegation/WalletStatus?address=${address}`
     - **For specific chain**: `${PLATFORM_BASE_URL}/v1/wallets/delegation/NetworkStatus?address=${address}&chainId=${chainId}`
   - Include Authorization header: `Bearer ${PLATFORM_API_KEY}`

3. Parse and display the results:

   - Show the raw JSON response
   - Parse the `result` object which contains delegation data per chain
   - Display a formatted summary showing:
     - Total number of chains
     - For each chain:
       - Chain ID
       - Delegation status (e.g., `DELEGATION_STATUS_NOT_DELEGATED`, `DELEGATION_STATUS_RAINBOW_DELEGATED`, `DELEGATION_STATUS_THIRD_PARTY_DELEGATED`)
       - **⚠️ REVOKE REASON** (if present) - Critical security alert
       - **REVOKE ADDRESS** (if revoke reason is set) - Contract to call for revocation
       - Update reason (e.g., `UPDATE_REASON_RAINBOW_ONBOARDING`)
       - Latest contract address and name
       - Current contract (if actively delegated)

4. Interpret the delegation status and revoke triggers:

   **Delegation Status:**

   - `DELEGATION_STATUS_NOT_DELEGATED`: Wallet is not currently delegated on this chain
   - `DELEGATION_STATUS_RAINBOW_DELEGATED`: Wallet is delegated to Rainbow's smart wallet contract
   - `DELEGATION_STATUS_THIRD_PARTY_DELEGATED`: Wallet is delegated to a third-party contract

   **Revoke Reasons (Security Triggers):**

   - `REVOKE_REASON_VULNERABILITY`: 🚨 Current contract has a security vulnerability - **REVOKE IMMEDIATELY**
   - `REVOKE_REASON_BUG`: ⚠️ Current contract has a bug - **REVOKE RECOMMENDED**
   - `null`: No revocation needed

## Example Script Template

```javascript
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env') });

const PLATFORM_BASE_URL = process.env.PLATFORM_BASE_URL;
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY;

const address = process.argv[2];
const chainId = process.argv[3]; // Optional

// Choose endpoint based on whether chainId is provided
let url;
if (chainId) {
  url = \`\${PLATFORM_BASE_URL}/v1/wallets/delegation/NetworkStatus?address=\${address}&chainId=\${chainId}\`;
} else {
  url = \`\${PLATFORM_BASE_URL}/v1/wallets/delegation/WalletStatus?address=\${address}\`;
}

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${PLATFORM_API_KEY}\`,
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));
```

## API Endpoint Reference

### WalletStatus Endpoint (All Chains)

**URL**: `/wallets/delegation/WalletStatus?address={address}`

Returns delegation state for all supported chains. Use this when querying general delegation status.

**Example**:

```
GET /v1/wallets/delegation/WalletStatus?address=0x0FCA7202706ae91F8C51A525aC3a5ca92deE2504
```

**Response**: Object with chain IDs as keys, each containing delegation data

```json
{
  "result": {
    "1": {
      /* Ethereum delegation data */
    },
    "10": {
      /* Optimism delegation data */
    },
    "8453": {
      /* Base delegation data */
    }
  }
}
```

### NetworkStatus Endpoint (Single Chain)

**URL**: `/wallets/delegation/NetworkStatus?address={address}&chainId={chainId}`

Returns delegation state for a specific chain. Use this when querying a particular network.

**Example**:

```
GET /v1/wallets/delegation/NetworkStatus?address=0x0FCA7202706ae91F8C51A525aC3a5ca92deE2504&chainId=1
```

**Response**: Single delegation data object

```json
{
  "result": {
    "chainId": "1",
    "delegationStatus": "DELEGATION_STATUS_*",
    "updates": {
      /* ... */
    }
  }
}
```

## Common Response Fields

Both endpoints return delegation data with these fields:

```json
{
  "chainId": "1",
  "delegationStatus": "DELEGATION_STATUS_NOT_DELEGATED | DELEGATION_STATUS_RAINBOW_DELEGATED | DELEGATION_STATUS_THIRD_PARTY_DELEGATED",

  // 🚨 SECURITY ALERT FIELDS - Present when delegation should be revoked
  "revokeReason": "REVOKE_REASON_VULNERABILITY | REVOKE_REASON_BUG | null",
  "revokeAddress": "0x...", // Contract address to call for revocation (when revokeReason is set)

  // Update recommendation fields
  "updates": {
    "reason": "UPDATE_REASON_RAINBOW_ONBOARDING | UPDATE_REASON_UPGRADE_AVAILABLE | UPDATE_REASON_UNSPECIFIED",
    "latest": {
      "address": "0x612373d7003d694220f7800eeaf8e3924c0951d3",
      "name": "Rainbow Calibur"
    }
  },

  // Active delegation fields (only present if currently delegated)
  "currentContract": "0x...",
  "currentContractName": "Active Name"
}
```

### Key Fields Explained

- **`revokeReason`**: Platform-triggered alert indicating the current delegation should be revoked

  - `REVOKE_REASON_VULNERABILITY`: Security exploit detected - **URGENT**
  - `REVOKE_REASON_BUG`: Contract has errors
  - `null`: No revocation needed

- **`revokeAddress`**: Contract address to call when revoking (populated when `revokeReason` is set)

- **`delegationStatus`**: Current state of delegation

  - Changing from `DELEGATED` → `NOT_DELEGATED` indicates a revocation occurred

- **`updates.reason`**: Recommendation to update/upgrade delegation
  - `UPDATE_REASON_UPGRADE_AVAILABLE`: Newer contract version available
  - `UPDATE_REASON_RAINBOW_ONBOARDING`: Initial onboarding recommendation

## Tips

- Always validate that PLATFORM_BASE_URL and PLATFORM_API_KEY are set before making requests
- Create temporary scripts for one-off queries rather than modifying existing code
- Clean up temporary script files after displaying results (unless user wants to keep them)
- Provide clear interpretation of the delegation status, not just raw data
