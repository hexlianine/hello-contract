---
tags: [Hardhat, TypeScript, Plugin, Debugging]
created: 2026-05-05
status: draft
---

# Hardhat Plugin Type Merging

**Hardhat plugins use TypeScript declaration merging to extend `HardhatUserConfig`, so a missing plugin import causes a type error rather than a runtime hint.**

## Overview

When you add a config block like `verify: { etherscan: { apiKey: "..." } }` to `hardhat.config.ts` without importing the corresponding plugin (`@nomicfoundation/hardhat-verify`), TypeScript reports:

> Object literal may only specify known properties, and 'verify' does not exist in type 'HardhatUserConfig'.

This is not a helpful "you forgot to import X" message — it's a generic structural type check failure.

## How It Works

Hardhat plugins augment the `HardhatUserConfig` type via TypeScript declaration merging:

```ts
// Inside @nomicfoundation/hardhat-verify type definitions
declare module "hardhat/config" {
  interface HardhatUserConfig {
    verify?: { etherscan?: { apiKey?: string } };
  }
}
```

Only when the plugin is imported does this declaration load and add `verify` as a known property. Without the import, TypeScript sees a plain `HardhatUserConfig` with no `verify` field.

## Runtime vs Type-Level Behavior

| State | Type-Level | Runtime |
|-------|-----------|---------|
| Plugin imported | `verify` is a known property | `npx hardhat verify` works |
| Plugin not imported | Type error: unknown property | `verify` key is silently ignored; `verify` task doesn't exist |

At runtime, Hardhat simply ignores unknown config keys — no error, no warning. The config block is **inert**: present but non-functional. TypeScript's type error is actually saving you from this silent failure.

## Why No "Import X" Suggestion?

TypeScript performs structural type checking — it knows a property is missing but has no concept of which plugin provides it. It cannot suggest a specific import because the relationship between config keys and plugins exists only in the plugin ecosystem, not in the type system.

## Fix

Always pair each config section with its plugin import:

```ts
import hardhatVerify from "@nomicfoundation/hardhat-verify";

export default defineConfig({
  plugins: [hardhatEthers, hardhatVerify],
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY || "",
    },
  },
});
```

## HHE80022: Contract Already Verified

This error means the explorer's API already matched source code to the deployed bytecode and rejects re-verification for an exact match.

[The error can be misleading](https://github.com/NomicFoundation/hardhat/issues/2287#issuecomment-1160856905) — the submission appears to succeed first ("Successfully submitted source code..."), then fails when polling the verification result with `NomicLabsHardhatPluginError: Already Verified`. This is especially problematic in scripts that verify programmatically, as the unhandled error crashes the script even though the contract is already in the desired state (verified).

### Why It Occurs

- **Previous verification**: The contract was successfully verified earlier.
- **`--force` flag**: Using `--force` can still trigger this if the API rejects based on an existing full match.
- **Full vs. Similar match**: The contract may be partially verified (similar match) but blocked from a full verification update via CLI.
- **Programmatic verification**: In deploy scripts that auto-verify after deployment, re-running the script against an already-verified contract will throw this error instead of gracefully skipping.

### How to Resolve

1. **Check the explorer manually**: Open the contract address in your browser (e.g., `etherscan.io/address/<address>#code`). A green checkmark means it's already verified — no further action needed.
2. **Wait a few minutes**: If you just deployed, the explorer might be updating its index. Wait 1–2 minutes.
3. **Use `--force`** (if not already): For updating a partially verified contract:
   ```bash
   npx hardhat verify --network <network> <contract-address> <constructor-args> --force
   ```
4. **Check compiler settings**: Ensure Solidity version, optimizer enabled, and optimization runs in `hardhat.config.ts` match the settings used during deployment.
5. **Verify via UI**: If CLI keeps failing, use the "Verify & Publish" feature directly on the Etherscan/Blockscout website.
6. **Catch the error in scripts**: When verifying programmatically, wrap the call in a try/catch so "Already Verified" doesn't crash your script:
   ```ts
   try {
     await hre.run("verify:verify", {
       address: contractAddress,
       constructorArguments: args,
     });
   } catch (e: any) {
     if (e.message.toLowerCase().includes("already verified")) {
       console.log("Contract already verified — skipping.");
     } else {
       throw e;
     }
   }
   ```

### Proxy Contracts

If verifying a proxy, you may need to verify the implementation contract separately. The Sourcify plugin is often more lenient with proxy re-verification.

## References

- [Hello World Smart Contract for Beginners - Goerli](https://ethereum.org/developers/tutorials/hello-world-smart-contract-fullstack/)
- [Lifecycle of the components of a Hardhat 3 plugin](https://hardhat.org/docs/plugin-development/explanations/lifecycle)
- [Hardhat 3 Plugin - hardhat-verify](https://hardhat.org/docs/plugins/hardhat-verify)
- [GitHub Issue #2287 — "Already Verified" should not crash scripts](https://github.com/NomicFoundation/hardhat/issues/2287)
