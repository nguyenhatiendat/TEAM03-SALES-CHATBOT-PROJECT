import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
let currentStatus = 'all';
let allOrders = [];

function updateCartCount() {
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = count;
}

function checkLoginStatus() {
    const user = localStorage.getItem('loggedInUser');
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    const userData = JSON.parse(user);
    const userIcon = document.getElementById('userIcon');
    if (userIcon) userIcon.innerHTML = `<i class="far fa-user"></i><span style="font-size:12px;margin-left:5px;">${userData.name.split(' ').pop()}</span>`;
    return userData;
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

// Chuẩn hóa dữ liệu đơn hàng từ Firebase (xử lý cả cấu trúc cũ và mới)
function normalizeOrderData(doc) {
    const data = doc.data();
    
    // Trường hợp 1: Dữ liệu đã đúng cấu trúc (không có field "order")
    if (!data.order) {
        return { id: doc.id, ...data };
    }
    
    // Trường hợp 2: Dữ liệu bị lồng trong field "order" (cấu trúc cũ)
    console.warn("⚠️ Phát hiện đơn hàng cũ (có field order):", doc.id);
    
    const orderData = data.order;
    return {
        id: doc.id,
        customer: orderData.customer || data.customer || {},
        items: orderData.items || data.items || [],
        subtotal: orderData.subtotal || data.subtotal || 0,
        shipping: orderData.shipping || data.shipping || 0,
        total: orderData.total || data.total || 0,
        paymentMethod: orderData.paymentMethod || data.paymentMethod || 'cod',
        note: orderData.note || data.note || '',
        status: orderData.status || data.status || 'pending',
        userId: orderData.userId || data.userId || null,
        userEmail: orderData.userEmail || data.userEmail || null,
        createdAt: orderData.createdAt || data.createdAt || new Date().toLocaleString('vi-VN')
    };
}

async function loadOrders() {
    const user = localStorage.getItem('loggedInUser');
    if (!user) return;
    
    const userData = JSON.parse(user);
    const userEmail = userData.email;
    const userId = userData.id;
    
    console.log("🔍 Đang tìm đơn hàng cho userId:", userId, "email:", userEmail);
    
    const ordersRef = collection(db, "orders");
    let q;
    
    if (userId) {
        q = query(ordersRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    } else if (userEmail) {
        q = query(ordersRef, where("userEmail", "==", userEmail), orderBy("createdAt", "desc"));
    } else {
        allOrders = [];
        displayOrders([]);
        return;
    }
    
    try {
        const snapshot = await getDocs(q);
        console.log("📦 Số đơn hàng tìm thấy:", snapshot.size);
        
        allOrders = [];
        snapshot.forEach(doc => {
            const normalizedOrder = normalizeOrderData(doc);
            console.log("✅ Đã chuẩn hóa đơn hàng:", normalizedOrder.id, normalizedOrder);
            allOrders.push(normalizedOrder);
        });
        
        filterOrders();
    } catch (error) {
        console.error("❌ Lỗi load đơn hàng:", error);
        showToastMessage('Lỗi tải dữ liệu', 'Không thể tải đơn hàng, vui lòng thử lại', 'error');
    }
}

function filterOrders() {
    let filtered = allOrders;
    if (currentStatus !== 'all') {
        filtered = allOrders.filter(order => order.status === currentStatus);
    }
    displayOrders(filtered);
}

function displayOrders(orders) {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `<div class="empty-orders"><i class="fas fa-receipt"></i><p>Bạn chưa có đơn hàng nào</p><a href="index.html">Tiếp tục mua sắm</a></div>`;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card" onclick="showOrderDetail('${order.id}')">
            <div class="order-header">
                <span class="order-code">#${order.id.slice(0, 8)}</span>
                <span class="order-date">${order.createdAt || 'Đang cập nhật'}</span>
                <span class="order-status ${getStatusClass(order.status)}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-body">
                <div class="order-products">
                    ${order.items && order.items.length > 0 ? order.items.slice(0, 2).map(item => `
                        <img class="order-product-img" src="${item.image}" onerror="this.src='https://placehold.co/300x400?text=3+Thần+Đằng'">
                        <span class="order-product-name">${item.name} x${item.quantity}</span>
                    `).join('') : '<span>Không có sản phẩm</span>'}
                    ${order.items && order.items.length > 2 ? `<span class="order-more">+${order.items.length - 2} sản phẩm</span>` : ''}
                </div>
                <div class="order-total">${(order.total || 0).toLocaleString()}đ</div>
            </div>
        </div>
    `).join('');
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, { status: newStatus });
        showToastMessage('Cập nhật thành công', `Đơn hàng đã chuyển sang trạng thái: ${getStatusText(newStatus)}`, 'success');
        await loadOrders();
    } catch (error) {
        console.error("Lỗi cập nhật trạng thái:", error);
        showToastMessage('Cập nhật thất bại', 'Vui lòng thử lại sau', 'error');
    }
};

window.showOrderDetail = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        console.error("Không tìm thấy đơn hàng:", orderId);
        return;
    }
    
    const modal = document.getElementById('orderModal');
    const detailDiv = document.getElementById('orderDetail');
    
    if (!modal || !detailDiv) return;
    
    detailDiv.innerHTML = `
        <div class="detail-row"><div class="detail-label">Mã đơn hàng</div><div class="detail-value">#${order.id}</div></div>
        <div class="detail-row"><div class="detail-label">Ngày đặt</div><div class="detail-value">${order.createdAt || 'Đang cập nhật'}</div></div>
        <div class="detail-row"><div class="detail-label">Trạng thái</div><div class="detail-value">
            <select id="statusSelect" onchange="updateOrderStatus('${order.id}', this.value)" style="padding:5px;border-radius:4px;">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Chờ xử lý</option>
                <option value="shipping" ${order.status === 'shipping' ? 'selected' : ''}>Đang giao hàng</option>
                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Hoàn thành</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
            </select>
        </div></div>
        <div class="detail-row"><div class="detail-label">Thông tin nhận hàng</div><div class="detail-value">${order.customer?.name || 'N/A'}<br>${order.customer?.phone || 'N/A'}<br>${order.customer?.address || 'N/A'}</div></div>
        <div class="detail-label">Sản phẩm</div>
        <div class="detail-items">${order.items && order.items.length > 0 ? order.items.map(item => `
            <div class="detail-item">
                <img src="${item.image}" onerror="this.src='https://placehold.co/300x400?text=3+Thần+Đằng'">
                <div class="detail-item-info">
                    <h4>${item.name}</h4>
                    <p>Số lượng: ${item.quantity} | Giá: ${(item.price || 0).toLocaleString()}đ</p>
                    <p>Size: ${item.size || 'M'} | Màu: ${item.color || 'Đen'}</p>
                </div>
                <div>${((item.price || 0) * item.quantity).toLocaleString()}đ</div>
            </div>
        `).join('') : '<p>Không có sản phẩm</p>'}</div>
        <div class="detail-row"><div class="detail-label">Phương thức thanh toán</div><div class="detail-value">${order.paymentMethod === 'cod' ? 'COD (Thanh toán khi nhận hàng)' : order.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' : 'Ví MoMo'}</div></div>
        ${order.note ? `<div class="detail-row"><div class="detail-label">Ghi chú</div><div class="detail-value">${order.note}</div></div>` : ''}
        <div class="detail-total">Tổng cộng: ${(order.total || 0).toLocaleString()}đ</div>
    `;
    modal.style.display = 'flex';
};

function initTabs() {
    const tabs = document.querySelectorAll('.order-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.getAttribute('data-status');
            filterOrders();
        });
    });
}

function initModal() {
    const modal = document.getElementById('orderModal');
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu');
    const menu = document.querySelector('.nav-menu');
    if (toggle && menu) toggle.addEventListener('click', () => menu.classList.toggle('active'));
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = checkLoginStatus();
    if (!user) return;
    updateCartCount();
    initTabs();
    initModal();
    initMobileMenu();
    await loadOrders();
});