// api/index.js

require('dotenv').config();
const LINE = require('@line/bot-sdk');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const client = new LINE.Client({
    channelAccessToken: process.env.LINE_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
});

// Middleware for parsing requests
app.use(express.json());

// User data management (example placeholder)
const userData = {};

// Utility function to handle responses
function handleResponse(message) {
    return `您好！我是一個股票經紀AI，您有任何股票投資問題都可以問我：\n${message}`;
}

// LINE signature verification middleware
app.use((req, res, next) => {
    const signature = req.headers['x-line-signature'];
    if (!LINE.validateSignature(req.body, signature, process.env.LINE_CHANNEL_SECRET)) {
        return res.status(401).send('Unauthorized');
    }
    next();
});

// Route to handle incoming messages
app.post('/webhook', (req, res) => {
    const events = req.body.events;

    Promise.all(events.map(event => {
        if (event.type === 'message' && event.message.type === 'text') {
            const replyToken = event.replyToken;
            const userId = event.source.userId;
            const messageText = event.message.text;

            // Handling user data
            userData[userId] = userData[userId] || { queries: [] };
            userData[userId].queries.push(messageText);

            // Basic AI response logic (here can be extended)
            const replyMessage = handleResponse(messageText);

            return client.replyMessage(replyToken, {
                type: 'text',
                text: replyMessage,
            });
        }
        return Promise.resolve(null);
    })).then(result => {
        res.status(200).send('OK');
    }).catch((err) => {
        console.error('Error handling message:', err);
        res.status(500).send('Internal Server Error');
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Rate limiting logic can be added here
// Detailed logging can be added for each request and error
