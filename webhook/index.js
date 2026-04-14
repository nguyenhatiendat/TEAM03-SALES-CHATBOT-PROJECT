const express = require('express');
const app = express();
app.use(express.json());

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ========== HÀM LƯU LỊCH SỬ CHAT ==========
async function saveChatLog(sessionId, userQuery, botResponse, intentName, status, parameters = null) {
    try {
        const logData = {
            sessionId: sessionId || 'unknown',
            userQuery: userQuery || '',
            botResponse: botResponse || '',
            intent: intentName || 'unknown',
            status: status || 'success',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        if (parameters) logData.parameters = parameters;
        await db.collection('chat_logs').add(logData);
        console.log('✅ [LOG] Đã lưu lịch sử chat');
    } catch (error) {
        console.error('❌ [LOG] Lỗi lưu log:', error.message);
    }
}

app.post('/webhook', async (req, res) => {
    const intentName = req.body.queryResult?.intent?.displayName;
    const parameters = req.body.queryResult?.parameters;
    const userQuery = req.body.queryResult?.queryText;
    const sessionId = req.body.session;
    
    console.log('Intent:', intentName);
    console.log('Parameters:', parameters);
    console.log('User query:', userQuery);
    
    let responseText = '';
    let logStatus = 'success';
    
    try {
        // ========== WELCOME INTENT ==========
        if (intentName === 'Default Welcome Intent') {
            responseText = 'Chào mừng bạn đến với cửa hàng thời trang! Bạn muốn xem sản phẩm gì ạ?';
        }
        
        // ========== BESTSELLER INTENT ==========
        else if (intentName === 'BESTSELLER' || intentName === 'bestseller') {
            try {
                const snapshot = await db.collection('products')
                    .orderBy('rating', 'desc')
                    .limit(1)
                    .get();
                
                if (!snapshot.empty) {
                    const product = snapshot.docs[0].data();
                    const price = product.price?.toLocaleString() || 'liên hệ';
                    const rating = product.rating || '?';
                    responseText = `🏆 Best seller: ${product.name} - ${price}đ ⭐${rating}`;
                } else {
                    const allProducts = await db.collection('products').limit(1).get();
                    if (!allProducts.empty) {
                        const product = allProducts.docs[0].data();
                        responseText = `🏆 Sản phẩm nổi bật: ${product.name} giá ${product.price?.toLocaleString()}đ!`;
                    } else {
                        responseText = 'Chưa có dữ liệu sản phẩm.';
                    }
                }
            } catch (error) {
                console.error('Lỗi bestseller:', error.message);
                const allProducts = await db.collection('products').limit(1).get();
                if (!allProducts.empty) {
                    const product = allProducts.docs[0].data();
                    responseText = `${product.name} giá ${product.price?.toLocaleString()}đ là sản phẩm nổi bật!`;
                } else {
                    responseText = 'Xin lỗi, hiện tại tôi chưa có thông tin sản phẩm.';
                }
                logStatus = 'error';
            }
        }
        
        // ========== SEARCH BY CATEGORY ==========
        else if (intentName === 'search_by_category') {
            const category = parameters?.category;
            const snapshot = await db.collection('products')
                .where('category', '==', category)
                .limit(5)
                .get();
            
            if (!snapshot.empty) {
                let productList = snapshot.docs.map(doc => doc.data().name).join(', ');
                responseText = `Sản phẩm cho ${category === 'nam' ? 'nam' : 'nữ'}: ${productList}. Bạn muốn xem chi tiết sản phẩm nào?`;
            } else {
                responseText = `Hiện chưa có sản phẩm cho ${category === 'nam' ? 'nam' : 'nữ'}.`;
            }
        }
        
        // ========== CHECK STOCK ==========
        else if (intentName === 'check_stock') {
            const productId = parameters?.product_id;
            const docRef = await db.collection('products').doc(productId).get();
            
            if (docRef.exists) {
                const stock = docRef.data().stock || 0;
                responseText = stock > 0 ? `Sản phẩm này còn ${stock} cái trong kho!` : `Rất tiếc, sản phẩm này đã hết hàng.`;
            } else {
                responseText = 'Không tìm thấy sản phẩm này.';
            }
        }
        
        // ========== FALLBACK INTENT ==========
        else if (intentName === 'Default Fallback Intent') {
            responseText = 'Xin lỗi, tôi không hiểu ý bạn. Bạn có thể nói lại được không?';
            logStatus = 'fallback';
        }
        
        // ========== DEFAULT ==========
        else {
            responseText = 'Tôi chưa được lập trình để trả lời câu này. Xin lỗi bạn nhé!';
            logStatus = 'unknown_intent';
        }
        
        // ========== LƯU LOG VÀO DATABASE ==========
        await saveChatLog(sessionId, userQuery, responseText, intentName, logStatus, parameters);
        
    } catch (error) {
        console.error('Lỗi Firestore:', error);
        responseText = 'Có lỗi xảy ra, vui lòng thử lại sau!';
        await saveChatLog(sessionId, userQuery, responseText, intentName, 'system_error', parameters);
    }
    
    res.json({ fulfillmentText: responseText });
});

app.get('/', (req, res) => {
    res.send('Webhook is running!');
});

// ========== API XEM LỊCH SỬ CHAT ==========
app.get('/logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const snapshot = await db.collection('chat_logs')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        
        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });
        
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Webhook đang chạy tại port ${PORT}`);
});
