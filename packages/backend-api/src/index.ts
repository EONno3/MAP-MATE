import express from 'express'
import cors from 'cors'
import axios from 'axios'

const app = express()
app.use(cors())
app.use(express.json())

const AI_URL = 'http://localhost:8000'

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Forward generation request to AI (Simplified for now)
app.get('/api/generate', async (req, res) => {
  try {
    const response = await axios.get(`${AI_URL}/generate`)
    res.json(response.data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to generate map' })
  }
})

app.listen(3001, () => {
  console.log('Backend API running on port 3001')
})














