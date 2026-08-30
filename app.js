// ========================================
// StudyLoop
// Firebase Authentication + Firestore
// ========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

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
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ========================================
// Firebase Configuration
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyDU3O5vBeN7sBA8hNTmAFofkTcWYS1YjsQ",
    authDomain: "ogrenci-ders-takibi-e7d57.firebaseapp.com",
    projectId: "ogrenci-ders-takibi-e7d57",
    storageBucket: "ogrenci-ders-takibi-e7d57.firebasestorage.app",
    messagingSenderId: "762782404099",
    appId: "1:762782404099:web:67ba2c4aff1e8230360836",
    measurementId: "G-GPDLXNL3GZ"
};


// ========================================
// Initialize Firebase
// ========================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ========================================
// State
// ========================================

const state = {
    lessons: [],
    currentUser: null
};


// ========================================
// DOM Elements
// ========================================

const authScreen =
    document.getElementById("authScreen");

const appScreen =
    document.getElementById("app");


const loginFormContainer =
    document.getElementById("loginFormContainer");

const registerFormContainer =
    document.getElementById("registerFormContainer");


const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");


const showRegisterButton =
    document.getElementById("showRegisterButton");

const showLoginButton =
    document.getElementById("showLoginButton");


const logoutButton =
    document.getElementById("logoutButton");


const userName =
    document.getElementById("userName");

const welcomeText =
    document.getElementById("welcomeText");


const lessonModal =
    document.getElementById("lessonModal");

const addLessonButton =
    document.getElementById("addLessonButton");

const emptyAddButton =
    document.getElementById("emptyAddButton");

const closeModalButton =
    document.getElementById("closeModalButton");

const lessonForm =
    document.getElementById("lessonForm");

const emptyState =
    document.getElementById("emptyState");

const lessonsList =
    document.getElementById("lessonsList");


// ========================================
// Authentication Screen
// ========================================

function showLogin() {

    loginFormContainer.hidden = false;

    registerFormContainer.hidden = true;

}


function showRegister() {

    loginFormContainer.hidden = true;

    registerFormContainer.hidden = false;

}


// ========================================
// Register
// ========================================

registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const name =
            document
                .getElementById("registerName")
                .value
                .trim();


        const email =
            document
                .getElementById("registerEmail")
                .value
                .trim();


        const password =
            document
                .getElementById("registerPassword")
                .value;


        if (!name || !email || !password) {

            alert("يرجى تعبئة جميع الحقول.");

            return;
        }


        try {

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential.user;


            // حفظ اسم المستخدم في Authentication

            await updateProfile(
                user,
                {
                    displayName: name
                }
            );


            // إنشاء ملف المستخدم في Firestore

            await setDoc(
                doc(db, "users", user.uid),
                {
                    name: name,
                    email: email,
                    createdAt: serverTimestamp()
                }
            );


            alert(
                "تم إنشاء الحساب بنجاح 🎉"
            );


            registerForm.reset();


        } catch (error) {

            console.error(error);

            showFirebaseError(error);

        }

    }
);


// ========================================
// Login
// ========================================

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();


        const password =
            document
                .getElementById("loginPassword")
                .value;


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            loginForm.reset();


        } catch (error) {

            console.error(error);

            showFirebaseError(error);

        }

    }
);


// ========================================
// Logout
// ========================================

logoutButton.addEventListener(
    "click",
    async function () {

        try {

            await signOut(auth);

        } catch (error) {

            console.error(error);

            alert(
                "حدث خطأ أثناء تسجيل الخروج."
            );

        }

    }
);


// ========================================
// Switch Auth Forms
// ========================================

showRegisterButton.addEventListener(
    "click",
    showRegister
);


showLoginButton.addEventListener(
    "click",
    showLogin
);


// ========================================
// Firebase Authentication State
// ========================================

onAuthStateChanged(
    auth,
    async function (user) {

        if (user) {

            state.currentUser = user;


            // إظهار التطبيق

            authScreen.hidden = true;

            appScreen.hidden = false;


            // عرض اسم المستخدم

            const name =
                user.displayName ||
                user.email.split("@")[0];


            userName.textContent =
                name;


            welcomeText.textContent =
                `مرحبًا ${name} 👋`;


            // تحميل دروس المستخدم

            await loadLessons();

        } else {

            state.currentUser = null;

            authScreen.hidden = false;

            appScreen.hidden = true;

            state.lessons = [];

        }

    }
);


// ========================================
// Open Lesson Modal
// ========================================

