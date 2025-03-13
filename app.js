// Função para enviar seed ao servidor e obter endereços gerados
async function generateAddresses() {
  const seed = document.getElementById("seedInput").value;

  if (!seed) {
    alert("Por favor, insira a seed.");
    return;
  }

  try {
    const response = await fetch(`/generate?seed=${encodeURIComponent(seed)}`);
    if (!response.ok) {
      throw new Error(`Erro: ${response.statusText}`);
    }

    const addresses = await response.json();
    displayResults(addresses);
  } catch (error) {
    console.error("Erro ao gerar endereços:", error);
    alert("Erro ao gerar endereços. Verifique o console para mais detalhes.");
  }
}

// Função para exibir os endereços no HTML
function displayResults(addresses) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  for (const [blockchain, addressList] of Object.entries(addresses)) {
    const blockchainDiv = document.createElement("div");
    blockchainDiv.innerHTML = `<h2>${blockchain}</h2>`;
    resultsDiv.appendChild(blockchainDiv);

    if (Array.isArray(addressList)) {
      // Para Ethereum, Tron, e outros tipos similares (arrays)
      addressList.forEach((entry, index) => {
        if (entry.balance > 0) {
          const addressDiv = document.createElement("div");
          const explorerURL = getExplorerURL(blockchain, entry.address);
          addressDiv.innerHTML = `
            <p style="color: white;">
              Endereço ${index + 1}: 
              <a href="${explorerURL}" target="_blank" style="color: white; text-decoration: underline;">
                ${entry.address}
              </a> - Saldo: ${entry.balance}
              <br><small>Caminho: ${entry.path}</small>
            </p>
          `;
          blockchainDiv.appendChild(addressDiv);
        }
      });
    } else {
      // Para Bitcoin (objeto com tipos diferentes)
      for (const [type, addresses] of Object.entries(addressList)) {
        const typeDiv = document.createElement("div");
        typeDiv.innerHTML = `<h3>${type}</h3>`;
        blockchainDiv.appendChild(typeDiv);

        addresses.forEach((entry, index) => {
          if (entry.balance > 0) {
            const addressDiv = document.createElement("div");
            const explorerURL = getExplorerURL("Bitcoin", entry.address);
            addressDiv.innerHTML = `
              <p style="color: white;">
                Endereço ${index + 1}: 
                <a href="${explorerURL}" target="_blank" style="color: white; text-decoration: underline;">
                  ${entry.address}
                </a> - Saldo: ${entry.balance}
                <br><small>Caminho: ${entry.path}</small>
              </p>
            `;
            typeDiv.appendChild(addressDiv);
          }
        });
      }
    }
  }
}

// Função para gerar o URL do explorador de blockchain baseado na rede e no endereço
function getExplorerURL(blockchain, address) {
  switch (blockchain) {
    case "Bitcoin":
      return `https://blockstream.info/address/${address}`;
    case "Ethereum":
      return `https://etherscan.io/address/${address}`;
    case "Tron":
      return `https://tronscan.org/#/address/${address}`;
    case "BSC":
      return `https://bscscan.com/address/${address}`;
    default:
      return "#";
  }
}

// Adicionando um listener ao botão de geração de endereços
document.getElementById("generateButton").addEventListener("click", generateAddresses);
