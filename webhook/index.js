const express = require('express');
const app = express();
app.use(express.json());

// Webhook xử lý Dialogflow
app.post('/webhook', (req, res) => {
    const intentName = req.body.queryResult?.intent?.displayName;
    const parameters = req.body.queryResult?.parameters;
    
    console.log('Intent:', intentName);
    console.log('Parameters:', parameters);
    
    let responseText = '';
    
    if (intentName === 'Default Welcome Intent') {
        responseText = 'Chào mừng bạn đến với cửa hàng thời trang! Bạn muốn xem sản phẩm gì ạ?';
    }
    else if (intentName === 'Default Fallback Intent') {
        responseText = 'Xin lỗi, tôi không hiểu ý bạn. Bạn có thể nói lại được không?';
    }
    else if (intentName === 'Introduce Product') {
        const category = parameters?.product_category;
        if (category) {
            responseText = `Chúng tôi có nhiều mẫu ${category} chất lượng cao. Mời bạn xem tại website!`;
        } else {
            responseText = 'Chúng tôi có áo thun, quần jeans, áo sơ mi. Bạn quan tâm loại nào?';
        }
    }
    else {
        responseText = 'Tôi chưa được lập trình để trả lời câu này. Xin lỗi bạn nhé!';
    }
    
    res.json({ fulfillmentText: responseText });
});

// Health check (cho Render)
app.get('/', (req, res) => {
    res.send('Webhook is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Webhook đang chạy tại port ${PORT}`);
    console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
});