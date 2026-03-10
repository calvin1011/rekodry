import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  createShipmentAndGetRates,
  purchaseLabel,
  isShippoConfigured,
  type ShippoAddressInput,
  type ShippoParcelInput,
} from '../lib/shippo'

const defaultAddressFrom: ShippoAddressInput = {
  name: 'Store',
  street1: '1 Main St',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  country: 'US',
}

const defaultAddressTo: ShippoAddressInput = {
  name: 'Customer',
  street1: '2 Oak Ave',
  city: 'Oakland',
  state: 'CA',
  zip: '94601',
  country: 'US',
}

const defaultParcel: ShippoParcelInput = {
  length: '10',
  width: '8',
  height: '6',
  distance_unit: 'in',
  weight: '2',
  mass_unit: 'lb',
}

describe('isShippoConfigured', () => {
  const origShippoKey = process.env.SHIPPO_API_KEY
  const origShippoToken = process.env.SHIPPO_TOKEN

  afterEach(() => {
    process.env.SHIPPO_API_KEY = origShippoKey
    process.env.SHIPPO_TOKEN = origShippoToken
  })

  it('returns true when SHIPPO_API_KEY is set', () => {
    process.env.SHIPPO_TOKEN = ''
    process.env.SHIPPO_API_KEY = 'shippo_test_abc'
    expect(isShippoConfigured()).toBe(true)
  })

  it('returns true when SHIPPO_TOKEN is set and SHIPPO_API_KEY is not', () => {
    delete (process.env as any).SHIPPO_API_KEY
    process.env.SHIPPO_TOKEN = 'shippo_live_xyz'
    expect(isShippoConfigured()).toBe(true)
  })

  it('returns false when neither SHIPPO_API_KEY nor SHIPPO_TOKEN is set', () => {
    delete (process.env as any).SHIPPO_API_KEY
    delete (process.env as any).SHIPPO_TOKEN
    expect(isShippoConfigured()).toBe(false)
  })
})

describe('createShipmentAndGetRates', () => {
  const origShippoKey = process.env.SHIPPO_API_KEY

  beforeEach(() => {
    process.env.SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || 'shippo_test_key'
  })

  afterEach(() => {
    process.env.SHIPPO_API_KEY = origShippoKey
    vi.restoreAllMocks()
  })

  it('returns error when fetch fails with 4xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid address' }),
      })
    )
    const result = await createShipmentAndGetRates({
      addressFrom: defaultAddressFrom,
      addressTo: defaultAddressTo,
      parcels: [defaultParcel],
    })
    expect(result.shipment).toBeUndefined()
    expect(result.error).toBe('Invalid address')
  })

  it('returns shipment with rates when fetch succeeds', async () => {
    const mockRates = [
      {
        object_id: 'rate_1',
        amount: '8.50',
        currency: 'USD',
        provider: 'usps',
        servicelevel: { name: 'Priority', token: 'usps_priority' },
        estimated_days: 2,
        duration_terms: null,
        tracking_url: null,
      },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          object_id: 'ship_123',
          status: 'SUCCESS',
          rates: mockRates,
          address_from: {},
          address_to: {},
        }),
      })
    )
    const result = await createShipmentAndGetRates({
      addressFrom: defaultAddressFrom,
      addressTo: defaultAddressTo,
      parcels: [defaultParcel],
    })
    expect(result.error).toBeUndefined()
    expect(result.shipment?.object_id).toBe('ship_123')
    expect(result.shipment?.rates).toHaveLength(1)
    expect(result.shipment?.rates?.[0].provider).toBe('usps')
    expect(result.shipment?.rates?.[0].amount).toBe('8.50')
  })

  it('builds request body with address_from, address_to, parcels', async () => {
    let capturedUrl = ''
    let capturedBody: any = null
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        capturedUrl = url
        try {
          capturedBody = opts?.body ? JSON.parse(opts.body as string) : null
        } catch {
          capturedBody = null
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ object_id: 's1', status: 'SUCCESS', rates: [], address_from: {}, address_to: {} }),
        })
      })
    )
    await createShipmentAndGetRates({
      addressFrom: { ...defaultAddressFrom, street2: 'Suite 1' },
      addressTo: defaultAddressTo,
      parcels: [defaultParcel],
    })
    expect(capturedUrl).toContain('api.goshippo.com')
    expect(capturedUrl).toContain('/shipments/')
    expect(capturedBody).toBeDefined()
    expect(capturedBody.address_from.name).toBe('Store')
    expect(capturedBody.address_from.street1).toBe('1 Main St')
    expect(capturedBody.address_from.street2).toBe('Suite 1')
    expect(capturedBody.address_to.city).toBe('Oakland')
    expect(capturedBody.parcels).toHaveLength(1)
    expect(capturedBody.parcels[0].weight).toBe('2')
    expect(capturedBody.parcels[0].mass_unit).toBe('lb')
    expect(capturedBody.async).toBe(false)
  })
})

