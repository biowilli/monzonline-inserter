import {NavigationHandler} from './navigation-handler.js'
import {websitesData} from './websites.js'

if (typeof chrome !== 'undefined') {
  const navigationHandler = new NavigationHandler(websitesData, chrome)
  chrome.webNavigation.onBeforeNavigate.addListener(
    async (details: any) => {
      await navigationHandler.handleNavigation(details)
    },
  )
}
