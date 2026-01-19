// Wagmi Configuration for Avalanche Fuji
import { http, createConfig } from "wagmi";
import { avalancheFuji } from "wagmi/chains";

export const config = createConfig({
    chains: [avalancheFuji],
    transports: {
        [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
    },
    ssr: true, // Enable SSR for Next.js
});
