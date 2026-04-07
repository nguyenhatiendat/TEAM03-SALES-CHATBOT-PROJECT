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
    { id: "p1", name: "Áo thun nam cổ tròn", price: 289000, oldPrice: 399000, category: "nam", image: "images/product1.jpg", sizes: ["S","M","L","XL","XXL"], colors: ["Đen","Trắng","Xám"], description: "Chất liệu cotton cao cấp, thoáng mát.", rating: 4.8, stock: 50 },
    { id: "p2", name: "Quần jean nam ống rộng", price: 499000, oldPrice: 699000, category: "nam", image: "images/product2.jpg", sizes: ["28","29","30","31","32","33","34","36"], colors: ["Xanh đen","Xanh nhạt","Đen"], description: "Quần jean form rộng, phong cách Hàn Quốc.", rating: 4.7, stock: 35 },
    { id: "p3", name: "Đầm suông nữ công sở", price: 559000, oldPrice: 759000, category: "nu", image: "images/product3.jpg", sizes: ["S","M","L","XL"], colors: ["Đen","Be","Hồng pastel"], description: "Đầm suông thanh lịch, phù hợp đi làm.", rating: 4.9, stock: 28 },
    { id: "p4", name: "Áo khoác chống UV", price: 588000, oldPrice: 788000, category: "nu", image: "images/product4.jpg", sizes: ["S","M","L","XL"], colors: ["Trắng","Be","Hồng"], description: "Áo khoác chống tia UV, ngăn chặn hơn 90% tia UV.", rating: 4.9, stock: 45 },
    { id: "p5", name: "Áo thun bé trai", price: 189000, oldPrice: 279000, category: "tre-em", image: "images/product5.jpg", sizes: ["2-3T","3-4T","4-5T","5-6T","6-7T","7-8T"], colors: ["Xanh dương","Đỏ","Xanh lá"], description: "Chất cotton mềm mại, an toàn cho da bé.", rating: 4.8, stock: 60 },
    { id: "p6", name: "Mũ lưỡi trai unisex", price: 189000, oldPrice: 279000, category: "phu-kien", image: "images/product6.jpg", sizes: ["Free size"], colors: ["Đen","Trắng","Nâu","Be"], description: "Mũ thời trang, phù hợp mọi outfit.", rating: 4.5, stock: 100 },
    { id: "p7", name: "Sơ mi nam linen", price: 429000, oldPrice: 599000, category: "nam", image: "images/product7.jpg", sizes: ["S","M","L","XL","XXL"], colors: ["Trắng","Xanh nhạt","Be"], description: "Sơ mi linen thoáng mát, phong cách công sở.", rating: 4.7, stock: 45 },
    { id: "p8", name: "Váy hoa nhí nữ", price: 529000, oldPrice: 729000, category: "nu", image: "images/product8.jpg", sizes: ["S","M","L"], colors: ["Hồng","Vàng","Xanh mint"], description: "Váy hoa nhí nữ tính, phù hợp dạo phố.", rating: 4.8, stock: 32 },
    { id: "p9", name: "Áo hoodie nam", price: 459000, oldPrice: 659000, category: "nam", image: "images/product9.jpg", sizes: ["S","M","L","XL","XXL"], colors: ["Đen","Xám","Navy"], description: "Áo hoodie dày dặn, form rộng.", rating: 4.9, stock: 42 },
    { id: "p10", name: "Quần tây nữ", price: 389000, oldPrice: 549000, category: "nu", image: "images/product10.jpg", sizes: ["S","M","L","XL"], colors: ["Đen","Trắng","Be","Nâu"], description: "Quần tây cao cấp, phù hợp công sở.", rating: 4.7, stock: 38 }
];

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'all';
let currentSearch = '';
let currentSize = 'all';
let currentPriceRange = 'all';
let swiperInstance = null;

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

async function initProducts() {
    try {
        const snapshot = await getDocs(collection(db, "products"));
        if (snapshot.empty) {
            for (const p of sampleProducts) await addDoc(collection(db, "products"), p);
            console.log("Đã tạo sản phẩm!");
        }
    } catch (error) { console.error("Lỗi init products:", error); }
}

async function getProducts() {
    let q = collection(db, "products");
    if (currentCategory !== 'all') q = query(collection(db, "products"), where("category", "==", currentCategory));
    const snapshot = await getDocs(q);
    let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (currentSearch) products = products.filter(p => p.name.toLowerCase().includes(currentSearch.toLowerCase()));
    if (currentSize !== 'all') products = products.filter(p => p.sizes && Array.isArray(p.sizes) && p.sizes.includes(currentSize));
    if (currentPriceRange !== 'all') {
        products = products.filter(p => {
            if (currentPriceRange === '0-200000') return p.price < 200000;
            if (currentPriceRange === '200000-500000') return p.price >= 200000 && p.price < 500000;
            if (currentPriceRange === '500000-1000000') return p.price >= 500000 && p.price < 1000000;
            if (currentPriceRange === '1000000-2000000') return p.price >= 1000000 && p.price < 2000000;
            if (currentPriceRange === '2000000+') return p.price >= 2000000;
            return true;
        });
    }
    return products;
}

