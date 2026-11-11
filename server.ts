import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with 25MB limit for image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize GoogleGenAI server-side with telemetry header as required
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasKey: Boolean(apiKey) });
});

// Chat endpoint (multi-turn conversation with memory)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, scheduleContext, model = 'gemini-3.8-flash' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Se requiere el historial de mensajes.' });
    }

    const systemInstruction = `Eres el Asistente Inteligente del Programa de Predicación de la Congregación Oeste (Testigos de Jehová).
Tu misión es asistir de forma amable, respetuosa, organizada y útil a los hermanos, publicadores y capitanes de grupo.
Tienes acceso al programa de predicación completo:
${scheduleContext ? JSON.stringify(scheduleContext) : 'Programa del mes cargado en la aplicación.'}

Pautas de respuesta:
1. Responde de forma clara, cálida, fraterna y directa en español.
2. Si te preguntan quién es el capitán de hoy, cuál es el lugar de reunión, el territorio o la hora, responde con exactitud citando el programa.
3. Si un publicador pide ayuda para preparar una reunión para el servicio del campo, ofrece sugerencias breves y bíblicas acordes a las buenas costumbres cristianas (ej. textos bíblicos animadores, cómo presentar la atalaya o despertar interés).
4. Si un capitán pide un mensaje para enviar por WhatsApp al grupo, redáctalo listo para copiar y pegar con emojis sobrios.
5. Si preguntan por los grupos (1 y 2, 3 y 4, 5 y 6, o Grupo General), especifica qué grupo sale en cada fecha.`;

    // Map messages to Gemini contents
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Generate response using selected model
    const response = await ai.models.generateContent({
      model: model || 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || 'No pude generar una respuesta.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({
      error: error?.message || 'Error al comunicarse con el asistente de IA.',
    });
  }
});

// Image analysis endpoint: analyze photo of a preaching schedule and extract structured JSON
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', targetMonth = '2026-11' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Se requiere la imagen en base64.' });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Analiza esta imagen de un programa/calendario de predicación de una congregación.
Extrae todas las salidas de predicación y eventos en formato JSON estructurado.
El mes objetivo de referencia es "${targetMonth}". Si la imagen especifica otro mes o año, detecta y usa las fechas correspondientes en formato YYYY-MM-DD.

Devuelve estrictamente un objeto JSON con la siguiente estructura:
{
  "title": "PROGRAMA PREDICACIÓN: NOMBRE DEL MES Y AÑO",
  "congregation": "Nombre de la congregación si aparece",
  "theme": "Lema, campaña o asamblea si aparece",
  "scripture": "Texto bíblico si aparece",
  "notes": "Notas del pie de página si aparecen",
  "sessions": [
    {
      "date": "YYYY-MM-DD",
      "dayName": "lun|mar|mié|jue|vie|sáb|dom",
      "time": "HH:MM",
      "meetingPlace": "Lugar de reunión",
      "captain": "Capitán encargado",
      "territory": "Nombre o descripción del territorio",
      "territoryNumber": "Número de territorio",
      "group": "Gral. | 1 y 2 | 3 y 4 | 5 y 6 | u otro",
      "type": "presencial | zoom | publica | asamblea | aseo"
    }
  ]
}

Asegúrate de no omitir ninguna fila ni horario de la tabla.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Clean markdown code blocks if any
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error en /api/analyze-image:', error);
    res.status(500).json({
      error: error?.message || 'Error al analizar la imagen con Gemini.',
    });
  }
});

// Setup Vite in dev or static files in prod
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const isProduction = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(distPath, 'index.html'));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
