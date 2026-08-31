```javascript
// ============================================
// StudyLoop - app.js
// Firebase Authentication + Firestore
// ============================================

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


// ============================================
// Firebase
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

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);


// ============================================
// State
// ============================================

let currentUser = null;

let lessons = [];

let subjects = [];


// ============================================
// Helper
// ============================================

function $(id) {
    return document.getElementById(id);
}


// ============================================
// Elements
// ============================================

const authScreen = $("authScreen");

const appScreen = $("app");

const loginContainer =
    $("loginFormContainer");

const registerContainer =
    $("registerFormContainer");

const loginForm =
    $("loginForm");

const registerForm =
    $("registerForm");

const showRegister =
    $("showRegisterButton");

const showLogin =
    $("showLoginButton");

const logoutButton =
    $("logoutButton");

const userName =
    $("userName");

const welcomeText =
    $("welcomeText");

const addLessonButton =
    $("addLessonButton");

const emptyAddButton =
    $("emptyAddButton");

const lessonModal =
    $("lessonModal");

const closeModalButton =
    $("closeModalButton");

const lessonForm =
    $("lessonForm");

const emptyState =
    $("emptyState");

const lessonsList =
    $("lessonsList");


// ============================================
// Start
// ============================================

console.log("StudyLoop started");


// ============================================
// Login / Register switching
// ============================================

if (showRegister) {

    showRegister.addEventListener(
        "click",
        function () {

            loginContainer.hidden = true;

            registerContainer.hidden = false;

        }
    );

}


if (showLogin) {

    showLogin.addEventListener(
        "click",
        function () {

            registerContainer.hidden = true;

            loginContainer.hidden = false;

        }
    );

}


// ============================================
// REGISTER
// ============================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            console.log("Register button clicked");


            const name =
                $("registerName")?.value.trim();

            const email =
                $("registerEmail")?.value.trim();

            const password =
                $("registerPassword")?.value;


            if (!name) {

                alert("يرجى كتابة الاسم.");

                return;

            }


            if (!email) {

                alert("يرجى كتابة البريد الإلكتروني.");

                return;

            }


            if (!password) {

                alert("يرجى كتابة كلمة المرور.");

                return;

            }


            if (password.length < 6) {

                alert(
                    "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل."
                );

                return;

            }


            try {

                console.log(
                    "Creating Firebase account..."
                );


                const result =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    result.user;


                console.log(
                    "Firebase account created:",
                    user.uid
                );


                // حفظ اسم المستخدم

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
                    "REGISTER ERROR:",
                    error
                );

                showError(error);

            }

        }
    );

}


// ============================================
// LOGIN
// ============================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            console.log("Login button clicked");


            const email =
                $("loginEmail")?.value.trim();

            const password =
                $("loginPassword")?.value;


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

                console.log(
                    "Signing in..."
                );


                const result =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                console.log(
                    "Login successful:",
                    result.user.uid
                );


                loginForm.reset();


            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );

                showError(error);

            }

        }
    );

}


// ============================================
// LOGOUT
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
// Firebase Authentication State
// ============================================

onAuthStateChanged(
    auth,
    async function (user) {

        console.log(
            "Auth state:",
            user
                ? user.email
                : "logged out"
        );


        if (user) {

            currentUser = user;


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

            updateStatistics();


        } else {

            currentUser = null;

            lessons = [];

            subjects = [];


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
// Add Lesson Modal
// ============================================

function openModal() {

    if (lessonModal) {

        lessonModal.hidden = false;

    }

}


function closeModal() {

    if (lessonModal) {

        lessonModal.hidden = true;

    }


    if (lessonForm) {

        lessonForm.reset();

    }

}


if (addLessonButton) {

    addLessonButton.addEventListener(
        "click",
        openModal
    );

}


if (emptyAddButton) {

    emptyAddButton.addEventListener(
        "click",
        openModal
    );

}


if (closeModalButton) {

    closeModalButton.addEventListener(
        "click",
        closeModal
    );

}


if (lessonModal) {

    lessonModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === lessonModal
            ) {

                closeModal();

            }

        }
    );

}


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            lessonModal &&
            !lessonModal.hidden
        ) {

            closeModal();

        }

    }
);


// ============================================
// ADD LESSON
// ============================================

if (lessonForm) {

    lessonForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentUser) {

                alert(
                    "يجب تسجيل الدخول أولًا."
                );

                return;

            }


            const subject =
                $("subjectName")?.value.trim();

            const name =
                $("lessonName")?.value.trim();

            const duration =
                Number(
                    $("studyDuration")?.value
                );


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

                // البحث عن المادة

                const subjectQuery =
                    query(
                        collection(
                            db,
                            "subjects"
                        ),

                        where(
                            "userId",
                            "==",
                            currentUser.uid
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


                if (
                    !subjectSnapshot.empty
                ) {

                    subjectId =
                        subjectSnapshot
                            .docs[0]
                            .id;

                } else {

                    const newSubject =
                        await addDoc(
                            collection(
                                db,
                                "subjects"
                            ),
                            {
                                userId:
                                    currentUser.uid,

                                name:
                                    subject,

                                createdAt:
                                    serverTimestamp()
                            }
                        );


                    subjectId =
                        newSubject.id;

                }


                // إنشاء الدرس

                await addDoc(
                    collection(
                        db,
                        "lessons"
                    ),
                    {

                        userId:
                            currentUser.uid,

                        subjectId:
                            subjectId,

                        subjectName:
                            subject,

                        name:
                            name,

                        duration:
                            duration || 45,

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


                closeModal();


                await loadSubjects();

                await loadLessons();

                updateStatistics();


                alert(
                    "تم حفظ الدرس بنجاح ✅"
                );


            } catch (error) {

                console.error(
                    "ADD LESSON ERROR:",
                    error
                );

                showError(error);

            }

        }
    );

}


// ============================================
// LOAD SUBJECTS
// ============================================

async function loadSubjects() {

    if (!currentUser) {
        return;
    }


    try {

        const q =
            query(
                collection(
                    db,
                    "subjects"
                ),

                where(
                    "userId",
                    "==",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(q);


        subjects = [];


        snapshot.forEach(
            function (item) {

                subjects.push({

                    id: item.id,

                    ...item.data()

                });

            }
        );


    } catch (error) {

        console.error(
            "LOAD SUBJECTS ERROR:",
            error
        );

    }

}


// ============================================
// LOAD LESSONS
// ============================================

async function loadLessons() {

    if (!currentUser) {
        return;
    }


    try {

        const q =
            query(
                collection(
                    db,
                    "lessons"
                ),

                where(
                    "userId",
                    "==",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(q);


        lessons = [];


        snapshot.forEach(
            function (item) {

                lessons.push({

                    id: item.id,

                    ...item.data()

                });

            }
        );


        renderLessons();


    } catch (error) {

        console.error(
            "LOAD LESSONS ERROR:",
            error
        );

        showError(error);

    }

}


// ============================================
// RENDER LESSONS
// ============================================

function renderLessons() {

    if (!lessonsList) {
        return;
    }


    if (
        lessons.length === 0
    ) {

        if (emptyState) {
            emptyState.hidden = false;
        }

        lessonsList.hidden = true;

        return;

    }


    if (emptyState) {
        emptyState.hidden = true;
    }


    lessonsList.hidden = false;


    lessonsList.innerHTML = "";


    lessons.forEach(
        function (lesson) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "lesson-card";


            const subject =
                escapeHTML(
                    lesson.subjectName ||
                    "مادة"
                );


            const title =
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
                        ${title}
                    </h4>

                </div>

                <div class="lesson-meta">

                    <span>
                        ⏱️ ${duration} دقيقة
                    </span>

                    <span>
                        ${getReviewText(lesson)}
                    </span>

                </div>

                <button
                    type="button"
                    class="start-lesson-button"
                    data-id="${lesson.id}"
                >
                    ابدأ الدراسة
                </button>

            `;


            lessonsList.appendChild(card);

        }
    );

}


