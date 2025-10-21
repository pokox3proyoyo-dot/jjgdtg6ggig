// netlify/receive.js

// Имитируем, что мы можем получить сообщения из того же места, что и send.js
// ВНИМАНИЕ: В РЕАЛЬНОСТИ ЭТО НЕ БУДЕТ РАБОТАТЬ НА NETLIFY БЕЗ БАЗЫ ДАННЫХ!
const getMessageStore = () => {
    // В идеале, тут должно быть чтение из Redis, FaunaDB или другой внешней БД
    // Для этого примера, мы полагаемся на глобальную переменную, что ненадежно
    return require('./send').messages || [];
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { sessionId, lastId } = event.queryStringParameters;
        const lastReceivedId = parseInt(lastId || '0', 10);

        if (!sessionId) {
            return { statusCode: 400, body: JSON.stringify({ ok: false, description: "Missing sessionId" }) };
        }

        const allMessages = getMessageStore();

        // 1. Фильтруем сообщения по ID сессии и ID, большему, чем последний полученный
        const newMessages = allMessages
            .filter(msg => msg.sessionId === sessionId && msg.id > lastReceivedId)
            .sort((a, b) => a.id - b.id); // Сортируем по возрастанию ID

        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true, messages: newMessages }),
        };
    } catch (error) {
        console.error('Receive Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ ok: false, description: 'Internal Server Error' }),
        };
    }
};