async function displayProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading">Đang tải sản phẩm...</div>';
    const products = await getProducts();
    if (products.length === 0) { grid.innerHTML = '<div class="loading">Không có sản phẩm phù hợp</div>'; return; }
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="viewProduct('${p.id}')">
            <div class="product-image">
                <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/300x400?text=3+Thần+Đằng'">
                <div class="product-actions">
                    ${p.stock > 0 ? `<button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${p.id}')">Thêm vào giỏ</button>` : `<button class="btn-add-cart out-of-stock" disabled>Hết hàng</button>`}
                </div>
            </div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price.toLocaleString()}đ ${p.oldPrice ? `<span class="product-old-price">${p.oldPrice.toLocaleString()}đ</span>` : ''}</div>
            <div class="product-rating-stock"><span>⭐ ${p.rating || 4.5}</span><span>📦 ${p.stock > 0 ? `Còn ${p.stock} sp` : 'Hết hàng'}</span></div>
        </div>
    `).join('');
}

async function loadBannerSlider() {
    const products = await getProducts();
    const featuredProducts = products.slice(0, 5);
    
    const bannerHTML = featuredProducts.map((product) => `
        <div class="swiper-slide banner-slide" onclick="viewProduct('${product.id}')">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/800x500?text=3+Thần+Đằng'">
            <div class="banner-slide-content">
                <h3>${product.name}</h3>
                <p>${product.description || 'Chất liệu cao cấp, thiết kế thời trang'}</p>
                <div class="price">${product.price.toLocaleString()}đ</div>
                <button class="btn-view" onclick="event.stopPropagation(); viewProduct('${product.id}')">Xem ngay →</button>
            </div>
        </div>
    `).join('');
    
    const wrapper = document.getElementById('bannerSwiperWrapper');
    if (wrapper) {
        wrapper.innerHTML = bannerHTML;
        if (swiperInstance) swiperInstance.destroy(true, true);
        swiperInstance = new Swiper('.bannerSwiper', {
            loop: true,
            autoplay: { delay: 4000, disableOnInteraction: false },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            pagination: { el: '.swiper-pagination', clickable: true },
            effect: 'slide',
            speed: 800,
        });
    }
}

window.viewProduct = function(id) { window.location.href = `product-detail.html?id=${id}`; };

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
    if (product.stock <= 0) { showToastMessage('Hết hàng', `${product.name} đã hết hàng!`, 'error'); return; }
    const exist = cart.find(i => i.id === productId);
    if (exist) {
        if (exist.quantity + 1 > product.stock) { showToastMessage('Số lượng không đủ', `Chỉ còn ${product.stock} sản phẩm!`, 'warning'); return; }
        exist.quantity++;
    } else {
        cart.push({ ...product, quantity: 1, selectedSize: product.sizes?.[0] || 'M', selectedColor: product.colors?.[0] || 'Đen' });
    }
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
            currentCategory = btn.getAttribute('data-category');
            await displayProducts();
            await loadBannerSlider();
        });
    });
}

function initSizeFilters() {
    document.querySelectorAll('.size-filter-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.size-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSize = btn.getAttribute('data-size');
            await displayProducts();
            await loadBannerSlider();
        });
    });
}

function initPriceFilters() {
    document.querySelectorAll('.price-filter-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.price-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPriceRange = btn.getAttribute('data-price');
            await displayProducts();
            await loadBannerSlider();
        });
    });
}

function initResetFilters() {
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            currentSize = 'all';
            document.querySelectorAll('.size-filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.size-filter-btn[data-size="all"]')?.classList.add('active');
            currentPriceRange = 'all';
            document.querySelectorAll('.price-filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.price-filter-btn[data-price="all"]')?.classList.add('active');
            currentSearch = '';
            document.getElementById('searchInput').value = '';
            await displayProducts();
            await loadBannerSlider();
        });
    }
}

function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', async () => { currentSearch = searchInput.value; await displayProducts(); await loadBannerSlider(); });
        searchInput.addEventListener('keypress', async (e) => { if (e.key === 'Enter') { currentSearch = searchInput.value; await displayProducts(); await loadBannerSlider(); } });
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
            currentCategory = cat;
            await displayProducts();
            await loadBannerSlider();
            document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
            const menu = document.querySelector('.nav-menu');
            if (menu.classList.contains('active')) menu.classList.remove('active');
        });
    });
}

function initFooterAccordion() {
    document.querySelectorAll('.footer-col h4').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const allContents = document.querySelectorAll('.footer-col .footer-content');
            const allHeaders = document.querySelectorAll('.footer-col h4');
            allHeaders.forEach(h => {
                if (h !== header) {
                    h.classList.remove('active');
                    const otherContent = h.nextElementSibling;
                    if (otherContent) otherContent.classList.remove('show');
                }
            });
            header.classList.toggle('active');
            if (content) content.classList.toggle('show');
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await initProducts();
    await displayProducts();
    await loadBannerSlider();
    updateCartCount();
    checkLoginStatus();
    initFilters();
    initSizeFilters();
    initPriceFilters();
    initResetFilters();
    initSearch();
    initMobileMenu();
    initNavMenu();
    initFooterAccordion();
});