/* eslint-disable import/no-named-as-default-member */

import anyTest, {type TestFn} from 'ava'
import sinon from 'sinon'
import {NavigationHandler} from '../navigation-handler.js'
import {type TestContext, type MockChrome} from './test-types.js'
import {type WebsiteData} from '../types.js'

type ExtendedTestContext = TestContext & {
  navigationHandler: NavigationHandler
}
const test: TestFn<ExtendedTestContext> =
  anyTest as unknown as TestFn<ExtendedTestContext>

test.beforeEach((t) => {
  const mockAffiliateId = 'monzonline-21'
  const testWebsitesData: WebsiteData[] = [
    {hostSuffix: 'amazon.de', affiliateId: 'monzonline-21'},
    {hostSuffix: 'amazon.com', affiliateId: 'monzonline-21'},
    {hostSuffix: 'amazon.fr', affiliateId: 'monzonline0d-21'},
  ]
  const chromeMock: MockChrome = {
    runtime: {
      id: mockAffiliateId,
    },
    storage: {
      sync: {
        get: sinon.stub(),
      },
    },
    tabs: {
      update: sinon.spy((_tabId: number, updateProperties: {url: string}) => {
        console.log('Updated tab with properties:', updateProperties)
      }),
    },
  }

  const testContext: ExtendedTestContext = {
    affiliateId: mockAffiliateId,
    navigationHandler: new NavigationHandler(testWebsitesData, chromeMock),
  }
  t.context = testContext
})

test('NavigationHandler modifies URL with affiliate ID on navigation for Amazon', async (t) => {
  const originalUrl = 'http://www.amazon.com/dp/B00EXAMPLE/?someparam=value'
  const expectedUrl =
    'http://www.amazon.com/dp/B00EXAMPLE/ref=nosim?someparam=value&tag=monzonline-21'

  await t.context.navigationHandler.handleNavigation({
    url: originalUrl,
    tabId: 1,
  })

  t.true(t.context.navigationHandler.chrome.tabs.update.calledOnce)

  const callArguments =
    t.context.navigationHandler.chrome.tabs.update.firstCall.args
  t.is(callArguments[0], 1)
  t.deepEqual(callArguments[1], {url: expectedUrl})
})

test('NavigationHandler does not modify URL for unsupported websites', async (t) => {
  const originalUrl = 'http://www.unsupported.com/some/path'

  await t.context.navigationHandler.handleNavigation({
    url: originalUrl,
    tabId: 1,
  })

  t.false(t.context.navigationHandler.chrome.tabs.update.called)
})
