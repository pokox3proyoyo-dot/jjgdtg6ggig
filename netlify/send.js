// netlify/send.js

let messages = [];
let currentId = 1;

// Если вы можете использовать Netlify Environment Variables (ENV):
// Это будет работать, только если вы настроите это в Netlify UI/CLI.
// const MESSAGE_STORAGE = process.env.MESSAGE_STORAGE || '[]'; 
// messages = JSON.parse(MESSAGE_STORAGE);

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        const { sessionId, encryptedMessage, sender } = data;

        if (!sessionId || !encryptedMessage) {
            return { statusCode: 400, body: JSON.stringify({ ok: false, description: "Missing data" }) };
        }

        // 1. Создаем новое сообщение
        const newMessage = {
            id: currentId++,
            sessionId,
            encryptedMessage,
            sender,
            timestamp: Date.now()
        };

        // 2. 🛑 Сохраняем сообщение в массиве (ВРЕМЕННОЕ НЕНАДЕЖНОЕ ХРАНИЛИЩЕ)
        messages.push(newMessage);
        // Ограничиваем историю, чтобы избежать переполнения памяти
        if (messages.length > 50) {
            messages.shift();
        }

        // Если вы используете ENV:
        // process.env.MESSAGE_STORAGE = JSON.stringify(messages);

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true, messageId: newMessage.id }),
        };
    } catch (error) {
        console.error('Send Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ ok: false, description: 'Internal Server Error' }),
        };
    }
};
