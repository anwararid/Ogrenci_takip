import { db, collection, addDoc, getDocs } from "./firebase-config.js";

// ==========================================
// 1. خوارزمية التكرار المتباعد (Spaced Repetition)
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
// 2. جلب وتسجيل الدروس في Firestore
// ==========================================
const lessonsCollection = collection(db, "lessons");

// إضافة درس جديد
async function addLesson(courseName, lessonTitle) {
    try {
        const initialSRS = calculateNextReview('HARD'); // البداية تكرار قريب
        await addDoc(lessonsCollection, {
            courseName,
            title: lessonTitle,
            understandingLevel: 'MEDIUM',
            srs: initialSRS,
            createdAt: new Date().toISOString()
        });
        alert("تم حفظ الدرس بنجاح في السحاب! 🚀");
        loadLessons(); // إعادة تحميل القائمة
    } catch (error) {
        console.error("خطأ في حفظ الدرس: ", error);
    }
}

// عرض الدروس في الصفحة
async function loadLessons() {
    const lessonsListContainer = document.getElementById('lessonsList');
    if (!lessonsListContainer) return;

    try {
        const querySnapshot = await getDocs(lessonsCollection);
        if (querySnapshot.empty) return;

        lessonsListContainer.innerHTML = ''; // مسح المحتوى القديم

        querySnapshot.forEach((doc) => {
            const lesson = doc.data();
            const lessonCard = `
                <div class="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <span class="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300">${lesson.courseName}</span>
                        <h3 class="font-bold text-slate-100 mt-1">${lesson.title}</h3>
                        <p class="text-xs text-slate-400 mt-1">تاريخ المراجعة القادمة: ${new Date(lesson.srs.nextReviewDate).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div class="flex gap-1.5 w-full sm:w-auto justify-end">
                        <button class="px-3 py-1.5 text-xs bg-red-950/40 border border-red-800 text-red-300 rounded-lg">🔴 صعب</button>
                        <button class="px-3 py-1.5 text-xs bg-amber-950/40 border border-amber-800 text-amber-300 rounded-lg">🟡 متوسط</button>
                        <button class="px-3 py-1.5 text-xs bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-lg">🟢 ممتاز</button>
                    </div>
                </div>
            `;
            lessonsListContainer.innerHTML += lessonCard;
        });
    } catch (e) {
        console.error("خطأ في جلب البيانات: ", e);
    }
}

// ==========================================
// 3. مؤقت البومودورو والأحداث
// ==========================================
let timerInterval = null;
let timeLeftSeconds = 25 * 60;
let isTimerRunning = false;

function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    if (!display) return;
    const minutes = Math.floor(timeLeftSeconds / 60);
    const seconds = timeLeftSeconds % 60;
    display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        document.getElementById('startTimerBtn').textContent = 'بدء';
        return;
    }
    isTimerRunning = true;
    document.getElementById('startTimerBtn').textContent = 'إيقاف مؤقت';
    timerInterval = setInterval(() => {
        if (timeLeftSeconds > 0) {
            timeLeftSeconds--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            alert('🎉 انتهت جلسة التركيز!');
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    updateTimerDisplay();
    loadLessons();

    const startBtn = document.getElementById('startTimerBtn');
    if (startBtn) startBtn.addEventListener('click', startTimer);

    // ربط نموذج الإضافة
    const form = document.getElementById('addLessonForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = form.querySelectorAll('input');
            const courseName = inputs[0].value;
            const lessonTitle = inputs[1].value;
            if (courseName && lessonTitle) {
                addLesson(courseName, lessonTitle);
                form.reset();
            }
        });
    }
});
