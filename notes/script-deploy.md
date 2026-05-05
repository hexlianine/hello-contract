---
tags: [Hardhat, Migration, Troubleshooting, Ethers]
created: 2026-05-04
status: draft
---

# Hardhat 2 to 3

**Breaking API changes between Hardhat 2 and Hardhat 3 that affect deploy scripts and plugin configuration.**

## Overview

Hardhat 3 redesigned its plugin system and network connection API. Scripts written for Hardhat 2 will fail with cryptic errors like `TypeError: ethers.getContractFactory is not a function`.

## Key Changes

### 1. Plugin Registration (hardhat.config.ts)

Hardhat 2 used side-effect imports; Hardhat 3 requires explicit plugin registration in the `plugins` array.

**Hardhat 2 (broken):**
```ts
import "@nomicfoundation/hardhat-ethers";
```

**Hardhat 3 (correct):**
```ts
import hardhatEthers from "@nomicfoundation/hardhat-ethers";

export default defineConfig({
  plugins: [hardhatEthers],
  // ...
});
```

Without the `plugins` array entry, the `newConnection` hook never fires and `ethers` is never attached to network connections. The connection object will only have `id`, `networkName`, `networkConfig`, `chainType`, and `close`.

### 2. Accessing Ethers (deploy scripts)

Hardhat 3 uses `network.create()` to get a connection, then destructures `ethers` from it.

**Hardhat 2 (broken):**
```ts
import ethers from "@nomicfoundation/hardhat-ethers";
const HelloWorld = await ethers.getContractFactory("HelloWorld");
const contract = await HelloWorld.deploy("Hello World!");
console.log("Address:", contract.address);
```

**Hardhat 3 (correct):**
```ts
import { network } from "hardhat";
const { ethers } = await network.create();
const contract = await ethers.deployContract("HelloWorld", ["Hello World!"]);
console.log("Address:", await contract.getAddress());
```

### 3. Ethers v6 Contract Address

Ethers v6 removed the `.address` property in favor of the async `.getAddress()` method.

**v5:** `contract.address`
**v6:** `await contract.getAddress()`

## Troubleshooting Checklist

- <span style="color: orange;">**Symptom:**</span> `ethers.getContractFactory is not a function`  
  - **Cause:** Hardhat 2 import style in Hardhat 3  
  - **Fix:** Use `const { ethers } = await network.create()`

- <span style="color: orange;">**Symptom:**</span> `Cannot read properties of undefined (reading 'getContractFactory')`  
  - **Cause:** Plugin not registered in `plugins` array  
  - **Fix:** Add `plugins: [hardhatEthers]` to config

- <span style="color: orange;">**Symptom:**</span> `contract.address` is `undefined`  
  - **Cause:** Ethers v6 removed `.address`  
  - **Fix:** Use `await contract.getAddress()`

- <span style="color: orange;">**Symptom:**</span> `network.connect()` deprecation warning  
  - **Cause:** `connect()` is deprecated in Hardhat 3  
  - **Fix:** Use `network.create()` instead

## Full Script Comparison

### Original Script (Hardhat 2 style — broken)

```ts
// scripts/deploy.ts
import ethers from "@nomicfoundation/hardhat-ethers";
async function main() {
    const HelloWorld = await ethers.getContractFactory("HelloWorld");

    // Start deployment, returning a promise that resolves to a contract object
    const hello_world = await HelloWorld.deploy("Hello World!");
    console.log("Contract deployed to address:", hello_world.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
```

### Updated Script (Hardhat 3 style — working)

```ts
// scripts/deploy.ts
import { network } from "hardhat";

async function main() {
    const { ethers } = await network.create();
    const hello_world = await ethers.deployContract("HelloWorld", ["Hello World!"]);
    console.log("Contract deployed to address:", await hello_world.getAddress());
}

(async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
```

## Related Concepts

- [[hardhat-ethers-plugin]]