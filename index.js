const express = require('express');
const app = express();
app.use(express.json());

// Khởi tạo Firebase Admin SDK
const admin = require('firebase-admin');

// Đọc file service account key
const serviceAccount = require('./service-account-key.json');

// Khởi tạo Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://team3-3than-dang-chatbot-default-rtdb.firebaseio.com" // Thay bằng URL của bạn
});

// Tham chiếu đến database
const db = admin.database();

app.post('/webhook', async (req, res) => {
    const intentName = req.body.queryResult?.intent?.displayName;
    const parameters = req.body.queryResult?.parameters;
    
    console.log('Intent:', intentName);
    console.log('Parameters:', parameters);
    
    let responseText = '';
    
    try {
        if (intentName === 'Default Welcome Intent') {
            responseText = 'Chào mừng bạn đến với cửa hàng thời trang! Bạn muốn xem sản phẩm gì ạ?';
        }
        else if (intentName === 'bestseller') {
            // Lấy dữ liệu từ Firebase Realtime Database
            const snapshot = await db.ref('products/bestseller').once('value');
            const bestseller = snapshot.val();
            
            if (bestseller && bestseller.name) {
                responseText = `🏆 Best seller của shop là ${bestseller.name} với giá ${bestseller.price.toLocaleString()}đ. Đã bán ${bestseller.sold} sản phẩm!`;
            } else {
                responseText = 'Best seller của shop là Quần jean nam ống rộng với lượt mua cao nhất.';
            }
        }
        else if (intentName === 'Default Fallback Intent') {
            responseText = 'Xin lỗi, tôi không hiểu ý bạn. Bạn có thể nói lại được không?';
        }
        else {
            responseText = 'Tôi chưa được lập trình để trả lời câu này. Xin lỗi bạn nhé!';
        }
    } catch (error) {
        console.error('Lỗi Firebase:', error);
        responseText = 'Có lỗi xảy ra khi kết nối database. Vui lòng thử lại sau!';
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