import { network } from "hardhat";

async function main() {
    const { ethers } = await network.create();
    const hello_world = await ethers.deployContract("HelloWorld", ["Hello World!"]);
    console.log("Contract deployed to address:", await hello_world.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });