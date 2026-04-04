import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, query, where, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let currentProduct = null;
let selectedColor = '';
let selectedSize = '';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function loadProductDetail() {
    const productId = getProductIdFromUrl();
    if (!productId) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const productsRef = collection(db, "products");
        const q = query(productsRef, where("id", "==", productId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            window.location.href = 'index.html';
            return;
        }
        
        snapshot.forEach(doc => {
            currentProduct = { id: doc.id, ...doc.data() };
        });
        
        displayProductDetail();
        loadRelatedProducts();
        
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

function displayProductDetail() {
    document.title = `${currentProduct.name} - 3 Thần Đằng`;
    document.getElementById('detailProductName').innerText = currentProduct.name;
    document.getElementById('productName').innerText = currentProduct.name;
    document.getElementById('productCategory').innerText = 
        currentProduct.category === 'nam' ? 'NAM' : 
        currentProduct.category === 'nu' ? 'NỮ' : 
        currentProduct.category === 'tre-em' ? 'TRẺ EM' : 'PHỤ KIỆN';
    
    document.getElementById('detailPrice').innerText = currentProduct.price.toLocaleString() + 'đ';
    if (currentProduct.oldPrice) {
        document.getElementById('detailOldPrice').innerText = currentProduct.oldPrice.toLocaleString() + 'đ';
        const discount = Math.round((1 - currentProduct.price / currentProduct.oldPrice) * 100);
        document.getElementById('discountBadge').innerText = `-${discount}%`;
    }
    
    document.getElementById('productDescription').innerText = 
        currentProduct.description || 'Chất liệu cao cấp, thiết kế thanh lịch, phù hợp với nhiều hoàn cảnh.';
    document.getElementById('fullDescription').innerHTML = `
        <p>${currentProduct.description || 'Chất liệu cao cấp, thiết kế thanh lịch, phù hợp với nhiều hoàn cảnh.'}</p>
        <p style="margin-top:10px">✅ Chất liệu: Vải cao cấp, thấm hút mồ hôi tốt<br>
        ✅ Thiết kế: Ôm sát, tôn dáng<br>
        ✅ Bảo quản: Giặt máy ở chế độ nhẹ, không dùng bột giặt có chất tẩy mạnh</p>
    `;
    
    const mainImage = document.getElementById('mainImage');
    mainImage.src = currentProduct.image;
    mainImage.alt = currentProduct.name;
    
    // Colors
    const colors = currentProduct.colors || ['Đen', 'Trắng', 'Be', 'Xanh'];
    const colorContainer = document.getElementById('colorOptions');
    colorContainer.innerHTML = colors.map(color => `
        <div class="color-option" style="background:${getColorCode(color)}" data-color="${color}" onclick="selectColor('${color}')"></div>
    `).join('');
    selectedColor = colors[0];
    document.querySelectorAll('.color-option')[0]?.classList.add('selected');
    
    // Sizes
    const sizes = currentProduct.sizes || ['S', 'M', 'L', 'XL'];
    const sizeContainer = document.getElementById('sizeOptions');
    sizeContainer.innerHTML = sizes.map(size => `
        <button class="size-option" data-size="${size}" onclick="selectSize('${size}')">${size}</button>
    `).join('');
    selectedSize = sizes[1] || sizes[0];
    document.querySelectorAll('.size-option')[1]?.classList.add('selected');
}

function getColorCode(color) {
    const colorMap = {
        'Đen': '#1a1a1a',
        'Trắng': '#ffffff',
        'Be': '#f5f5dc',
        'Xanh': '#2e5c6e',
        'Nâu': '#8b5a2b',
        'Hồng': '#ff69b4',
        'Đỏ': '#e74c3c'
    };
    return colorMap[color] || '#ccc';
}

window.selectColor = function(color) {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-color') === color) opt.classList.add('selected');
    });
};

window.selectSize = function(size) {
    selectedSize = size;
    document.querySelectorAll('.size-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-size') === size) opt.classList.add('selected');
    });
};

window.changeQuantity = function(change) {
    const qtyInput = document.getElementById('quantity');
    let qty = parseInt(qtyInput.value) + change;
    if (qty < 1) qty = 1;
    if (qty > 99) qty = 99;
    qtyInput.value = qty;
};

window.addToCartDetail = function() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value);
    
    const existingItem = cart.find(item => 
        item.id === currentProduct.id && 
        item.selectedColor === selectedColor && 
        item.selectedSize === selectedSize
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.image,
            quantity: quantity,
            selectedColor: selectedColor,
            selectedSize: selectedSize
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showAddToCartPopup(currentProduct.name, currentProduct.price, quantity);
};

window.buyNow = function() {
    addToCartDetail();
    window.location.href = 'checkout.html';
};

function showAddToCartPopup(productName, price, quantity) {
    let popup = document.getElementById('cartPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'cartPopup';
        popup.style.cssText = `position:fixed;bottom:30px;right:30px;background:white;border-radius:12px;box-shadow:0 5px 25px rgba(0,0,0,0.15);padding:20px;width:340px;z-index:10000;border-left:4px solid #b89a6e;transform:translateX(400px);transition:transform 0.3s ease;`;
        document.body.appendChild(popup);
    }
    popup.innerHTML = `
        <div style="display:flex;gap:15px;align-items:center;">
            <div style="background:#b89a6e;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;"><i class="fas fa-check" style="color:white;font-size:20px;"></i></div>
            <div style="flex:1;"><p style="font-weight:600;margin-bottom:5px;">Đã thêm vào giỏ</p><p style="font-size:13px;">${productName} x${quantity}</p><p style="font-size:13px;color:#b89a6e;">${(price * quantity).toLocaleString()}đ</p></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:15px;"><a href="cart.html" style="flex:1;background:#1a1a1a;color:white;text-align:center;padding:10px;text-decoration:none;font-size:13px;border-radius:4px;">XEM GIỎ</a><button onclick="closePopup()" style="flex:1;background:#f0f0f0;border:none;padding:10px;cursor:pointer;border-radius:4px;">TIẾP TỤC</button></div>
    `;
    setTimeout(() => { popup.style.transform = 'translateX(0)'; }, 10);
    setTimeout(() => { if(popup) closePopup(); }, 4000);
}

window.closePopup = function() {
    const popup = document.getElementById('cartPopup');
    if (popup) {
        popup.style.transform = 'translateX(400px)';
        setTimeout(() => popup.remove(), 300);
    }
};

async function loadRelatedProducts() {
    if (!currentProduct) return;
    
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("category", "==", currentProduct.category), limit(4));
    const snapshot = await getDocs(q);
    
    const products = [];
    snapshot.forEach(doc => {
        const product = { id: doc.id, ...doc.data() };
        if (product.id !== currentProduct.id) {
            products.push(product);
        }
    });
    
    const container = document.getElementById('relatedProducts');
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align:center">Không có sản phẩm liên quan</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="related-item" onclick="window.location.href='product-detail.html?id=${product.id}'">
            <img src="${product.image}" alt="${product.name}">
            <h4>${product.name}</h4>
            <div class="price">${product.price.toLocaleString()}đ</div>
        </div>
    `).join('');
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
    }
}

function initTabs() {
    const tabs = document.querySelectorAll('.tab-header');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(`tab-${tab.getAttribute('data-tab')}`).classList.add('active');
        });
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
    updateCartCount();
    checkLoginStatus();
    initTabs();
    initMobileMenu();
    await loadProductDetail();
});