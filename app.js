// ============================================================
// StudyLoop
// Authentication + Firestore
// Professional Version
// ============================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

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
} from
    "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyDU3O5vBeN7sBA8hNTmAFofkTcWYS1YjsQ",
    authDomain: "ogrenci-ders-takibi-e7d57.firebaseapp.com",
    projectId: "ogrenci-ders-takibi-e7d57",
    storageBucket: "ogrenci-ders-takibi-e7d57.firebasestorage.app",
    messagingSenderId: "762782404099",
    appId: "1:762782404099:web:67ba2c4aff1e8230360836",
    measurementId: "G-GPDLXNL3GZ"
};


const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);


// ============================================================
// STATE
// ============================================================

let currentUser = null;
let lessons = [];
let subjects = [];


// ============================================================
// HELPER
// ============================================================

function $(id) {
    return document.getElementById(id);
}


// ============================================================
// ELEMENTS
// ============================================================

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
// AUTH MESSAGE
// ============================================================

function getAuthMessage() {
    let message = document.getElementById("authMessage");

    if (!message) {
        message = document.createElement("div");
        message.id = "authMessage";
        message.style.marginTop = "15px";
        message.style.padding = "11px 14px";
        message.style.borderRadius = "11px";
        message.style.fontSize = "13px";
        message.style.fontWeight = "700";
        message.style.display = "none";
        message.style.lineHeight = "1.7";

        const card = document.querySelector(".auth-card");
        if (card) {
            card.appendChild(message);
        }
    }

    return message;
}


function showAuthMessage(message, type = "error") {
    const element = getAuthMessage();
    if (!element) return;

    element.textContent = message;
    element.style.display = "block";

    if (type === "success") {
        element.style.background = "#ecfdf5";
        element.style.color = "#047857";
        element.style.border = "1px solid #a7f3d0";
    } else if (type === "info") {
        element.style.background = "#eff6ff";
        element.style.color = "#1d4ed8";
        element.style.border = "1px solid #bfdbfe";
    } else {
        element.style.background = "#fef2f2";
        element.style.color = "#b91c1c";
        element.style.border = "1px solid #fecaca";
    }
}


function hideAuthMessage() {
    const element = document.getElementById("authMessage");
    if (element) {
        element.style.display = "none";
    }
}


// ============================================================
// BUTTON LOADING
// ============================================================

function setButtonLoading(button, loading, normalText, loadingText) {
    if (!button) return;
    button.disabled = loading;

    if (loading) {
        button.dataset.originalText = normalText;
        button.textContent = loadingText;
    } else {
        button.textContent = normalText;
    }
}


// ============================================================
// LOGIN / REGISTER SWITCHING
// ============================================================

if (showRegister) {
    showRegister.addEventListener("click", function () {
        hideAuthMessage();
        loginContainer.hidden = true;
        registerContainer.hidden = false;
        const nameInput = $("registerName");
        if (nameInput) setTimeout(() => nameInput.focus(), 100);
    });
}


if (showLogin) {
    showLogin.addEventListener("click", function () {
        hideAuthMessage();
        registerContainer.hidden = true;
        loginContainer.hidden = false;
        const emailInput = $("loginEmail");
        if (emailInput) setTimeout(() => emailInput.focus(), 100);
    });
}


// ============================================================
// REGISTER
// ============================================================

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        hideAuthMessage();

        const submitButton = registerForm.querySelector('button[type="submit"]');
        const name = $("registerName")?.value.trim();
        const email = $("registerEmail")?.value.trim().toLowerCase();
        const password = $("registerPassword")?.value;

        if (!name || name.length < 2) {
            showAuthMessage("يرجى كتابة اسم صحيح (حرفين على الأقل).");
            return;
        }

        if (!email) {
            showAuthMessage("يرجى كتابة البريد الإلكتروني.");
            return;
        }

        if (!password || password.length < 6) {
            showAuthMessage("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
            return;
        }

        setButtonLoading(submitButton, true, "إنشاء الحساب", "جارٍ إنشاء الحساب...");

        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            await updateProfile(user, { displayName: name });

            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                createdAt: serverTimestamp()
            });

            registerForm.reset();
            showAuthMessage("تم إنشاء حسابك بنجاح 🎉 جارٍ الدخول...", "success");

        } catch (error) {
            console.error("REGISTER ERROR:", error);
            showAuthMessage(getFirebaseErrorMessage(error, "register"));
        } finally {
            setButtonLoading(submitButton, false, "إنشاء الحساب", "جارٍ إنشاء الحساب...");
        }
    });
}


// ============================================================
// LOGIN (FIXED & FULLY IMPLEMENTED)
// ============================================================

// ============================================================
// LOGIN (تسجيل الدخول المعدل)
// ============================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // يمنع إعادة تحديث الصفحة

        const email = document.getElementById("loginEmail")?.value.trim().toLowerCase();
        const password = document.getElementById("loginPassword")?.value;

        if (!email || !password) {
            alert("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
            return;
        }

        try {
            // استدعاء دالة Firebase الحقيقية بدلاً من alert
            await signInWithEmailAndPassword(auth, email, password);
            loginForm.reset();
            alert("تم تسجيل الدخول بنجاح! 🎉");
        } catch (error) {
            console.error("LOGIN ERROR:", error);
            alert("حدث خطأ أثناء تسجيل الدخول: " + error.message);
        }
    });
}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {
    logoutButton.addEventListener("click", async function () {
        logoutButton.disabled = true;
        logoutButton.textContent = "جارٍ الخروج...";

        try {
            await signOut(auth);
        } catch (error) {
            console.error("LOGOUT ERROR:", error);
            alert(getFirebaseErrorMessage(error));
        } finally {
            logoutButton.disabled = false;
            logoutButton.textContent = "تسجيل الخروج";
        }
    });
}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(auth, async function (user) {
    if (user) {
        currentUser = user;

        if (authScreen) authScreen.hidden = true;
        if (appScreen) appScreen.hidden = false;

        const name = user.displayName || user.email.split("@")[0];

        if (userName) userName.textContent = name;
        if (welcomeText) welcomeText.textContent = `مرحبًا ${name} 👋`;

        try {
            await loadSubjects();
            await loadLessons();
            updateStatistics();
        } catch (error) {
            console.error("INITIAL DATA ERROR:", error);
        }

    } else {
        currentUser = null;
        lessons = [];
        subjects = [];

        if (authScreen) authScreen.hidden = false;
        if (appScreen) appScreen.hidden = true;
    }
});


