chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started');
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId === 0) {
    let domain;
    const url = new URL(details.url);
    
    // Check if the URL directly points to a .eth domain
    if (url.hostname.endsWith('.eth')) {
      domain = url.hostname;
    }
    // Check if it's a search query on Google or Bing
    else if ((url.hostname === 'www.google.com' && url.pathname === '/search') ||
             (url.hostname === 'www.bing.com' && url.pathname === '/search')) {
      domain = url.searchParams.get('q');
    }

    if (domain && domain.endsWith('.eth')) {
      console.log(`Handling .eth domain:`, domain);


      const loadingPageUrl = chrome.runtime.getURL('loading.html');
      chrome.tabs.update(details.tabId, { url: loadingPageUrl }, async () => {
        if (chrome.runtime.lastError) {
          console.error(`Error during redirect: ${chrome.runtime.lastError.message}`);
          return;
        }

        const apiUrl = `https://dns.eth.limo/dns-query?name=${domain}&type=TXT`;

        try {
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);

          const data = await response.json();
          console.log('API response:', data);

          if (data.Answer && data.Answer.length > 0) {
            const dnslink = data.Answer[0].data.split('=')[1];
            if (dnslink) {
              performRedirect(domain, dnslink, details.tabId);
            } else {
              redirectToCustomDomain(domain);
            }
          } else {
            redirectToCustomDomain(domain);
          }
        } catch (error) {
          console.error('Error resolving .eth domain:', error);
          redirectToCustomDomain(domain);
        }
      });
    }
  }
}, { url: [{ schemes: ['http', 'https'] }] });

function performRedirect(domain, dnslink, tabId) {
  chrome.storage.local.get(['customGateway'], (result) => {
    let customGateway = result.customGateway || 'https://1w3.spheron.link';
    if (!customGateway.startsWith('https://')) {
      customGateway = 'https://' + customGateway;
    }
    const ipfsUrl = `${customGateway}${dnslink}`;

    // Update recent searches
    const resolvedDomain = { domain, url: ipfsUrl, timestamp: new Date().toISOString() };
    chrome.storage.local.get({ recentSearches: [] }, (res) => {
      let recentSearches = [resolvedDomain].concat(res.recentSearches.slice(0, 9));
      chrome.storage.local.set({ recentSearches });
    });

    chrome.tabs.update(tabId, { url: ipfsUrl });
  });
}

function redirectToCustomDomain(domain) {
  const customDomain = `https://${domain}.lk`;
  chrome.tabs.update({ url: customDomain });
}
