import {
    auth,
    db,

    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,

    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc
} from "./firebase-config.js";


// =========================================================
// DOM
// =========================================================

const $ = (id) => document.getElementById(id);

const authScreen = $("authScreen");
const appScreen = $("app");

const loginFormContainer = $("loginFormContainer");
const registerFormContainer = $("registerFormContainer");

const showRegisterButton = $("showRegisterButton");
const showLoginButton = $("showLoginButton");

const loginForm = $("loginForm");
const registerForm = $("registerForm");

const logoutButton = $("logoutButton");

const userNameSpan = $("sidebarUserName");
const welcomeText = $("welcomeText");

const totalLessonsEl = $("totalLessons");
const totalSubjectsEl = $("totalSubjects");
const totalMinutesEl = $("totalMinutes");
const reviewLessonsEl = $("reviewLessons");

const todayMinutesEl = $("todayMinutes");
const todayProgressEl = $("todayProgress");
const focusMessageEl = $("focusMessage");

const lessonsList = $("lessonsList");
const lessonsEmptyState = $("lessonsEmptyState");

const reviewList = $("reviewList");
const reviewBadge = $("reviewBadge");
const reviewCountLarge = $("reviewCountLarge");
const reviewHeroTitle = $("reviewHeroTitle");
const reviewHeroText = $("reviewHeroText");

const recentLessons = $("recentLessons");

const lessonModal = $("lessonModal");
const lessonForm = $("lessonForm");
const lessonModalTitle = $("lessonModalTitle");
const editingLessonId = $("editingLessonId");

const subjectName = $("subjectName");
const lessonName = $("lessonName");
const studyDuration = $("studyDuration");
const reviewDate = $("reviewDate");

const closeModalButton = $("closeModalButton");
const cancelModalButton = $("cancelModalButton");

const saveLessonText = $("saveLessonText");

const profileModal = $("profileModal");
const profileForm = $("profileForm");
const profileName = $("profileName");
const profileEmail = $("profileEmail");

const closeProfileModal = $("closeProfileModal");
const closeProfileModalButton = $("closeProfileModalButton");

const profileAvatarLarge = $("profileAvatarLarge");
const sidebarAvatar = $("sidebarAvatar");
const topAvatar = $("topAvatar");

const profileButton = $("profileButton");
const sidebarProfileButton = $("sidebarProfileButton");

const focusModal = $("focusModal");
const focusSubject = $("focusSubject");
const focusLessonName = $("focusLessonName");
const timerDisplay = $("timerDisplay");

const pauseTimerButton = $("pauseTimerButton");
const finishTimerButton = $("finishTimerButton");
const closeFocusButton = $("closeFocusButton");

const timerProgressCircle = $("timerProgressCircle");
const timerStatusText = $("timerStatusText");

const deleteModal = $("deleteModal");
const cancelDeleteButton = $("cancelDeleteButton");
const confirmDeleteButton = $("confirmDeleteButton");

const lessonSearch = $("lessonSearch");

const weeklyChart = $("weeklyChart");
const analyticsChart = $("analyticsChart");

const analyticsTotal = $("analyticsTotal");
const averageSession = $("averageSession");
const sessionCount = $("sessionCount");
const topSubject = $("topSubject");
const completionRate = $("completionRate");

const streakValue = $("streakValue");

const currentDate = $("currentDate");

const pageTitle = $("pageTitle");

const mobileMenuButton = $("mobileMenuButton");
const sidebar = $("sidebar");
const sidebarOverlay = $("sidebarOverlay");

const heroAddLessonButton = $("heroAddLessonButton");
const heroStartButton = $("heroStartButton");


// =========================================================
// STATE
// =========================================================

let currentUser = null;

let currentLessons = [];

let currentSessions = [];

let unsubscribeLessons = null;
let unsubscribeSessions = null;

let activeTimer = null;

let timerState = {
    lessonId: null,
    lessonName: "",
    subject: "",
    totalSeconds: 0,
    remainingSeconds: 0,
    elapsedSeconds: 0,
    paused: false,
    startedAt: null
};

let currentFilter = "all";

let lessonToDelete = null;


// =========================================================
// GENERAL UI
// =========================================================

function showToast(message, type = "success") {

    const container = $("toastContainer");

    if (!container) return;

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    const icon = document.createElement("div");

    icon.className = "toast-icon";

    icon.textContent = type === "error" ? "!" : "✓";

    const text = document.createElement("div");

    text.className = "toast-message";

    text.textContent = message;

    toast.append(icon, text);

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-20px)";

        setTimeout(() => {
            toast.remove();
        }, 250);

    }, 3500);
}


function showError(message) {

    const banner = $("errorBanner");

    if (!banner) return;

    banner.textContent = message;

    banner.hidden = false;

    setTimeout(() => {
        banner.hidden = true;
    }, 5000);
}


function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = String(value ?? "");

    return div.innerHTML;
}


function getInitials(name) {

    const clean = String(name || "مستخدم").trim();

    if (!clean) return "م";

    return clean.charAt(0).toUpperCase();
}


function formatMinutes(minutes) {

    const value = Number(minutes) || 0;

    if (value < 60) {
        return `${value} دقيقة`;
    }

    const hours = Math.floor(value / 60);
    const mins = value % 60;

    if (mins === 0) {
        return `${hours} ساعة`;
    }

    return `${hours}س ${mins}د`;
}


