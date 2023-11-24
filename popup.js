document.addEventListener('DOMContentLoaded', () => {
  const defaultGatewayRadio = document.getElementById('defaultGateway');
  const customGatewayRadio = document.getElementById('customGateway');
  const customGatewayInputDiv = document.getElementById('customGatewayInput');
  const customGatewaySavedDiv = document.getElementById('customGatewaySaved');
  const gatewayDisplay = document.getElementById('gatewayDisplay');
  const recentSearchesList = document.getElementById('recentSearches'); // Ensure you have this in your HTML

  // Function to display recent searches
  function displayRecentSearches() {
    chrome.storage.local.get({ recentSearches: [] }, (result) => {
      recentSearchesList.innerHTML = '';
      result.recentSearches.forEach(search => {
        const listItem = document.createElement('li');

        const domainSpan = document.createElement('span');
        domainSpan.classList.add('domain-name');
        domainSpan.textContent = search.domain;
        listItem.appendChild(domainSpan);

        const date = new Date(search.timestamp);
        const dateSpan = document.createElement('span');
        dateSpan.classList.add('search-date');
        dateSpan.textContent = `  ${date.toLocaleDateString()}`;
        listItem.appendChild(dateSpan);

        const timeSpan = document.createElement('span');
        timeSpan.classList.add('search-time');
        timeSpan.textContent = ` ${date.toLocaleTimeString()}`;
        listItem.appendChild(timeSpan);

        listItem.addEventListener('click', () => {
          chrome.tabs.create({ url: search.url });
        });

        recentSearchesList.appendChild(listItem);
      });
    });
  }

  // Load saved gateway and update UI accordingly
  chrome.storage.local.get(['customGateway'], (result) => {
    if (result.customGateway) {
      gatewayDisplay.textContent = result.customGateway;
      customGatewaySavedDiv.classList.remove('hidden');
      customGatewayRadio.checked = true;
    }
  });

  // Handle default gateway selection
  defaultGatewayRadio.addEventListener('change', () => {
    customGatewayInputDiv.classList.add('hidden');
    customGatewaySavedDiv.classList.add('hidden');
    chrome.storage.local.remove(['customGateway']);
  });

  // Handle custom gateway selection
  customGatewayRadio.addEventListener('change', () => {
    customGatewaySavedDiv.classList.add('hidden');
    customGatewayInputDiv.classList.remove('hidden');
  });

  // Handle saving the custom gateway
  document.getElementById('saveGateway').addEventListener('click', () => {
    let gatewayUrl = document.getElementById('gatewayUrl').value.trim();
    // Check if the user input already contains 'https://', if not, prepend it
    if (gatewayUrl && !gatewayUrl.startsWith('https://')) {
      gatewayUrl = 'https://' + gatewayUrl;
    }

    if (gatewayUrl) {
      chrome.storage.local.set({ customGateway: gatewayUrl }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error setting customGateway: ${chrome.runtime.lastError.message}`);
        } else {
          customGatewayInputDiv.classList.add('hidden');
          gatewayDisplay.textContent = gatewayUrl;
          customGatewaySavedDiv.classList.remove('hidden');
          console.log(`Custom gateway saved: ${gatewayUrl}`);
        }
      });
    }
  });

  // Handle change button click
  document.getElementById('changeGateway').addEventListener('click', () => {
    customGatewaySavedDiv.classList.add('hidden');
    customGatewayInputDiv.classList.remove('hidden');
  });

  // Call to display the recent searches
  displayRecentSearches();
});
