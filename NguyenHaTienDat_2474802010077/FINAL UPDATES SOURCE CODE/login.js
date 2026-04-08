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

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email), where("password", "==", password));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            let userData;
            snapshot.forEach(doc => { userData = { id: doc.id, ...doc.data() }; });
            localStorage.setItem('loggedInUser', JSON.stringify(userData));
            showToastMessage('Đăng nhập thành công!', `Chào mừng ${userData.name}`, 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
        } else {
            showToastMessage('Đăng nhập thất bại', 'Sai email hoặc mật khẩu!', 'error');
        }
    } catch (error) {
        console.error("Lỗi:", error);
        showToastMessage('Lỗi hệ thống', 'Vui lòng thử lại sau!', 'error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    const loggedIn = localStorage.getItem('loggedInUser');
    if (loggedIn) { window.location.href = 'index.html'; }
});