function formatTime(seconds) {

    const safe = Math.max(0, Math.floor(seconds));

    const hours = Math.floor(safe / 3600);

    const mins = Math.floor((safe % 3600) / 60);

    const secs = safe % 60;

    if (hours > 0) {

        return [
            hours.toString().padStart(2, "0"),
            mins.toString().padStart(2, "0"),
            secs.toString().padStart(2, "0")
        ].join(":");

    }

    return [
        mins.toString().padStart(2, "0"),
        secs.toString().padStart(2, "0")
    ].join(":");
}


function localDateKey(date = new Date()) {

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function dateFromKey(key) {

    if (!key) return null;

    const parts = key.split("-").map(Number);

    if (parts.length !== 3) return null;

    return new Date(parts[0], parts[1] - 1, parts[2]);
}


function formatDate(dateValue) {

    if (!dateValue) return "غير محدد";

    let date;

    if (typeof dateValue === "string") {
        date = dateFromKey(dateValue) || new Date(dateValue);
    } else if (dateValue?.toDate) {
        date = dateValue.toDate();
    } else {
        date = new Date(dateValue);
    }

    if (Number.isNaN(date.getTime())) {
        return "غير محدد";
    }

    return new Intl.DateTimeFormat("ar", {
        day: "numeric",
        month: "short"
    }).format(date);
}


// =========================================================
// AUTH FORMS
// =========================================================

showRegisterButton?.addEventListener("click", () => {

    loginFormContainer.hidden = true;

    registerFormContainer.hidden = false;

});


showLoginButton?.addEventListener("click", () => {

    registerFormContainer.hidden = true;

    loginFormContainer.hidden = false;

});


document.querySelectorAll(".password-toggle").forEach((button) => {

    button.addEventListener("click", () => {

        const target = document.getElementById(
            button.dataset.target
        );

        if (!target) return;

        if (target.type === "password") {

            target.type = "text";

            button.textContent = "◌";

        } else {

            target.type = "password";

            button.textContent = "◉";
        }

    });

});


// =========================================================
// REGISTER
// =========================================================

registerForm?.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name = $("registerName").value.trim();

    const email = $("registerEmail").value.trim();

    const password = $("registerPassword").value;

    if (name.length < 2) {

        showToast("اكتب اسمًا صحيحًا.", "error");

        return;
    }

    if (password.length < 6) {

        showToast(
            "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل.",
            "error"
        );

        return;
    }

    const button = $("registerSubmitButton");

    setButtonLoading(button, true);

    try {

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = credential.user;

        await updateProfile(user, {
            displayName: name
        });

        await setDoc(
            doc(db, "users", user.uid),
            {
                name,
                email,
                createdAt: serverTimestamp()
            },
            {
                merge: true
            }
        );

        registerForm.reset();

        showToast("تم إنشاء حسابك بنجاح ✦");

    } catch (error) {

        showToast(
            translateError(error.code),
            "error"
        );

    } finally {

        setButtonLoading(button, false);

    }

});


// =========================================================
// LOGIN
// =========================================================

loginForm?.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = $("loginEmail").value.trim();

    const password = $("loginPassword").value;

    const button = $("loginSubmitButton");

    setButtonLoading(button, true);

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        loginForm.reset();

        showToast("مرحبًا بعودتك ✦");

    } catch (error) {

        showToast(
            translateError(error.code),
            "error"
        );

    } finally {

        setButtonLoading(button, false);

    }

});


function setButtonLoading(button, loading) {

    if (!button) return;

    button.disabled = loading;

    if (loading) {

        button.dataset.originalText =
            button.innerHTML;

        button.innerHTML = `
            <span class="loading-spinner"></span>
            <span>جاري المعالجة...</span>
        `;

    } else if (button.dataset.originalText) {

        button.innerHTML =
            button.dataset.originalText;
    }
}


// =========================================================
// AUTH STATE
// =========================================================

onAuthStateChanged(auth, async (user) => {

    if (user) {

        currentUser = user;

        authScreen.hidden = true;

        appScreen.hidden = false;

        await loadUserProfile(user);

        setupCurrentDate();

        listenToLessons(user.uid);

        listenToSessions(user.uid);

        navigateToSection("dashboardSection");

    } else {

        currentUser = null;

        authScreen.hidden = false;

        appScreen.hidden = true;

        currentLessons = [];

        currentSessions = [];

        if (unsubscribeLessons) {

            unsubscribeLessons();

            unsubscribeLessons = null;
        }

        if (unsubscribeSessions) {

            unsubscribeSessions();

            unsubscribeSessions = null;
        }

        stopTimerWithoutSaving();

    }

});


async function loadUserProfile(user) {

    let name =
        user.displayName ||
        user.email?.split("@")[0] ||
        "المستخدم";

    try {

        const snapshot =
            await getDoc(
                doc(db, "users", user.uid)
            );

        if (snapshot.exists()) {

            const data = snapshot.data();

            name = data.name || name;
        }

    } catch (error) {

        console.warn(
            "تعذر تحميل ملف المستخدم:",
            error
        );

    }

    updateUserUI(name, user.email);

}


