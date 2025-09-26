// Complete bundle for Chrome Extension background script (no ES6 modules)

type WebsiteData = {
  hostSuffix: string
  affiliateId: string
}

class WebsiteRepository {
  public readonly websitesData: WebsiteData[]

  public constructor(websitesData: WebsiteData[]) {
    this.websitesData = websitesData
  }

  public get websites(): string[] {
    return this.websitesData.map((website) => website.hostSuffix)
  }
}

class Validator {
  private readonly websiteRepository: WebsiteRepository

  public constructor(websiteRepository: WebsiteRepository) {
    this.websiteRepository = websiteRepository
  }

  public isSupportedWebsite(url: URL): boolean {
    return this.websiteRepository.websites.includes(
      url.host.replace('www.', ''),
    )
  }

  public validateAmazonWebsite(url: URL): boolean {
    const isProductPage =
      /(.*)(\/dp\/|\/gp\/product\/|\/gp\/aw\/d\/|\/gp\/offer-listing\/)([a-z\d]{10})(.*)/i.test(
        url.pathname,
      )
    const isSearchPage =
      url.pathname.includes('/s') && url.search.includes('k=')

    let isValid = isProductPage || isSearchPage
    isValid &&= !url.href.includes('/ap/signin')
    isValid &&= !url.href.includes('/sspa/click')

    return isValid
  }
}

class NavigationHandler {
  public readonly chrome: any
  private readonly validator: Validator
  private readonly websiteRepository: WebsiteRepository

  public constructor(websitesData: WebsiteData[], chrome: any) {
    this.websiteRepository = new WebsiteRepository(websitesData)
    this.validator = new Validator(this.websiteRepository)
    this.chrome = chrome
  }

  public async generateAmazonAffiliateLink(
    url: string,
    affiliateId: string,
  ): Promise<string> {
    if (affiliateId.length === 0) {
      console.warn("Didn't modify URL because no affiliate ID was provided")
      return url
    }

    try {
      const parsedUrl = new URL(url)
      const isSearchPage =
        parsedUrl.pathname.includes('/s') && parsedUrl.search.includes('k=')

      // Remove existing referral if present
      parsedUrl.href = parsedUrl.href.replaceAll(/\/ref=([^/]*)/g, '')

      if (!isSearchPage && !parsedUrl.pathname.includes('/ref=nosim')) {
        parsedUrl.pathname += parsedUrl.pathname.endsWith('/')
          ? 'ref=nosim'
          : '/ref=nosim'
      }

      parsedUrl.searchParams.set('tag', affiliateId)
      return parsedUrl.href
    } catch (error) {
      console.error('Error generating affiliate link:', error)
      return url
    }
  }

  public async handleNavigation(details: any): Promise<void> {
    const currentWebsite = new URL(details.url)

    if (
      !this.validator.isSupportedWebsite(currentWebsite) ||
      !this.validator.validateAmazonWebsite(currentWebsite)
    ) {
      return
    }

    const affiliateId = this.getAffiliateIdForWebsite(currentWebsite)
    if (!affiliateId) {
      console.log('No affiliate ID found for this website')
      return
    }

    console.log('Using affiliate ID: ' + affiliateId)
    const modifiedURL = await this.generateAmazonAffiliateLink(
      details.url,
      affiliateId,
    )

    if (modifiedURL !== details.url) {
      console.log('Modded URL:', modifiedURL)
      this.redirectUser(details.tabId, modifiedURL)
    }
  }

  private getAffiliateIdForWebsite(url: URL): string | undefined {
    const hostname = url.hostname.replace('www.', '')
    const website = this.websiteRepository.websitesData.find(
      (site) => site.hostSuffix === hostname,
    )
    return website?.affiliateId
  }

  private redirectUser(tabId: number, url: string): void {
    this.chrome.tabs.update(tabId, {url})
  }
}

// Website data and initialization
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
    {url: websitesData},
  )
}