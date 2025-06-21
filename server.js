// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Your Groq API key
const GROQ_API_KEY = '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';

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running!', timestamp: new Date().toISOString() });
});

// Chat endpoint that forwards requests to Groq
app.post('/api/chat', async (req, res) => {
    try {
        console.log('Received chat request:', req.body);
        
        const { message, model = 'llama-3.1-8b-instant' } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Make request to Groq API
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant embedded in a website. Be friendly, concise, and helpful. You can answer questions about the website, provide general assistance, and help users with their queries.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `Groq API Error: ${response.status} ${response.statusText}`,
                details: errorText
            });
        }

        const data = await response.json();
        console.log('Groq API Response:', data);

        // Return the AI response
        res.json({
            success: true,
            message: data.choices[0].message.content,
            usage: data.usage
        });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Serve the chat app HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📱 Chat app available at http://localhost:${PORT}`);
    console.log(`🏥 Health check at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
