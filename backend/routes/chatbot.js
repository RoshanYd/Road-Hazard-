const express = require('express');
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-120b';

const SYSTEM_PROMPT = `You are "Saarthi" (साथी), a smart and friendly AI assistant for the Road Hazard Reporting Platform — an initiative of the Government of India. Your name means "companion" in Hindi.

About the Platform:
- The Road Hazard Reporting Platform allows citizens to report road hazards like potholes, broken street lights, damaged roads, waterlogging, missing road signs, and other road safety issues.
- Users can register, log in, and submit reports with photos, GPS location, severity level (low/medium/high/critical), and descriptions.
- Reports are reviewed by admin officials who can update status (submitted → under review → in progress → resolved/rejected).
- Users can track the status of their reports from their dashboard.
- The platform aims to improve road safety and enable citizens to participate in civic governance.

Your Capabilities:
- Answer questions about traffic rules, vehicle regulations, road safety tips, driving laws in India.
- Provide information about how to use the Road Hazard Reporting Platform.
- Help users understand report statuses and what they mean.
- Share general knowledge about road infrastructure, traffic management, and civic participation.
- Answer any general topic the user asks about — you're a well-rounded AI assistant.

Guidelines:
- Be friendly, helpful, and concise.
- Use simple language that everyone can understand.
- When discussing traffic rules, mention that rules can vary by state/country and suggest verifying with local authorities.
- If asked about the platform, provide detailed guidance on how to use it.
- Use emojis occasionally to be more engaging 🚗
- Keep responses focused and not too long (2-4 paragraphs max).
- If you don't know something, be honest about it.
- Always prioritize safety when discussing road/vehicle topics.`;

/**
 * @route   POST /api/chatbot/message
 * @desc    Send a message to Saarthi chatbot (powered by Groq/Llama)
 * @access  Public (no auth required)
 */
router.post('/message', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message is required',
            });
        }

        if (!GROQ_API_KEY) {
            console.warn('GROQ_API_KEY is not configured in environment variables');
            return res.status(503).json({
                success: false,
                error: 'Saarthi AI service is not configured. Please set GROQ_API_KEY in .env.',
            });
        }

        // Build messages array for Groq (OpenAI-compatible format)
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...(history || []).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content,
            })),
            { role: 'user', content: message.trim() },
        ];

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages,
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 0.9,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API error:', response.status, errorText);
            return res.status(503).json({
                success: false,
                error: 'Saarthi is temporarily unavailable. Please try again in a moment.',
            });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;

        if (reply) {
            res.json({
                success: true,
                reply,
                model: GROQ_MODEL,
            });
        } else {
            res.status(503).json({
                success: false,
                error: 'Saarthi did not respond. Please try again.',
            });
        }
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});

module.exports = router;
