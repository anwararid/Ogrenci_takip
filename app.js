// ============================================================
// StudyLoop - Main Application Code
// Firebase Authentication & Firestore Database
// ============================================================
document.getElementById('authLoading')?.remove();
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDU3O5vBeN7sBA8hNTmAFofkTcWYS1YjsQ",
    authDomain: "ogrenci-ders-takibi-e7d57.firebaseapp.com",
    projectId: "ogrenci-ders-takibi-e7d57",
    storageBucket: "ogrenci-ders-takibi-e7d57.firebasestorage.app",
    messagingSenderId: "762782404099",
    appId: "1:762782404099:web:67ba2c4aff1e8230360836",
    measurementId: "G-GPDLXNL3GZ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// State Management
let currentUser = null;
let lessons = [];
let subjects = [];

// DOM Helper
const $ = (id) => document.getElementById(id);

// DOM Elements
const authScreen = $("authScreen");
const appScreen = $("app");
const loginContainer = $("loginFormContainer");
const registerContainer = $("registerFormContainer");
const loginForm = $("loginForm");
const registerForm = $("registerForm");
const showRegister = $("showRegisterButton");
const showLogin = $("showLoginButton");
const logoutButton = $("logoutButton");
const userName = $("userName");
const welcomeText = $("welcomeText");
const addLessonButton = $("addLessonButton");
const emptyAddButton = $("emptyAddButton");
const lessonModal = $("lessonModal");
const closeModalButton = $("closeModalButton");
const lessonForm = $("lessonForm");
const emptyState = $("emptyState");
const lessonsList = $("lessonsList");


// ============================================================
// AUTHENTICATION LOGIC (تسجيل الدخول وإنشاء الحساب)
// ============================================================

// التنقل بين شاشة تسجيل الدخول وإنشاء الحساب
if (showRegister) {
    showRegister.addEventListener("click", () => {
        if (loginContainer) loginContainer.hidden = true;
        if (registerContainer) registerContainer.hidden = false;
    });
}

if (showLogin) {
    showLogin.addEventListener("click", () => {
        if (registerContainer) registerContainer.hidden = true;
        if (loginContainer) loginContainer.hidden = false;
    });
}

// 1. إنشاء حساب جديد (REGISTER)
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = $("registerName")?.value.trim() || "";
        const email = $("registerEmail")?.value.trim().toLowerCase();
        const password = $("registerPassword")?.value;

        if (!email || !password) {
            alert("يرجى ملء جميع البيانات المطلوب.");
            return;
        }

        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            if (name) {
                await updateProfile(user, { displayName: name });
            }

            // حفظ بيانات المستخدم في Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: name || email.split("@")[0],
                email: email,
                createdAt: serverTimestamp()
            });

            registerForm.reset();
            alert("تم إنشاء الحساب بنجاح! 🎉");
        } catch (error) {
            console.error("خطأ في إنشاء الحساب:", error);
            alert("حدث خطأ في إنشاء الحساب: " + error.message);
        }
    });
}

// 2. تسجيل الدخول (LOGIN)
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = $("loginEmail")?.value.trim().toLowerCase();
        const password = $("loginPassword")?.value;

        if (!email || !password) {
            alert("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            loginForm.reset();
            alert("تم تسجيل الدخول بنجاح! 🚀");
        } catch (error) {
            console.error("خطأ في تسجيل الدخول:", error);
            alert("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        }
    });
}

// 3. تسجيل الخروج (LOGOUT)
if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            alert("تم تسجيل الخروج بنجاح.");
        } catch (error) {
            console.error("خطأ في تسجيل الخروج:", error);
        }
    });
}

// 4. مراقبة حالة المستخدِم (هل هو مسجّل دخول أم لا)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        if (authScreen) authScreen.hidden = true;
        if (appScreen) appScreen.hidden = false;

        const displayName = user.displayName || user.email.split("@")[0];
        if (userName) userName.textContent = displayName;
        if (welcomeText) welcomeText.textContent = `مرحبًا بك 👋 ${displayName}`;

        await loadSubjects();
        await loadLessons();
        updateStatistics();
    } else {
        currentUser = null;
        lessons = [];
        subjects = [];
        if (authScreen) authScreen.hidden = false;
        if (appScreen) appScreen.hidden = true;
    }
});