function updateUserUI(name, email) {

    const initial = getInitials(name);

    userNameSpan.textContent = name;

    welcomeText.textContent =
        `مرحبًا بك، ${name} 👋`;

    sidebarAvatar.textContent = initial;

    topAvatar.textContent = initial;

    profileAvatarLarge.textContent = initial;

    profileName.value = name;

    profileEmail.textContent =
        email || currentUser?.email || "—";

}


// =========================================================
// LOGOUT
// =========================================================

logoutButton?.addEventListener("click", async () => {

    try {

        stopTimerWithoutSaving();

        await signOut(auth);

        closeProfile();

        showToast("تم تسجيل الخروج.");

    } catch (error) {

        showToast(
            "تعذر تسجيل الخروج.",
            "error"
        );

    }

});


// =========================================================
// NAVIGATION
// =========================================================

const navItems =
    document.querySelectorAll(".nav-item");

const pageNames = {
    dashboardSection: "الرئيسية",
    lessonsSection: "دروسي",
    reviewsSection: "المراجعة",
    analyticsSection: "الإحصائيات"
};


function navigateToSection(sectionId) {

    document
        .querySelectorAll(".page-section")
        .forEach((section) => {

            section.classList.toggle(
                "active",
                section.id === sectionId
            );

        });

    navItems.forEach((item) => {

        item.classList.toggle(
            "active",
            item.dataset.section === sectionId
        );

    });

    pageTitle.textContent =
        pageNames[sectionId] || "StudyLoop";

    closeMobileSidebar();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


navItems.forEach((item) => {

    item.addEventListener("click", () => {

        navigateToSection(
            item.dataset.section
        );

    });

});


document
    .querySelectorAll("[data-section]")
    .forEach((element) => {

        if (element.classList.contains("nav-item")) {
            return;
        }

        element.addEventListener("click", () => {

            const section =
                element.dataset.section;

            if (section) {
                navigateToSection(section);
            }

        });

    });


// =========================================================
// MOBILE SIDEBAR
// =========================================================

mobileMenuButton?.addEventListener(
    "click",
    () => {

        sidebar.classList.add("open");

        sidebarOverlay.classList.add("visible");

    }
);


sidebarOverlay?.addEventListener(
    "click",
    closeMobileSidebar
);


function closeMobileSidebar() {

    sidebar.classList.remove("open");

    sidebarOverlay.classList.remove("visible");

}


// =========================================================
// CURRENT DATE
// =========================================================

function setupCurrentDate() {

    currentDate.textContent =
        new Intl.DateTimeFormat("ar", {
            weekday: "short",
            day: "numeric",
            month: "short"
        }).format(new Date());

}


// =========================================================
// LESSON MODAL
// =========================================================

function openLessonModal(lesson = null) {

    lessonModal.hidden = false;

    if (lesson) {

        lessonModalTitle.textContent =
            "تعديل الدرس";

        saveLessonText.textContent =
            "حفظ التغييرات";

        editingLessonId.value =
            lesson.id;

        subjectName.value =
            lesson.subject || "";

        lessonName.value =
            lesson.name || "";

        studyDuration.value =
            lesson.duration || "";

        reviewDate.value =
            lesson.reviewDate || "";

    } else {

        lessonModalTitle.textContent =
            "إضافة درس جديد";

        saveLessonText.textContent =
            "حفظ الدرس";

        editingLessonId.value = "";

        lessonForm.reset();

        reviewDate.value =
            localDateKey();

    }

    setTimeout(() => {
        subjectName.focus();
    }, 100);

}


function closeLessonModal() {

    lessonModal.hidden = true;

    lessonForm.reset();

    editingLessonId.value = "";

}


$("addLessonButton")?.addEventListener(
    "click",
    () => openLessonModal()
);

heroAddLessonButton?.addEventListener(
    "click",
    () => openLessonModal()
);

$("emptyAddButton")?.addEventListener(
    "click",
    () => openLessonModal()
);

closeModalButton?.addEventListener(
    "click",
    closeLessonModal
);

cancelModalButton?.addEventListener(
    "click",
    closeLessonModal
);


lessonModal?.addEventListener("click", (event) => {

    if (event.target === lessonModal) {

        closeLessonModal();
    }

});


// =========================================================
// ADD / EDIT LESSON
// =========================================================

lessonForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (!currentUser) return;

        const subject =
            subjectName.value.trim();

        const name =
            lessonName.value.trim();

        const duration =
            Number(studyDuration.value);

        const selectedReviewDate =
            reviewDate.value;

        if (!subject || !name) {

            showToast(
                "يرجى تعبئة جميع الحقول.",
                "error"
            );

            return;
        }

        if (
            !Number.isFinite(duration) ||
            duration < 1 ||
            duration > 1440
        ) {

            showToast(
                "مدة الدراسة يجب أن تكون بين دقيقة و1440 دقيقة.",
                "error"
            );

            return;
        }

        try {

            const lessonId =
                editingLessonId.value;

            if (lessonId) {

                await updateDoc(
                    doc(
                        db,
                        "lessons",
                        lessonId
                    ),
                    {
                        subject,
                        name,
                        duration,
                        reviewDate:
                            selectedReviewDate || null,
                        updatedAt:
                            serverTimestamp()
                    }
                );

                showToast(
                    "تم تحديث الدرس بنجاح."
                );

            } else {

                await addDoc(
                    collection(db, "lessons"),
                    {
                        userId:
                            currentUser.uid,

                        subject,
                        name,
                        duration,

                        status: "new",

                        completedMinutes: 0,

                        reviewDate:
                            selectedReviewDate ||
                            localDateKey(),

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()
                    }
                );

                showToast(
                    "تمت إضافة الدرس ✦"
                );
            }

            closeLessonModal();

        } catch (error) {

            console.error(error);

            showToast(
                "تعذر حفظ الدرس. تحقق من اتصال Firebase وقواعد Firestore.",
                "error"
            );

        }

    }
);


