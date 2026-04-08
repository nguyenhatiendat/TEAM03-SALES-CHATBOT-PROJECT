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

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function showToastMessage(title, message, type = 'error') {
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

function updateCartCount() {
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    const el = document.getElementById('cartCount');
    if (el) el.textContent = count;
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullname = document.getElementById('fullname').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const address = document.getElementById('address').value;
    if (password !== confirmPassword) {
        showToastMessage('Đăng ký thất bại', 'Mật khẩu xác nhận không khớp!', 'error');
        return;
    }
    if (password.length < 6) {
        showToastMessage('Đăng ký thất bại', 'Mật khẩu phải có ít nhất 6 ký tự!', 'error');
        return;
    }
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            showToastMessage('Đăng ký thất bại', 'Email đã được đăng ký!', 'error');
            return;
        }
        const newUser = {
            name: fullname, phone: phone, email: email, password: password, address: address,
            createdAt: new Date().toLocaleString('vi-VN')
        };
        await addDoc(collection(db, "users"), newUser);
        showToastMessage('Đăng ký thành công!', 'Vui lòng đăng nhập.', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    } catch (error) {
        console.error("Lỗi:", error);
        showToastMessage('Đăng ký thất bại', 'Có lỗi xảy ra, vui lòng thử lại!', 'error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    const loggedIn = localStorage.getItem('loggedInUser');
    if (loggedIn) { window.location.href = 'index.html'; }
});