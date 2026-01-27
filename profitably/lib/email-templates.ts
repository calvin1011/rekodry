interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  orderDate: string
  items: {
    title: string
    quantity: number
    price: number
    subtotal: number
  }[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  shippingAddress: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  storeName: string
}

interface ShippingEmailData {
  orderNumber: string
  customerName: string
  trackingNumber: string
  trackingCarrier: string
  trackingUrl?: string
  storeName: string
}

export function getOrderConfirmationEmailHtml(data: OrderEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #10b981;
          }
          .header h1 {
            color: #10b981;
            margin: 0;
            font-size: 28px;
          }
          .order-number {
            font-size: 14px;
            color: #666;
            margin-top: 8px;
          }
          .section {
            margin-bottom: 24px;
          }
          .section h2 {
            font-size: 18px;
            margin-bottom: 12px;
            color: #1f2937;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          .items-table th {
            text-align: left;
            padding: 12px 8px;
            border-bottom: 2px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
          }
          .items-table td {
            padding: 12px 8px;
            border-bottom: 1px solid #f3f4f6;
          }
          .totals {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 2px solid #e5e7eb;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .total-row.final {
            font-weight: bold;
            font-size: 18px;
            color: #10b981;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 2px solid #e5e7eb;
          }
          .address {
            background-color: #f9fafb;
            padding: 16px;
            border-radius: 6px;
            font-size: 14px;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.storeName}</h1>
            <p class="order-number">Order #${data.orderNumber}</p>
            <p style="margin: 0; color: #10b981; font-weight: 600;">Thank you for your order!</p>
          </div>

          <div class="section">
            <h2>Order Details</h2>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td>${item.title}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">$${item.price.toFixed(2)}</td>
                    <td style="text-align: right;">$${item.subtotal.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${data.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Shipping:</span>
                <span>$${data.shipping.toFixed(2)}</span>
              </div>
              ${data.tax > 0 ? `
                <div class="total-row">
                  <span>Tax:</span>
                  <span>$${data.tax.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-row final">
                <span>Total:</span>
                <span>$${data.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Shipping Address</h2>
            <div class="address">
              <strong>${data.customerName}</strong><br>
              ${data.shippingAddress.line1}<br>
              ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br>` : ''}
              ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
              ${data.shippingAddress.country}
            </div>
          </div>

          <div class="footer">
            <p>You will receive a shipping notification when your order ships.</p>
            <p style="margin-top: 16px; color: #9ca3af; font-size: 12px;">
              If you have any questions, please reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getShippingNotificationEmailHtml(data: ShippingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Order Has Shipped</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 2px solid #10b981;
          }
          .header h1 {
            color: #10b981;
            margin: 0;
            font-size: 28px;
          }
          .order-number {
            font-size: 14px;
            color: #666;
            margin-top: 8px;
          }
          .section {
            margin-bottom: 24px;
          }
          .tracking-info {
            background-color: #f0fdf4;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
          }
          .tracking-number {
            font-size: 24px;
            font-weight: bold;
            color: #047857;
            margin: 12px 0;
            letter-spacing: 1px;
          }
          .carrier {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 16px;
          }
          .track-button {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff;
            padding: 12px 32px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 16px;
          }
          .track-button:hover {
            background-color: #059669;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${data.storeName}</h1>
            <p class="order-number">Order #${data.orderNumber}</p>
            <p style="margin: 0; color: #10b981; font-weight: 600;">📦 Your order has shipped!</p>
          </div>

          <div class="section">
            <p style="text-align: center; font-size: 16px;">
              Hi ${data.customerName},
            </p>
            <p style="text-align: center; color: #6b7280;">
              Great news! Your order is on its way.
            </p>
          </div>

          <div class="tracking-info">
            <div class="carrier">Carrier: <strong>${data.trackingCarrier}</strong></div>
            <div class="tracking-number">${data.trackingNumber}</div>
            ${data.trackingUrl ? `
              <a href="${data.trackingUrl}" class="track-button">
                Track Your Package
              </a>
            ` : ''}
          </div>

          <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p style="margin-top: 16px; color: #9ca3af; font-size: 12px;">
              If you have any questions, please reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}