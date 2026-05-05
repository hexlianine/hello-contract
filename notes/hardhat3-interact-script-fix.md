---
tags: [Hardhat, Ethers, Troubleshooting, TypeScript]
created: 2026-05-05
status: draft
---

# Hardhat 3 Interact Script (Troubleshooting)

**Common pitfalls when writing a standalone contract interaction script with Hardhat 3, Ethers v6, and TypeScript 5.8.** 

## Overview

The `scripts/interact.ts` script reads from and writes to a deployed contract outside of Hardhat's runtime. Unlike the deploy script (which uses `network.create()`), the interact script runs standalone and must configure its own provider, signer, and contract instance.

## Key Issues and Fixes

### 1. Environment Variable Names Must Match `.env`

The `.env` file defines `API_URL` and `API_KEY` as separate variables. The original script referenced `API_KEY` where it should have used `API_URL` for the JSON-RPC provider.

**Two provider options exist:**
- `ethers.JsonRpcProvider(API_URL)` — uses the full RPC URL directly
- `ethers.AlchemyProvider("sepolia", API_KEY)` — uses just the API key, Alchemy constructs the URL

### 2. dotenv Must Be Loaded

When running via `npx tsx scripts/interact.ts` (not through `hardhat run`), environment variables are not automatically loaded. Add `import "dotenv/config"` at the top of the script.

### 3. Import Assertion Syntax for TypeScript 5.8+

TypeScript 5.8+ and Node 22 require `with { type: "json" }` instead of the deprecated `assert { type: "json" }` for JSON imports.

The `module` and `moduleResolution` in `tsconfig.json` must be set to `nodenext` (not `node16`) to support import attributes.

### 4. Contract Address Format

`CONTRACT_ADDRESS` from `.env` already includes the `0x` prefix. When passing to `ethers.Contract()`, do **not** double-prefix with `0x`. However, `PRIVATE_KEY` in `.env` does **not** include the prefix, so `0x${PRIVATE_KEY}` is correct.

### 5. Non-View Functions Return TransactionResponse, Not Return Values

Calling a state-changing function (like `update`) via ethers.js returns a `TransactionResponse`, not the Solidity return value. The EVM discards return values from non-view functions during transaction execution.

**Practical patterns to get updated values:**
- **Event Emission:** Emit an event in the contract and parse it from the transaction receipt
- **Reading State:** Call a view function (like `message`) after the transaction confirms
- **Simulation (callStatic):** Use `helloWorld.callStatic.update(...)` to preview the return value without sending a transaction

## Troubleshooting Checklist

- <span style="color: orange;">**Symptom:**</span> `process.env.API_URL` is `undefined`
  - **Cause:** Wrong env var name or missing `dotenv/config` import
  - **Fix:** Use `API_URL` (not `API_KEY`) and add `import "dotenv/config"`

- <span style="color: orange;">**Symptom:**</span> `Import attributes are only supported when '--module' is set to 'esnext', 'node18', ...`
  - **Cause:** `tsconfig.json` has `module: "node16"`
  - **Fix:** Change to `module: "nodenext"` and `moduleResolution: "nodenext"`

- <span style="color: orange;">**Symptom:**</span> `SyntaxError: Unexpected identifier` on JSON import
  - **Cause:** Using `assert { type: "json" }` with Node 22+
  - **Fix:** Use `with { type: "json" }`

- <span style="color: orange;">**Symptom:**</span> Non-view function returns `[object Object]` instead of expected value
  - **Cause:** Ethers returns `TransactionResponse`, not the Solidity return value
  - **Fix:** Read state via a view function after `tx.wait()`, or use events

- <span style="color: orange;">**Symptom:**</span> `invalid address` or `bad address checksum`
  - **Cause:** Double `0x` prefix on contract address
  - **Fix:** Use `CONTRACT_ADDRESS` directly (already has `0x`)

## Working Script

```ts
import "dotenv/config";
import { ethers } from "ethers";
import contract from "../artifacts/contracts/HelloWorld.sol/HelloWorld.json" with { type: "json" };

const API_URL = process.env.API_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

async function main() {
    const provider = new ethers.JsonRpcProvider(API_URL);
    const signer = new ethers.Wallet(`0x${PRIVATE_KEY}`, provider);
    const helloWorld = new ethers.Contract(CONTRACT_ADDRESS, contract.abi, signer);

    const message = await helloWorld.message();
    console.log("Current message:", message);

    const tx = await helloWorld.update("Hello Hardhat!");
    console.log("Updating the message...");
    console.log("Transaction Hash:", tx.hash);
    await tx.wait();
    console.log("Transaction confirmed");

    const newMessage = await helloWorld.message();
    console.log("Updated message:", newMessage);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

## Related Concepts

- [[hardhat3-deploy-script-fix]]
