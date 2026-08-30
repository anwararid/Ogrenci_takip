import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// إعدادات Firebase الخاصة بك
const firebaseConfig = {
  apiKey: "AIzaSyDU305vBeN7sBA8hNTmAFofk",
  authDomain: "ogrenci-ders-takibi-e7d57.firebaseapp.com",
  projectId: "ogrenci-ders-takibi-e7d57",
  storageBucket: "ogrenci-ders-takibi-e7d57.firebasestorage.app",
  messagingSenderId: "762782404099",
  appId: "1:762782404099:web:67ba2c4aff1d",
  measurementId: "G-GPDLXNL3GZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const lessonsCollection = collection(db, "lessons");

// حالة التطبيق المحلية
let currentUser = localStorage.getItem('study_tracker_user') || 'زائر';
let activeLesson = null;
let timerInterval = null;
let timeLeftSeconds = 25 * 60;
let isTimerRunning = false;

// ==========================================
// 1. خوارزمية التكرار المتباعد
// ==========================================
function calculateNextReview(difficulty, srsData = { intervalDays: 1, repetitionCount: 0, easeFactor: 2.5 }) {
    let { intervalDays, repetitionCount, easeFactor } = srsData;

    if (difficulty === 'HARD') {
        repetitionCount = 0;
        intervalDays = 1;
    } else if (difficulty === 'MEDIUM') {
        repetitionCount += 1;
        intervalDays = Math.round(intervalDays * 1.5) || 3;
    } else if (difficulty === 'EASY') {
        repetitionCount += 1;
        intervalDays = repetitionCount === 1 ? 3 : (repetitionCount === 2 ? 6 : Math.round(intervalDays * easeFactor));
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    return {
        intervalDays,
        repetitionCount,
        easeFactor,
        lastReviewedAt: new Date().toISOString(),
        nextReviewDate: nextReviewDate.toISOString()
    };
}

// ==========================================
// 2. إدارة المستخدم والدروس الخاصة
// ==========================================
function updateUIUser() {
    const display = document.getElementById('currentUserNameDisplay');
    const userInput = document.getElementById('usernameInput');
    if (display) display.textContent = currentUser;
    if (userInput) userInput.value = currentUser === 'زائر' ? '' : currentUser;
}

// تحميل دروس المستخدم الحالي فقط من Firestore
async function loadUserLessons() {
    const listContainer = document.getElementById('lessonsList');
    const badge = document.getElementById('lessonCountBadge');
    if (!listContainer) return;

    if (!currentUser || currentUser === 'زائر') {
        listContainer.innerHTML = `<p class="text-xs text-slate-500 text-center py-8">اكتب اسمك بالإعلى واضغط (دخول) لعرض دروسك الخاصة.</p>`;
        if (badge) badge.textContent = '0 دروس';
        return;
    }

    try {
        const q = query(lessonsCollection, where("user", "==", currentUser));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            listContainer.innerHTML = `<p class="text-xs text-slate-400 text-center py-8">لا يوجد دروس مضافة بعد باسم (${currentUser}). قم بإضافة درسك الأول!</p>`;
            if (badge) badge.textContent = '0 دروس';
            return;
        }

        if (badge) badge.textContent = `${querySnapshot.size} دروس`;
        listContainer.innerHTML = '';

        querySnapshot.forEach((docSnapshot) => {
            const lesson = docSnapshot.data();
            const lessonId = docSnapshot.id;
            const nextDate = lesson.srs && lesson.srs.nextReviewDate 
                ? new Date(lesson.srs.nextReviewDate).toLocaleDateString('ar-EG') 
                : 'اليوم';

            const card = document.createElement('div');
            card.className = "bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl cursor-pointer transition flex justify-between items-center group";
            card.innerHTML = `
                <div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">${lesson.courseName}</span>
                    <h4 class="font-bold text-slate-100 text-sm mt-1.5 group-hover:text-indigo-400 transition">${lesson.title}</h4>
                    <p class="text-[11px] text-slate-400 mt-1">المراجعة القادمة: <span class="text-emerald-400">${nextDate}</span></p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">تكرار: ${lesson.srs ? lesson.srs.repetitionCount : 0}</span>
                    <span class="text-slate-500 group-hover:translate-x-[-2px] transition">👈</span>
                </div>
            `;

            card.addEventListener('click', () => openLessonModal(lessonId, lesson));
            listContainer.appendChild(card);
        });

    } catch (err) {
        console.error("خطأ جلب البيانات:", err);
    }
}

// إضافة درس جديد للمستخدم
async function addLesson(courseName, lessonTitle) {
    if (!currentUser || currentUser === 'زائر') {
        alert("يرجى كتابة اسمك في الأعلى واختيار دخول أولاً!");
        return;
    }

    try {
        const initialSRS = calculateNextReview('HARD');
        await addDoc(lessonsCollection, {
            user: currentUser,
            courseName: courseName,
            title: lessonTitle,
            srs: initialSRS,
            createdAt: new Date().toISOString()
        });

        alert("✅ تم إدراج الدرس بنجاح إلى قائمتك!");
        loadUserLessons();
    } catch (e) {
        console.error("خطأ الإضافة:", e);
    }
}

// ==========================================
// 3. النافذة التفاعلية والدروس المحددة
// ==========================================
function openLessonModal(id, lessonData) {
    activeLesson = { id, ...lessonData };

    document.getElementById('modalCourseName').textContent = lessonData.courseName;
    document.getElementById('modalLessonTitle').textContent = lessonData.title;
    document.getElementById('modalRepetitionCount').textContent = lessonData.srs ? lessonData.srs.repetitionCount : 0;
    
    const nextDate = lessonData.srs && lessonData.srs.nextReviewDate 
        ? new Date(lessonData.srs.nextReviewDate).toLocaleDateString('ar-EG') 
        : 'اليوم';
    document.getElementById('modalNextReviewDate').textContent = nextDate;

    resetModalTimer();
    document.getElementById('lessonModal').classList.remove('hidden');
}

function closeLessonModal() {
    document.getElementById('lessonModal').classList.add('hidden');
    clearInterval(timerInterval);
    isTimerRunning = false;
    activeLesson = null;
}

// تحديث مستوى الفهم وحفظ التكرار المتباعد
async function rateLesson(difficulty) {
    if (!activeLesson) return;

    const currentSRS = activeLesson.srs || { intervalDays: 1, repetitionCount: 0, easeFactor: 2.5 };
    const updatedSRS = calculateNextReview(difficulty, currentSRS);

    try {
        const lessonRef = doc(db, "lessons", activeLesson.id);
        await updateDoc(lessonRef, { srs: updatedSRS });

        alert("🎉 تم تحديث جدول مراجعة الدرس بحسب استيعابك!");
        closeLessonModal();
        loadUserLessons();
    } catch (e) {
        console.error("خطأ التحديث:", e);
    }
}

// ==========================================
// 4. مؤقت البومودورو المخصص
// ==========================================
function updateModalTimerDisplay() {
    const display = document.getElementById('modalTimerDisplay');
    if (!display) return;
    const mins = Math.floor(timeLeftSeconds / 60);
    const secs = timeLeftSeconds % 60;
    display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startModalTimer() {
    const btn = document.getElementById('modalStartTimerBtn');
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        if (btn) btn.textContent = 'استئناف الجلسة';
        return;
    }

    isTimerRunning = true;
    if (btn) btn.textContent = 'إيقاف مؤقت';
    timerInterval = setInterval(() => {
        if (timeLeftSeconds > 0) {
            timeLeftSeconds--;
            updateModalTimerDisplay();
        } else {
            clearInterval(timerInterval);
            isTimerRunning = false;
            alert(`🎉 أحسنت! أنهيت جلسة تركيز للدرس (${activeLesson ? activeLesson.title : ''})`);
            resetModalTimer();
        }
    }, 1000);
}

function resetModalTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeftSeconds = 25 * 60;
    updateModalTimerDisplay();
    const btn = document.getElementById('modalStartTimerBtn');
    if (btn) btn.textContent = 'بدء الجلسة';
}

// ==========================================
// 5. التهيئة والأحداث
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    updateUIUser();
    loadUserLessons();

    // حفظ المستخدم
    document.getElementById('saveUserBtn').addEventListener('click', () => {
        const val = document.getElementById('usernameInput').value.trim();
        if (val) {
            currentUser = val;
            localStorage.setItem('study_tracker_user', currentUser);
            updateUIUser();
            loadUserLessons();
        }
    });

    // إضافة درس
    document.getElementById('addLessonForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const inputs = e.target.querySelectorAll('input');
        const course = inputs[0].value.trim();
        const title = inputs[1].value.trim();
        if (course && title) {
            addLesson(course, title);
            e.target.reset();
        }
    });

    // إغلاق النافذة
    document.getElementById('closeModalBtn').addEventListener('click', closeLessonModal);

    // مؤقت النافذة
    document.getElementById('modalStartTimerBtn').addEventListener('click', startModalTimer);
    document.getElementById('modalResetTimerBtn').addEventListener('click', resetModalTimer);

    // أزرار التقييم
    document.querySelectorAll('.rate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = e.currentTarget.getAttribute('data-level');
            rateLesson(level);
        });
    });
});
