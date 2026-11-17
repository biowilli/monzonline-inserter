import test from 'ava'
import {websitesData} from '../websites.js'

test('websitesData only supports amazon.de with the current affiliate id', (t) => {
  t.deepEqual(websitesData, [
    {hostSuffix: 'amazon.de', affiliateId: 'monzonline0a-21'},
  ])
})
