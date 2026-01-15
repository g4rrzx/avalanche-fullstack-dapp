
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";
import { USER_PRIVATE_KEY } from "../helpers/constants";
import SimpleStorageArtifact from "../artifacts/contracts/SimpleStorage.sol/SimpleStorage.json" with { type: "json" };

async function main() {
    const account = privateKeyToAccount(USER_PRIVATE_KEY as `0x${string}`);

    const client = createWalletClient({
        account,
        chain: avalancheFuji,
        transport: http()
    });

    const publicClient = createPublicClient({
        chain: avalancheFuji,
        transport: http()
    });

    console.log(`Deploying with account: ${account.address}`);

    const hash = await client.deployContract({
        abi: SimpleStorageArtifact.abi,
        bytecode: SimpleStorageArtifact.bytecode as `0x${string}`,
    });

    console.log(`Transaction hash: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`SimpleStorage deployed to: ${receipt.contractAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
