# 📘 Day 5 – Integrasi & Deployment Full Stack dApp (Avalanche)

> Avalanche Indonesia Short Course – **Day 5**

Hari kelima merupakan **puncak dari short course ini**.
Peserta akan **mengintegrasikan seluruh layer** yang telah dibangun dari Day 1 hingga Day 4, lalu melakukan **deployment** sehingga dApp dapat diakses secara publik dan berjalan **end-to-end**.

---

## 🏗️ Struktur Project

```
day-5/
├── README.md                 # Dokumentasi ini
└── fullstack-dapp/
    ├── package.json          # Root package.json dengan scripts
    ├── backend/              # NestJS Backend (dari Day 4)
    │   ├── .env              # Environment config
    │   ├── src/
    │   │   ├── main.ts       # Entry point dengan CORS
    │   │   ├── blockchain/   # Blockchain service
    │   │   └── ...
    │   └── ...
    └── frontend/             # Next.js Frontend
        ├── .env.local        # Environment config
        ├── app/
        │   ├── page.tsx      # Main page dengan integrasi
        │   ├── layout.tsx    # Layout dengan providers
        │   └── globals.css   # Global styles
        ├── src/
        │   ├── components/   # React components
        │   ├── contracts/    # Smart contract ABI
        │   └── lib/          # Utilities & API client
        └── ...
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend
cd fullstack-dapp/backend
pnpm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

#### Backend (`.env`)
```env
PORT=3000
FRONTEND_URL=http://localhost:3002
RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
CONTRACT_ADDRESS=0xCC33006367bB9d606d7afe5BfC3Ec3Ba6f0df960
```

#### Frontend (`.env.local`)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_CONTRACT_ADDRESS=0xCC33006367bB9d606d7afe5BfC3Ec3Ba6f0df960
NEXT_PUBLIC_CHAIN_ID=43113
```

### 3. Run Applications

**Terminal 1 - Backend (Port 3000):**
```bash
cd fullstack-dapp/backend
pnpm start:dev
```

**Terminal 2 - Frontend (Port 3002):**
```bash
cd fullstack-dapp/frontend
npm run dev
```

### 4. Buka Aplikasi

- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api

---

## 🧩 Arsitektur Full Stack

```text
User
 ↓
Frontend (Next.js @ localhost:3002)
 ↓ REST API (Read)      ↓ Direct (Write)
Backend (NestJS)        Wallet (Core)
 ↓ read                  ↓ sign & send
Blockchain (Avalanche Fuji)
```

### Read Flow (via Backend)
```
Frontend → Backend API → Blockchain → Response
```
- Frontend memanggil `/blockchain/value`
- Backend membaca dari smart contract via viem
- Data dikembalikan ke frontend

### Write Flow (via Wallet)
```
Frontend → Wallet → Blockchain → Event
```
- User memasukkan nilai baru
- Wallet (Core) menandatangani transaksi
- Smart contract di-update on-chain

---

## 📝 API Endpoints

| Method | Endpoint            | Deskripsi                     |
|--------|---------------------|-------------------------------|
| GET    | /blockchain/value   | Get current stored value      |
| POST   | /blockchain/events  | Get ValueUpdated events       |

### Example Response

**GET /blockchain/value**
```json
{
  "value": "123"
}
```

**POST /blockchain/events**
```json
[
  {
    "blockNumber": "50496198",
    "value": "123",
    "txHash": "0x..."
  }
]
```

---

## ✅ Checklist Day 5

- [x] Smart contract terdeploy (Day 2)
- [x] Backend API dengan CORS enabled
- [x] Frontend terintegrasi dengan Backend API
- [x] Frontend terintegrasi dengan Smart Contract (via wagmi)
- [x] Environment configuration (`.env` files)
- [x] Wallet connection (Core Wallet)
- [x] Read data via Backend
- [x] Write data via Wallet transaction
- [x] Event logging

---

## 🎓 Output Akhir

Setelah menyelesaikan Day 5, peserta:

1. **Memiliki Full Stack Web3 dApp** yang running
2. **Memahami**:
   - Arsitektur dApp secara utuh
   - On-chain vs off-chain responsibility
   - Integrasi frontend, backend, dan blockchain
   - Environment configuration
   - CORS setup untuk cross-origin requests
3. **Siap melanjutkan** ke deployment production

---

## 📚 Referensi

- [Avalanche Docs](https://docs.avax.network)
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [wagmi Documentation](https://wagmi.sh)
- [viem Documentation](https://viem.sh)

---

**TEGAR ANDRIYANSYAH**
**NIM: 231011402038**

🔥 **Course selesai!** Sekarang saatnya **build, ship, dan iterate dApp Web3-mu sendiri** 🚀
