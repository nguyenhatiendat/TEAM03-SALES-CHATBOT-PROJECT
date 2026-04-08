const express = require('express');
const app = express();
app.use(express.json());

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.post('/webhook', async (req, res) => {
    const intentName = req.body.queryResult?.intent?.displayName;
    const parameters = req.body.queryResult?.parameters;
    
    console.log('Intent:', intentName);
    console.log('Parameters:', parameters);
    
    let responseText = '';
    
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
        }
        
        // ========== DEFAULT ==========
        else {
            responseText = 'Tôi chưa được lập trình để trả lời câu này. Xin lỗi bạn nhé!';
        }
    } catch (error) {
        console.error('Lỗi Firestore:', error);
        responseText = 'Có lỗi xảy ra, vui lòng thử lại sau!';
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
