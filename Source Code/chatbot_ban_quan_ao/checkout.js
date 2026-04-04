import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBydAzunkJI9NVC1M-NmSZWxvOXg8LnoKo",
    authDomain: "team3-3than-dang-chatbot.firebaseapp.com",
    projectId: "team3-3than-dang-chatbot",
    storageBucket: "team3-3than-dang-chatbot.firebasestorage.app",
    messagingSenderId: "963296403533",
    appId: "1:963296403533:web:8aa94bd7bea8116ac27c04"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let selectedPayment = 'cod';

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
    const discount = 0;
    const total = subtotal + shipping - discount;
    
    document.getElementById('subtotal').innerText = subtotal.toLocaleString() + 'đ';
    document.getElementById('shipping').innerText = shipping.toLocaleString() + 'đ';
    document.getElementById('discount').innerText = discount.toLocaleString() + 'đ';
    document.getElementById('total').innerText = total.toLocaleString() + 'đ';
}

function updateCartCount() {
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = count;
}

function checkLoginStatus() {
    const user = localStorage.getItem('loggedInUser');
    if (user) {
        const userData = JSON.parse(user);
        const userIcon = document.getElementById('userIcon');
        if (userIcon) {
            userIcon.innerHTML = `<i class="far fa-user"></i><span style="font-size:12px;margin-left:5px;">${userData.name.split(' ').pop()}</span>`;
        }
        // Tự động điền thông tin nếu có
        document.getElementById('fullname').value = userData.name || '';
        document.getElementById('phone').value = userData.phone || '';
        document.getElementById('address').value = userData.address || '';
    }
}

// Chọn phương thức thanh toán
document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', () => {
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
        method.classList.add('selected');
        selectedPayment = method.getAttribute('data-method');
    });
});

window.placeOrder = async function() {
    if (cart.length === 0) {
        alert("Giỏ hàng trống!");
        return;
    }
    
    const fullname = document.getElementById('fullname').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const district = document.getElementById('district').value;
    const note = document.getElementById('note').value;
    
    if (!fullname || !phone || !address) {
        alert("Vui lòng nhập đầy đủ thông tin giao hàng!");
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 1000000 ? 0 : 30000;
    const total = subtotal + shipping;
    
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
        createdAt: new Date().toLocaleString('vi-VN')
    };
    
    // Lấy thông tin user nếu đã đăng nhập
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        orderData.userId = user.id;
        orderData.userEmail = user.email;
    }
    
    try {
        const docRef = await addDoc(collection(db, "orders"), orderData);
        alert(`✅ Đặt hàng thành công!\nMã đơn: ${docRef.id}\nTổng tiền: ${total.toLocaleString()}đ\n\n3 Thần Đằng sẽ liên hệ xác nhận đơn hàng!`);
        
        // Xóa giỏ hàng sau khi đặt thành công
        localStorage.removeItem('cart');
        window.location.href = 'orders.html';
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Có lỗi xảy ra, vui lòng thử lại!");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }
    renderOrderItems();
    updateCartCount();
    checkLoginStatus();
});