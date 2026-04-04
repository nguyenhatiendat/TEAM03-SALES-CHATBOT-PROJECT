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
        alert('❌ Mật khẩu xác nhận không khớp!');
        return;
    }
    
    if (password.length < 6) {
        alert('❌ Mật khẩu phải có ít nhất 6 ký tự!');
        return;
    }
    
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            alert('❌ Email đã được đăng ký!');
            return;
        }
        
        const newUser = {
            name: fullname,
            phone: phone,
            email: email,
            password: password,
            address: address,
            createdAt: new Date().toLocaleString('vi-VN')
        };
        
        await addDoc(collection(db, "users"), newUser);
        alert('✅ Đăng ký thành công! Vui lòng đăng nhập.');
        window.location.href = 'login.html';
        
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