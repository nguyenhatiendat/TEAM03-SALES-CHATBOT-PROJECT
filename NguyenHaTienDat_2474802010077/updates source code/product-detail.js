import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    
    const rating = currentProduct.rating || 4.5;
    document.getElementById('detailRating').innerHTML = `${rating} (${Math.floor(rating * 10)} đánh giá)`;
    
    const stock = currentProduct.stock || 0;
    const stockInfo = document.getElementById('stockInfo');
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    const buyNowBtn = document.querySelector('.buy-now-btn');
    const quantityInput = document.getElementById('quantity');
    
    if (stockInfo) {
        if (stock <= 0) {
            stockInfo.style.background = '#ffebee';
            stockInfo.style.color = '#f44336';
            stockInfo.innerHTML = '<i class="fas fa-times-circle"></i> Sản phẩm đã hết hàng';
        } else if (stock < 10) {
            stockInfo.style.background = '#fff3e0';
            stockInfo.style.color = '#ff9800';
            stockInfo.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Chỉ còn ' + stock + ' sản phẩm! Đặt nhanh kẻo hết';
        } else {
            stockInfo.style.background = '#e8f5e9';
            stockInfo.style.color = '#4caf50';
            stockInfo.innerHTML = '<i class="fas fa-boxes"></i> Còn ' + stock + ' sản phẩm có sẵn';
        }
    }
    
    if (stock <= 0) {
        if (addToCartBtn) { addToCartBtn.disabled = true; addToCartBtn.style.background = '#ccc'; addToCartBtn.style.cursor = 'not-allowed'; }
        if (buyNowBtn) { buyNowBtn.disabled = true; buyNowBtn.style.background = '#ccc'; buyNowBtn.style.cursor = 'not-allowed'; }
        if (quantityInput) quantityInput.disabled = true;
    }
    
    document.getElementById('productDescription').innerText = currentProduct.description || 'Chất liệu cao cấp, thiết kế thanh lịch, phù hợp với nhiều hoàn cảnh.';
    document.getElementById('fullDescription').innerHTML = `
        <p>${currentProduct.description || 'Chất liệu cao cấp, thiết kế thanh lịch, phù hợp với nhiều hoàn cảnh.'}</p>
        <p style="margin-top:10px">✅ Chất liệu: Vải cao cấp, thấm hút mồ hôi tốt<br>✅ Thiết kế: Ôm sát, tôn dáng<br>✅ Bảo quản: Giặt máy ở chế độ nhẹ, không dùng bột giặt có chất tẩy mạnh</p>
    `;
    
    const mainImage = document.getElementById('mainImage');
    mainImage.src = currentProduct.image;
    mainImage.alt = currentProduct.name;
    
    const colors = currentProduct.colors || ['Đen', 'Trắng', 'Be', 'Xanh', 'Nâu'];
    const colorContainer = document.getElementById('colorOptions');
    colorContainer.innerHTML = colors.map(color => `<div class="color-option" style="background:${getColorCode(color)}" data-color="${color}" onclick="selectColor('${color}')" title="${color}"></div>`).join('');
    selectedColor = colors[0];
    document.querySelectorAll('.color-option')[0]?.classList.add('selected');
    
    const sizes = currentProduct.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
    const sizeContainer = document.getElementById('sizeOptions');
    sizeContainer.innerHTML = sizes.map(size => `<button class="size-option" data-size="${size}" onclick="selectSize('${size}')">${size}</button>`).join('');
    selectedSize = sizes[1] || sizes[0];
    const defaultSizeBtn = document.querySelector(`.size-option[data-size="${selectedSize}"]`);
    if (defaultSizeBtn) defaultSizeBtn.classList.add('selected');
}

function getColorCode(color) {
    const colorMap = {
        'Đen': '#1a1a1a', 'Trắng': '#ffffff', 'Be': '#f5f5dc', 'Xanh': '#2e5c6e',
        'Xanh dương': '#2e5c6e', 'Xanh lá': '#4caf50', 'Xanh mint': '#98ff98',
        'Xanh navy': '#000080', 'Xanh rêu': '#6b8e23', 'Nâu': '#8b5a2b',
        'Hồng': '#ff69b4', 'Đỏ': '#e74c3c', 'Xám': '#808080', 'Tím': '#8e44ad', 'Vàng': '#f1c40f'
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
    const stock = currentProduct?.stock || 0;
    const qtyInput = document.getElementById('quantity');
    let qty = parseInt(qtyInput.value) + change;
    if (qty < 1) qty = 1;
    if (qty > stock && stock > 0) qty = stock;
    if (qty > 99) qty = 99;
    qtyInput.value = qty;
};

window.addToCartDetail = function() {
    if (!currentProduct) return;
    const stock = currentProduct.stock || 0;
    const quantity = parseInt(document.getElementById('quantity').value);
    if (stock <= 0) { showToastMessage('Hết hàng', 'Sản phẩm này đã hết hàng!', 'error'); return; }
    if (quantity > stock) { showToastMessage('Số lượng không đủ', `Chỉ còn ${stock} sản phẩm trong kho!`, 'warning'); return; }
    const existingItem = cart.find(item => item.id === currentProduct.id && item.selectedColor === selectedColor && item.selectedSize === selectedSize);
    if (existingItem) {
        if (existingItem.quantity + quantity > stock) { showToastMessage('Số lượng không đủ', `Chỉ còn ${stock} sản phẩm trong kho!`, 'warning'); return; }
        existingItem.quantity += quantity;
    } else {
        cart.push({ id: currentProduct.id, name: currentProduct.name, price: currentProduct.price, image: currentProduct.image, quantity: quantity, selectedColor: selectedColor, selectedSize: selectedSize });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToastMessage('Thành công!', `Đã thêm ${quantity} ${currentProduct.name} vào giỏ hàng!`, 'success');
};

window.buyNow = function() { addToCartDetail(); setTimeout(() => { window.location.href = 'checkout.html'; }, 500); };

async function loadRelatedProducts() {
    if (!currentProduct) return;
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("category", "==", currentProduct.category), limit(4));
    const snapshot = await getDocs(q);
    const products = [];
    snapshot.forEach(doc => { const product = { id: doc.id, ...doc.data() }; if (product.id !== currentProduct.id) products.push(product); });
    const container = document.getElementById('relatedProducts');
    if (products.length === 0) { container.innerHTML = '<p style="text-align:center">Không có sản phẩm liên quan</p>'; return; }
    container.innerHTML = products.map(product => `<div class="related-item" onclick="window.location.href='product-detail.html?id=${product.id}'"><img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/300x400?text=3+Thần+Đằng'"><h4>${product.name}</h4><div class="price">${product.price.toLocaleString()}đ</div></div>`).join('');
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
        if (userIcon) userIcon.innerHTML = `<i class="far fa-user"></i><span style="font-size:12px;margin-left:5px;">${userData.name.split(' ').pop()}</span>`;
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
    if (toggle && menu) toggle.addEventListener('click', () => menu.classList.toggle('active'));
}

document.addEventListener('DOMContentLoaded', async () => {
    updateCartCount();
    checkLoginStatus();
    initTabs();
    initMobileMenu();
    await loadProductDetail();
});