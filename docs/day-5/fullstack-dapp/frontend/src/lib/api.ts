// Backend API Client
// Uses Next.js API routes as proxy to avoid CORS/firewall issues

export interface ValueResponse {
    value: string;
}

export interface EventResponse {
    blockNumber: string;
    value: string;
    txHash: string;
}

// Get latest value via Next.js API proxy
export async function getValueFromBackend(): Promise<ValueResponse> {
    const response = await fetch('/api/blockchain/value', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
}

// Get events via Next.js API proxy
export async function getEventsFromBackend(
    fromBlock?: number,
    toBlock?: number
): Promise<EventResponse[]> {
    const response = await fetch('/api/blockchain/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fromBlock,
            toBlock,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `API Error: ${response.status}`);
    }

    return response.json();
}
