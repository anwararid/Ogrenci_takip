```javascript
// ============================================
// StudyLoop
// Firebase Authentication + Firestore
// Final Stable Version
// ============================================

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


// ============================================
// Firebase Configuration
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDU3O5vBeN7sBA8hNTmAFofkTcWYS1YjsQ",
    authDomain: "ogrenci-ders-takibi-e7d57.firebaseapp.com",
    projectId: "ogrenci-ders-takibi-e7d57",
    storageBucket: "ogrenci-ders-takibi-e7d57.firebasestorage.app",
    messagingSenderId: "762782404099",
    appId: "1:762782404099:web:67ba2c4aff1e8230360836",
    measurementId: "G-GPDLXNL3GZ"
};


// ============================================
// Initialize Firebase
// ============================================

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);


// ============================================
// Application State
// ============================================

const state = {
    currentUser: null,
    lessons: [],
    subjects: []
};


// ============================================
// Helper: Get Element
// ============================================

function getElement(id) {
    return document.getElementById(id);
}


// ============================================
// DOM Elements
// ============================================

const authScreen = getElement("authScreen");
const appScreen = getElement("app");

const loginFormContainer =
    getElement("loginFormContainer");

const registerFormContainer =
    getElement("registerFormContainer");

const loginForm =
    getElement("loginForm");

const registerForm =
    getElement("registerForm");

const showRegisterButton =
    getElement("showRegisterButton");

const showLoginButton =
    getElement("showLoginButton");

const logoutButton =
    getElement("logoutButton");

const userName =
    getElement("userName");

const welcomeText =
    getElement("welcomeText");

const lessonModal =
    getElement("lessonModal");

const addLessonButton =
    getElement("addLessonButton");

const emptyAddButton =
    getElement("emptyAddButton");

const closeModalButton =
    getElement("closeModalButton");

const lessonForm =
    getElement("lessonForm");

const emptyState =
    getElement("emptyState");

const lessonsList =
    getElement("lessonsList");


// ============================================
// Check Required Elements
// ============================================

const requiredElements = {
    authScreen,
    appScreen,
    loginFormContainer,
    registerFormContainer,
    loginForm,
    registerForm,
    showRegisterButton,
    showLoginButton,
    logoutButton,
    userName,
    welcomeText,
    lessonModal,
    addLessonButton,
    emptyAddButton,
    closeModalButton,
    lessonForm,
    emptyState,
    lessonsList
};


for (const [name, element] of Object.entries(requiredElements)) {

    if (!element) {

        console.error(
            `StudyLoop: العنصر ${name} غير موجود في index.html`
        );

    }

}


// ============================================
// Authentication UI
// ============================================

function showLogin() {

    if (loginFormContainer) {
        loginFormContainer.hidden = false;
    }

    if (registerFormContainer) {
        registerFormContainer.hidden = true;
    }

}


function showRegister() {

    if (loginFormContainer) {
        loginFormContainer.hidden = true;
    }

    if (registerFormContainer) {
        registerFormContainer.hidden = false;
    }

}


// ============================================
// Register
// ============================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const nameInput =
                getElement("registerName");

            const emailInput =
                getElement("registerEmail");

            const passwordInput =
                getElement("registerPassword");


            if (
                !nameInput ||
                !emailInput ||
                !passwordInput
            ) {

                alert(
                    "حدث خطأ في نموذج إنشاء الحساب."
                );

                return;

            }


            const name =
                nameInput.value.trim();

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            if (!name) {

                alert(
                    "يرجى كتابة الاسم."
                );

                return;

            }


            if (!email) {

                alert(
                    "يرجى كتابة البريد الإلكتروني."
                );

                return;

            }


            if (password.length < 6) {

                alert(
                    "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
                );

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


                // حفظ الاسم في Authentication

                await updateProfile(
                    user,
                    {
                        displayName: name
                    }
                );


                // إنشاء ملف المستخدم في Firestore

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        name: name,
                        email: email,
                        createdAt: serverTimestamp()
                    }
                );


                registerForm.reset();


                alert(
                    "تم إنشاء الحساب بنجاح 🎉"
                );


            } catch (error) {

                console.error(
                    "CREATE ACCOUNT ERROR:",
                    error
                );

                showFirebaseError(error);

            }

        }
    );

}


// ============================================
// Login
// ============================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const emailInput =
                getElement("loginEmail");

            const passwordInput =
                getElement("loginPassword");


            if (
                !emailInput ||
                !passwordInput
            ) {

                alert(
                    "حدث خطأ في نموذج تسجيل الدخول."
                );

                return;

            }


            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            if (!email) {

                alert(
                    "يرجى كتابة البريد الإلكتروني."
                );

                return;

            }


            if (!password) {

                alert(
                    "يرجى كتابة كلمة المرور."
                );

                return;

            }


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                loginForm.reset();


            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );

                showFirebaseError(error);

            }

        }
    );

}


// ============================================
// Logout
// ============================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            try {

                await signOut(auth);

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

                alert(
                    "حدث خطأ أثناء تسجيل الخروج."
                );

            }

        }
    );

}


// ============================================
// Switch Login / Register
// ============================================

if (showRegisterButton) {

    showRegisterButton.addEventListener(
        "click",
        showRegister
    );

}


if (showLoginButton) {

    showLoginButton.addEventListener(
        "click",
        showLogin
    );

}


// ============================================
// Authentication State
// ============================================

onAuthStateChanged(
    auth,
    async function (user) {

        console.log(
            "Authentication state:",
            user ? user.email : "No user"
        );


        if (user) {

            state.currentUser = user;


            if (authScreen) {
                authScreen.hidden = true;
            }

            if (appScreen) {
                appScreen.hidden = false;
            }


            const name =
                user.displayName ||
                user.email.split("@")[0];


            if (userName) {
                userName.textContent = name;
            }


            if (welcomeText) {
                welcomeText.textContent =
                    `مرحبًا ${name} 👋`;
            }


            await loadSubjects();

            await loadLessons();


        } else {

            state.currentUser = null;

            state.lessons = [];

            state.subjects = [];


            if (authScreen) {
                authScreen.hidden = false;
            }

            if (appScreen) {
                appScreen.hidden = true;
            }

        }

    }
);


// ============================================
// Open Lesson Modal
// ============================================

function openLessonModal() {

    if (!lessonModal) {
        return;
    }

    lessonModal.hidden = false;

}


// ============================================
// Close Lesson Modal
// ============================================

function closeLessonModal() {

    if (!lessonModal) {
        return;
    }

    lessonModal.hidden = true;


    if (lessonForm) {
        lessonForm.reset();
    }

}


// ============================================
// Add Lesson
// ============================================

if (lessonForm) {

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


            const subjectInput =
                getElement("subjectName");

            const lessonInput =
                getElement("lessonName");

            const durationInput =
                getElement("studyDuration");


            if (
                !subjectInput ||
                !lessonInput ||
                !durationInput
            ) {

                alert(
                    "حدث خطأ في نموذج إضافة الدرس."
                );

                return;

            }


            const subject =
                subjectInput.value.trim();

            const name =
                lessonInput.value.trim();

            const duration =
                Number(durationInput.value);


            if (!subject) {

                alert(
                    "يرجى كتابة اسم المادة."
                );

                return;

            }


            if (!name) {

                alert(
                    "يرجى كتابة اسم الدرس."
                );

                return;

            }


            try {

                // ==================================
                // البحث عن المادة
                // ==================================

                const subjectQuery =
                    query(
                        collection(
                            db,
                            "subjects"
                        ),

                        where(
                            "userId",
                            "==",
                            state.currentUser.uid
                        ),

                        where(
                            "name",
                            "==",
                            subject
                        )
                    );


                const subjectSnapshot =
                    await getDocs(
                        subjectQuery
                    );


                let subjectId;


                // المادة موجودة

                if (
                    !subjectSnapshot.empty
                ) {

                    subjectId =
                        subjectSnapshot
                            .docs[0]
                            .id;

                }


                // المادة غير موجودة

                else {

                    const newSubject =
                        await addDoc(
                            collection(
                                db,
                                "subjects"
                            ),
                            {
                                userId:
                                    state.currentUser.uid,

                                name:
                                    subject,

                                createdAt:
                                    serverTimestamp()
                            }
                        );


                    subjectId =
                        newSubject.id;

                }


                // ==================================
                // إنشاء الدرس
                // ==================================

                await addDoc(
                    collection(
                        db,
                        "lessons"
                    ),
                    {

                        userId:
                            state.currentUser.uid,

                        subjectId:
                            subjectId,

                        subjectName:
                            subject,

                        name:
                            name,

                        duration:
                            duration,

                        createdAt:
                            serverTimestamp(),

                        lastStudiedAt:
                            null,

                        nextReviewAt:
                            serverTimestamp(),

                        reviewLevel:
                            0,

                        reviewCount:
                            0,

                        status:
                            "new"

                    }
                );


                closeLessonModal();


                await loadSubjects();

                await loadLessons();


                alert(
                    "تم حفظ الدرس بنجاح ✅"
                );


            } catch (error) {

                console.error(
                    "ADD LESSON ERROR:",
                    error
                );

                showFirebaseError(error);

            }

        }
    );

}


// ============================================
// Load Subjects
// ============================================

async function loadSubjects() {

    if (!state.currentUser) {
        return;
    }


    try {

        const subjectsQuery =
            query(
                collection(
                    db,
                    "subjects"
                ),

                where(
                    "userId",
                    "==",
                    state.currentUser.uid
                )
            );


        const snapshot =
            await getDocs(
                subjectsQuery
            );


        state.subjects = [];


        snapshot.forEach(
            function (subjectDocument) {

                state.subjects.push({

                    id:
                        subjectDocument.id,

                    ...subjectDocument.data()

                });

            }
        );


    } catch (error) {

        console.error(
            "LOAD SUBJECTS ERROR:",
            error
        );

        showFirebaseError(error);

    }

}


// ============================================
// Load Lessons
// ============================================

async function loadLessons() {

    if (!state.currentUser) {
        return;
    }


    try {

        const lessonsQuery =
            query(
                collection(
                    db,
                    "lessons"
                ),

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

        console.error(
            "LOAD LESSONS ERROR:",
            error
        );

        showFirebaseError(error);

    }

}


// ============================================
// Render Lessons
// ============================================

function renderLessons() {

    if (!emptyState || !lessonsList) {
        return;
    }


    if (
        state.lessons.length === 0
    ) {

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


            const subject =
                escapeHTML(
                    lesson.subjectName ||
                    "مادة"
                );


            const lessonName =
                escapeHTML(
                    lesson.name ||
                    "درس"
                );


            const duration =
                Number(
                    lesson.duration || 0
                );


            card.innerHTML = `

                <div>

                    <span class="lesson-subject">
                        ${subject}
                    </span>

                    <h4>
                        ${lessonName}
                    </h4>

                </div>

                <div
                    style="
                        margin-top: 12px;
                        display: flex;
                        gap: 15px;
                        flex-wrap: wrap;
                    "
                >

                    <span>
                        ⏱️ ${duration} دقيقة
                    </span>

                    <span>
                        ${getReviewStatusText(lesson)}
                    </span>

                </div>

                <button
                    class="start-lesson-button"
                    type="button"
                    data-id="${lesson.id}"
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


