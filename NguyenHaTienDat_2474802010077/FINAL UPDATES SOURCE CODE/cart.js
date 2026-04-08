import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
let selectedCity = '';

const shippingFees = { 'hcm': 20000, 'hn': 25000, 'dn': 30000, 'other': 40000 };

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

function renderCart() {
    const container = document.getElementById('cartItemsList');
    const itemCountSpan = document.getElementById('itemCount');
    if (!cart.length) {
        container.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-bag"></i><h3>Giỏ hàng của bạn đang trống</h3><p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm nhé!</p><a href="index.html">🛍️ Tiếp tục mua sắm</a></div>`;
        if (itemCountSpan) itemCountSpan.textContent = '0';
        updateTotals();
        return;
    }
    if (itemCountSpan) itemCountSpan.textContent = cart.reduce((s, i) => s + i.quantity, 0);
    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item" data-id="${item.id}" data-index="${index}">
            <div class="cart-product"><img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/300x400?text=3+Thần+Đằng'"><div class="cart-product-info"><h4>${item.name}</h4><p>Màu: ${item.selectedColor || 'Đen'} | Size: ${item.selectedSize || 'M'}</p></div></div>
            <div class="cart-price">${item.price.toLocaleString()}đ</div>
            <div class="cart-quantity"><button onclick="updateQuantity('${item.id}', ${index}, -1)">-</button><span>${item.quantity}</span><button onclick="updateQuantity('${item.id}', ${index}, 1)">+</button></div>
            <div class="cart-subtotal">${(item.price * item.quantity).toLocaleString()}đ</div>
            <div class="cart-remove" onclick="removeItem(${index})"><i class="far fa-trash-alt"></i></div>
        </div>
    `).join('');
    updateTotals();
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let shipping = 0, showShippingRow = false;
    if (selectedCity && subtotal < 1000000) { shipping = shippingFees[selectedCity] || 40000; showShippingRow = true; }
    const total = subtotal + shipping;
    document.getElementById('subtotal').innerText = subtotal.toLocaleString() + 'đ';
    document.getElementById('shipping').innerText = shipping.toLocaleString() + 'đ';
    document.getElementById('total').innerText = total.toLocaleString() + 'đ';
    const shippingRow = document.getElementById('shippingRow');
    if (shippingRow) shippingRow.style.display = showShippingRow ? 'flex' : 'none';
    const freeShipNotice = document.getElementById('freeShipNotice');
    if (freeShipNotice) freeShipNotice.style.display = subtotal >= 1000000 ? 'block' : 'none';
}

window.updateShippingFee = function() {
    const citySelect = document.getElementById('shippingCity');
    selectedCity = citySelect.value;
    updateTotals();
};

window.updateQuantity = function(id, index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartCount();
    }
};

window.removeItem = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
    showToastMessage('Đã xóa sản phẩm', 'Sản phẩm đã được xóa khỏi giỏ hàng.', 'info');
};

function updateCartCount() {
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.textContent = count;
}

window.proceedToCheckout = function() {
    if (cart.length === 0) {
        showToastMessage('Giỏ hàng trống', 'Vui lòng thêm sản phẩm trước khi thanh toán.', 'warning');
        return;
    }
    if (!selectedCity) {
        showToastMessage('Chưa chọn khu vực', 'Vui lòng chọn tỉnh/thành phố để tính phí vận chuyển.', 'info');
        return;
    }
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        showToastMessage('Cần đăng nhập', 'Vui lòng đăng nhập để tiếp tục thanh toán.', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = (subtotal >= 1000000) ? 0 : (shippingFees[selectedCity] || 40000);
    localStorage.setItem('checkoutShipping', JSON.stringify({ city: selectedCity, shippingFee: shipping, total: subtotal + shipping }));
    window.location.href = 'checkout.html';
};

function checkLoginStatus() {
    const user = localStorage.getItem('loggedInUser');
    if (user) {
        const userData = JSON.parse(user);
        const userIcon = document.getElementById('userIcon');
        if (userIcon) userIcon.innerHTML = `<i class="far fa-user"></i><span style="font-size:12px;margin-left:5px;">${userData.name.split(' ').pop()}</span>`;
    }
}

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu');
    const menu = document.querySelector('.nav-menu');
    if (toggle && menu) toggle.addEventListener('click', () => menu.classList.toggle('active'));
}

function restoreSelectedCity() {
    const saved = localStorage.getItem('checkoutShipping');
    if (saved) {
        const shipping = JSON.parse(saved);
        const citySelect = document.getElementById('shippingCity');
        if (citySelect && shipping.city) { citySelect.value = shipping.city; selectedCity = shipping.city; updateShippingFee(); }
    }
}

document.addEventListener('DOMContentLoaded', () => { renderCart(); updateCartCount(); checkLoginStatus(); initMobileMenu(); restoreSelectedCity(); });