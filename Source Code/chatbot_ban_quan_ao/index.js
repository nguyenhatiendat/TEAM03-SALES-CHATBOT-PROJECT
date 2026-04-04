import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const sampleProducts = [
    { id: "p1", name: "Áo thun nam cổ tròn", price: 289000, oldPrice: 399000, category: "nam", image: "https://picsum.photos/300/400?random=1", sizes: ["S","M","L","XL"], colors: ["Đen","Trắng"] },
    { id: "p2", name: "Quần jean nam ống rộng", price: 499000, oldPrice: 699000, category: "nam", image: "https://picsum.photos/300/400?random=2", sizes: ["28","30","32","34"], colors: ["Xanh","Đen"] },
    { id: "p3", name: "Đầm suông nữ công sở", price: 559000, oldPrice: 759000, category: "nu", image: "https://picsum.photos/300/400?random=3", sizes: ["S","M","L"], colors: ["Đen","Be"] },
    { id: "p4", name: "Áo len cổ lọ nữ", price: 489000, oldPrice: 689000, category: "nu", image: "https://picsum.photos/300/400?random=4", sizes: ["S","M","L","XL"], colors: ["Nâu","Đen"] },
    { id: "p5", name: "Áo thun bé trai", price: 189000, oldPrice: 279000, category: "tre-em", image: "https://picsum.photos/300/400?random=5", sizes: ["2-3T","4-5T","6-7T"], colors: ["Xanh","Đỏ"] },
    { id: "p6", name: "Mũ lưỡi trai unisex", price: 189000, oldPrice: 279000, category: "phu-kien", image: "https://picsum.photos/300/400?random=6", sizes: ["Free size"], colors: ["Đen","Trắng","Nâu"] },
    { id: "p7", name: "Sơ mi nam linen", price: 429000, oldPrice: 599000, category: "nam", image: "https://picsum.photos/300/400?random=7", sizes: ["S","M","L","XL"], colors: ["Trắng","Xanh"] },
    { id: "p8", name: "Váy hoa nhí nữ", price: 529000, oldPrice: 729000, category: "nu", image: "https://picsum.photos/300/400?random=8", sizes: ["S","M","L"], colors: ["Hồng","Vàng"] },
];

let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function initProducts() {
    const snapshot = await getDocs(collection(db, "products"));
    if (snapshot.empty) {
        for (const p of sampleProducts) await addDoc(collection(db, "products"), p);
        console.log("Đã tạo sản phẩm");
    }
}

async function getProducts(category = 'all', search = '') {
    let q = collection(db, "products");
    if (category !== 'all') q = query(collection(db, "products"), where("category", "==", category));
    const snapshot = await getDocs(q);
    let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (search) products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    return products;
}

async function displayProducts(category = 'all', search = '') {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading">Đang tải...</div>';
    const products = await getProducts(category, search);
    if (products.length === 0) { grid.innerHTML = '<div class="loading">Không có sản phẩm</div>'; return; }
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="viewProduct('${p.id}')">
            <div class="product-image">
                <img src="${p.image}" alt="${p.name}">
                <div class="product-actions">
                    <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${p.id}')">Thêm vào giỏ</button>
                </div>
            </div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price.toLocaleString()}đ ${p.oldPrice ? `<span class="product-old-price">${p.oldPrice.toLocaleString()}đ</span>` : ''}</div>
        </div>
    `).join('');
}

window.viewProduct = function(id) {
    window.location.href = `product-detail.html?id=${id}`;
};

function showPopup(productName, price) {
    let popup = document.getElementById('cartPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'cartPopup';
        popup.style.cssText = `position:fixed;bottom:30px;right:30px;background:white;border-radius:12px;box-shadow:0 5px 25px rgba(0,0,0,0.15);padding:20px;width:340px;z-index:10000;border-left:4px solid #b89a6e;transform:translateX(400px);transition:transform 0.3s ease;`;
        document.body.appendChild(popup);
    }
    popup.innerHTML = `<div style="display:flex;gap:15px;align-items:center;"><div style="background:#b89a6e;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;"><i class="fas fa-check" style="color:white;font-size:20px;"></i></div><div style="flex:1;"><p style="font-weight:600;margin-bottom:5px;">Đã thêm vào giỏ</p><p style="font-size:13px;">${productName}</p><p style="font-size:13px;color:#b89a6e;">${price.toLocaleString()}đ</p></div></div><div style="display:flex;gap:10px;margin-top:15px;"><a href="cart.html" style="flex:1;background:#1a1a1a;color:white;text-align:center;padding:10px;text-decoration:none;font-size:13px;border-radius:4px;">XEM GIỎ</a><button onclick="closePopup()" style="flex:1;background:#f0f0f0;border:none;padding:10px;cursor:pointer;border-radius:4px;">TIẾP TỤC</button></div>`;
    setTimeout(() => { popup.style.transform = 'translateX(0)'; }, 10);
    setTimeout(() => { if(popup) closePopup(); }, 4000);
}

window.closePopup = function() {
    const popup = document.getElementById('cartPopup');
    if (popup) { popup.style.transform = 'translateX(400px)'; setTimeout(() => popup.remove(), 300); }
};

window.addToCart = async function(productId) {
    const q = query(collection(db, "products"), where("id", "==", productId));
    const snapshot = await getDocs(q);
    let product;
    snapshot.forEach(doc => { product = { id: doc.id, ...doc.data() }; });
    if (!product) return;
    const exist = cart.find(i => i.id === productId);
    if (exist) exist.quantity++;
    else cart.push({ ...product, quantity: 1, selectedSize: product.sizes?.[0] || 'M', selectedColor: product.colors?.[0] || 'Đen' });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showPopup(product.name, product.price);
};

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
        if (userIcon) userIcon.innerHTML = `<i class="fas fa-user"></i><span style="font-size:12px;margin-left:5px;">${userData.name.split(' ').pop()}</span>`;
    }
}

function initFilters() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const search = document.getElementById('searchInput')?.value || '';
            await displayProducts(btn.getAttribute('data-category'), search);
        });
    });
}

function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', async () => {
            const activeTab = document.querySelector('.tab-btn.active');
            const category = activeTab?.getAttribute('data-category') || 'all';
            await displayProducts(category, searchInput.value);
        });
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const activeTab = document.querySelector('.tab-btn.active');
                const category = activeTab?.getAttribute('data-category') || 'all';
                await displayProducts(category, searchInput.value);
            }
        });
    }
}

function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu');
    const menu = document.querySelector('.nav-menu');
    if (toggle && menu) toggle.addEventListener('click', () => menu.classList.toggle('active'));
}

function initNavMenu() {
    document.querySelectorAll('.nav-menu a[data-category]').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const cat = link.getAttribute('data-category');
            document.querySelectorAll('.tab-btn').forEach(btn => {
                if (btn.getAttribute('data-category') === cat) {
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
            await displayProducts(cat, '');
            document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
            const menu = document.querySelector('.nav-menu');
            if (menu.classList.contains('active')) menu.classList.remove('active');
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await initProducts();
    await displayProducts('all', '');
    updateCartCount();
    checkLoginStatus();
    initFilters();
    initSearch();
    initMobileMenu();
    initNavMenu();
});