// ============================================
// Review Status
// ============================================

function getReviewStatusText(lesson) {

    if (
        lesson.status === "new"
    ) {

        return "🆕 درس جديد";

    }


    if (
        lesson.reviewLevel === 0
    ) {

        return "🔄 يحتاج مراجعة";

    }


    return (
        `🔄 مراجعة رقم ${lesson.reviewCount || 0}`
    );

}


// ============================================
// Start Lesson
// ============================================

if (lessonsList) {

    lessonsList.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".start-lesson-button"
                );


            if (!button) {
                return;
            }


            const lessonId =
                button.dataset.id;


            const lesson =
                state.lessons.find(
                    function (item) {

                        return (
                            item.id === lessonId
                        );

                    }
                );


            if (!lesson) {
                return;
            }


            alert(
                `سنبدأ جلسة دراسة: ${lesson.name}`
            );

        }
    );

}


// ============================================
// Modal Buttons
// ============================================

if (addLessonButton) {

    addLessonButton.addEventListener(
        "click",
        openLessonModal
    );

}


if (emptyAddButton) {

    emptyAddButton.addEventListener(
        "click",
        openLessonModal
    );

}


if (closeModalButton) {

    closeModalButton.addEventListener(
        "click",
        closeLessonModal
    );

}


if (lessonModal) {

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

}


