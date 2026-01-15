# Avalanche Indonesia Short Course – Day 2

This repository contains the materials and code for **Day 2** of the **Avalanche Indonesia Short Course**. The focus of this module is on setting up a development environment using **Hardhat**, writing a smart contract using **Solidity**, and deploying it using **Viem**.

## 🚀 Project Overview

In this project, we implement a simple smart contract named `SimpleStorage`. This contract allows users to:
- Store a numeric value on the blockchain.
- Retrieve the stored value.
- Emit an event whenever the value is updated.

## 🛠 Tech Stack

- **Solidity** (^0.8.20): Smart contract programming language.
- **Hardhat**: Development environment for Ethereum software.
- **Viem**: TypeScript interface for Ethereum.
- **TypeScript**: Typed superset of JavaScript.

## 📋 Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## 📦 Installation

1. Clone the repository (if you haven't already):
   ```bash
   git clone <repository_url>
   cd docs/day-2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## ⚙️ Configuration

1. Create a `.env` file in the root of the `day-2` directory.
2. Add your private key and other configuration variables as needed (e.g., for deployment to testnets).

   ```env
   PRIVATE_KEY=your_private_key_here
   ```

   > **Note:** Never commit your `.env` file to version control. It is already added to `.gitignore`.

## 💻 Usage

### Compile Contracts
To compile the Solidity smart contracts:

```bash
npx hardhat compile
```

### Deploy Contract
To deploy the contract to a network (local or testnet):

```bash
npx hardhat run scripts/deploy.ts
```
Or if you are using Hardhat Ignition:
```bash
npx hardhat ignition deploy ignition/modules/SimpleStorage.ts
```

### Run Tests
(If tests are implemented)
```bash
npx hardhat test
```

## 📄 Contract Details

### `SimpleStorage.sol`

A basic contract to demonstrate state variables, functions, and events.

**Functions:**
- `setValue(uint256 _value)`: Updates the stored integer and emits a `ValueUpdated` event.
- `getValue()`: Returns the currently stored integer.

**Events:**
- `ValueUpdated(uint256 newValue)`: Emitted when the value is successfully changed.

## 🤝 Contributing

This project is part of an educational course. Feel free to fork and experiment!

---
*Avalanche Indonesia Short Course*
