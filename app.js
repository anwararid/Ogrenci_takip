import { 
    auth, 
    db, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    doc,
    setDoc
} from "./firebase-config.js";

// DOM Elements
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('app');
const loginFormContainer = document.getElementById('loginFormContainer');
const registerFormContainer = document.getElementById('registerFormContainer');
const showRegisterButton = document.getElementById('showRegisterButton');
const showLoginButton = document.getElementById('showLoginButton');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutButton = document.getElementById('logoutButton');

const userNameSpan = document.getElementById('userName');
const welcomeText = document.getElementById('welcomeText');

const totalLessonsEl = document.getElementById('totalLessons');
const totalSubjectsEl = document.getElementById('totalSubjects');
const reviewLessonsEl = document.getElementById('reviewLessons');
const totalMinutesEl = document.getElementById('totalMinutes');

const addLessonButton = document.getElementById('addLessonButton');
const emptyAddButton = document.getElementById('emptyAddButton');
const closeModalButton = document.getElementById('closeModalButton');
const lessonModal = document.getElementById('lessonModal');
const lessonForm = document.getElementById('lessonForm');
const emptyState = document.getElementById('emptyState');
const lessonsList = document.getElementById('lessonsList');

let currentUser = null;
let unsubscribeLessons = null;
let activeTimer = null;

// Navigation Logic
showRegisterButton?.addEventListener('click', () => {
    loginFormContainer.hidden = true;
    registerFormContainer.hidden = false;
});

showLoginButton?.addEventListener('click', () => {
    registerFormContainer.hidden = true;
    loginFormContainer.hidden = false;
});

// Modal Logic
const openModal = () => lessonModal.hidden = false;
const closeModal = () => {
    lessonModal.hidden = true;
    lessonForm.reset();
};

addLessonButton?.addEventListener('click', openModal);
emptyAddButton?.addEventListener('click', openModal);
closeModalButton?.addEventListener('click', closeModal);

// Auth Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        authScreen.hidden = true;
        appScreen.hidden = false;
        
        const name = user.displayName || user.email.split('@')[0];
        userNameSpan.textContent = name;
        welcomeText.textContent = `مرحبًا بك 👋 ${name}`;

        listenToLessons(user.uid);
    } else {
        currentUser = null;
        if (unsubscribeLessons) unsubscribeLessons();
        appScreen.hidden = true;
        authScreen.hidden = false;
    }
});

// Authentication Handlers
registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), { name, email }, { merge: true }).catch(() => {});
        registerForm.reset();
    } catch (error) {
        console.error("Register Error:", error.message);
    }
});

loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginForm.reset();
    } catch (error) {
        console.error("Login Error:", error.message);
    }
});

logoutButton?.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Error:", error.message);
    }
});

// Add Lesson
lessonForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const subject = document.getElementById('subjectName').value;
    const name = document.getElementById('lessonName').value;
    const duration = parseInt(document.getElementById('studyDuration').value);

    try {
        await addDoc(collection(db, "lessons"), {
            userId: currentUser.uid,
            subject,
            name,
            duration,
            createdAt: serverTimestamp(),
            nextReview: new Date().toISOString()
        });
        closeModal();
    } catch (error) {
        console.error("Add Lesson Error:", error);
    }
});

// Realtime Listener
function listenToLessons(userId) {
    const q = query(collection(db, "lessons"), where("userId", "==", userId));
    
    unsubscribeLessons = onSnapshot(q, (snapshot) => {
        const lessons = [];
        snapshot.forEach((doc) => lessons.push({ id: doc.id, ...doc.data() }));

        updateStats(lessons);
        renderLessons(lessons);
    });
}

function updateStats(lessons) {
    totalLessonsEl.textContent = lessons.length;
    
    const subjects = new Set(lessons.map(l => l.subject));
    totalSubjectsEl.textContent = subjects.size;

    const totalMins = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
    totalMinutesEl.textContent = totalMins;

    reviewLessonsEl.textContent = lessons.length;
}

// Render Lessons
function renderLessons(lessons) {
    if (lessons.length === 0) {
        emptyState.hidden = false;
        lessonsList.hidden = true;
        return;
    }

    emptyState.hidden = true;
    lessonsList.hidden = false;
    lessonsList.innerHTML = '';

    lessons.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.innerHTML = `
            <div>
                <span class="lesson-subject">${lesson.subject}</span>
                <h4>${lesson.name}</h4>
            </div>
            <div class="lesson-meta">
                <span>⏱️ ${lesson.duration} دقيقة</span>
            </div>
            <button class="start-lesson-button" type="button">
                ▶ بدء الدراسة
            </button>
        `;

        const startBtn = card.querySelector('.start-lesson-button');
        startBtn.addEventListener('click', () => {
            startStudySession(lesson.name, lesson.duration);
        });

        lessonsList.appendChild(card);
    });
}

// Study Session Timer
function startStudySession(lessonName, durationMinutes) {
    if (activeTimer) clearInterval(activeTimer);

    let secondsLeft = durationMinutes * 60;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';

    const box = document.createElement('div');
    box.className = 'modal';
    box.style.textAlign = 'center';

    box.innerHTML = `
        <h3 style="font-size: 18px; color: #a78bfa; margin-bottom: 8px;">جلسة دراسة جارية 📚</h3>
        <h4 style="font-size: 20px; color: #f8fafc; margin-bottom: 20px;">${lessonName}</h4>
        <div id="timerDisplay" style="font-size: 48px; font-weight: 700; color: #10b981; margin: 20px 0; font-family: monospace;">
            ${formatTime(secondsLeft)}
        </div>
        <button id="stopTimerBtn" class="btn-primary" style="background: #ef4444; width: 100%;">إنهاء الجلسة</button>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const timerDisplay = box.querySelector('#timerDisplay');
    const stopBtn = box.querySelector('#stopTimerBtn');

    activeTimer = setInterval(() => {
        secondsLeft--;
        timerDisplay.textContent = formatTime(secondsLeft);

        if (secondsLeft <= 0) {
            clearInterval(activeTimer);
            timerDisplay.textContent = "🎉 انتهى الوقت!";
            stopBtn.textContent = "إغلاق";
        }
    }, 1000);

    stopBtn.addEventListener('click', () => {
        clearInterval(activeTimer);
        overlay.remove();
    });
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
