// ==========================================
// 1. FIREBASE AUTH & FIRESTORE REFERENCES
// ==========================================
const auth = firebase.auth();
const db = firebase.firestore();

// Global App State
let currentUser = null;
let currentSubjectId = null;
let activeTimerInterval = null;
let timerSecondsRemaining = 25 * 60;
let isTimerRunning = false;
let currentTimerTaskTitle = "";

// DOM Elements
const authScreen = document.getElementById("authScreen");
const mainApp = document.getElementById("mainApp");
const authForm = document.getElementById("authForm");
const authEmailInput = document.getElementById("authEmail");
const authPasswordInput = document.getElementById("authPassword");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authToggleBtn = document.getElementById("authToggleBtn");
const authToggleText = document.getElementById("authToggleText");
const authError = document.getElementById("authError");
const logoutBtn = document.getElementById("logoutBtn");

let isSignUpMode = false;

// ==========================================
// 2. AUTHENTICATION LOGIC
// ==========================================
authToggleBtn.addEventListener("click", () => {
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
        authTitle.textContent = "إنشاء حساب جديد";
        authSubtitle.textContent = "أنشئ حساباً وابدأ تنظيم مسيرتك الدراسية";
        authSubmitBtn.textContent = "تسجيل الحساب";
        authToggleText.textContent = "لديك حساب بالفعل؟";
        authToggleBtn.textContent = "سجل دخولك";
    } else {
        authTitle.textContent = "تسجيل الدخول";
        authSubtitle.textContent = "أهلاً بك مجدداً، أدخل بيانات حسابك للمتابعة";
        authSubmitBtn.textContent = "دخول";
        authToggleText.textContent = "ليس لديك حساب؟";
        authToggleBtn.textContent = "أنشئ حساباً جديداً";
    }
    authError.textContent = "";
});

authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value.trim();
    authError.textContent = "";

    try {
        if (isSignUpMode) {
            await auth.createUserWithEmailAndPassword(email, password);
        } else {
            await auth.signInWithEmailAndPassword(email, password);
        }
    } catch (error) {
        authError.textContent = "خطأ: " + error.message;
    }
});

logoutBtn.addEventListener("click", () => {
    auth.signOut();
});

// Monitor Auth State
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        authScreen.style.display = "none";
        mainApp.style.display = "flex";
        
        // Update User Interface details
        document.getElementById("userEmailDisplay").textContent = user.email;
        const username = user.email.split('@')[0];
        document.getElementById("userNameDisplay").textContent = username;
        document.getElementById("welcomeName").textContent = username;
        document.getElementById("userAvatar").textContent = username.charAt(0).toUpperCase();

        // Load Initial Data
        initApp();
    } else {
        currentUser = null;
        authScreen.style.display = "flex";
        mainApp.style.display = "none";
    }
});

// ==========================================
// 3. NAVIGATION & UI CONTROLS
// ==========================================
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach(item => {
    item.addEventListener("click", () => {
        const targetPage = item.getAttribute("data-page");
        
        navItems.forEach(nav => nav.classList.remove("active"));
        item.classList.add("active");

        pages.forEach(page => page.classList.remove("active-page"));
        document.getElementById(targetPage).classList.add("active-page");
    });
});

function setCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('ar-SA', options);
    const dateEl = document.getElementById("currentDate");
    if(dateEl) dateEl.textContent = today;
}
setCurrentDate();

// ==========================================
// 4. DATA MANAGEMENT & FIRESTORE SYNC
// ==========================================
let userSubjects = [];
let userTasks = [];

function initApp() {
    loadSubjects();
    loadTasks();
    setupDarkMode();
}

// --- SUBJECTS ---
async function loadSubjects() {
    try {
        const snapshot = await db.collection("users").doc(currentUser.uid).collection("subjects").get();
        userSubjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderSubjects();
        populateSubjectDropdowns();
    } catch (err) {
        console.error("Error loading subjects:", err);
    }
}

function renderSubjects() {
    const grid = document.getElementById("subjectsGrid");
    if (!grid) return;

    if (userSubjects.length === 0) {
        grid.innerHTML = `<p style="color: var(--muted); font-size: 13px;">لا توجد مواد مضافة حتى الآن. اضغط على زر إضافة مادة جديدة.</p>`;
        return;
    }

    grid.innerHTML = userSubjects.map(sub => `
        <div class="subject-card" onclick="openSubjectDetails('${sub.id}', '${sub.name}')">
            <span class="section-kicker">${sub.color || 'مادة'}</span>
            <h3 style="font-size: 18px; font-weight: 900; margin-top: 5px;">${sub.name}</h3>
        </div>
    `).join('');
}

