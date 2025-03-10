const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const BIP32Factory = require('bip32').default;
const ecc = require('tiny-secp256k1');
const ethers = require('ethers');
const TronWeb = require('tronweb');
const axios = require('axios');

// Inicializa a biblioteca ECC
bitcoin.initEccLib(ecc);

const bip32 = BIP32Factory(ecc);

// Tokens de API
const ETHERSCAN_API_KEY = 'DNJDG5KV5V8ZEG8NTYWYYIF6C38789P481';
const TRONGRID_API_KEY = '72604aff-af71-4857-ad8d-6cefc8b6ee75';
const BSCSCAN_API_KEY = 'M5SB7A1XZ97QG1M8YX1578R2G7TVIVYX7R';

// Função para gerar endereço Taproot (P2TR)
function generateTaprootAddress(root, pathTaproot) {
  const childNode = root.derivePath(pathTaproot);
  const { address } = bitcoin.payments.p2tr({
    internalPubkey: childNode.publicKey.slice(1, 33),
    network: bitcoin.networks.bitcoin
  });
  return address;
}

// Função para gerar endereços Bitcoin para várias contas e índices
function generateBitcoinAddresses(seedPhrase) {
  if (!bip39.validateMnemonic(seedPhrase)) {
    throw new Error("Seed inválida.");
  }
  const seed = bip39.mnemonicToSeedSync(seedPhrase);
  const root = bip32.fromSeed(seed);

  const addresses = { p2pkh: [], p2sh: [], bech32: [], taproot: [] };
  const contas = [0, 1];
  const indices = [0, 1];

  contas.forEach(conta => {
    indices.forEach(indice => {
      for (let i = 0; i < 5; i++) {
        const pathP2PKH = `m/44'/0'/${conta}'/0/${indice * 10 + i}`;
        const pathP2SH = `m/49'/0'/${conta}'/0/${indice * 10 + i}`;
        const pathBech32 = `m/84'/0'/${conta}'/0/${indice * 10 + i}`;
        const pathTaproot = `m/86'/0'/${conta}'/0/${indice * 10 + i}`;

        const p2pkh = bitcoin.payments.p2pkh({ pubkey: root.derivePath(pathP2PKH).publicKey });
        const p2sh = bitcoin.payments.p2sh({ redeem: bitcoin.payments.p2wpkh({ pubkey: root.derivePath(pathP2SH).publicKey }) });
        const bech32 = bitcoin.payments.p2wpkh({ pubkey: root.derivePath(pathBech32).publicKey });
        
        const taprootAddress = generateTaprootAddress(root, pathTaproot);

        addresses.p2pkh.push({ address: p2pkh.address, path: pathP2PKH });
        addresses.p2sh.push({ address: p2sh.address, path: pathP2SH });
        addresses.bech32.push({ address: bech32.address, path: pathBech32 });
        addresses.taproot.push({ address: taprootAddress, path: pathTaproot });
      }
    });
  });

  return addresses;
}

// Função para gerar endereços Ethereum em múltiplas contas e índices
function generateEthereumAddresses(seedPhrase) {
  if (!bip39.validateMnemonic(seedPhrase)) {
    throw new Error("Seed inválida.");
  }
  const hdNode = ethers.utils.HDNode.fromMnemonic(seedPhrase);
  const addresses = [];
  
  const contas = [0, 1];
  const indices = [0, 1];

  contas.forEach(conta => {
    indices.forEach(indice => {
      for (let i = 0; i < 5; i++) {
        const path = `m/44'/60'/${conta}'/0/${indice * 5 + i}`;
        const wallet = hdNode.derivePath(path);
        addresses.push({ address: wallet.address, path });
      }
    });
  });

  return addresses;
}

// Função para gerar endereços BSC em múltiplas contas e índices
function generateBscAddresses(seedPhrase) {
  if (!bip39.validateMnemonic(seedPhrase)) {
    throw new Error("Seed inválida.");
  }
  const hdNode = ethers.utils.HDNode.fromMnemonic(seedPhrase);
  const addresses = [];
  
  const contas = [0, 1];
  const indices = [0, 1];

  contas.forEach(conta => {
    indices.forEach(indice => {
      for (let i = 0; i < 5; i++) {
        const path = `m/44'/60'/${conta}'/0/${indice * 5 + i}`;
        const wallet = hdNode.derivePath(path);
        addresses.push({ address: wallet.address, path });
      }
    });
  });

  return addresses;
}

// Função para gerar endereços Tron em múltiplas contas e índices
function generateTronAddresses(seedPhrase) {
  if (!bip39.validateMnemonic(seedPhrase)) {
    throw new Error("Seed inválida.");
  }

  const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io'
  });

  const addresses = [];
  
  const contas = [0, 1];
  const indices = [0, 1];

  const root = bip32.fromSeed(bip39.mnemonicToSeedSync(seedPhrase));
  contas.forEach(conta => {
    indices.forEach(indice => {
      for (let i = 0; i < 5; i++) {
        const path = `m/44'/195'/${conta}'/0/${indice * 5 + i}`;
        const derivedNode = root.derivePath(path);
        const privateKey = derivedNode.privateKey.toString('hex');

        if (!privateKey) {
          console.error("Erro ao derivar chave privada para o caminho:", path);
          continue;
        }

        const address = tronWeb.address.fromPrivateKey(privateKey);
        addresses.push({ address, path });
      }
    });
  });

  return addresses;
}

// Consultas de saldo para Bitcoin, Ethereum, BSC e Tron
async function getBitcoinBalance(address) {
  try {
    const response = await axios.get(`https://blockstream.info/api/address/${address}`);
    const balance = response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;
    console.log(`Bitcoin Balance for ${address}:`, balance);
    return balance / 100000000;
  } catch (error) {
    console.error(`Erro ao consultar saldo de Bitcoin: ${error.message}`);
    return 0;
  }
}

async function getEthereumBalance(address) {
  try {
    const response = await axios.get(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`);
    console.log(`Ethereum Balance for ${address}:`, response.data.result);
    return response.data.result / 1000000000000000000;
  } catch (error) {
    console.error(`Erro ao consultar saldo de Ethereum: ${error.message}`);
    return 0;
  }
}

async function getBscBalance(address) {
  try {
    const response = await axios.get(`https://api.bscscan.com/api?module=account&action=balance&address=${address}&tag=latest&apikey=${BSCSCAN_API_KEY}`);
    console.log(`BSC Balance for ${address}:`, response.data.result);
    return response.data.result / 1000000000000000000;
  } catch (error) {
    console.error(`Erro ao consultar saldo de BSC: ${error.message}`);
    return 0;
  }
}

async function getTronBalance(address) {
  try {
    const response = await axios.get(`https://api.trongrid.io/v1/accounts/${address}`, {
      headers: {
        'TRON-PRO-API-KEY': TRONGRID_API_KEY
      }
    });
    
    const balance = response.data?.data?.[0]?.balance ?? 0;
    console.log(`Tron Balance for ${address}:`, balance);
    return balance / 1000000;
  } catch (error) {
    console.error(`Erro ao consultar saldo de Tron: ${error.message}`);
    return 0;
  }
}

module.exports = {
  generateBitcoinAddresses,
  generateEthereumAddresses,
  generateTronAddresses,
  generateBscAddresses,
  getBitcoinBalance,
  getEthereumBalance,
  getTronBalance,
  getBscBalance
};
