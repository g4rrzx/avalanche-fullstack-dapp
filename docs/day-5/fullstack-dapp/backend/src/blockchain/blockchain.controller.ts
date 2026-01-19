import { Controller, Get, Body, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BlockchainService } from "./blockchain.service";
import { GetEventsDto } from "./dto/get-events.dto";

@ApiTags("Blockchain")
@Controller("blockchain")
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {
    console.log("BlockchainController initialized!");
  }

  // GET /blockchain/value
  @Get("value")
  @ApiOperation({ summary: "Get latest value from Smart Contract" })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved value",
    schema: {
      type: "object",
      properties: {
        value: { type: "string", example: "123" },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Service Unavailable (RPC Issue)",
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error",
  })
  async getValue() {
    return this.blockchainService.getLatestValue();
  }

  // GET /blockchain/events
  @Post("events")
  @ApiOperation({ summary: "Get ValueUpdated events from Smart Contract" })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved events",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          blockNumber: { type: "string", example: "50496198" },
          value: { type: "string", example: "123" },
          txHash: { type: "string", example: "0x..." },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Service Unavailable (RPC Issue)",
  })
  @ApiResponse({
    status: 500,
    description: "Internal Server Error",
  })
  async getEvents(@Body() body: GetEventsDto) {
    return this.blockchainService.getValueUpdatedEvents(body.fromBlock, body.toBlock);
  }
}