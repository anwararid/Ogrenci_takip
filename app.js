// 1. عرض التاريخ الحالي بالعربية
const dateEl = document.getElementById('currentDate');
if (dateEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('ar-SA', options);
}

// 2. التنقل بين الصفحات (Navigation)
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        const targetPage = item.getAttribute('data-page');
        pages.forEach(page => {
            if (page.id === targetPage) {
                page.classList.add('active-page');
            } else {
                page.classList.remove('active-page');
            }
        });
    });
});

// 3. تفعيل زر إزاحة القائمة الجانبية (Sidebar Toggle)
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main');

if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
        if (window.innerWidth > 992) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        } else {
            sidebar.classList.toggle('mobile-show');
        }
    });
}

// 4. النوافذ المنبثقة لإضافة المهام (Modal Management)
const taskModal = document.getElementById('taskModal');
function openModal() {
    if (taskModal) taskModal.style.display = 'flex';
}
function closeModal() {
    if (taskModal) taskModal.style.display = 'none';
}
function closeModalOutside(event) {
    if (event.target === taskModal) closeModal();
}

// 5. إضافة مهمة جديدة ديناميكياً
const taskForm = document.getElementById('taskForm');
const tasksContainer = document.getElementById('tasksContainer');

if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value;
        const subject = document.getElementById('taskSubject').value;
        const minutes = document.getElementById('taskMinutes').value;

        const colorClass = subject === 'منطق رقمي' ? 'purple' : 'blue';
        const textClass = subject === 'منطق رقمي' ? 'purple-text' : 'blue-text';
        const btnClass = subject === 'منطق رقمي' ? 'purple-button' : 'blue-button';
        const iconSymbol = subject === 'منطق رقمي' ? '∫' : '&lt;/&gt;';

        const newTaskCard = document.createElement('article');
        newTaskCard.className = 'task-card';
        newTaskCard.innerHTML = `
            <div class="task-number">جديد</div>
            <div class="subject-icon ${colorClass}">${iconSymbol}</div>
            <div class="task-info">
                <span class="subject-name ${textClass}">${subject}</span>
                <h3>${title}</h3>
                <span class="task-time"><i class="fa-regular fa-clock"></i> ${minutes} دقيقة</span>
            </div>
            <button class="start-button ${btnClass}" type="button" onclick="startStudy('${title}', ${minutes})">
                ابدأ الدراسة <span><i class="fa-solid fa-play"></i></span>
            </button>
        `;

        if (tasksContainer) {
            tasksContainer.appendChild(newTaskCard);
        }

        taskForm.reset();
        closeModal();
    });
}

// 6. نظام مؤقت الدراسة (Study Timer)
const timerOverlay = document.getElementById('timerOverlay');
const timerTitle = document.getElementById('timerTitle');
const timerDisplay = document.getElementById('timerDisplay');
const timerStartBtn = document.getElementById('timerStart');

let countdownInterval = null;
let totalSeconds = 0;
let isRunning = false;

function startStudy(title, minutes) {
    if (timerTitle) timerTitle.textContent = title;
    totalSeconds = minutes * 60;
    updateTimerDisplay();
    if (timerOverlay) timerOverlay.style.display = 'flex';
    if (timerStartBtn) timerStartBtn.textContent = '▶ ابدأ التركيز';
    isRunning = false;
    clearInterval(countdownInterval);
}

function updateTimerDisplay() {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (timerDisplay) {
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

function toggleTimer() {
    if (!isRunning) {
        if (totalSeconds <= 0) return;
        isRunning = true;
        if (timerStartBtn) timerStartBtn.textContent = '⏸ إيقاف مؤقت';
        countdownInterval = setInterval(() => {
            if (totalSeconds > 0) {
                totalSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(countdownInterval);
                isRunning = false;
                alert('انتهت جلسة الدراسة بنجاح! كفو يا أنور 🎉');
                closeTimer();
            }
        }, 1000);
    } else {
        isRunning = false;
        clearInterval(countdownInterval);
        if (timerStartBtn) timerStartBtn.textContent = '▶ استمرار';
    }
}

function finishTimer() {
    clearInterval(countdownInterval);
    isRunning = false;
    closeTimer();
}

function closeTimer() {
    if (timerOverlay) timerOverlay.style.display = 'none';
    clearInterval(countdownInterval);
    isRunning = false;
}

// 7. تفعيل الوضع الداكن (Dark Mode)
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode', darkModeToggle.checked);
    });
}
