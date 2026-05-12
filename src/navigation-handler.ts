import {type WebsiteData} from './types.js'
import {Validator} from './validator.js'
import {WebsiteRepository} from './website-repository.js'

export class NavigationHandler {
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
      parsedUrl.href = parsedUrl.href.replace(/\/ref=([^/]*)/g, '')

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
