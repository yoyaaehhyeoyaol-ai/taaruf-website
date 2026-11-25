
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    updateProfile
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

// إعدادات Firebase الخاصة بموقع TAARUF
const firebaseConfig = {
    apiKey: "AIzaSyDo1nZdpiUsx3glVHUf3o0Yqfq9spZD4Gs",
    authDomain: "taaruf-72985.firebaseapp.com",
    projectId: "taaruf-72985",
    storageBucket: "taaruf-72985.firebasestorage.app",
    messagingSenderId: "162693881912",
    appId: "1:162693881912:web:6f1c6d768b47c498adc6cd"
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const modal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");

let currentMode = "register";

function showMessage(text, success = false) {
    const message = document.getElementById("message");
    message.textContent = text;
    message.style.color = success ? "#8ee6ad" : "#ffc1c1";
}

function openAuth(type) {
    currentMode = type;
    updateAuth();
    modal.classList.add("active");
}

function closeAuth() {
    modal.classList.remove("active");
    authForm.reset();
    showMessage("");
}

function switchAuth() {
    currentMode =
        currentMode === "register" ? "login" : "register";

    updateAuth();
}

function updateAuth() {
    const registering = currentMode === "register";

    document.getElementById("modalTitle").textContent =
        registering ? "إنشاء حساب جديد" : "تسجيل الدخول";

    document.getElementById("modalDesc").textContent =
        registering ? "انضم إلى مجتمع تعارف" : "مرحباً بعودتك";

    [
        "nameField",
        "ageField",
        "countryField",
        "termsField"
    ].forEach(id => {
        document.getElementById(id).style.display =
            registering ? "block" : "none";
    });

    document.getElementById("submitBtn").textContent =
        registering ? "إنشاء الحساب" : "دخول";

    document.getElementById("switchText").textContent =
        registering ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟";

    document.getElementById("switchBtn").textContent =
        registering ? "تسجيل الدخول" : "إنشاء حساب";

    showMessage("");
}

async function registerUser() {
    const name = document.getElementById("userName").value.trim();
    const age = Number(document.getElementById("userAge").value);
    const country = document.getElementById("userCountry").value;
    const email = document.getElementById("userEmail").value.trim();
    const password = document.getElementById("userPassword").value;
    const terms = document.getElementById("agreeTerms").checked;

    if (!name || !country || !email || !password) {
        showMessage("يرجى تعبئة جميع الحقول.");
        return;
    }

    if (!Number.isInteger(age) || age < 18 || age > 100) {
        showMessage("التسجيل متاح للبالغين من 18 إلى 100 عام.");
        return;
    }

    if (password.length < 8) {
        showMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
        return;
    }

    if (!terms) {
        showMessage("يرجى الموافقة على شروط الاستخدام.");
        return;
    }

    const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    const user = credential.user;

    await updateProfile(user, {
        displayName: name
    });

    await setDoc(doc(db, "users", user.uid), {
        name: name,
        age: age,
        country: country,
        createdAt: serverTimestamp()
    });

    await sendEmailVerification(user);

    showMessage(
        "تم إنشاء حسابك بنجاح! أرسلنا رسالة تحقق إلى بريدك الإلكتروني.",
        true
    );

    authForm.reset();
}

async function loginUser() {
    const email = document.getElementById("userEmail").value.trim();
    const password = document.getElementById("userPassword").value;

    if (!email || !password) {
        showMessage("أدخل البريد الإلكتروني وكلمة المرور.");
        return;
    }

    await signInWithEmailAndPassword(auth, email, password);

    showMessage("تم تسجيل الدخول بنجاح!", true);
}

authForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const submitButton = document.getElementById("submitBtn");

    submitButton.disabled = true;
    submitButton.textContent = "يرجى الانتظار...";

    try {
        if (currentMode === "register") {
            await registerUser();
        } else {
            await loginUser();
        }
    } catch (error) {
        console.error(error);

        const errors = {
            "auth/email-already-in-use": "هذا البريد مسجل بالفعل.",
            "auth/invalid-email": "البريد الإلكتروني غير صحيح.",
            "auth/weak-password": "كلمة المرور ضعيفة.",
            "auth/invalid-credential": "البريد أو كلمة المرور غير صحيحة.",
            "auth/user-not-found": "لا يوجد حساب بهذا البريد.",
            "auth/network-request-failed": "تحقق من اتصال الإنترنت.",
            "permission-denied": "تعذر حفظ الملف الشخصي. راجع قواعد Firestore."
        };

        showMessage(
            errors[error.code] ||
            "حدث خطأ. حاول مرة أخرى."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent =
            currentMode === "register" ? "إنشاء الحساب" : "دخول";
    }
});

modal.addEventListener("click", function(event) {
    if (event.target === modal) {
        closeAuth();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeAuth();
    }
});

// إتاحة الأزرار الموجودة في صفحة HTML
window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.switchAuth = switchAuth;
