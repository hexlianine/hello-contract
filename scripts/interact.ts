import "dotenv/config";
import { ethers } from "ethers";
import contract from "../artifacts/contracts/HelloWorld.sol/HelloWorld.json" with { type: "json" };

const API_KEY = process.env.API_KEY!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

async function main() {
    console.log(contract.abi);

    // Alternative:
    // const provider = new ethers.JsonRpcProvider(API_URL);
    const provider = new ethers.AlchemyProvider("sepolia", API_KEY);

    const signer = new ethers.Wallet(`0x${PRIVATE_KEY}`, provider)
    const helloWorld = new ethers.Contract(`0x${CONTRACT_ADDRESS}`, contract.abi, signer)

    const message = await helloWorld.message();
    console.log("Current message:", message);

    // The `update` function is a state-changing (non-view) method, so when called
    // via ethers.js, it initiates a transaction on the blockchain. It returns a
    // `TransactionResponse` object (`tx`) rather than the function's Solidity return
    // value (which is implicit for non-view functions). This object allows tracking
    // the transaction's progress, hash, status, etc.
    //
    // If `update` returns a string, but it's a state-changing function (non-view),
    // the EVM discards the returned value upon transaction execution; ethers.js
    // cannot directly retrieve this returned string from the transaction.
    //
    // You have a few practical options:
    //
    // 1. **Pattern: Event Emission**
    //    Modify the contract to emit an event with the string you want to return,
    //    and read the event from the transaction receipt:
    //    // Solidity:
    //    ```
    //    event Updated(string newValue);
    //    function update(string calldata v) public returns (string memory) {
    //        ... // logic
    //        emit Updated(v);
    //        return v;
    //    }
    //    ```
    //    // Script:
    //    ```
    //    const tx = await helloWorld.update("Hello from interact script!");
    //    const receipt = await tx.wait();
    //    const event = receipt.logs
    //      .map(log => helloWorld.interface.parseLog(log))
    //      .find(parsed => parsed && parsed.name === "Updated");
    //    if (event) {
    //      console.log("Value from event:", event.args.newValue);
    //    }
    //    ```
    //
    // 2. **Pattern: Reading State**
    //    After transaction confirmation, call a view function to read the updated
    //    value:
    //    ```
    //    const tx = await helloWorld.update("Hello from interact script!");
    //    await tx.wait();
    //    const newMessage = await helloWorld.message();
    //    console.log("Updated message after tx:", newMessage);
    //    ```
    //
    // 3. **Pattern: Simulation (callStatic)**
    //    If you just want to know what would be returned, but *not* actually
    //    perform the transaction:
    //    ```
    //    const simulatedReturn = await helloWorld.callStatic.update(
    //      "Hello Hardhat!"
    //    );
    //    console.log("Simulated return value:", simulatedReturn);
    //    ```
    //
    // 4. **Pattern: Transaction Input/Output Decoding**
    //    If the transaction itself was mined, you can sometimes decode output from
    //    transaction traces (requires custom tooling or rpc support such as
    //    debug_traceTransaction). This is advanced and not natively supported by
    //    ethers.js for ordinary users, is not portable across chains/rpc providers,
    //    and usually not recommended for dapp logic.
    //
    // In short: For production, use events or state-reading.
    const tx = await helloWorld.update("Hello Hardhat!");

    // While running that script, you may notice that the "Updating the message..."
    // step takes a while before the new message loads. That is due to the mining
    // process; if you are curious about tracking transactions while they are being
    // mined, visit the Alchemy mempool(https://dashboard.alchemy.com/mempool) to see 
    // the status of a transaction. If the transaction is dropped, it's also helpful 
    // to check Sepolia Etherscan(https://sepolia.etherscan.io) and search for your 
    // transaction hash.
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
