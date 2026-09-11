import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { EdgeTTS } from '@andresaya/edge-tts'

function geminiApi() {
  return {
    name: 'gemini-api',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: any, res: any) => void) => void } }) {
      server.middlewares.use('/api/analyze', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        if (!process.env.GEMINI_API_KEY) {
          res.statusCode = 503
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }))
          return
        }

        try {
          const chunks: Buffer[] = []
          let size = 0
          for await (const chunk of req) {
            size += Buffer.byteLength(chunk)
            if (size > 6_000_000) throw new Error('Image payload is too large')
            chunks.push(Buffer.from(chunk))
          }
          const { imageDataUrl } = JSON.parse(Buffer.concat(chunks).toString()) as { imageDataUrl?: string }
          if (!imageDataUrl?.startsWith('data:image/')) throw new Error('A camera image is required')

          const [header, encoded] = imageDataUrl.split(',', 2)
          if (!encoded || encoded.length > 5_500_000) throw new Error('Image payload is too large')
          const mimeType = header.match(/^data:(.*);base64$/)?.[1] ?? 'image/jpeg'
          const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
            .getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash' })
          const result = await model.generateContent([
            { inlineData: { mimeType, data: encoded } },
            `You are Mira, a cute but arrogant fictional AI critic. Analyze this image for a playful game result.
Do not identify the person or infer sensitive traits such as race, ethnicity, gender, age, health, sexuality, identity, or personality as fact.
Only return valid JSON, with no markdown, using exactly these fields:
{ "npcLevel": number 0-100, "aura": number -200 to 1500, "mainCharacterEnergy": number 0-100, "dripLevel": number 0-100, "luck": number -50 to 100, "sideCharacterEnergy": number 0-100, "threatLevel": one of ["COMPLETELY HARMLESS","MILDLY CONCERNING","EMOTIONALLY HARMLESS","LEGALLY AMBIGUOUS","SUSPICIOUS VIBES","CHAOTIC NEUTRAL","DANGER: OPINIONS","THREAT LEVEL: VIBES"], "futureCareer": string, "verdict": string, "overallScore": number 0-10, "rarity": one of ["COMMON","UNCOMMON","RARE","LEGENDARY"], "legendaryEvent": string or null }.
Base the playful scores only on visible presentation, pose, lighting, and styling. Keep verdict under 120 characters and make it witty.`,
          ])
          const text = result.response.text().replace(/^```json\s*|\s*```$/g, '').trim()
          JSON.parse(text)
          res.setHeader('Content-Type', 'application/json')
          res.end(text)
        } catch (error) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Gemini analysis failed' }))
        }
      })
    },
  }
}

function malayalamSpeechApi() {
  return {
    name: 'malayalam-speech-api',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: any, res: any) => void) => void } }) {
      server.middlewares.use('/api/speech', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        try {
          const chunks: Buffer[] = []
          let size = 0
          for await (const chunk of req) {
            size += Buffer.byteLength(chunk)
            if (size > 12_000) throw new Error('Speech text is too long')
            chunks.push(Buffer.from(chunk))
          }
          const { text, rate, pitch } = JSON.parse(Buffer.concat(chunks).toString()) as {
            text?: string;
            rate?: number;
            pitch?: number;
          }
          if (!text?.trim()) throw new Error('Speech text is required')

          const tts = new EdgeTTS()
          await tts.synthesize(text.slice(0, 900), 'ml-IN-SobhanaNeural', {
            rate: `${Math.max(-20, Math.min(20, rate ?? 0))}%`,
            pitch: `${Math.max(-10, Math.min(10, pitch ?? 0))}Hz`,
            outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
          })
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ audio: tts.toBase64(), voice: 'ml-IN-SobhanaNeural' }))
        } catch (error) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Malayalam speech failed' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    geminiApi(),
    malayalamSpeechApi(),
  ],
})