// =========================================================
// FIRESTORE LESSONS
// =========================================================

function listenToLessons(userId) {

    if (unsubscribeLessons) {
        unsubscribeLessons();
    }

    const lessonsQuery =
        query(
            collection(db, "lessons"),
            where(
                "userId",
                "==",
                userId
            )
        );

    unsubscribeLessons =
        onSnapshot(
            lessonsQuery,
            (snapshot) => {

                currentLessons = [];

                snapshot.forEach((item) => {

                    currentLessons.push({
                        id: item.id,
                        ...item.data()
                    });

                });

                currentLessons.sort(
                    sortLessonsByDate
                );

                renderEverything();

            },
            (error) => {

                console.error(error);

                showToast(
                    "تعذر تحميل الدروس من قاعدة البيانات.",
                    "error"
                );

            }
        );

}


function sortLessonsByDate(a, b) {

    const aTime =
        a.createdAt?.toMillis?.() ||
        0;

    const bTime =
        b.createdAt?.toMillis?.() ||
        0;

    return bTime - aTime;
}


// =========================================================
// FIRESTORE SESSIONS
// =========================================================

function listenToSessions(userId) {

    if (unsubscribeSessions) {
        unsubscribeSessions();
    }

    const sessionsQuery =
        query(
            collection(db, "studySessions"),
            where(
                "userId",
                "==",
                userId
            )
        );

    unsubscribeSessions =
        onSnapshot(
            sessionsQuery,
            (snapshot) => {

                currentSessions = [];

                snapshot.forEach((item) => {

                    currentSessions.push({
                        id: item.id,
                        ...item.data()
                    });

                });

                renderEverything();

            },
            (error) => {

                console.error(error);

                showToast(
                    "تعذر تحميل جلسات الدراسة.",
                    "error"
                );

            }
        );

}


// =========================================================
// RENDER EVERYTHING
// =========================================================

function renderEverything() {

    updateStats();

    renderLessons();

    renderReviews();

    renderRecentLessons();

    renderWeeklyChart();

    renderAnalytics();

    updateTodayFocus();

}


// =========================================================
// STATS
// =========================================================

function updateStats() {

    totalLessonsEl.textContent =
        currentLessons.length;

    const subjects =
        new Set(
            currentLessons
                .map((lesson) => lesson.subject)
                .filter(Boolean)
        );

    totalSubjectsEl.textContent =
        subjects.size;

    const totalMinutes =
        currentSessions.reduce(
            (total, session) =>
                total +
                Number(
                    session.durationMinutes || 0
                ),
            0
        );

    totalMinutesEl.textContent =
        Math.round(totalMinutes);

    const reviewCount =
        getReviewLessons().length;

    reviewLessonsEl.textContent =
        reviewCount;

    reviewBadge.textContent =
        reviewCount;

    reviewBadge.hidden =
        reviewCount === 0;

}


// =========================================================
// REVIEW LOGIC
// =========================================================

function getReviewLessons() {

    const today =
        localDateKey();

    return currentLessons.filter(
        (lesson) => {

            if (lesson.status === "completed") {
                return false;
            }

            if (lesson.status === "review") {
                return true;
            }

            if (
                lesson.reviewDate &&
                lesson.reviewDate <= today
            ) {
                return true;
            }

            return false;

        }
    );

}


function renderReviews() {

    const reviews =
        getReviewLessons();

    reviewCountLarge.textContent =
        reviews.length;

    if (reviews.length === 0) {

        reviewHeroTitle.textContent =
            "لا توجد مراجعات مستحقة 🎉";

        reviewHeroText.textContent =
            "أنت على الطريق الصحيح. استمر في الدراسة.";

        reviewList.innerHTML = "";

        return;
    }

    reviewHeroTitle.textContent =
        `لديك ${reviews.length} ${reviews.length === 1 ? "درس" : "دروس"} للمراجعة`;

    reviewHeroText.textContent =
        "خصص بضع دقائق لتثبيت ما تعلمته.";

    reviewList.innerHTML =
        reviews.map(
            createLessonCardHTML
        ).join("");

    attachLessonCardEvents(reviewList);

}


// =========================================================
// LESSON FILTERING
// =========================================================

document
    .querySelectorAll(".filter-button")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".filter-button")
                    .forEach((item) =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");

                currentFilter =
                    button.dataset.filter;

                renderLessons();

            }
        );

    });


lessonSearch?.addEventListener(
    "input",
    renderLessons
);


