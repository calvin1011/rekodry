import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  createShipmentAndGetRates,
  purchaseLabel,
  isEasyPostConfigured,
  type EasyPostAddressInput,
  type EasyPostParcelInput,
} from '../lib/easypost'

const defaultAddressFrom: EasyPostAddressInput = {
  name: 'Store',
  street1: '1 Main St',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  country: 'US',
}

const defaultAddressTo: EasyPostAddressInput = {
  name: 'Customer',
  street1: '2 Oak Ave',
  city: 'Oakland',
  state: 'CA',
  zip: '94601',
  country: 'US',
}

const defaultParcel: EasyPostParcelInput = {
  length: '10',
  width: '8',
  height: '6',
  distance_unit: 'in',
  weight: '2',
  mass_unit: 'lb',
}

describe('isEasyPostConfigured', () => {
  const origKey = process.env.EASYPOST_API_KEY

  afterEach(() => {
    process.env.EASYPOST_API_KEY = origKey
  })

  it('returns true when EASYPOST_API_KEY is set', () => {
    process.env.EASYPOST_API_KEY = 'EZAK123'
    expect(isEasyPostConfigured()).toBe(true)
  })

  it('returns false when EASYPOST_API_KEY is not set', () => {
    delete (process.env as any).EASYPOST_API_KEY
    expect(isEasyPostConfigured()).toBe(false)
  })
})

describe('createShipmentAndGetRates', () => {
  const origKey = process.env.EASYPOST_API_KEY

  beforeEach(() => {
    process.env.EASYPOST_API_KEY = process.env.EASYPOST_API_KEY || 'easypost_test_key'
  })

  afterEach(() => {
    process.env.EASYPOST_API_KEY = origKey
    vi.restoreAllMocks()
  })

  it('returns error when fetch fails with 4xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Invalid address' } }),
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
        id: 'rate_1',
        rate: '8.50',
        currency: 'USD',
        carrier: 'USPS',
        service: 'Priority',
        est_delivery_days: 2,
      },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'shp_123',
          rates: mockRates,
        }),
      })
    )
    const result = await createShipmentAndGetRates({
      addressFrom: defaultAddressFrom,
      addressTo: defaultAddressTo,
      parcels: [defaultParcel],
    })
    expect(result.error).toBeUndefined()
    expect(result.shipment?.id).toBe('shp_123')
    expect(result.shipment?.rates).toHaveLength(1)
    expect(result.shipment?.rates?.[0].provider).toBe('USPS')
    expect(result.shipment?.rates?.[0].amount).toBe('8.50')
  })

  it('builds request body with shipment.to_address, from_address, parcel', async () => {
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
          json: async () => ({ id: 'shp_1', rates: [], to_address: {}, from_address: {}, parcel: {} }),
        })
      })
    )
    await createShipmentAndGetRates({
      addressFrom: { ...defaultAddressFrom, street2: 'Suite 1' },
      addressTo: defaultAddressTo,
      parcels: [defaultParcel],
    })
    expect(capturedBody?.shipment).toBeDefined()
    expect(capturedBody.shipment.from_address.name).toBe('Store')
    expect(capturedBody.shipment.from_address.street1).toBe('1 Main St')
    expect(capturedBody.shipment.from_address.street2).toBe('Suite 1')
    expect(capturedBody.shipment.to_address.city).toBe('Oakland')
    expect(capturedBody.shipment.parcel).toBeDefined()
    expect(capturedBody.shipment.parcel.weight).toBe(32) // 2 lb -> 32 oz
  })
})

describe('purchaseLabel', () => {
  const origKey = process.env.EASYPOST_API_KEY

  beforeEach(() => {
    process.env.EASYPOST_API_KEY = process.env.EASYPOST_API_KEY || 'easypost_test_key'
  })

  afterEach(() => {
    process.env.EASYPOST_API_KEY = origKey
    vi.restoreAllMocks()
  })

  it('returns transaction with label_url and tracking_number when fetch succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'shp_1',
          tracking_code: '1Z999AA10123456784',
          postage_label: { label_url: 'https://easypost.com/labels/abc.pdf', label_pdf_url: 'https://easypost.com/labels/abc.pdf' },
          tracker: { public_url: 'https://track.easypost.com/xxx' },
          selected_rate: { carrier: 'USPS', service: 'Priority' },
        }),
      })
    )
    const result = await purchaseLabel({ shipmentId: 'shp_1', rateId: 'rate_123' })
    expect(result.error).toBeUndefined()
    expect(result.transaction?.tracking_number).toBe('1Z999AA10123456784')
    expect(result.transaction?.label_url).toContain('easypost.com')
    expect(result.transaction?.rate?.provider).toBe('USPS')
  })

  it('sends rate id and shipment id to buy endpoint', async () => {
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
          json: async () => ({
            id: 'shp_1',
            tracking_code: '123',
            postage_label: { label_url: 'https://example.com/label.pdf' },
            selected_rate: { carrier: 'USPS', service: 'Ground' },
          }),
        })
      })
    )
    await purchaseLabel({ shipmentId: 'shp_abc', rateId: 'rate_xyz', labelFileType: 'PDF' })
    expect(capturedUrl).toContain('/shipments/shp_abc/buy')
    expect(capturedBody?.rate?.id).toBe('rate_xyz')
    expect(capturedBody?.label_format).toBe('pdf')
  })

  it('returns error when fetch returns 4xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Rate has expired' } }),
      })
    )
    const result = await purchaseLabel({ shipmentId: 'shp_1', rateId: 'expired_rate' })
    expect(result.transaction).toBeUndefined()
    expect(result.error).toBe('Rate has expired')
  })
})

describe('createShipmentAndGetRates without key', () => {
  const origKey = process.env.EASYPOST_API_KEY

  afterEach(() => {
    process.env.EASYPOST_API_KEY = origKey
  })

  it('rejects when EASYPOST_API_KEY is unset', async () => {
    delete (process.env as any).EASYPOST_API_KEY
    await expect(
      createShipmentAndGetRates({
        addressFrom: defaultAddressFrom,
        addressTo: defaultAddressTo,
        parcels: [defaultParcel],
      })
    ).rejects.toThrow(/EASYPOST_API_KEY/)
  })
})
