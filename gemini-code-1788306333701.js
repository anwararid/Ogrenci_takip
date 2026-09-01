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
// RECENT LESSONS (Dashboard)
// =========================================================

function renderRecentLessons() {

    if (!recentLessons) return;

    const recent = [...currentLessons]
        .sort((a, b) => {

            const aTime =
                a.updatedAt?.toMillis?.() ||
                a.createdAt?.toMillis?.() ||
                0;

            const bTime =
                b.updatedAt?.toMillis?.() ||
                b.createdAt?.toMillis?.() ||
                0;

            return bTime - aTime;
        })
        .slice(0, 4);

    if (recent.length === 0) {

        recentLessons.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <p>لا توجد دروس حديثة بعد.</p>
            </div>
        `;

        return;
    }

    recentLessons.innerHTML =
        recent.map(createLessonCardHTML).join("");

    attachLessonCardEvents(recentLessons);

}


// =========================================================
// DELETE LESSON MODAL
// =========================================================

function openDeleteModal(lesson) {

    lessonToDelete = lesson;

    if (deleteModal) {
        deleteModal.hidden = false;
    }

}


function closeDeleteModal() {

    lessonToDelete = null;

    if (deleteModal) {
        deleteModal.hidden = true;
    }

}


cancelDeleteButton?.addEventListener(
    "click",
    closeDeleteModal
);


deleteModal?.addEventListener("click", (event) => {

    if (event.target === deleteModal) {
        closeDeleteModal();
    }

});


confirmDeleteButton?.addEventListener(
    "click",
    async () => {

        if (!lessonToDelete || !currentUser) return;

        try {

            await deleteDoc(
                doc(db, "lessons", lessonToDelete.id)
            );

            showToast("تم حذف الدرس بنجاح.");

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


// =========================================================
// FOCUS / TIMER SESSION
// =========================================================

function startStudySession(lesson) {

    if (!lesson) return;

    const durationMinutes =
        Number(lesson.duration) || 25;

    const totalSeconds =
        durationMinutes * 60;

    timerState = {
        lessonId: lesson.id,
        lessonName: lesson.name,
        subject: lesson.subject,
        totalSeconds: totalSeconds,
        remainingSeconds: totalSeconds,
        elapsedSeconds: 0,
        paused: false,
        startedAt: Date.now()
    };

    if (focusSubject) {
        focusSubject.textContent =
            lesson.subject || "دورة الدراسة";
    }

    if (focusLessonName) {
        focusLessonName.textContent =
            lesson.name || "جلسة تركيز";
    }

    updateTimerDisplay();

    if (focusModal) {
        focusModal.hidden = false;
    }

    if (activeTimer) {
        clearInterval(activeTimer);
    }

    activeTimer = setInterval(() => {

        if (timerState.paused) return;

        if (timerState.remainingSeconds > 0) {

            timerState.remainingSeconds--;
            timerState.elapsedSeconds++;

            updateTimerDisplay();

        } else {
            finishActiveSession(true);
        }

    }, 1000);

}


function updateTimerDisplay() {

    if (timerDisplay) {
        timerDisplay.textContent =
            formatTime(timerState.remainingSeconds);
    }

    if (timerStatusText) {
        timerStatusText.textContent =
            timerState.paused
                ? "متوقف مؤقتاً ⏸"
                : "جاري التركيز ⏱";
    }

    if (timerProgressCircle) {

        const total =
            timerState.totalSeconds || 1;

        const progress =
            ((total - timerState.remainingSeconds) / total) * 100;

        timerProgressCircle.style.setProperty(
            "--progress",
            `${progress}%`
        );
    }

}


pauseTimerButton?.addEventListener("click", () => {

    timerState.paused = !timerState.paused;

    if (pauseTimerButton) {
        pauseTimerButton.textContent =
            timerState.paused
                ? "استئناف ▶"
                : "إيقاف مؤقت ⏸";
    }

    updateTimerDisplay();

});


finishTimerButton?.addEventListener("click", () => {
    finishActiveSession(false);
});


closeFocusButton?.addEventListener("click", () => {

    if (
        confirm(
            "هل تريد إنهاء جلسة الدراسة الحالية دون حفظ التقدم؟"
        )
    ) {
        stopTimerWithoutSaving();
    }

});


function stopTimerWithoutSaving() {

    if (activeTimer) {
        clearInterval(activeTimer);
        activeTimer = null;
    }

    if (focusModal) {
        focusModal.hidden = true;
    }

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


async function finishActiveSession(
    completedAutomatically = false
) {

    if (!currentUser || !timerState.lessonId) {
        stopTimerWithoutSaving();
        return;
    }

    if (activeTimer) {
        clearInterval(activeTimer);
        activeTimer = null;
    }

    const elapsedMinutes =
        Math.max(
            1,
            Math.round(
                timerState.elapsedSeconds / 60
            )
        );

    const lessonId = timerState.lessonId;

    const lesson =
        currentLessons.find(
            (item) => item.id === lessonId
        );

    try {

        await addDoc(
            collection(db, "studySessions"),
            {
                userId: currentUser.uid,
                lessonId: lessonId,
                subject: timerState.subject,
                lessonName: timerState.lessonName,
                durationMinutes: elapsedMinutes,
                dateKey: localDateKey(),
                createdAt: serverTimestamp()
            }
        );

        if (lesson) {

            const prevCompleted =
                Number(
                    lesson.completedMinutes || 0
                );

            const newCompleted =
                prevCompleted + elapsedMinutes;

            const totalDuration =
                Number(lesson.duration || 0);

            const isCompleted =
                newCompleted >= totalDuration ||
                completedAutomatically;

            await updateDoc(
                doc(
                    db,
                    "lessons",
                    lessonId
                ),
                {
                    completedMinutes: newCompleted,
                    status: isCompleted
                        ? "completed"
                        : "review",
                    updatedAt:
                        serverTimestamp()
                }
            );

        }

        showToast(
            `تم تسجيل جلسة الدراسة بنجاح (${elapsedMinutes} دقيقة) ✦`
        );

    } catch (error) {

        console.error(error);

        showToast(
            "تعذر حفظ جلسة الدراسة.",
            "error"
        );

    } finally {
        stopTimerWithoutSaving();
    }

}


heroStartButton?.addEventListener(
    "click",
    () => {

        const reviewListItems =
            getReviewLessons();

        const target =
            reviewListItems.length > 0
                ? reviewListItems[0]
                : currentLessons[0];

        if (target) {
            startStudySession(target);
        } else {
            showToast(
                "أضف درسًا أولاً لبدء جلسة التركيز.",
                "error"
            );
            openLessonModal();
        }

    }
);


// =========================================================
// TODAY FOCUS & STATS EXTRAS
// =========================================================

function updateTodayFocus() {

    const todayKey = localDateKey();

    const todaySessions =
        currentSessions.filter(
            (s) => s.dateKey === todayKey
        );

    const todayTotalMins =
        todaySessions.reduce(
            (acc, s) =>
                acc +
                Number(
                    s.durationMinutes || 0
                ),
            0
        );

    if (todayMinutesEl) {
        todayMinutesEl.textContent =
            todayTotalMins;
    }

    const dailyGoalMinutes = 60;

    const progressPercent =
        Math.min(
            100,
            Math.round(
                (todayTotalMins /
                    dailyGoalMinutes) *
                    100
            )
        );

    if (todayProgressEl) {
        todayProgressEl.style.width =
            `${progressPercent}%`;
    }

    if (focusMessageEl) {

        if (todayTotalMins >= dailyGoalMinutes) {
            focusMessageEl.textContent =
                "أنت رائع! لقد حققت هدفك اليومي 🎉";
        } else {
            focusMessageEl.textContent =
                `أبقِ التركيز مستمراً، بقي ${Math.max(
                    0,
                    dailyGoalMinutes -
                        todayTotalMins
                )} دقيقة لهدفك اليومي.`;
        }

    }

    if (streakValue) {

        const uniqueDates = [
            ...new Set(
                currentSessions.map(
                    (s) => s.dateKey
                )
            )
        ]
            .sort()
            .reverse();

        let streak = 0;
        let checkDate = new Date();

        for (let i = 0; i < 30; i++) {

            const key =
                localDateKey(checkDate);

            if (uniqueDates.includes(key)) {
                streak++;
                checkDate.setDate(
                    checkDate.getDate() - 1
                );
            } else if (i === 0) {
                checkDate.setDate(
                    checkDate.getDate() - 1
                );
            } else {
                break;
            }

        }

        streakValue.textContent = streak;

    }

}


// =========================================================
// CHARTS & ANALYTICS RENDERING
// =========================================================

function renderWeeklyChart() {

    if (!weeklyChart) return;

    const days = [];

    for (let i = 6; i >= 0; i--) {

        const d = new Date();
        d.setDate(d.getDate() - i);

        days.push({
            key: localDateKey(d),
            label: new Intl.DateTimeFormat(
                "ar",
                { weekday: "short" }
            ).format(d)
        });

    }

    const maxMinutes = Math.max(
        60,
        ...days.map((day) => {
            return currentSessions
                .filter(
                    (s) =>
                        s.dateKey === day.key
                )
                .reduce(
                    (sum, s) =>
                        sum +
                        Number(
                            s.durationMinutes ||
                                0
                        ),
                    0
                );
        })
    );

    weeklyChart.innerHTML = days
        .map((day) => {

            const dayMinutes =
                currentSessions
                    .filter(
                        (s) =>
                            s.dateKey === day.key
                    )
                    .reduce(
                        (sum, s) =>
                            sum +
                            Number(
                                s.durationMinutes ||
                                    0
                            ),
                        0
                    );

            const heightPercent =
                Math.min(
                    100,
                    Math.round(
                        (dayMinutes /
                            maxMinutes) *
                            100
                    )
                );

            return `
                <div class="chart-bar-container" title="${dayMinutes} دقيقة">
                    <div class="chart-bar" style="height: ${heightPercent}%"></div>
                    <span class="chart-label">${day.label}</span>
                </div>
            `;

        })
        .join("");

}


function renderAnalytics() {

    const totalMins =
        currentSessions.reduce(
            (acc, s) =>
                acc +
                Number(
                    s.durationMinutes || 0
                ),
            0
        );

    if (analyticsTotal) {
        analyticsTotal.textContent =
            formatMinutes(totalMins);
    }

    const sessionCnt =
        currentSessions.length;

    if (sessionCount) {
        sessionCount.textContent =
            sessionCnt;
    }

    const avgMins =
        sessionCnt > 0
            ? Math.round(
                  totalMins / sessionCnt
              )
            : 0;

    if (averageSession) {
        averageSession.textContent =
            `${avgMins} دقيقة`;
    }

    const subjectCounts = {};

    currentSessions.forEach((s) => {
        if (s.subject) {
            subjectCounts[s.subject] =
                (subjectCounts[s.subject] ||
                    0) +
                Number(
                    s.durationMinutes || 0
                );
        }
    });

    let bestSubject = "—";
    let maxMins = 0;

    for (const [
        subj,
        mins
    ] of Object.entries(subjectCounts)) {
        if (mins > maxMins) {
            maxMins = mins;
            bestSubject = subj;
        }
    }

    if (topSubject) {
        topSubject.textContent =
            bestSubject;
    }

    const completedLessonsCount =
        currentLessons.filter(
            (l) => l.status === "completed"
        ).length;

    const rate =
        currentLessons.length > 0
            ? Math.round(
                  (completedLessonsCount /
                      currentLessons.length) *
                      100
              )
            : 0;

    if (completionRate) {
        completionRate.textContent =
            `${rate}%`;
    }

    if (analyticsChart) {
        analyticsChart.innerHTML = `
            <div class="analytics-summary-box">
                <p>إجمالي ساعات الدراسة: <strong>${(
                    totalMins / 60
                ).toFixed(1)} ساعة</strong></p>
                <p>عدد الدروس المكتملة: <strong>${completedLessonsCount} من ${
            currentLessons.length
        }</strong></p>
            </div>
        `;
    }

}


// =========================================================
// PROFILE MODAL
// =========================================================

function openProfile() {
    if (profileModal) {
        profileModal.hidden = false;
    }
}


function closeProfile() {
    if (profileModal) {
        profileModal.hidden = true;
    }
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
        if (event.target === profileModal) {
            closeProfile();
        }
    }
);


profileForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (!currentUser) return;

        const newName =
            profileName.value.trim();

        if (newName.length < 2) {
            showToast(
                "الاسم قصير جداً.",
                "error"
            );
            return;
        }

        try {

            await updateProfile(
                currentUser,
                { displayName: newName }
            );

            await setDoc(
                doc(db, "users", currentUser.uid),
                { name: newName },
                { merge: true }
            );

            updateUserUI(
                newName,
                currentUser.email
            );

            showToast(
                "تم تحديث الملف الشخصي بنجاح ✦"
            );

            closeProfile();

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
// ERROR TRANSLATOR
// =========================================================

function translateError(code) {

    switch (code) {

        case "auth/email-already-in-use":
            return "البريد الإلكتروني مستخدم بالفعل من قبل حساب آخر.";

        case "auth/invalid-email":
            return "صيغة البريد الإلكتروني غير صحيحة.";

        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

        case "auth/weak-password":
            return "كلمة المرور ضعيفة جداً.";

        case "auth/too-many-requests":
            return "تم حظر المحاولات مؤقتاً بسبب كثرة الطلبات. حاول لاحقاً.";

        default:
            return "حدث خطأ غير متوقع. يرجى التحقق من اتصال الشبكة.";
    }

}