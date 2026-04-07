import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBydAzunkJI9NVC1M-NmSZWxvOXg8LnoKo",
    authDomain: "team3-3than-dang-chatbot.firebaseapp.com",
    projectId: "team3-3than-dang-chatbot",
    storageBucket: "team3-3than-dang-chatbot.firebasestorage.app",
    messagingSenderId: "963296533",
    appId: "1:963296533:web:8aa94bd7bea8116ac27c04"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let selectedPayment = 'cod';

function showToastMessage(title, message, type = 'success') {
    let toast = document.getElementById('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.style.cssText = `position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(100px);background:white;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.2);padding:15px 25px;z-index:10001;transition:transform 0.3s ease;min-width:280px;text-align:center;`;
        document.body.appendChild(toast);
    }
    const colors = { success: '#4caf50', error: '#f44336', warning: '#ff9800', info: '#2196f3' };
    toast.style.borderLeft = `4px solid ${colors[type] || colors.success}`;
    toast.innerHTML = `<strong>${title}</strong><br>${message}`;
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => { toast.style.transform = 'translateX(-50%) translateY(100px)'; }, 3000);
}

function renderOrderItems() {
    const container = document.getElementById('orderItems');
    if (!cart.length) {
        container.innerHTML = '<p style="text-align:center;padding:20px;">Giỏ hàng trống</p>';
        return;
    }
    container.innerHTML = cart.map(item => `
        <div class="order-item">
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/300x400?text=3+Thần+Đằng'">
            <div class="order-item-info">
                <h4>${item.name}</h4>
                <p>Số lượng: ${item.quantity}</p>
                <p>Size: ${item.selectedSize || 'M'} | Màu: ${item.selectedColor || 'Đen'}</p>
            </div>
            <div class="order-item-price">${(item.price * item.quantity).toLocaleString()}đ</div>
        </div>
    `).join('');
    updateTotals();
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 1000000 ? 0 : 30000;
    const total = subtotal + shipping;
    document.getElementById('subtotal').innerText = subtotal.toLocaleString() + 'đ';
    document.getElementById('shipping').innerText = shipping.toLocaleString() + 'đ';
    document.getElementById('total').innerText = total.toLocaleString() + 'đ';
}

function updateCartCount() {
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = count;
}

function checkLoginStatus() {
    const user = localStorage.getItem('loggedInUser');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    const userData = JSON.parse(user);
    const userIcon = document.getElementById('userIcon');
    if (userIcon) userIcon.innerHTML = `<i class="far fa-user"></i><span style="font-size:12px;margin-left:5px;">${userData.name.split(' ').pop()}</span>`;
    document.getElementById('fullname').value = userData.name || '';
    document.getElementById('phone').value = userData.phone || '';
    document.getElementById('address').value = userData.address || '';
}

document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', () => {
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
        method.classList.add('selected');
        selectedPayment = method.getAttribute('data-method');
    });
});

async function updateStock(productId, quantity) {
    try {
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("id", "==", productId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            for (const docSnap of snapshot.docs) {
                const product = docSnap.data();
                const newStock = product.stock - quantity;
                await updateDoc(docSnap.ref, { stock: newStock });
            }
        }
    } catch (error) {
        console.error("Lỗi cập nhật stock:", error);
    }
}

window.placeOrder = async function() {
    if (cart.length === 0) {
        showToastMessage('Giỏ hàng trống', 'Vui lòng thêm sản phẩm trước khi thanh toán', 'warning');
        return;
    }
    
    const fullname = document.getElementById('fullname').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const district = document.getElementById('district').value;
    const note = document.getElementById('note').value;
    
    if (!fullname || !phone || !address) {
        showToastMessage('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin giao hàng', 'error');
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 1000000 ? 0 : 30000;
    const total = subtotal + shipping;
    
    const loggedInUser = localStorage.getItem('loggedInUser');
    let userId = null, userEmail = null;
    if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        userId = user.id;
        userEmail = user.email;
    }
    
    // ĐÚNG - lưu trực tiếp, không lồng vào field "order"
    const orderData = {
        customer: { 
            name: fullname, 
            phone: phone, 
            address: `${address}, ${district}, ${city}` 
        },
        items: cart.map(item => ({
            id: item.id, 
            name: item.name, 
            price: item.price, 
            quantity: item.quantity,
            size: item.selectedSize || 'M', 
            color: item.selectedColor || 'Đen', 
            image: item.image
        })),
        subtotal: subtotal, 
        shipping: shipping, 
        total: total,
        paymentMethod: selectedPayment, 
        note: note,
        status: 'pending', 
        userId: userId, 
        userEmail: userEmail,
        createdAt: new Date().toLocaleString('vi-VN')
    };
    
    // Debug: kiểm tra dữ liệu trước khi lưu
    console.log("📦 Đang lưu đơn hàng:", orderData);
    
    try {
        // Cập nhật stock cho từng sản phẩm
        for (const item of cart) {
            await updateStock(item.id, item.quantity);
        }
        
        const docRef = await addDoc(collection(db, "orders"), orderData);
        console.log("✅ Lưu thành công với ID:", docRef.id);
        console.log("📄 Dữ liệu đã lưu:", orderData);
        
        showToastMessage('Đặt hàng thành công!', `Mã đơn: ${docRef.id.slice(0, 8)} | Tổng: ${total.toLocaleString()}đ`, 'success');
        
        // Xóa giỏ hàng và chuyển về trang orders
        localStorage.removeItem('cart');
        setTimeout(() => { 
            window.location.href = 'orders.html'; 
        }, 1500);
    } catch (error) {
        console.error("❌ Lỗi chi tiết:", error);
        showToastMessage('Đặt hàng thất bại', 'Có lỗi xảy ra, vui lòng thử lại sau', 'error');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    if (cart.length === 0) { 
        window.location.href = 'cart.html'; 
        return; 
    }
    renderOrderItems();
    updateCartCount();
});