function openLessonModal() {

    lessonModal.hidden = false;

}


// ========================================
// Close Lesson Modal
// ========================================

function closeLessonModal() {

    lessonModal.hidden = true;

    lessonForm.reset();

}


// ========================================
// Add Lesson
// ========================================

lessonForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (!state.currentUser) {

            alert(
                "يجب تسجيل الدخول أولًا."
            );

            return;
        }


        const subject =
            document
                .getElementById("subjectName")
                .value
                .trim();


        const name =
            document
                .getElementById("lessonName")
                .value
                .trim();


        const duration =
            Number(
                document
                    .getElementById("studyDuration")
                    .value
            );


        if (!subject || !name) {

            alert(
                "يرجى تعبئة جميع الحقول."
            );

            return;
        }


        try {

            await addDoc(
                collection(db, "lessons"),
                {

                    userId:
                        state.currentUser.uid,

                    subject:
                        subject,

                    name:
                        name,

                    duration:
                        duration,

                    createdAt:
                        serverTimestamp(),

                    nextReview:
                        serverTimestamp()

                }
            );


            closeLessonModal();


            await loadLessons();


            alert(
                "تم حفظ الدرس بنجاح ✅"
            );


        } catch (error) {

            console.error(error);

            showFirebaseError(error);

        }

    }
);


// ========================================
// Load User Lessons
// ========================================

async function loadLessons() {

    if (!state.currentUser) {
        return;
    }


    try {

        const lessonsQuery =
            query(
                collection(db, "lessons"),
                where(
                    "userId",
                    "==",
                    state.currentUser.uid
                )
            );


        const snapshot =
            await getDocs(
                lessonsQuery
            );


        state.lessons = [];


        snapshot.forEach(
            function (lessonDocument) {

                state.lessons.push({

                    id:
                        lessonDocument.id,

                    ...lessonDocument.data()

                });

            }
        );


        renderLessons();


    } catch (error) {

        console.error(error);

        showFirebaseError(error);

    }

}


// ========================================
// Render Lessons
// ========================================

function renderLessons() {

    if (state.lessons.length === 0) {

        emptyState.hidden = false;

        lessonsList.hidden = true;

        return;

    }


    emptyState.hidden = true;

    lessonsList.hidden = false;

    lessonsList.innerHTML = "";


    state.lessons.forEach(
        function (lesson) {

            const card =
                document.createElement("div");


            card.className =
                "lesson-card";


            card.innerHTML = `

                <div>

                    <span class="lesson-subject">
                        ${escapeHTML(lesson.subject)}
                    </span>

                    <h4>
                        ${escapeHTML(lesson.name)}
                    </h4>

                </div>

                <div style="margin-top: 12px;">
                    ⏱️ ${lesson.duration} دقيقة
                </div>

                <button
                    class="start-lesson-button"
                    type="button"
                    style="
                        margin-top: 15px;
                        padding: 10px 15px;
                        border-radius: 10px;
                        background: #5b5bd6;
                        color: white;
                        border: none;
                        cursor: pointer;
                    "
                >
                    ابدأ الدراسة
                </button>

            `;


            lessonsList.appendChild(card);

        }
    );

}


// ========================================
// Escape HTML
// ========================================

function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent =
        value ?? "";

    return element.innerHTML;

}


// ========================================
// Modal Events
// ========================================

addLessonButton.addEventListener(
    "click",
    openLessonModal
);


emptyAddButton.addEventListener(
    "click",
    openLessonModal
);


closeModalButton.addEventListener(
    "click",
    closeLessonModal
);


lessonModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target === lessonModal
        ) {

            closeLessonModal();

        }

    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeLessonModal();

        }

    }
);


// ========================================
// Firebase Error Messages
// ========================================

function showFirebaseError(error) {

    let message =
        "حدث خطأ. حاول مرة أخرى.";


    switch (error.code) {

        case "auth/email-already-in-use":

            message =
                "هذا البريد الإلكتروني مستخدم بالفعل.";

            break;


        case "auth/invalid-email":

            message =
                "البريد الإلكتروني غير صحيح.";

            break;


        case "auth/weak-password":

            message =
                "كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.";

            break;


        case "auth/invalid-credential":

            message =
                "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

            break;


        case "auth/user-not-found":

            message =
                "لا يوجد حساب بهذا البريد الإلكتروني.";

            break;


        case "auth/wrong-password":

            message =
                "كلمة المرور غير صحيحة.";

            break;

    }


    alert(message);

}
```
