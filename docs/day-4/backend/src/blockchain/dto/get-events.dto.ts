import { ApiProperty } from "@nestjs/swagger";

export class GetEventsDto {
    @ApiProperty({
        description: "Block number to start fetching events from",
        example: 0,
    })
    fromBlock: number;
    @ApiProperty({
        description: "Block number to stop fetching events at",
        example: 100,
    })
    toBlock: number;
}