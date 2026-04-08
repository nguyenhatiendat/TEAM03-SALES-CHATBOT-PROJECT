import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit, where, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
        if (userIcon) userIcon.innerHTML = `<i class="far fa-user"></i><span style="font-size:12px;margin-left:5px;">${userData.name.split(' ').pop()}</span>`;
    }
}

function getStatusText(status) {
    const statusMap = { 'pending': 'Chờ xử lý', 'shipping': 'Đang giao hàng', 'completed': 'Hoàn thành', 'cancelled': 'Đã hủy' };
    return statusMap[status] || 'Chờ xử lý';
}

function getStatusClass(status) {
    const classMap = { 'pending': 'status-pending', 'shipping': 'status-shipping', 'completed': 'status-completed', 'cancelled': 'status-cancelled' };
    return classMap[status] || 'status-pending';
}

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

window.trackOrder = async function() {
    const orderId = document.getElementById('orderCode').value.trim();
    if (!orderId) {
        showToastMessage('Nhập mã đơn', 'Vui lòng nhập mã đơn hàng', 'warning');
        return;
    }
    
    try {
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("__name__", "==", orderId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            document.getElementById('trackResult').style.display = 'block';
            document.getElementById('trackResult').innerHTML = `
                <div style="text-align:center;padding:40px;">
                    <i class="fas fa-search" style="font-size:48px;color:#ddd;"></i>
                    <p style="margin-top:15px;">Không tìm thấy đơn hàng với mã: ${orderId}</p>
                    <p style="font-size:13px;color:#888;">Vui lòng kiểm tra lại mã đơn hàng</p>
                </div>
            `;
            return;
        }
        
        let order;
        snapshot.forEach(doc => { order = { id: doc.id, ...doc.data() }; });
        
        const status = order.status || 'pending';
        let progressClass = '';
        if (status === 'pending') progressClass = 'progress-pending';
        else if (status === 'shipping') progressClass = 'progress-shipping';
        else if (status === 'completed') progressClass = 'progress-completed';
        else if (status === 'cancelled') progressClass = 'progress-cancelled';
        
        document.getElementById('trackResult').style.display = 'block';
        document.getElementById('trackResult').innerHTML = `
            <div class="order-detail">
                <h3>📦 CHI TIẾT ĐƠN HÀNG #${order.id.slice(0, 8)}</h3>
                <div class="order-info">
                    <p><strong>Ngày đặt:</strong> ${order.createdAt || 'Đang cập nhật'}</p>
                    <p><strong>Trạng thái:</strong> <span class="status-badge ${getStatusClass(status)}">${getStatusText(status)}</span></p>
                    <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'cod' ? 'COD (Thanh toán khi nhận hàng)' : order.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' : 'Ví MoMo'}</p>
                    <p><strong>Tổng tiền:</strong> ${order.total?.toLocaleString() || 0}đ</p>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}"></div>
                </div>
                <div class="order-info">
                    <p><strong>👤 Thông tin nhận hàng:</strong></p>
                    <p>${order.customer?.name || ''}</p>
                    <p>${order.customer?.phone || ''}</p>
                    <p>${order.customer?.address || ''}</p>
                </div>
                <div class="order-info">
                    <p><strong>🛍️ Sản phẩm:</strong></p>
                    ${order.items?.map(item => `
                        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
                            <span>${item.name} x${item.quantity}</span>
                            <span>${(item.price * item.quantity).toLocaleString()}đ</span>
                        </div>
                    `).join('') || ''}
                </div>
                ${order.note ? `<div class="order-info"><p><strong>📝 Ghi chú:</strong> ${order.note}</p></div>` : ''}
            </div>
        `;
        
    } catch (error) {
        console.error("Lỗi:", error);
        showToastMessage('Lỗi tra cứu', 'Có lỗi xảy ra, vui lòng thử lại', 'error');
    }
};

async function loadRecentOrders() {
    const user = localStorage.getItem('loggedInUser');
    if (!user) {
        document.getElementById('recentOrders').innerHTML = `<p style="text-align:center;color:#888;">Đăng nhập để xem đơn hàng gần đây</p>`;
        return;
    }
    
    const userData = JSON.parse(user);
    const userEmail = userData.email;
    const userId = userData.id;
    
    try {
        const ordersRef = collection(db, "orders");
        let q;
        if (userId) {
            q = query(ordersRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(5));
        } else if (userEmail) {
            q = query(ordersRef, where("userEmail", "==", userEmail), orderBy("createdAt", "desc"), limit(5));
        } else {
            q = query(ordersRef, orderBy("createdAt", "desc"), limit(5));
        }
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            document.getElementById('recentOrders').innerHTML = `<p style="text-align:center;color:#888;">Chưa có đơn hàng nào</p>`;
            return;
        }
        
        const orders = [];
        snapshot.forEach(doc => { orders.push({ id: doc.id, ...doc.data() }); });
        
        document.getElementById('recentOrders').innerHTML = orders.map(order => `
            <div class="recent-order-card" onclick="document.getElementById('orderCode').value='${order.id}'; trackOrder();">
                <div class="recent-order-info">
                    <div class="recent-order-code">#${order.id.slice(0, 8)}</div>
                    <div class="recent-order-date">${order.createdAt || 'Đang cập nhật'}</div>
                </div>
                <div class="recent-order-total">${order.total?.toLocaleString() || 0}đ</div>
                <div class="recent-order-status ${getStatusClass(order.status)}">${getStatusText(order.status)}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error("Lỗi load đơn hàng:", error);
    }
}

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu');
    const menu = document.querySelector('.nav-menu');
    if (toggle && menu) toggle.addEventListener('click', () => menu.classList.toggle('active'));
}

// Modal functions
function initModal() {
    const modal = document.getElementById('orderModal');
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    checkLoginStatus();
    initMobileMenu();
    initModal();
    loadRecentOrders();
});