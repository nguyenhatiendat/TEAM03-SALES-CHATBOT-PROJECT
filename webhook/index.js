const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
    const intentName = req.body.queryResult?.intent?.displayName;
    
    console.log('Intent:', intentName);
    
    let responseText = '';
    
    if (intentName === 'Default Welcome Intent') {
        responseText = 'Chào mừng bạn đến với cửa hàng thời trang! Bạn muốn xem sản phẩm gì ạ?';
    }
    else if (intentName === 'bestseller') {
        responseText = 'Best seller của shop là Quần jean nam ống rộng với lượt mua cao nhất. Bạn có muốn xem chi tiết sản phẩm này không?';
    }
    else if (intentName === 'Default Fallback Intent') {
        responseText = 'Xin lỗi, tôi không hiểu ý bạn. Bạn có thể nói lại được không?';
    }
    else {
        responseText = 'Tôi chưa được lập trình để trả lời câu này. Xin lỗi bạn nhé!';
    }
    
    res.json({ fulfillmentText: responseText });
});

app.get('/', (req, res) => {
    res.send('Webhook is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Webhook đang chạy tại port ${PORT}`);
});
