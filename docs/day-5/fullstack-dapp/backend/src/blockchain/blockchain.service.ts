import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createPublicClient, http } from "viem";
import { avalancheFuji } from "viem/chains";
import SIMPLE_STORAGE_ABI from "./Simple-Storage.json";

@Injectable()
export class BlockchainService {
  private client;
  private contractAddress: `0x${string}`;

  constructor() {
    // 🔹 Day 5: Configuration from environment variables
    const rpcUrl = process.env.RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
    const contractAddr = process.env.CONTRACT_ADDRESS || "0xCC33006367bB9d606d7afe5BfC3Ec3Ba6f0df960";

    this.client = createPublicClient({
      chain: avalancheFuji,
      transport: http(rpcUrl, {
        timeout: 10_000, // 10 seconds timeout
      }),
    });

    this.contractAddress = contractAddr as `0x${string}`;

    console.log(`🔗 Blockchain Service initialized`);
    console.log(`   RPC URL: ${rpcUrl}`);
    console.log(`   Contract: ${this.contractAddress}`);
  }

  // 🔹 Read latest value
  async getLatestValue() {
    try {
      const value = await this.client.readContract({
        address: this.contractAddress,
        abi: SIMPLE_STORAGE_ABI,
        functionName: "getValue",
      });

      return {
        value: value.toString(),
      };
    } catch (error: any) {
      this.handleRpcError(error);
    }
  }

  // 🔹 Read events
  async getValueUpdatedEvents(fromBlock?: number, toBlock?: number) {
    try {
      // Get current block number
      const currentBlock = await this.client.getBlockNumber();

      // Use smaller range to avoid RPC rate limiting (last 10000 blocks)
      const defaultFromBlock = currentBlock - 10000n;

      const events = await this.client.getLogs({
        address: this.contractAddress,
        event: {
          type: "event",
          name: "ValueUpdated",
          inputs: [{ name: "newValue", type: "uint256", indexed: false }],
        },
        fromBlock: fromBlock !== undefined ? BigInt(fromBlock) : defaultFromBlock,
        toBlock: toBlock !== undefined ? BigInt(toBlock) : "latest",
      });

      return events.map((event) => ({
        blockNumber: event.blockNumber?.toString(),
        value: event.args.newValue?.toString() || "0",
        txHash: event.transactionHash,
      }));
    } catch (error: any) {
      console.error("Error fetching events:", error.message);
      // Return empty array instead of throwing to prevent 503
      return [];
    }
  }

  // 🔹 Centralized RPC Error Handler
  private handleRpcError(error: any): never {
    const message = error?.message?.toLowerCase() || "";

    if (message.includes("timeout")) {
      throw new ServiceUnavailableException(
        "RPC timeout. Silakan coba beberapa saat lagi."
      );
    }

    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("failed")
    ) {
      throw new ServiceUnavailableException(
        "Tidak dapat terhubung ke blockchain RPC."
      );
    }

    throw new InternalServerErrorException(
      "Terjadi kesalahan saat membaca data blockchain."
    );
  }
}