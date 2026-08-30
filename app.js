// ==========================================
// 1. خوارزمية التكرار المتباعد (Spaced Repetition System)
// ==========================================

/**
 * حساب تاريخ المراجعة القادمة استناداً لمستوى استيعاب الطالب
 * @param {string} difficulty - مستوى الفهم ('EASY', 'MEDIUM', 'HARD')
 * @param {object} srsData - البيانات الحالية للتكرار
 */
function calculateNextReview(difficulty, srsData = { intervalDays: 1, repetitionCount: 0, easeFactor: 2.5 }) {
    let { intervalDays, repetitionCount, easeFactor } = srsData;

    if (difficulty === 'HARD') {
        // إذا كان الفهم صعباً (🔴): إعادة من البداية وتكرار غداً
        repetitionCount = 0;
        intervalDays = 1;
    } else if (difficulty === 'MEDIUM') {
        // إذا كان الفهم متوسطاً (🟡): تكرار بعد 3 أيام
        repetitionCount += 1;
        intervalDays = Math.round(intervalDays * 1.5) || 3;
    } else if (difficulty === 'EASY') {
        // إذا كان الفهم ممتازاً (🟢): تضاعف الفترة المتباعدة
        repetitionCount += 1;
        if (repetitionCount === 1) {
            intervalDays = 3;
        } else if (repetitionCount === 2) {
            intervalDays = 6;
        } else {
            intervalDays = Math.round(intervalDays * easeFactor);
        }
    }

    // حساب التاريخ القادم
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
// 2. مؤقت البومودورو (Pomodoro Timer)
// ==========================================
let timerInterval = null;
let timeLeftSeconds = 25 * 60; // 25 دقيقة
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
        document.getElementById('startTimerBtn').classList.replace('bg-amber-600', 'bg-indigo-600');
        return;
    }

    isTimerRunning = true;
    document.getElementById('startTimerBtn').textContent = 'إيقاف مؤقت';
    document.getElementById('startTimerBtn').classList.replace('bg-indigo-600', 'bg-amber-600');

    timerInterval = setInterval(() => {
        if (timeLeftSeconds > 0) {
            timeLeftSeconds--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            isTimerRunning = false;
            alert('🎉 انتهت جلسة التركيز! خذ استراحة لمدة 5 دقائق.');
            resetTimer();
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeftSeconds = 25 * 60;
    updateTimerDisplay();
    const startBtn = document.getElementById('startTimerBtn');
    if (startBtn) {
        startBtn.textContent = 'بدء';
        startBtn.className = 'bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2 rounded-xl transition';
    }
}

// ==========================================
// 3. إدارة الأحداث وتجهيز الصفحة
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    updateTimerDisplay();

    const startBtn = document.getElementById('startTimerBtn');
    const resetBtn = document.getElementById('resetTimerBtn');

    if (startBtn) startBtn.addEventListener('click', startTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);
});
