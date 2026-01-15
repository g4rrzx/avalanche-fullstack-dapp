
import fs from "fs";
import path from "path";

// Manually load .env variables
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
            let value = valueParts.join("=").trim();
            // Remove quotes
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            if (!process.env[key.trim()]) {
                process.env[key.trim()] = value;
            }
        }
    });
}

export const USER_PRIVATE_KEY = process.env.PRIVATE_KEY || "";
export const ETHERSCAN_API = process.env.ETHERSCAN_API_KEY || "";
export const RPC_URL = process.env.RPC_URL || "";
