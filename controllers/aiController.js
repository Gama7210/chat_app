import Groq from 'groq-sdk';
import { AppError } from '../middlewares/errorMiddleware.js';

const histories = new Map();

const SYSTEM_PROMPT = `Eres un asistente de IA integrado en Chat Seguro, una aplicacion de mensajeria cifrada. 
Eres util, amigable y respondes en el mismo idioma que el usuario. 
Puedes ayudar con preguntas generales, programacion, redaccion, analisis y mucho mas.
Manten respuestas concisas pero completas. Usa emojis ocasionalmente para ser mas amigable.`;

export async function chatWithAI(req, res, next) {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message?.trim()) throw new AppError('El mensaje no puede estar vacio', 400, 'Escribe algo');
    if (!process.env.GROQ_API_KEY) throw new AppError('API key no configurada', 500, 'Contacta al administrador');

    if (!histories.has(userId)) histories.set(userId, []);
    const history = histories.get(userId);

    history.push({ role: 'user', content: message.trim() });
    if (history.length > 20) history.splice(0, history.length - 20);

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model:    'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
      ],
      temperature: 0.8,
      max_tokens:  1024,
    });

    const reply = completion.choices?.[0]?.message?.content;
    if (!reply) throw new AppError('Sin respuesta de la IA', 502, 'Intenta de nuevo');

    history.push({ role: 'assistant', content: reply });

    res.json({ status: 'success', message: reply });
  } catch (err) {
    console.error('Groq error:', err.message);
    next(new AppError('Error al contactar la IA: ' + err.message, 502, 'Intenta de nuevo'));
  }
}

export async function getAIHistory(req, res) {
  const history = histories.get(req.user.id) || [];
  const messages = history.map((entry, i) => ({
    id:      `ai_${i}`,
    role:    entry.role,
    content: entry.content,
    isAI:    entry.role === 'assistant',
  }));
  res.json({ status: 'success', messages });
}

export async function clearAIHistory(req, res) {
  histories.delete(req.user.id);
  res.json({ status: 'success', message: 'Historial limpiado' });
}