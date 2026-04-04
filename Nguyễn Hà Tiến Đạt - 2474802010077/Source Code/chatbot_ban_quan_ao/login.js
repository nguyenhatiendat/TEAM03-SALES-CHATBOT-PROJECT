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
            snapshot.forEach(doc => {
                userData = { id: doc.id, ...doc.data() };
            });
            localStorage.setItem('loggedInUser', JSON.stringify(userData));
            alert(`✅ Đăng nhập thành công! Chào mừng ${userData.name}`);
            window.location.href = 'index.html';
        } else {
            alert('❌ Sai email hoặc mật khẩu!');
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert('Có lỗi xảy ra, vui lòng thử lại!');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    // Kiểm tra nếu đã đăng nhập thì chuyển về trang chủ
    const loggedIn = localStorage.getItem('loggedInUser');
    if (loggedIn) {
        window.location.href = 'index.html';
    }
});