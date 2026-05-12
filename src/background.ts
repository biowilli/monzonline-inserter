import {type WebsiteData} from './types.js'
import {NavigationHandler} from './navigation-handler.js'

const websitesData: WebsiteData[] = [
  {hostSuffix: 'amazon.de', affiliateId: 'monzonline-21'},
  {hostSuffix: 'amazon.com', affiliateId: 'monzonline-21'},
  {hostSuffix: 'amazon.fr', affiliateId: 'monzonline0d-21'},
  {hostSuffix: 'amazon.it', affiliateId: 'monzonline02-21'},
  {hostSuffix: 'amazon.es', affiliateId: 'monzonline08-21'},
  {hostSuffix: 'amazon.co.uk', affiliateId: 'monzonline05-21'},
]

if (typeof chrome !== 'undefined') {
  const navigationHandler = new NavigationHandler(websitesData, chrome)
  chrome.webNavigation.onBeforeNavigate.addListener(
    async (details: any) => {
      await navigationHandler.handleNavigation(details)
    },
  )
}