// ============================================================
// LESSONS MANAGEMENT (إدارة الدروس والمواد)
// ============================================================

function openModal() {
    if (lessonModal) lessonModal.hidden = false;
}

function closeModal() {
    if (lessonModal) lessonModal.hidden = true;
    if (lessonForm) lessonForm.reset();
}

if (addLessonButton) addLessonButton.addEventListener("click", openModal);
if (emptyAddButton) emptyAddButton.addEventListener("click", openModal);
if (closeModalButton) closeModalButton.addEventListener("click", closeModal);

// حفظ درس جديد
if (lessonForm) {
    lessonForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!currentUser) return;

        const subject = $("subjectName")?.value.trim();
        const name = $("lessonName")?.value.trim();
        const duration = Number($("studyDuration")?.value);

        if (!subject || !name || !duration) {
            alert("يرجى إكمال كل البيانات المطلوبة.");
            return;
        }

        try {
            const subjectQuery = query(
                collection(db, "subjects"),
                where("userId", "==", currentUser.uid),
                where("name", "==", subject)
            );

            const subjectSnapshot = await getDocs(subjectQuery);
            let subjectId;

            if (!subjectSnapshot.empty) {
                subjectId = subjectSnapshot.docs[0].id;
            } else {
                const newSubject = await addDoc(collection(db, "subjects"), {
                    userId: currentUser.uid,
                    name: subject,
                    createdAt: serverTimestamp()
                });
                subjectId = newSubject.id;
            }

            await addDoc(collection(db, "lessons"), {
                userId: currentUser.uid,
                subjectId: subjectId,
                subjectName: subject,
                name: name,
                duration: duration,
                createdAt: serverTimestamp(),
                reviewCount: 0,
                status: "new"
            });

            closeModal();
            await loadSubjects();
            await loadLessons();
            updateStatistics();
        } catch (error) {
            console.error("خطأ في حفظ الدرس:", error);
            alert("تعذر حفظ الدرس: " + error.message);
        }
    });
}

// جلب البيانات والعرض
async function loadSubjects() {
    if (!currentUser) return;
    const q = query(collection(db, "subjects"), where("userId", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function loadLessons() {
    if (!currentUser) return;
    const q = query(collection(db, "lessons"), where("userId", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderLessons();
}

function renderLessons() {
    if (!lessonsList) return;

    if (lessons.length === 0) {
        if (emptyState) emptyState.hidden = false;
        lessonsList.hidden = true;
        return;
    }

    if (emptyState) emptyState.hidden = true;
    lessonsList.hidden = false;
    lessonsList.innerHTML = "";

    lessons.forEach(lesson => {
        const card = document.createElement("div");
        card.className = "lesson-card";
        card.innerHTML = `
            <div>
                <span class="lesson-subject">${lesson.subjectName}</span>
                <h4>${lesson.name}</h4>
            </div>
            <div class="lesson-meta">
                <span>⏱️ ${lesson.duration} دقيقة</span>
                <span>${lesson.status === "new" ? "🆕 جديد" : "🔄 مراجعة"}</span>
            </div>
            <button type="button" class="start-lesson-button" data-id="${lesson.id}">ابدأ الدراسة</button>
        `;
        lessonsList.appendChild(card);
    });
}

function updateStatistics() {
    if ($("totalLessons")) $("totalLessons").textContent = lessons.length;
    if ($("totalSubjects")) $("totalSubjects").textContent = subjects.length;
    if ($("reviewLessons")) $("reviewLessons").textContent = lessons.filter(l => l.status !== "new").length;
    if ($("totalMinutes")) $("totalMinutes").textContent = lessons.reduce((acc, l) => acc + Number(l.duration || 0), 0);
}
