import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    if (userIcon) {
        userIcon.innerHTML = `<i class="far fa-user"></i><span style="font-size:12px;margin-left:5px;">${userData.name.split(' ').pop()}</span>`;
    }
    return userData;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ xử lý',
        'shipping': 'Đang giao hàng',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || 'Chờ xử lý';
}

function getStatusClass(status) {
    const classMap = {
        'pending': 'status-pending',
        'shipping': 'status-shipping',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
    };
    return classMap[status] || 'status-pending';
}

async function loadOrders() {
    const user = localStorage.getItem('loggedInUser');
    if (!user) return;
    
    const userData = JSON.parse(user);
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("userEmail", "==", userData.email), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    allOrders = [];
    snapshot.forEach(doc => {
        allOrders.push({ id: doc.id, ...doc.data() });
    });
    
    filterOrders();
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
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-orders">
                <i class="fas fa-receipt"></i>
                <p>Bạn chưa có đơn hàng nào</p>
                <a href="index.html">Tiếp tục mua sắm</a>
            </div>
        `;
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
                    ${order.items.slice(0, 2).map(item => `
                        <img class="order-product-img" src="${item.image}" onerror="this.src='https://placehold.co/300x400?text=3+Thần+Đằng'">
                        <span class="order-product-name">${item.name} x${item.quantity}</span>
                    `).join('')}
                    ${order.items.length > 2 ? `<span class="order-more">+${order.items.length - 2} sản phẩm</span>` : ''}
                </div>
                <div class="order-total">${order.total.toLocaleString()}đ</div>
            </div>
        </div>
    `).join('');
}

window.showOrderDetail = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('orderModal');
    const detailDiv = document.getElementById('orderDetail');
    
    detailDiv.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Mã đơn hàng</div>
            <div class="detail-value">#${order.id}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Ngày đặt</div>
            <div class="detail-value">${order.createdAt || 'Đang cập nhật'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Trạng thái</div>
            <div class="detail-value"><span class="order-status ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Thông tin nhận hàng</div>
            <div class="detail-value">
                ${order.customer?.name}<br>
                ${order.customer?.phone}<br>
                ${order.customer?.address}
            </div>
        </div>
        <div class="detail-label">Sản phẩm</div>
        <div class="detail-items">
            ${order.items.map(item => `
                <div class="detail-item">
                    <img src="${item.image}" onerror="this.src='https://placehold.co/300x400?text=3+Thần+Đằng'">
                    <div class="detail-item-info">
                        <h4>${item.name}</h4>
                        <p>Số lượng: ${item.quantity} | Giá: ${item.price.toLocaleString()}đ</p>
                        <p>Size: ${item.size || 'M'} | Màu: ${item.color || 'Đen'}</p>
                    </div>
                    <div>${(item.price * item.quantity).toLocaleString()}đ</div>
                </div>
            `).join('')}
        </div>
        <div class="detail-row">
            <div class="detail-label">Phương thức thanh toán</div>
            <div class="detail-value">${order.paymentMethod === 'cod' ? 'COD (Thanh toán khi nhận hàng)' : order.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' : 'Ví MoMo'}</div>
        </div>
        ${order.note ? `<div class="detail-row"><div class="detail-label">Ghi chú</div><div class="detail-value">${order.note}</div></div>` : ''}
        <div class="detail-total">
            Tổng cộng: ${order.total.toLocaleString()}đ
        </div>
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
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu');
    const menu = document.querySelector('.nav-menu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => menu.classList.toggle('active'));
    }
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