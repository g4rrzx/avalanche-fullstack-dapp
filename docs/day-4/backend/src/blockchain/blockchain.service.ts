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
    this.client = createPublicClient({
      chain: avalancheFuji,
      transport: http("https://api.avax-test.network/ext/bc/C/rpc", {
        timeout: 10_000, // 10 detik timeout
      }),
    });

    // GANTI dengan address hasil deploy Day 2
    this.contractAddress = "0xCC33006367bB9d606d7afe5BfC3Ec3Ba6f0df960" as `0x${string}`;
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
      const events = await this.client.getLogs({
        address: this.contractAddress,
        event: {
          type: "event",
          name: "ValueUpdated",
          inputs: [{ name: "newValue", type: "uint256", indexed: false }],
        },
        fromBlock: fromBlock !== undefined ? BigInt(fromBlock) : 50496198n,
        toBlock: toBlock !== undefined ? BigInt(toBlock) : "latest",
      });

      return events.map((event) => ({
        blockNumber: event.blockNumber?.toString(),
        value: event.args.newValue.toString(),
        txHash: event.transactionHash,
      }));
    } catch (error: any) {
      this.handleRpcError(error);
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