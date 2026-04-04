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
let shippingFee = 0;

// Phí ship theo khu vực
const shippingFees = {
    'hcm': 20000,
    'hn': 25000,
    'dn': 30000,
    'other': 40000
};

function renderCart() {
    const container = document.getElementById('cartItemsList');
    const itemCountSpan = document.getElementById('itemCount');
    
    if (!cart.length) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-bag"></i>
                <p>Giỏ hàng trống</p>
                <a href="index.html">Tiếp tục mua sắm</a>
            </div>
        `;
        if (itemCountSpan) itemCountSpan.textContent = '0';
        updateTotals();
        return;
    }
    
    if (itemCountSpan) {
        const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
        itemCountSpan.textContent = totalItems;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-product">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/300x400?text=3+Thần+Đằng'">
                <div class="cart-product-info">
                    <h4>${item.name}</h4>
                    <p>Màu sắc: ${item.selectedColor || 'Đen'} | Size: ${item.selectedSize || 'M'}</p>
                </div>
            </div>
            <div class="cart-price">${item.price.toLocaleString()}đ</div>
            <div class="cart-quantity">
                <button onclick="updateQuantity('${item.id}', -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity('${item.id}', 1)">+</button>
            </div>
            <div class="cart-subtotal">${(item.price * item.quantity).toLocaleString()}đ</div>
            <div class="cart-remove" onclick="removeItem('${item.id}')">
                <i class="far fa-trash-alt"></i>
            </div>
        </div>
    `).join('');
    
    updateTotals();
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Chỉ tính phí ship nếu đã chọn tỉnh thành VÀ chưa đủ điều kiện free ship
    let shipping = 0;
    let showShippingRow = false;
    
    if (selectedCity && subtotal < 1000000) {
        shipping = shippingFees[selectedCity] || 40000;
        showShippingRow = true;
    } else if (subtotal >= 1000000) {
        shipping = 0;
        showShippingRow = false;
    } else {
        shipping = 0;
        showShippingRow = false;
    }
    
    const discount = 0;
    const total = subtotal + shipping - discount;
    
    document.getElementById('subtotal').innerText = subtotal.toLocaleString() + 'đ';
    document.getElementById('shipping').innerText = shipping.toLocaleString() + 'đ';
    document.getElementById('discount').innerText = discount.toLocaleString() + 'đ';
    document.getElementById('total').innerText = total.toLocaleString() + 'đ';
    
    // Hiển thị/ẩn dòng phí ship
    const shippingRow = document.getElementById('shippingRow');
    if (shippingRow) {
        shippingRow.style.display = showShippingRow ? 'flex' : 'none';
    }
    
    // Hiển thị thông báo free ship
    const freeShipNotice = document.getElementById('freeShipNotice');
    if (freeShipNotice) {
        if (subtotal >= 1000000) {
            freeShipNotice.style.display = 'block';
        } else {
            freeShipNotice.style.display = 'none';
        }
    }
}

window.updateShippingFee = function() {
    const citySelect = document.getElementById('shippingCity');
    selectedCity = citySelect.value;
    
    if (!selectedCity) {
        shippingFee = 0;
    } else {
        shippingFee = shippingFees[selectedCity] || 40000;
    }
    
    updateTotals();
};

window.updateQuantity = function(id, change) {
    const itemIndex = cart.findIndex(i => i.id === id);
    if (itemIndex !== -1) {
        cart[itemIndex].quantity += change;
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartCount();
    }
};

window.removeItem = function(id) {
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
};

function updateCartCount() {
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.textContent = count;
}

window.proceedToCheckout = function() {
    if (cart.length === 0) {
        alert("Giỏ hàng trống! Vui lòng thêm sản phẩm.");
        return;
    }
    
    if (!selectedCity) {
        alert("Vui lòng chọn tỉnh/thành phố để tính phí vận chuyển!");
        return;
    }
    
    // Lưu thông tin shipping để dùng ở checkout
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = (subtotal >= 1000000) ? 0 : (shippingFees[selectedCity] || 40000);
    const total = subtotal + shipping;
    
    localStorage.setItem('checkoutShipping', JSON.stringify({
        city: selectedCity,
        shippingFee: shipping,
        total: total
    }));
    
    window.location.href = 'checkout.html';
};

function checkLoginStatus() {
    const user = localStorage.getItem('loggedInUser');
    if (user) {
        const userData = JSON.parse(user);
        const userIcon = document.getElementById('userIcon');
        if (userIcon) {
            userIcon.innerHTML = `<i class="far fa-user"></i><span style="font-size:12px;margin-left:5px;">${userData.name.split(' ').pop()}</span>`;
        }
    }
}

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu');
    const menu = document.querySelector('.nav-menu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => menu.classList.toggle('active'));
    }
}

// Khôi phục selected city nếu có
function restoreSelectedCity() {
    const savedShipping = localStorage.getItem('checkoutShipping');
    if (savedShipping) {
        const shipping = JSON.parse(savedShipping);
        const citySelect = document.getElementById('shippingCity');
        if (citySelect && shipping.city) {
            citySelect.value = shipping.city;
            selectedCity = shipping.city;
            updateShippingFee();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    updateCartCount();
    checkLoginStatus();
    initMobileMenu();
    restoreSelectedCity();
});