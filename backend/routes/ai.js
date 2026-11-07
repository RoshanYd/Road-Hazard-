const express = require('express');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Hazard types that match the issue_types table
const HAZARD_TYPES = [
    { id: 1, name: 'Pothole', keywords: ['pothole', 'hole', 'pit', 'crater', 'dip'] },
    { id: 2, name: 'Broken Street Light', keywords: ['street light', 'lamp', 'light pole', 'broken light', 'dark street'] },
    { id: 3, name: 'Road Crack', keywords: ['crack', 'fracture', 'split', 'broken road', 'damaged road', 'asphalt'] },
    { id: 4, name: 'Open Manhole', keywords: ['manhole', 'sewer', 'drain', 'open cover', 'missing cover'] },
    { id: 5, name: 'Unsafe Highway', keywords: ['highway', 'barrier', 'guard rail', 'divider', 'unsafe road'] },
    { id: 6, name: 'Speed Breaker Damage', keywords: ['speed breaker', 'speed bump', 'bump', 'hump', 'damaged bump'] },
];

/**
 * @route   POST /api/ai/classify
 * @desc    Classify a road hazard image using Gemini Vision API
 * @access  Public
 */
router.post('/classify', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                message: 'Image data (base64) is required',
            });
        }

        if (!GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY is not configured in environment variables');
            return res.status(503).json({
                success: false,
                message: 'Gemini AI Vision service is not configured. Please set GEMINI_API_KEY in .env.',
            });
        }

        // Remove data URL prefix if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        const prompt = `You are a road hazard classification AI. Analyze this image and classify the road hazard.

Respond ONLY with a valid JSON object (no markdown, no code blocks, no extra text) in this exact format:
{
  "hazardType": "one of: Pothole, Broken Street Light, Road Crack, Open Manhole, Unsafe Highway, Speed Breaker Damage, Unknown",
  "severity": "one of: low, medium, high, critical",
  "confidence": 0.0 to 1.0,
  "description": "Brief 1-sentence description of what you see"
}

Classification guidelines:
- Pothole: Holes, pits, craters in road surface
- Broken Street Light: Damaged/non-functional street lights or poles
- Road Crack: Cracks, fractures, splits in road surface
- Open Manhole: Uncovered/damaged manholes or drainage
- Unsafe Highway: Damaged barriers, missing guard rails, dangerous road conditions
- Speed Breaker Damage: Damaged or badly constructed speed bumps/breakers

Severity guidelines:
- low: Minor damage, minimal danger
- medium: Moderate damage, some risk
- high: Significant damage, dangerous
- critical: Severe damage, immediate danger to life

If the image does not show a road hazard, set hazardType to "Unknown" and confidence to 0.`;

        // Call Gemini Vision API
        const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest'];
        let aiResponse = null;
        let lastError = null;

        for (const model of models) {
            try {
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: 'image/jpeg',
                                        data: base64Data,
                                    },
                                },
                            ],
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 300,
                        },
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    lastError = errorData.error?.message || `HTTP ${response.status}`;
                    console.warn(`Gemini model ${model} failed:`, lastError);
                    continue;
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (text) {
                    // Parse JSON from response (handle potential markdown code blocks)
                    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                    aiResponse = JSON.parse(jsonStr);
                    break;
                }
            } catch (modelError) {
                lastError = modelError.message;
                console.warn(`Gemini model ${model} error:`, modelError.message);
                continue;
            }
        }

        if (!aiResponse) {
            return res.status(503).json({
                success: false,
                message: 'AI classification temporarily unavailable',
                error: lastError,
            });
        }

        // Map the AI response to issue type ID
        const matchedType = HAZARD_TYPES.find(
            ht => ht.name.toLowerCase() === aiResponse.hazardType?.toLowerCase()
        );

        res.json({
            success: true,
            classification: {
                hazardType: aiResponse.hazardType || 'Unknown',
                issueTypeId: matchedType?.id || null,
                severity: aiResponse.severity || 'medium',
                confidence: Math.min(1, Math.max(0, aiResponse.confidence || 0)),
                description: aiResponse.description || '',
            },
        });
    } catch (error) {
        console.error('AI classification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to classify image',
        });
    }
});

module.exports = router;