describe('purchaseLabel', () => {
  const origShippoKey = process.env.SHIPPO_API_KEY

  beforeEach(() => {
    process.env.SHIPPO_API_KEY = process.env.SHIPPO_API_KEY || 'shippo_test_key'
  })

  afterEach(() => {
    process.env.SHIPPO_API_KEY = origShippoKey
    vi.restoreAllMocks()
  })

  it('returns transaction with label_url and tracking_number when fetch succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          object_id: 'tx_1',
          status: 'SUCCESS',
          tracking_number: '1Z999AA10123456784',
          label_url: 'https://shippo.com/labels/abc.pdf',
          tracking_url_provider: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=1Z999AA10123456784',
          rate: { provider: 'usps', servicelevel: { name: 'Priority' } },
        }),
      })
    )
    const result = await purchaseLabel({ rateObjectId: 'rate_123' })
    expect(result.error).toBeUndefined()
    expect(result.transaction?.tracking_number).toBe('1Z999AA10123456784')
    expect(result.transaction?.label_url).toContain('shippo.com')
    expect(result.transaction?.rate?.provider).toBe('usps')
  })

  it('uses PDF as default label_file_type', async () => {
    let capturedBody: any = null
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, opts?: RequestInit) => {
        try {
          capturedBody = opts?.body ? JSON.parse(opts.body as string) : null
        } catch {
          capturedBody = null
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            object_id: 'tx_1',
            status: 'SUCCESS',
            tracking_number: '123',
            label_url: 'https://example.com/label.pdf',
            tracking_url_provider: null,
            rate: {},
          }),
        })
      })
    )
    await purchaseLabel({ rateObjectId: 'rate_xyz' })
    expect(capturedBody?.label_file_type).toBe('PDF')
    expect(capturedBody?.rate).toBe('rate_xyz')
  })

  it('returns error when fetch returns 4xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Rate has expired' }),
      })
    )
    const result = await purchaseLabel({ rateObjectId: 'expired_rate' })
    expect(result.transaction).toBeUndefined()
    expect(result.error).toBe('Rate has expired')
  })

  it('returns error when Shippo returns status ERROR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          object_id: 'tx_1',
          status: 'ERROR',
          tracking_number: null,
          label_url: null,
          tracking_url_provider: null,
          rate: {},
          messages: ['Carrier rejected the shipment'],
        }),
      })
    )
    const result = await purchaseLabel({ rateObjectId: 'rate_1' })
    expect(result.error).toContain('Carrier rejected')
  })
})

describe('createShipmentAndGetRates without token', () => {
  const origShippoKey = process.env.SHIPPO_API_KEY
  const origShippoToken = process.env.SHIPPO_TOKEN

  afterEach(() => {
    process.env.SHIPPO_API_KEY = origShippoKey
    process.env.SHIPPO_TOKEN = origShippoToken
  })

  it('rejects when SHIPPO_API_KEY and SHIPPO_TOKEN are unset', async () => {
    delete (process.env as any).SHIPPO_API_KEY
    delete (process.env as any).SHIPPO_TOKEN
    await expect(
      createShipmentAndGetRates({
        addressFrom: defaultAddressFrom,
        addressTo: defaultAddressTo,
        parcels: [defaultParcel],
      })
    ).rejects.toThrow(/SHIPPO_API_KEY/)
  })
})

describe('Shippo API (live, when SHIPPO_API_KEY is set)', () => {
  it.skipIf(!process.env.SHIPPO_API_KEY)('createShipmentAndGetRates returns rates from Shippo test API', async () => {
    const result = await createShipmentAndGetRates({
      addressFrom: defaultAddressFrom,
      addressTo: defaultAddressTo,
      parcels: [defaultParcel],
    })
    expect(result.error).toBeUndefined()
    expect(result.shipment?.object_id).toBeDefined()
    expect(Array.isArray(result.shipment?.rates)).toBe(true)
  }, 15000)
})