// ============================================================
// MODAL & LESSONS LOGIC
// ============================================================

function openModal() {
    if (!lessonModal) return;
    lessonModal.hidden = false;
    setTimeout(() => $("subjectName")?.focus(), 100);
}

function closeModal() {
    if (lessonModal) lessonModal.hidden = true;
    if (lessonForm) lessonForm.reset();
}

if (addLessonButton) addLessonButton.addEventListener("click", openModal);
if (emptyAddButton) emptyAddButton.addEventListener("click", openModal);
if (closeModalButton) closeModalButton.addEventListener("click", closeModal);

if (lessonModal) {
    lessonModal.addEventListener("click", function (event) {
        if (event.target === lessonModal) closeModal();
    });
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && lessonModal && !lessonModal.hidden) {
        closeModal();
    }
});


// ============================================================
// ADD LESSON
// ============================================================

if (lessonForm) {
    lessonForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!currentUser) {
            alert("يجب تسجيل الدخول أولًا.");
            return;
        }

        const submitButton = lessonForm.querySelector('button[type="submit"]');
        const subject = $("subjectName")?.value.trim();
        const name = $("lessonName")?.value.trim();
        const duration = Number($("studyDuration")?.value);

        if (!subject || !name || !duration || duration < 1) {
            alert("يرجى ملء جميع الحقول بشكل صحيح.");
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "جارٍ الحفظ...";
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
                lastStudiedAt: null,
                nextReviewAt: serverTimestamp(),
                reviewLevel: 0,
                reviewCount: 0,
                status: "new"
            });

            closeModal();
            await loadSubjects();
            await loadLessons();
            updateStatistics();

        } catch (error) {
            console.error("ADD LESSON ERROR:", error);
            alert(getFirebaseErrorMessage(error));
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "حفظ الدرس";
            }
        }
    });
}


// ============================================================
// LOAD & RENDER
// ============================================================

async function loadSubjects() {
    if (!currentUser) return;
    const q = query(collection(db, "subjects"), where("userId", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    subjects = [];
    snapshot.forEach(item => subjects.push({ id: item.id, ...item.data() }));
}

async function loadLessons() {
    if (!currentUser) return;
    const q = query(collection(db, "lessons"), where("userId", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    lessons = [];
    snapshot.forEach(item => lessons.push({ id: item.id, ...item.data() }));
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

    lessons.forEach(function (lesson) {
        const card = document.createElement("div");
        card.className = "lesson-card";

        const subject = escapeHTML(lesson.subjectName || "مادة");
        const title = escapeHTML(lesson.name || "درس");
        const duration = Number(lesson.duration || 0);

        card.innerHTML = `
            <div>
                <span class="lesson-subject">${subject}</span>
                <h4>${title}</h4>
            </div>
            <div class="lesson-meta">
                <span>⏱️ ${duration} دقيقة</span>
                <span>${getReviewText(lesson)}</span>
            </div>
            <button type="button" class="start-lesson-button" data-id="${lesson.id}">
                ابدأ الدراسة
            </button>
        `;

        lessonsList.appendChild(card);
    });
}

function getReviewText(lesson) {
    if (lesson.status === "new") return "🆕 جديد";
    return `🔄 مراجعة ${lesson.reviewCount || 0}`;
}

function updateStatistics() {
    if ($("totalLessons")) $("totalLessons").textContent = lessons.length;
    if ($("totalSubjects")) $("totalSubjects").textContent = subjects.length;
    if ($("reviewLessons")) $("reviewLessons").textContent = lessons.filter(l => l.status !== "new").length;
    if ($("totalMinutes")) $("totalMinutes").textContent = lessons.reduce((acc, l) => acc + Number(l.duration || 0), 0);
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}


// ============================================================
// FIREBASE ERROR TRANSLATION
// ============================================================

function getFirebaseErrorMessage(error, type = "") {
    switch (error?.code) {
        case "auth/email-already-in-use":
            return "هذا البريد الإلكتروني مستخدم بالفعل. جرّب تسجيل الدخول.";
        case "auth/invalid-email":
            return "البريد الإلكتروني غير صحيح.";
        case "auth/invalid-credential":
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
        case "auth/user-not-found":
            return "لا يوجد حساب بهذا البريد الإلكتروني.";
        case "auth/wrong-password":
            return "كلمة المرور غير صحيحة.";
        case "auth/weak-password":
            return "كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.";
        case "auth/too-many-requests":
            return "تم إجراء محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.";
        case "auth/network-request-failed":
            return "تعذر الاتصال بالإنترنت. تأكد من اتصالك وحاول مجددًا.";
        default:
            return type === "login" ? "تعذر تسجيل الدخول. تأكد من البيانات." : "حدث خطأ غير متوقع. حاول مرة أخرى.";
    }
}