// ============================================
// REVIEW TEXT
// ============================================

function getReviewText(lesson) {

    if (
        lesson.status === "new"
    ) {

        return "🆕 جديد";

    }


    return (
        `🔄 مراجعة ${lesson.reviewCount || 0}`
    );

}


// ============================================
// START LESSON
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


            const id =
                button.dataset.id;


            const lesson =
                lessons.find(
                    function (item) {

                        return item.id === id;

                    }
                );


            if (!lesson) {
                return;
            }


            alert(
                `📚 ${lesson.name}\n\nجلسة الدراسة ستتم إضافتها في المرحلة القادمة.`
            );

        }
    );

}


// ============================================
// STATISTICS
// ============================================

function updateStatistics() {

    const totalLessons =
        $("totalLessons");

    const totalSubjects =
        $("totalSubjects");

    const reviewLessons =
        $("reviewLessons");

    const totalMinutes =
        $("totalMinutes");


    if (totalLessons) {

        totalLessons.textContent =
            lessons.length;

    }


    if (totalSubjects) {

        totalSubjects.textContent =
            subjects.length;

    }


    if (reviewLessons) {

        reviewLessons.textContent =
            lessons.filter(
                function (lesson) {

                    return (
                        lesson.status !== "new"
                    );

                }
            ).length;

    }


    if (totalMinutes) {

        totalMinutes.textContent =
            lessons.reduce(
                function (total, lesson) {

                    return (
                        total +
                        Number(
                            lesson.duration || 0
                        )
                    );

                },
                0
            );

    }

}


// ============================================
// HTML Security
// ============================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// ============================================
// Firebase Error Handler
// ============================================

function showError(error) {

    console.error(
        "Firebase error:",
        error
    );


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


        case "auth/weak-password":

            message =
                "كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.";

            break;


        case "auth/too-many-requests":

            message =
                "محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا.";

            break;


        case "auth/network-request-failed":

            message =
                "تعذر الاتصال بالإنترنت.";

            break;


        case "permission-denied":

            message =
                "ليس لديك صلاحية للوصول إلى البيانات.";

            break;


        case "failed-precondition":

            message =
                "هناك إعداد ناقص في Firestore.";

            break;

    }


    alert(message);

}
```