```javascript
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


const firebaseApp =
    initializeApp(firebaseConfig);

const auth =
    getAuth(firebaseApp);

const db =
    getFirestore(firebaseApp);


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

const authScreen =
    $("authScreen");

const appScreen =
    $("app");

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


// ============================================================
// AUTH MESSAGE
// Creates a message area automatically.
// No need to modify index.html.
// ============================================================

function getAuthMessage() {

    let message =
        document.getElementById(
            "authMessage"
        );


    if (!message) {

        message =
            document.createElement(
                "div"
            );

        message.id =
            "authMessage";

        message.style.marginTop =
            "15px";

        message.style.padding =
            "11px 14px";

        message.style.borderRadius =
            "11px";

        message.style.fontSize =
            "13px";

        message.style.fontWeight =
            "700";

        message.style.display =
            "none";

        message.style.lineHeight =
            "1.7";


        const card =
            document.querySelector(
                ".auth-card"
            );


        if (card) {

            card.appendChild(
                message
            );

        }

    }


    return message;

}


function showAuthMessage(
    message,
    type = "error"
) {

    const element =
        getAuthMessage();


    if (!element) {
        return;
    }


    element.textContent =
        message;

    element.style.display =
        "block";


    if (type === "success") {

        element.style.background =
            "#ecfdf5";

        element.style.color =
            "#047857";

        element.style.border =
            "1px solid #a7f3d0";

    } else if (type === "info") {

        element.style.background =
            "#eff6ff";

        element.style.color =
            "#1d4ed8";

        element.style.border =
            "1px solid #bfdbfe";

    } else {

        element.style.background =
            "#fef2f2";

        element.style.color =
            "#b91c1c";

        element.style.border =
            "1px solid #fecaca";

    }

}


function hideAuthMessage() {

    const element =
        document.getElementById(
            "authMessage"
        );


    if (element) {

        element.style.display =
            "none";

    }

}


// ============================================================
// BUTTON LOADING
// ============================================================

function setButtonLoading(
    button,
    loading,
    normalText,
    loadingText
) {

    if (!button) {
        return;
    }


    button.disabled =
        loading;


    if (loading) {

        button.dataset.originalText =
            normalText;

        button.textContent =
            loadingText;

    } else {

        button.textContent =
            normalText;

    }

}


// ============================================================
// START
// ============================================================

console.log(
    "StudyLoop started successfully"
);


// ============================================================
// LOGIN / REGISTER SWITCHING
// ============================================================

if (showRegister) {

    showRegister.addEventListener(
        "click",
        function () {

            hideAuthMessage();

            loginContainer.hidden =
                true;

            registerContainer.hidden =
                false;

            const nameInput =
                $("registerName");

            if (nameInput) {

                setTimeout(
                    function () {

                        nameInput.focus();

                    },
                    100
                );

            }

        }
    );

}


if (showLogin) {

    showLogin.addEventListener(
        "click",
        function () {

            hideAuthMessage();

            registerContainer.hidden =
                true;

            loginContainer.hidden =
                false;

            const emailInput =
                $("loginEmail");

            if (emailInput) {

                setTimeout(
                    function () {

                        emailInput.focus();

                    },
                    100
                );

            }

        }
    );

}


// ============================================================
// REGISTER
// ============================================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideAuthMessage();


            const submitButton =
                registerForm.querySelector(
                    'button[type="submit"]'
                );


            const name =
                $("registerName")?.value.trim();

            const email =
                $("registerEmail")?.value
                    .trim()
                    .toLowerCase();

            const password =
                $("registerPassword")?.value;


            // --------------------------------------------
            // Validation
            // --------------------------------------------

            if (!name) {

                showAuthMessage(
                    "يرجى كتابة الاسم."
                );

                $("registerName")?.focus();

                return;

            }


            if (name.length < 2) {

                showAuthMessage(
                    "الاسم يجب أن يحتوي على حرفين على الأقل."
                );

                $("registerName")?.focus();

                return;

            }


            if (!email) {

                showAuthMessage(
                    "يرجى كتابة البريد الإلكتروني."
                );

                $("registerEmail")?.focus();

                return;

            }


            if (!password) {

                showAuthMessage(
                    "يرجى كتابة كلمة المرور."
                );

                $("registerPassword")?.focus();

                return;

            }


            if (password.length < 6) {

                showAuthMessage(
                    "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل."
                );

                $("registerPassword")?.focus();

                return;

            }


            // --------------------------------------------
            // Loading
            // --------------------------------------------

            setButtonLoading(
                submitButton,
                true,
                "إنشاء الحساب",
                "جارٍ إنشاء الحساب..."
            );


            try {

                console.log(
                    "Creating account..."
                );


                // ----------------------------------------
                // Create Firebase Auth account
                // ----------------------------------------

                const result =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    result.user;


                console.log(
                    "Account created:",
                    user.uid
                );


                // ----------------------------------------
                // Save display name
                // ----------------------------------------

                await updateProfile(
                    user,
                    {
                        displayName:
                            name
                    }
                );


                // ----------------------------------------
                // Save user in Firestore
                // ----------------------------------------

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {
                        name:
                            name,

                        email:
                            email,

                        createdAt:
                            serverTimestamp()
                    }
                );


                console.log(
                    "User saved in Firestore"
                );


                registerForm.reset();


                showAuthMessage(
                    "تم إنشاء حسابك بنجاح 🎉 جارٍ فتح حسابك...",
                    "success"
                );


                /*
                 * Firebase automatically signs the user in.
                 * onAuthStateChanged will therefore open
                 * the application automatically.
                 */


            } catch (error) {

                console.error(
                    "REGISTER ERROR:",
                    error
                );


                showAuthMessage(
                    getFirebaseErrorMessage(
                        error,
                        "register"
                    )
                );


            } finally {

                setButtonLoading(
                    submitButton,
                    false,
                    "إنشاء الحساب",
                    "جارٍ إنشاء الحساب..."
                );

            }

        }
    );

}


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            hideAuthMessage();


            const submitButton =
                loginForm.querySelector(
                    'button[type="submit"]'
                );


            const email =
                $("loginEmail")?.value
                    .trim()
                    .toLowerCase();

            const password =
                $("loginPassword")?.value;


            // --------------------------------------------
            // Validation
            // --------------------------------------------

            if (!email) {

                showAuthMessage(
                    "يرجى كتابة البريد الإلكتروني."
                );

                $("loginEmail")?.focus();

                return;

            }


            if (!password) {

                showAuthMessage(
                    "يرجى كتابة كلمة المرور."
                );

                $("loginPassword")?.focus();

                return;

            }


            // --------------------------------------------
            // Loading
            // --------------------------------------------

            setButtonLoading(
                submitButton,
                true,
                "تسجيل الدخول",
                "جارٍ تسجيل الدخول..."
            );


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


                showAuthMessage(
                    "تم تسجيل الدخول بنجاح ✓",
                    "success"
                );


                /*
                 * onAuthStateChanged handles
                 * opening the application.
                 */


            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                showAuthMessage(
                    getFirebaseErrorMessage(
                        error,
                        "login"
                    )
                );


            } finally {

                setButtonLoading(
                    submitButton,
                    false,
                    "تسجيل الدخول",
                    "جارٍ تسجيل الدخول..."
                );

            }

        }
    );

}


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "جارٍ الخروج...";


            try {

                await signOut(auth);

                console.log(
                    "Logged out"
                );


            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

                alert(
                    getFirebaseErrorMessage(
                        error
                    )
                );


                logoutButton.disabled =
                    false;

                logoutButton.textContent =
                    "تسجيل الخروج";

            }

        }
    );

}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async function (user) {

        console.log(
            "Auth state changed:",
            user
                ? user.email
                : "logged out"
        );


        if (user) {

            currentUser =
                user;


            // ----------------------------------------
            // Show application
            // ----------------------------------------

            if (authScreen) {

                authScreen.hidden =
                    true;

            }


            if (appScreen) {

                appScreen.hidden =
                    false;

            }


            // ----------------------------------------
            // User name
            // ----------------------------------------

            const name =
                user.displayName ||
                user.email
                    .split("@")[0];


            if (userName) {

                userName.textContent =
                    name;

            }


            if (welcomeText) {

                welcomeText.textContent =
                    `مرحبًا ${name} 👋`;

            }


            // ----------------------------------------
            // Load data
            // ----------------------------------------

            try {

                await loadSubjects();

                await loadLessons();

                updateStatistics();

            } catch (error) {

                console.error(
                    "INITIAL DATA ERROR:",
                    error
                );

            }


        } else {

            currentUser =
                null;

            lessons =
                [];

            subjects =
                [];


            if (authScreen) {

                authScreen.hidden =
                    false;

            }


            if (appScreen) {

                appScreen.hidden =
                    true;

            }

        }

    }
);


// ============================================================
// MODAL
// ============================================================

function openModal() {

    if (!lessonModal) {
        return;
    }


    lessonModal.hidden =
        false;


    setTimeout(
        function () {

            $("subjectName")?.focus();

        },
        100
    );

}


function closeModal() {

    if (lessonModal) {

        lessonModal.hidden =
            true;

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
                event.target ===
                lessonModal
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


// ============================================================
// ADD LESSON
// ============================================================

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


            const submitButton =
                lessonForm.querySelector(
                    'button[type="submit"]'
                );


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


            if (
                !duration ||
                duration < 1
            ) {

                alert(
                    "يرجى إدخال مدة صحيحة."
                );

                return;

            }


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "جارٍ الحفظ...";

            }


            try {

                // ----------------------------------------
                // Find subject
                // ----------------------------------------

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


                // ----------------------------------------
                // Add lesson
                // ----------------------------------------

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

                alert(
                    getFirebaseErrorMessage(
                        error
                    )
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "حفظ الدرس";

                }

            }

        }
    );

}


// ============================================================
// LOAD SUBJECTS
// ============================================================

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


        subjects =
            [];


        snapshot.forEach(
            function (item) {

                subjects.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );


    } catch (error) {

        console.error(
            "LOAD SUBJECTS ERROR:",
            error
        );

        throw error;

    }

}


// ============================================================
// LOAD LESSONS
// ============================================================

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


        lessons =
            [];


        snapshot.forEach(
            function (item) {

                lessons.push({

                    id:
                        item.id,

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

        throw error;

    }

}


// ============================================================
// RENDER LESSONS
// ============================================================

function renderLessons() {

    if (!lessonsList) {
        return;
    }


    if (
        lessons.length === 0
    ) {

        if (emptyState) {

            emptyState.hidden =
                false;

        }


        lessonsList.hidden =
            true;


        return;

    }


    if (emptyState) {

        emptyState.hidden =
            true;

    }


    lessonsList.hidden =
        false;


    lessonsList.innerHTML =
        "";


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
                    lesson.duration ||
                    0
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


            lessonsList.appendChild(
                card
            );

        }
    );

}


// ============================================================
// REVIEW TEXT
// ============================================================

function getReviewText(lesson) {

    if (
        lesson.status ===
        "new"
    ) {

        return "🆕 جديد";

    }


    return (
        `🔄 مراجعة ${lesson.reviewCount || 0}`
    );

}


// ============================================================
// START LESSON
// ============================================================

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

                        return (
                            item.id === id
                        );

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


// ============================================================
// STATISTICS
// ============================================================

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
                        lesson.status !==
                        "new"
                    );

                }
            ).length;

    }


    if (totalMinutes) {

        totalMinutes.textContent =
            lessons.reduce(
                function (
                    total,
                    lesson
                ) {

                    return (
                        total +
                        Number(
                            lesson.duration ||
                            0
                        )
                    );

                },
                0
            );

    }

}


// ============================================================
// HTML SECURITY
// ============================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// ============================================================
// FIREBASE ERROR TRANSLATION
// ============================================================

function getFirebaseErrorMessage(
    error,
    type = ""
) {

    console.error(
        "Firebase:",
        error
    );


    switch (error?.code) {

        case "auth/email-already-in-use":

            return (
                "هذا البريد الإلكتروني مستخدم بالفعل. جرّب تسجيل الدخول."
            );


        case "auth/invalid-email":

            return (
                "البريد الإلكتروني غير صحيح."
            );


        case "auth/invalid-credential":

            return (
                "البريد الإلكتروني أو كلمة المرور غير صحيحة."
            );


        case "auth/user-not-found":

            return (
                "لا يوجد حساب بهذا البريد الإلكتروني."
            );


        case "auth/wrong-password":

            return (
                "كلمة المرور غير صحيحة."
            );


        case "auth/weak-password":

            return (
                "كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل."
            );


        case "auth/too-many-requests":

            return (
                "تم إجراء محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا."
            );


        case "auth/network-request-failed":

            return (
                "تعذر الاتصال بالإنترنت. تأكد من اتصالك وحاول مجددًا."
            );


        case "auth/user-disabled":

            return (
                "هذا الحساب تم تعطيله."
            );


        case "auth/operation-not-allowed":

            return (
                "تسجيل الدخول بالبريد الإلكتروني غير مفعّل في Firebase."
            );


        case "permission-denied":

            return (
                "ليس لديك صلاحية للوصول إلى بيانات Firestore."
            );


        case "failed-precondition":

            return (
                "هناك إعداد ناقص في Firestore."
            );


        case "unavailable":

            return (
                "خدمة Firebase غير متاحة حاليًا. حاول مرة أخرى."
            );


        default:

            if (
                type === "login"
            ) {

                return (
                    "تعذر تسجيل الدخول. تأكد من البريد وكلمة المرور."
                );

            }


            if (
                type === "register"
            ) {

                return (
                    "تعذر إنشاء الحساب. تأكد من البيانات وحاول مرة أخرى."
                );

            }


            return (
                "حدث خطأ غير متوقع. حاول مرة أخرى."
            );

    }

}
```