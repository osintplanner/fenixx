
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const { generateBitcoinAddresses, generateEthereumAddresses, generateTronAddresses, generateBscAddresses, getBitcoinBalance, getEthereumBalance, getTronBalance, getBscBalance } = require('./addressGenerator');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const formatBalance = (balance) => {
  return (isNaN(balance) || balance === null) ? "0.00000" : balance.toFixed(5);
};

app.get('/generate', async (req, res) => {
  const seed = req.query.seed;

  if (!seed) {
    return res.status(400).send("Seed não fornecida");
  }

  try {
    const bitcoinAddresses = generateBitcoinAddresses(seed);
    const ethereumAddresses = generateEthereumAddresses(seed);
    const tronAddresses = generateTronAddresses(seed);
    const bscAddresses = generateBscAddresses(seed);

    const results = {
      Bitcoin: {
        p2pkh: [],
        p2sh: [],
        bech32: [],
        taproot: []
      },
      Ethereum: [],
      Tron: [],
      BSC: []
    };

    // Processa endereços Bitcoin (P2PKH, P2SH, Bech32 e Taproot)
    for (const { address, path } of bitcoinAddresses.p2pkh) {
      try {
        const balance = await getBitcoinBalance(address);
        results.Bitcoin.p2pkh.push({ address, balance: formatBalance(balance), path });
      } catch (error) {
        console.error(`Erro ao consultar saldo para P2PKH ${address}:`, error.message);
      }
      await delay(1000);
    }
    for (const { address, path } of bitcoinAddresses.p2sh) {
      try {
        const balance = await getBitcoinBalance(address);
        results.Bitcoin.p2sh.push({ address, balance: formatBalance(balance), path });
      } catch (error) {
        console.error(`Erro ao consultar saldo para P2SH ${address}:`, error.message);
      }
      await delay(1000);
    }
    for (const { address, path } of bitcoinAddresses.bech32) {
      try {
        const balance = await getBitcoinBalance(address);
        results.Bitcoin.bech32.push({ address, balance: formatBalance(balance), path });
      } catch (error) {
        console.error(`Erro ao consultar saldo para Bech32 ${address}:`, error.message);
      }
      await delay(1000);
    }
    for (const { address, path } of bitcoinAddresses.taproot) {
      try {
        const balance = await getBitcoinBalance(address);
        results.Bitcoin.taproot.push({ address, balance: formatBalance(balance), path });
      } catch (error) {
        console.error(`Erro ao consultar saldo para Taproot ${address}:`, error.message);
      }
      await delay(1000);
    }

    // Processa endereços Ethereum
    for (const { address, path } of ethereumAddresses) {
      try {
        const balance = await getEthereumBalance(address);
        results.Ethereum.push({ address, balance: formatBalance(balance), path });
      } catch (error) {
        console.error(`Erro ao consultar saldo de Ethereum para o endereço ${address}:`, error.message);
      }
      await delay(500);
    }

    // Processa endereços Tron
    for (const { address, path } of tronAddresses) {
      try {
        const balance = await getTronBalance(address);
        results.Tron.push({ address, balance: formatBalance(balance), path });
      } catch (error) {
        console.error(`Erro ao consultar saldo de Tron para o endereço ${address}:`, error.message);
      }
      await delay(200);
    }

    // Processa endereços BSC
    for (const { address, path } of bscAddresses) {
      try {
        const balance = await getBscBalance(address);
        results.BSC.push({ address, balance: formatBalance(balance), path });
      } catch (error) {
        console.error(`Erro ao consultar saldo de BSC para o endereço ${address}:`, error.message);
      }
      await delay(500);
    }

    res.json(results);
  } catch (error) {
    console.error("Erro ao gerar endereços:", error);
    res.status(500).send("Erro ao gerar endereços");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  exec(`start "" "http://localhost:${port}"`);
});
