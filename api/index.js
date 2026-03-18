// 使用符合 ES Module 的導入方式
import axios from 'axios';

export default async function handler(req, res) {
  // 1. 解決診斷中的「缺少回應」：優先回傳 200 給 LINE Webhook
  if (req.method === 'GET') {
    return res.status(200).send('山城 AI 伺服器運行中！');
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const CONFIG = {
    LINE_TOKEN: 'exVu9fkC4DNhM3JTltui9/R7xMozMnunSK/ZlJ0BCXS4DiSy016baxEsVOJhQb1J+6ShanxwpO+LO/2favp/++vkfy13zYEGULSO5fDg4qvsyZpIUTWDvT11pKVjT7gdK5oTu1YAEPKeOVKI3gQA9QdB04t89/1O/w1cDnyilFU=',
    GEMINI_KEY: 'AIzaSyB3gGr3mBA3tnN-1OWRKQWK5CV-ZWYbYdg'
  };

  const events = req.body.events;
  
  // 2. 解決診斷中的「數組訪問」問題：加入安全檢查
  if (!events || events.length === 0) {
    return res.status(200).send('No events');
  }

  const event = events[0];
  if (event.type === 'message' && event.message.type === 'text') {
    try {
      const userMsg = event.message.text;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_KEY}`;
      
      // 3. 呼叫 AI 並加入防錯機制
      const aiRes = await axios.post(geminiUrl, {
        contents: [{ parts: [{ text: `你是山城 AI 股票分析師，請針對此訊息給予專業建議：${userMsg}` }] }]
      });

      // 檢查 AI 響應結構
      const replyText = aiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "抱歉，AI 暫時無法分析這項資訊。";

      // 4. 回傳給 LINE (使用 Reply Token 更節省資源且穩定)
      await axios.post('https://api.line.me/v2/bot/message/reply', {
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: replyText }]
      }, { 
        headers: { 
          'Authorization': `Bearer ${CONFIG.LINE_TOKEN}`,
          'Content-Type': 'application/json'
        } 
      });

    } catch (err) {
      console.error("處理失敗:", err.response?.data || err.message);
    }
  }

  // 無論如何都要回給 LINE OK
  return res.status(200).send('OK');
}
