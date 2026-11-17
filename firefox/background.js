// Firefox-compatible Background Script for Monzonline Affiliate Extension

const websitesData = [
  { hostSuffix: 'amazon.de', affiliateId: 'monzonline0a-21' }
];

function isSupportedWebsite(url) {
  const hostname = url.hostname.replace('www.', '');
  return websitesData.some(site => site.hostSuffix === hostname);
}

function validateAmazonWebsite(url) {
  const isProductPage = /(.*)(\/dp\/|\/gp\/product\/|\/gp\/aw\/d\/|\/gp\/offer-listing\/)([a-z\d]{10})(.*)/i.test(url.pathname);
  const isSearchPage = url.pathname.includes('/s') && url.search.includes('k=');
  
  let isValid = isProductPage || isSearchPage;
  isValid = isValid && !url.href.includes('/ap/signin');
  isValid = isValid && !url.href.includes('/sspa/click');
  
  return isValid;
}

function getAffiliateIdForWebsite(url) {
  const hostname = url.hostname.replace('www.', '');
  const website = websitesData.find(site => site.hostSuffix === hostname);
  return website ? website.affiliateId : null;
}

function generateAmazonAffiliateLink(url, affiliateId) {
  if (!affiliateId) {
    console.warn("No affiliate ID provided");
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    
    // Check if our affiliate tag is already present
    const currentTag = parsedUrl.searchParams.get('tag');
    if (currentTag === affiliateId) {
      console.log('Affiliate tag already present, skipping modification');
      return url;
    }
    
    const isSearchPage = parsedUrl.pathname.includes('/s') && parsedUrl.search.includes('k=');

    // Clean up URL: remove any existing tags and refs
    parsedUrl.searchParams.delete('tag');
    parsedUrl.href = parsedUrl.href.replace(/\/ref=([^/?]*)/g, '');
    parsedUrl.href = parsedUrl.href.replace(/\/tag=([^/?]*)/g, '');

    // Add ref=nosim for product pages (not search pages)
    if (!isSearchPage && !parsedUrl.pathname.includes('/ref=nosim')) {
      if (parsedUrl.pathname.endsWith('/')) {
        parsedUrl.pathname += 'ref=nosim';
      } else {
        parsedUrl.pathname += '/ref=nosim';
      }
    }

    // Add our affiliate tag
    parsedUrl.searchParams.set('tag', affiliateId);
    return parsedUrl.href;
  } catch (error) {
    console.error('Error generating affiliate link:', error);
    return url;
  }
}

function handleNavigation(details) {
  try {
    const currentWebsite = new URL(details.url);

    if (!isSupportedWebsite(currentWebsite) || !validateAmazonWebsite(currentWebsite)) {
      return;
    }

    const affiliateId = getAffiliateIdForWebsite(currentWebsite);
    if (!affiliateId) {
      console.log('No affiliate ID found for this website');
      return;
    }

    console.log('Using affiliate ID: ' + affiliateId);
    const modifiedURL = generateAmazonAffiliateLink(details.url, affiliateId);

    if (modifiedURL !== details.url) {
      console.log('Modded URL:', modifiedURL);
      // Firefox supports both chrome and browser APIs
      const api = typeof browser !== 'undefined' ? browser : chrome;
      api.tabs.update(details.tabId, { url: modifiedURL });
    }
  } catch (error) {
    console.error('Error in handleNavigation:', error);
  }
}

// Register the event listener with Firefox/Chrome compatibility
const api = typeof browser !== 'undefined' ? browser : chrome;

if (api && api.webNavigation) {
  api.webNavigation.onBeforeNavigate.addListener(
    handleNavigation,
    {
      url: [
        { hostContains: 'amazon.de' }
      ]
    }
  );
  console.log('Monzonline Affiliate Extension loaded for Firefox');
} else {
  console.error('WebNavigation API not available');
}