// ============================================
// Escape Key
// ============================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            lessonModal &&
            !lessonModal.hidden
        ) {

            closeLessonModal();

        }

    }
);


// ============================================
// Escape HTML
// ============================================

function escapeHTML(value) {

    const element =
        document.createElement("div");


    element.textContent =
        value ?? "";


    return element.innerHTML;

}


// ============================================
// Firebase Errors
// ============================================

function showFirebaseError(error) {

    let message =
        "حدث خطأ. حاول مرة أخرى.";


    switch (error.code) {

        case "auth/invalid-email":

            message =
                "البريد الإلكتروني غير صحيح.";

            break;


        case "auth/user-not-found":

            message =
                "لا يوجد حساب بهذا البريد الإلكتروني.";

            break;


        case "auth/wrong-password":

            message =
                "كلمة المرور غير صحيحة.";

            break;


        case "auth/invalid-credential":

            message =
                "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

            break;


        case "auth/email-already-in-use":

            message =
                "هذا البريد الإلكتروني مستخدم بالفعل.";

            break;


        case "auth/weak-password":

            message =
                "كلمة المرور ضعيفة. يجب أن تكون 6 أحرف على الأقل.";

            break;


        case "auth/too-many-requests":

            message =
                "تمت محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.";

            break;


        case "auth/network-request-failed":

            message =
                "تعذر الاتصال بالإنترنت. تحقق من اتصالك.";

            break;


        case "permission-denied":

            message =
                "ليس لديك صلاحية للوصول إلى هذه البيانات.";

            break;


        case "failed-precondition":

            message =
                "Firestore يحتاج إلى إعداد إضافي.";

            break;

    }


    alert(message);

    console.error(
        "Firebase error code:",
        error.code
    );

    console.error(
        "Firebase error message:",
        error.message
    );

}
```