function getFilteredLessons() {

    const search =
        lessonSearch.value
            .trim()
            .toLowerCase();

    return currentLessons.filter(
        (lesson) => {

            const matchesSearch =
                !search ||
                String(lesson.name || "")
                    .toLowerCase()
                    .includes(search) ||
                String(lesson.subject || "")
                    .toLowerCase()
                    .includes(search);

            if (!matchesSearch) {
                return false;
            }

            if (currentFilter === "all") {
                return true;
            }

            if (currentFilter === "review") {

                return getReviewLessons()
                    .some(
                        (item) =>
                            item.id === lesson.id
                    );
            }

            return (
                lesson.status ===
                currentFilter
            );

        }
    );

}


function renderLessons() {

    const lessons =
        getFilteredLessons();

    if (currentLessons.length === 0) {

        lessonsList.innerHTML = "";

        lessonsEmptyState.hidden = false;

        return;
    }

    lessonsEmptyState.hidden =
        lessons.length !== 0;

    if (lessons.length === 0) {

        lessonsList.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <div class="empty-icon">⌕</div>
                <h3>لم نجد نتائج</h3>
                <p>جرّب البحث باسم مختلف.</p>
            </div>
        `;

        return;
    }

    lessonsList.innerHTML =
        lessons.map(
            createLessonCardHTML
        ).join("");

    attachLessonCardEvents(
        lessonsList
    );

}


function getLessonStatus(lesson) {

    if (lesson.status === "completed") {
        return {
            key: "completed",
            label: "مكتمل"
        };
    }

    if (
        lesson.status === "review" ||
        (
            lesson.reviewDate &&
            lesson.reviewDate <= localDateKey()
        )
    ) {

        return {
            key: "review",
            label: "للمراجعة"
        };

    }

    return {
        key: "new",
        label: "جديد"
    };

}


function getLessonProgress(lesson) {

    const duration =
        Number(lesson.duration) || 0;

    const completed =
        Number(
            lesson.completedMinutes || 0
        );

    if (duration <= 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.round(
            (completed / duration) * 100
        )
    );

}


function createLessonCardHTML(lesson) {

    const status =
        getLessonStatus(lesson);

    const progress =
        getLessonProgress(lesson);

    return `
        <article
            class="lesson-card"
            data-lesson-id="${escapeHTML(lesson.id)}"
        >

            <div class="lesson-top">

                <span class="lesson-subject">
                    ${escapeHTML(lesson.subject)}
                </span>

                <span class="lesson-status ${status.key}">
                    ${status.label}
                </span>

            </div>

            <h3>
                ${escapeHTML(lesson.name)}
            </h3>

            <div class="lesson-info">

                <span>
                    ◷ ${escapeHTML(lesson.duration)} دقيقة
                </span>

                <span>
                    ${lesson.reviewDate
                        ? `↻ ${escapeHTML(formatDate(lesson.reviewDate))}`
                        : "بدون موعد مراجعة"
                    }
                </span>

            </div>

            <div class="lesson-progress">
                <span style="width:${progress}%"></span>
            </div>

            <div class="lesson-actions">

                <button
                    class="lesson-action primary"
                    data-action="start"
                    type="button"
                >
                    ▶ بدء الدراسة
                </button>

                <button
                    class="lesson-action"
                    data-action="edit"
                    type="button"
                    aria-label="تعديل"
                >
                    ✎
                </button>

                <button
                    class="lesson-action"
                    data-action="delete"
                    type="button"
                    aria-label="حذف"
                >
                    ×
                </button>

            </div>

        </article>
    `;
}


function attachLessonCardEvents(container) {

    container
        .querySelectorAll(".lesson-card")
        .forEach((card) => {

            const id =
                card.dataset.lessonId;

            const lesson =
                currentLessons.find(
                    (item) =>
                        item.id === id
                );

            if (!lesson) return;

            card
                .querySelector('[data-action="start"]')
                ?.addEventListener(
                    "click",
                    () => startStudySession(lesson)
                );

            card
                .querySelector('[data-action="edit"]')
                ?.addEventListener(
                    "click",
                    () => openLessonModal(lesson)
                );

            card
                .querySelector('[data-action="delete"]')
                ?.addEventListener(
                    "click",
                    () => openDeleteModal(lesson)
                );

        });

}


// =========================================================
// RECENT LESSONS
// =========================================================

function renderRecentLessons() {

    const lessons =
        currentLessons.slice(0, 3);

    if (lessons.length === 0) {

        recentLessons.innerHTML = `
            <div
                class="empty-state"
                style="grid-column:1/-1;padding:35px 15px"
            >
                <div class="empty-icon">✦</div>
                <h3>ابدأ مكتبتك</h3>
                <p>
                    أضف أول درس لتظهر هنا.
                </p>
            </div>
        `;

        return;
    }

    recentLessons.innerHTML =
        lessons.map(
            (lesson) => `
                <div
                    class="recent-item"
                    data-recent-id="${escapeHTML(lesson.id)}"
                >

                    <div class="recent-item-icon">
                        ✦
                    </div>

                    <div class="recent-item-info">

                        <strong>
                            ${escapeHTML(lesson.name)}
                        </strong>

                        <span>
                            ${escapeHTML(lesson.subject)}
                            ·
                            ${escapeHTML(lesson.duration)} دقيقة
                        </span>

                    </div>

                </div>
            `
        ).join("");

    recentLessons
        .querySelectorAll(".recent-item")
        .forEach((item) => {

            item.addEventListener(
                "click",
                () => {

                    const lesson =
                        currentLessons.find(
                            (entry) =>
                                entry.id ===
                                item.dataset.recentId
                        );

                    if (lesson) {
                        startStudySession(lesson);
                    }

                }
            );

        });

}


// =========================================================
// STUDY SESSION
// =========================================================

async function startStudySession(lesson) {

    if (!lesson) return;

    if (activeTimer) {

        showToast(
            "هناك جلسة دراسة تعمل بالفعل.",
            "error"
        );

        return;
    }

    const duration =
        Number(lesson.duration) || 0;

    if (duration <= 0) {

        showToast(
            "مدة الدرس غير صحيحة.",
            "error"
        );

        return;
    }

    timerState = {

        lessonId: lesson.id,

        lessonName:
            lesson.name,

        subject:
            lesson.subject,

        totalSeconds:
            duration * 60,

        remainingSeconds:
            duration * 60,

        elapsedSeconds:
            0,

        paused:
            false,

        startedAt:
            new Date()

    };

    focusSubject.textContent =
        lesson.subject;

    focusLessonName.textContent =
        lesson.name;

    timerDisplay.textContent =
        formatTime(
            timerState.remainingSeconds
        );

    pauseTimerButton.textContent =
        "❚❚ إيقاف مؤقت";

    timerStatusText.textContent =
        "جلسة نشطة";

    focusModal.hidden = false;

    setupTimerCircle();

    updateTimerCircle();

    activeTimer =
        setInterval(
            timerTick,
            1000
        );

}


function setupTimerCircle() {

    const radius = 104;

    const circumference =
        2 * Math.PI * radius;

    timerProgressCircle.style.strokeDasharray =
        circumference;

    timerProgressCircle.dataset.circumference =
        circumference;

}


function updateTimerCircle() {

    const circumference =
        Number(
            timerProgressCircle.dataset.circumference
        ) || 653;

    const progress =
        timerState.totalSeconds > 0
            ? timerState.remainingSeconds /
              timerState.totalSeconds
            : 0;

    const offset =
        circumference *
        (1 - progress);

    timerProgressCircle.style.strokeDashoffset =
        offset;
}


function timerTick() {

    if (timerState.paused) {
        return;
    }

    timerState.remainingSeconds--;

    timerState.elapsedSeconds++;

    timerDisplay.textContent =
        formatTime(
            timerState.remainingSeconds
        );

    updateTimerCircle();

    if (
        timerState.remainingSeconds <= 0
    ) {

        clearInterval(activeTimer);

        activeTimer = null;

        timerState.remainingSeconds = 0;

        timerDisplay.textContent =
            "00:00";

        timerStatusText.textContent =
            "انتهى الوقت 🎉";

        pauseTimerButton.disabled = true;

        finishStudySession(true);

    }

}


pauseTimerButton?.addEventListener(
    "click",
    () => {

        if (!activeTimer) return;

        timerState.paused =
            !timerState.paused;

        if (timerState.paused) {

            pauseTimerButton.textContent =
                "▶ متابعة";

            timerStatusText.textContent =
                "متوقف مؤقتًا";

        } else {

            pauseTimerButton.textContent =
                "❚❚ إيقاف مؤقت";

            timerStatusText.textContent =
                "جلسة نشطة";

        }

    }
);


finishTimerButton?.addEventListener(
    "click",
    () => finishStudySession(false)
);


closeFocusButton?.addEventListener(
    "click",
    () => {

        if (
            timerState.elapsedSeconds > 0
        ) {

            const shouldClose =
                window.confirm(
                    "هل تريد إغلاق الجلسة؟ سيتم حفظ الوقت الذي درسته حتى الآن."
                );

            if (!shouldClose) return;

            finishStudySession(false);

        } else {

            stopTimerWithoutSaving();

            focusModal.hidden = true;

        }

    }
);


async function finishStudySession(autoFinished = false) {

    if (!currentUser) return;

    if (
        activeTimer !== null
    ) {

        clearInterval(activeTimer);

        activeTimer = null;
    }

    const elapsedSeconds =
        timerState.elapsedSeconds;

    const elapsedMinutes =
        Math.max(
            0,
            Math.floor(
                elapsedSeconds / 60
            )
        );

    if (elapsedMinutes > 0) {

        try {

            await addDoc(
                collection(
                    db,
                    "studySessions"
                ),
                {
                    userId:
                        currentUser.uid,

                    lessonId:
                        timerState.lessonId,

                    lessonName:
                        timerState.lessonName,

                    subject:
                        timerState.subject,

                    durationMinutes:
                        elapsedMinutes,

                    startedAt:
                        timerState.startedAt,

                    endedAt:
                        serverTimestamp(),

                    date:
                        localDateKey(),

                    createdAt:
                        serverTimestamp()
                }
            );

            const lesson =
                currentLessons.find(
                    (item) =>
                        item.id ===
                        timerState.lessonId
                );

            if (lesson) {

                const previous =
                    Number(
                        lesson.completedMinutes || 0
                    );

                const duration =
                    Number(
                        lesson.duration || 0
                    );

                const totalCompleted =
                    previous +
                    elapsedMinutes;

                const newStatus =
                    totalCompleted >= duration
                        ? "completed"
                        : "review";

                await updateDoc(
                    doc(
                        db,
                        "lessons",
                        lesson.id
                    ),
                    {
                        completedMinutes:
                            totalCompleted,

                        status:
                            newStatus,

                        updatedAt:
                            serverTimestamp()
                    }
                );

            }

            showToast(
                autoFinished
                    ? "أحسنت! انتهت جلسة الدراسة 🎉"
                    : `تم حفظ ${elapsedMinutes} دقيقة من الدراسة.`
            );

        } catch (error) {

            console.error(error);

            showToast(
                "تم إنهاء الجلسة لكن تعذر حفظها في Firebase.",
                "error"
            );

        }

    } else if (!autoFinished) {

        showToast(
            "الجلسة كانت قصيرة جدًا ولم يتم تسجيل دقيقة كاملة."
        );

    }

    resetTimerState();

    focusModal.hidden = true;

    pauseTimerButton.disabled = false;

}


function stopTimerWithoutSaving() {

    if (activeTimer) {

        clearInterval(activeTimer);

        activeTimer = null;
    }

    resetTimerState();

}


function resetTimerState() {

    timerState = {

        lessonId: null,

        lessonName: "",

        subject: "",

        totalSeconds: 0,

        remainingSeconds: 0,

        elapsedSeconds: 0,

        paused: false,

        startedAt: null

    };

}


// =========================================================
// HERO START BUTTON
// =========================================================

heroStartButton?.addEventListener(
    "click",
    () => {

        if (currentLessons.length === 0) {

            openLessonModal();

            return;
        }

        const review =
            getReviewLessons();

        const lesson =
            review[0] ||
            currentLessons[0];

        startStudySession(lesson);

    }
);


// =========================================================
// DELETE LESSON
// =========================================================

function openDeleteModal(lesson) {

    lessonToDelete = lesson;

    deleteModal.hidden = false;

}


function closeDeleteModal() {

    lessonToDelete = null;

    deleteModal.hidden = true;

}


cancelDeleteButton?.addEventListener(
    "click",
    closeDeleteModal
);


confirmDeleteButton?.addEventListener(
    "click",
    async () => {

        if (
            !currentUser ||
            !lessonToDelete
        ) return;

        try {

            await deleteDoc(
                doc(
                    db,
                    "lessons",
                    lessonToDelete.id
                )
            );

            showToast(
                "تم حذف الدرس."
            );

            closeDeleteModal();

        } catch (error) {

            console.error(error);

            showToast(
                "تعذر حذف الدرس.",
                "error"
            );

        }

    }
);


deleteModal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target === deleteModal
        ) {
            closeDeleteModal();
        }

    }
);


// =========================================================
// PROFILE
// =========================================================

function openProfile() {

    if (!currentUser) return;

    profileModal.hidden = false;

}


function closeProfile() {

    profileModal.hidden = true;

}


profileButton?.addEventListener(
    "click",
    openProfile
);


sidebarProfileButton?.addEventListener(
    "click",
    openProfile
);


closeProfileModal?.addEventListener(
    "click",
    closeProfile
);


closeProfileModalButton?.addEventListener(
    "click",
    closeProfile
);


profileModal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target === profileModal
        ) {
            closeProfile();
        }

    }
);


profileForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (!currentUser) return;

        const name =
            profileName.value.trim();

        if (name.length < 2) {

            showToast(
                "الاسم قصير جدًا.",
                "error"
            );

            return;
        }

        try {

            await updateProfile(
                currentUser,
                {
                    displayName: name
                }
            );

            await setDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                ),
                {
                    name,
                    email:
                        currentUser.email,
                    updatedAt:
                        serverTimestamp()
                },
                {
                    merge: true
                }
            );

            updateUserUI(
                name,
                currentUser.email
            );

            closeProfile();

            showToast(
                "تم تحديث الملف الشخصي."
            );

        } catch (error) {

            console.error(error);

            showToast(
                "تعذر تحديث الملف الشخصي.",
                "error"
            );

        }

    }
);


// =========================================================
// WEEKLY CHART
// =========================================================

function getLastSevenDays() {

    const days = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {

        const date =
            new Date(now);

        date.setDate(
            now.getDate() - i
        );

        days.push(date);

    }

    return days;

}


function getMinutesForDate(dateKey) {

    return currentSessions
        .filter(
            (session) =>
                session.date === dateKey
        )
        .reduce(
            (sum, session) =>
                sum +
                Number(
                    session.durationMinutes || 0
                ),
            0
        );

}


function renderWeeklyChart() {

    const days =
        getLastSevenDays();

    const values =
        days.map(
            (date) =>
                getMinutesForDate(
                    localDateKey(date)
                )
        );

    const max =
        Math.max(
            ...values,
            30
        );

    weeklyChart.innerHTML =
        values.map(
            (value) => {

                const height =
                    Math.max(
                        5,
                        Math.round(
                            (value / max) *
                            100
                        )
                    );

                return `
                    <div class="chart-bar-wrap">
                        <div
                            class="chart-bar"
                            style="height:${height}%"
                            title="${value} دقيقة"
                        ></div>
                    </div>
                `;

            }
        ).join("");

}


// =========================================================
// TODAY FOCUS
// =========================================================

function updateTodayFocus() {

    const today =
        localDateKey();

    const minutes =
        getMinutesForDate(today);

    todayMinutesEl.textContent =
        minutes;

    const progress =
        Math.min(
            100,
            Math.round(
                (minutes / 60) *
                100
            )
        );

    todayProgressEl.style.width =
        `${progress}%`;

    if (minutes === 0) {

        focusMessageEl.textContent =
            "ابدأ أول جلسة اليوم.";

    } else if (minutes < 60) {

        focusMessageEl.textContent =
            `باقي ${60 - minutes} دقيقة للوصول لهدفك.`;

    } else {

        focusMessageEl.textContent =
            "رائع! حققت هدفك اليوم 🔥";

    }

}


// =========================================================
// ANALYTICS
// =========================================================

function renderAnalytics() {

    const days =
        getLastSevenDays();

    const values =
        days.map(
            (date) =>
                getMinutesForDate(
                    localDateKey(date)
                )
        );

    const total =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        );

    analyticsTotal.textContent =
        `${total} دقيقة`;

    const max =
        Math.max(
            ...values,
            30
        );

    analyticsChart.innerHTML =
        days.map(
            (date, index) => {

                const value =
                    values[index];

                const height =
                    Math.max(
                        3,
                        Math.round(
                            (value / max) *
                            100
                        )
                    );

                const label =
                    new Intl.DateTimeFormat(
                        "ar",
                        {
                            weekday: "short"
                        }
                    ).format(date);

                return `
                    <div class="analytics-bar-wrap">

                        <div
                            class="analytics-bar"
                            style="height:${height}%"
                            title="${value} دقيقة"
                        ></div>

                        <span class="analytics-day">
                            ${escapeHTML(label)}
                        </span>

                    </div>
                `;

            }
        ).join("");

    const sessions =
        currentSessions.filter(
            (session) =>
                Number(
                    session.durationMinutes || 0
                ) > 0
        );

    sessionCount.textContent =
        sessions.length;

    const avg =
        sessions.length
            ? Math.round(
                totalSessionMinutes() /
                sessions.length
            )
            : 0;

    averageSession.textContent =
        `${avg} دقيقة`;

    const subjectMap = {};

    currentSessions.forEach(
        (session) => {

            const subject =
                session.subject ||
                "غير محدد";

            subjectMap[subject] =
                (subjectMap[subject] || 0) +
                Number(
                    session.durationMinutes || 0
                );

        }
    );

    const top =
        Object.entries(subjectMap)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];

    topSubject.textContent =
        top ? top[0] : "—";

    const completed =
        currentLessons.filter(
            (lesson) =>
                lesson.status ===
                "completed"
        ).length;

    completionRate.textContent =
        currentLessons.length
            ? `${Math.round(
                (completed /
                    currentLessons.length) *
                100
            )}%`
            : "0%";

    streakValue.textContent =
        calculateStreak();

}


function totalSessionMinutes() {

    return currentSessions.reduce(
        (sum, session) =>
            sum +
            Number(
                session.durationMinutes || 0
            ),
        0
    );

}


function calculateStreak() {

    const studiedDates =
        new Set(
            currentSessions
                .filter(
                    (session) =>
                        Number(
                            session.durationMinutes || 0
                        ) > 0
                )
                .map(
                    (session) =>
                        session.date
                )
        );

    let streak = 0;

    const today =
        new Date();

    for (let i = 0; i < 365; i++) {

        const date =
            new Date(today);

        date.setDate(
            today.getDate() - i
        );

        const key =
            localDateKey(date);

        if (studiedDates.has(key)) {

            streak++;

        } else {

            if (i === 0) {
                continue;
            }

            break;

        }

    }

    return streak;

}


// =========================================================
// FILTER + KEYBOARD
// =========================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {

            if (!lessonModal.hidden) {
                closeLessonModal();
            }

            if (!profileModal.hidden) {
                closeProfile();
            }

            if (!deleteModal.hidden) {
                closeDeleteModal();
            }

        }

    }
);


// =========================================================
// FIREBASE ERRORS
// =========================================================

function translateError(code) {

    switch (code) {

        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

        case "auth/email-already-in-use":
            return "هذا البريد الإلكتروني مستخدم بالفعل.";

        case "auth/weak-password":
            return "كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.";

        case "auth/invalid-email":
            return "صيغة البريد الإلكتروني غير صحيحة.";

        case "auth/too-many-requests":
            return "تمت محاولات كثيرة. حاول مرة أخرى لاحقًا.";

        case "auth/network-request-failed":
            return "تعذر الاتصال بالإنترنت.";

        case "auth/operation-not-allowed":
            return "طريقة تسجيل الدخول هذه غير مفعلة في Firebase.";

        case "auth/unauthorized-domain":
            return "هذا النطاق غير مصرح له في Firebase.";

        default:
            return "حدث خطأ غير متوقع.";
    }

}
