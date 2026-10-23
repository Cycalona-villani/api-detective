const express = require('express')

const app = express()
const port = 3001

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Mission 1: The Missing Turkey
app.get('/api/orders/:id', (req, res) => {
  if (req.params.id !== '1042') {
    return res.status(404).json({
      error: 'Order not found',
    })
  }

  res.json({
    orderId: 1042,
    item: 'Thanksgiving turkey',
    deliveryStatus: 'On the way!',
  })
})

// Mission 2: Who Ordered 400 Pies?
app.post('/api/orders', (req, res) => {
  const { item, quantity } = req.body ?? {}

  if (item !== 'pumpkin pie') {
    return res.status(400).json({
      error: 'Invalid item',
      hint: 'This mission requires pumpkin pie.',
    })
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 10
  ) {
    return res.status(400).json({
      error: 'Invalid quantity',
      hint: 'Quantity must be a whole number between 1 and 10.',
      received: quantity ?? null,
    })
  }

  res.status(201).json({
    orderId: 1043,
    item,
    quantity,
    deliveryStatus: 'Ready for delivery',
  })
})

// Mission 3: Access Denied
app.get('/api/delivery-manifest', (req, res) => {
  const authorization = req.get('Authorization')

  if (authorization !== 'Bearer feast-demo-token') {
    res.set('WWW-Authenticate', 'Bearer')

    return res.status(401).json({
      error: 'Unauthorized',
      hint: 'Include the demo Bearer token in the Authorization header.',
    })
  }

  res.json({
    manifestId: 'FEAST-2026',
    authorized: true,
    deliveries: [
      { orderId: 1042, item: 'Thanksgiving turkey' },
      { orderId: 1043, item: 'Pumpkin pies' },
    ],
  })
})

// Keep this after all mission routes.
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    hint: 'Check the route name against the API reference',
  })
})

app.listen(port, () => {
  console.log(`API Detective server: http://localhost:${port}`)
})