function populateSubjectDropdowns() {
    const select = document.getElementById("taskSubjectSelect");
    if (!select) return;

    select.innerHTML = userSubjects.map(sub => `
        <option value="${sub.id}">${sub.name}</option>
    `).join('');
}

// --- TASKS / LESSONS ---
async function loadTasks() {
    try {
        const snapshot = await db.collection("users").doc(currentUser.uid).collection("tasks").get();
        userTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTasks();
        updateProgressMetrics();
    } catch (err) {
        console.error("Error loading tasks:", err);
    }
}

function renderTasks() {
    const container = document.getElementById("tasksContainer");
    if (!container) return;

    if (userTasks.length === 0) {
        container.innerHTML = `<p style="color: var(--muted); font-size: 13px;">لا توجد جلسات دراسية اليوم. أضف جلسة وابدأ التركيز!</p>`;
        return;
    }

    container.innerHTML = userTasks.map(task => {
        const sub = userSubjects.find(s => s.id === task.subjectId);
        const subName = sub ? sub.name : 'عام';
        
        return `
            <div class="task-card">
                <div>
                    <span style="font-size: 11px; font-weight: 800; color: var(--primary);">${subName}</span>
                    <h4 style="font-size: 15px; font-weight: 900; margin-top: 2px; ${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.title}</h4>
                    <span style="font-size: 12px; color: var(--muted);">${task.minutes || 25} دقيقة</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${!task.completed ? `<button class="add-task-small" type="button" onclick="startStudyTimer('${task.id}', '${task.title}', ${task.minutes || 25})">بدء التركيز ⏱</button>` : ''}
                    <button class="icon-button" style="width: 36px; height: 36px; font-size: 14px;" type="button" onclick="toggleTaskCompletion('${task.id}', ${!task.completed})" title="تغيير الحالة">${task.completed ? '↩' : '✓'}</button>
                    <button class="icon-button" style="width: 36px; height: 36px; color: #ff4e7b; font-size: 14px;" type="button" onclick="deleteTask('${task.id}')" title="حذف">×</button>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// 5. MODALS & FORMS HANDLING
// ==========================================
function openSubjectModal() {
    document.getElementById("subjectModal").style.display = "flex";
}
function closeSubjectModal() {
    document.getElementById("subjectModal").style.display = "none";
}
function closeSubjectModalOutside(e) {
    if (e.target.id === "subjectModal") closeSubjectModal();
}

document.getElementById("subjectForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("subName").value.trim();
    const color = document.getElementById("subColor").value;

    if (!name) return;

    try {
        await db.collection("users").doc(currentUser.uid).collection("subjects").add({
            name,
            color,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById("subName").value = "";
        closeSubjectModal();
        loadSubjects();
    } catch (err) {
        console.error("Error adding subject:", err);
    }
});

function openTaskModal() {
    if (userSubjects.length === 0) {
        alert("يرجى إضافة مادة دراسية أولاً قبل إضافة الجلسات والدروس.");
        openSubjectModal();
        return;
    }
    document.getElementById("taskModal").style.display = "flex";
}
function closeTaskModal() {
    document.getElementById("taskModal").style.display = "none";
}
function closeTaskModalOutside(e) {
    if (e.target.id === "taskModal") closeTaskModal();
}

document.getElementById("taskForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("taskTitleInput").value.trim();
    const subjectId = document.getElementById("taskSubjectSelect").value;
    const minutes = parseInt(document.getElementById("taskMinutesInput").value) || 25;

    if (!title) return;

    try {
        await db.collection("users").doc(currentUser.uid).collection("tasks").add({
            title,
            subjectId,
            minutes,
            completed: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById("taskTitleInput").value = "";
        closeTaskModal();
        loadTasks();
    } catch (err) {
        console.error("Error adding task:", err);
    }
});

async function toggleTaskCompletion(taskId, newStatus) {
    try {
        await db.collection("users").doc(currentUser.uid).collection("tasks").doc(taskId).update({
            completed: newStatus
        });
        loadTasks();
    } catch (err) {
        console.error("Error updating task:", err);
    }
}

async function deleteTask(taskId) {
    if (!confirm("هل أنت متأكد من حذف هذه الجلسة؟")) return;
    try {
        await db.collection("users").doc(currentUser.uid).collection("tasks").doc(taskId).delete();
        loadTasks();
    } catch (err) {
        console.error("Error deleting task:", err);
    }
}

// ==========================================
// 6. SUBJECT DETAILS VIEW
// ==========================================
function openSubjectDetails(subId, subName) {
    currentSubjectId = subId;
    document.getElementById("detailSubjectTitle").textContent = subName;
    document.getElementById("detailSubjectKicker").textContent = "SUBJECT LESSONS";
    
    pages.forEach(page => page.classList.remove("active-page"));
    document.getElementById("subjectDetailsPage").classList.add("active-page");

    renderSubjectLessons();
}

function backToSubjects() {
    currentSubjectId = null;
    pages.forEach(page => page.classList.remove("active-page"));
    document.getElementById("subjects").classList.add("active-page");
}

function renderSubjectLessons() {
    const container = document.getElementById("subjectLessonsContainer");
    if (!container) return;

    const filtered = userTasks.filter(t => t.subjectId === currentSubjectId);

    if (filtered.length === 0) {
        container.innerHTML = `<p style="color: var(--muted); font-size: 13px;">لا توجد دروس أو جلسات مسجلة لهذه المادة حتى الآن.</p>`;
        return;
    }

    container.innerHTML = filtered.map(task => `
        <div class="task-card">
            <div>
                <h4 style="font-size: 15px; font-weight: 900; ${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.title}</h4>
                <span style="font-size: 12px; color: var(--muted);">${task.minutes || 25} دقيقة</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
                ${!task.completed ? `<button class="add-task-small" type="button" onclick="startStudyTimer('${task.id}', '${task.title}', ${task.minutes || 25})">بدء التركيز ⏱</button>` : ''}
                <button class="icon-button" style="width: 36px; height: 36px; font-size: 14px;" type="button" onclick="toggleTaskCompletion('${task.id}', ${!task.completed})">${task.completed ? '↩' : '✓'}</button>
                <button class="icon-button" style="width: 36px; height: 36px; color: #ff4e7b; font-size: 14px;" type="button" onclick="deleteTask('${task.id}')">×</button>
            </div>
        </div>
    `).join('');
}

function openLessonModal() {
    openTaskModal();
}

// ==========================================
// 7. STUDY TIMER LOGIC
// ==========================================
function startStudyTimer(taskId, title, minutes) {
    currentTimerTaskTitle = title;
    timerSecondsRemaining = minutes * 60;
    isTimerRunning = false;
    
    document.getElementById("timerTitle").textContent = title;
    document.getElementById("timerDisplay").textContent = formatTime(timerSecondsRemaining);
    document.getElementById("timerStart").textContent = "▶ ابدأ التركيز";
    document.getElementById("timerOverlay").style.display = "flex";
}

function toggleTimer() {
    const startBtn = document.getElementById("timerStart");
    if (isTimerRunning) {
        clearInterval(activeTimerInterval);
        isTimerRunning = false;
        startBtn.textContent = "▶ استئناف";
    } else {
        isTimerRunning = true;
        startBtn.textContent = "⏸ إيقاف مؤقت";
        activeTimerInterval = setInterval(() => {
            if (timerSecondsRemaining > 0) {
                timerSecondsRemaining--;
                document.getElementById("timerDisplay").textContent = formatTime(timerSecondsRemaining);
            } else {
                clearInterval(activeTimerInterval);
                isTimerRunning = false;
                alert("أحسنت! انتهت جلسة التركيز بنجاح 🎉");
                closeTimer();
            }
        }, 1000);
    }
}

function finishTimer() {
    clearInterval(activeTimerInterval);
    isTimerRunning = false;
    closeTimer();
}

function closeTimer() {
    clearInterval(activeTimerInterval);
    isTimerRunning = false;
    document.getElementById("timerOverlay").style.display = "none";
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ==========================================
// 8. PROGRESS & SETTINGS
// ==========================================
function updateProgressMetrics() {
    const total = userTasks.length;
    const completed = userTasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    const heroPercentage = document.getElementById("heroPercentage");
    const heroProgressFill = document.getElementById("heroProgressFill");
    if (heroPercentage) heroPercentage.textContent = `${percentage}%`;
    if (heroProgressFill) heroProgressFill.style.width = `${percentage}%`;

    const totalMinutes = userTasks.filter(t => t.completed).reduce((acc, t) => acc + (t.minutes || 25), 0);
    const totalStudyTimeEl = document.getElementById("totalStudyTime");
    if (totalStudyTimeEl) totalStudyTimeEl.textContent = `${totalMinutes} دقيقة`;
}

function setupDarkMode() {
    const toggle = document.getElementById("darkModeToggle");
    if (!toggle) return;

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        toggle.checked = true;
    }

    toggle.addEventListener("change", () => {
        if (toggle.checked) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
        }
    });
}
