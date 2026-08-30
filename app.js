// ========================================
// StudyLoop - التطبيق الأساسي
// ========================================

const state = {
    lessons: []
};


// ========================================
// العناصر
// ========================================

const lessonModal = document.getElementById("lessonModal");
const addLessonButton = document.getElementById("addLessonButton");
const emptyAddButton = document.getElementById("emptyAddButton");
const closeModalButton = document.getElementById("closeModalButton");

const lessonForm = document.getElementById("lessonForm");
const emptyState = document.getElementById("emptyState");
const lessonsList = document.getElementById("lessonsList");


// ========================================
// فتح نافذة إضافة درس
// ========================================

function openLessonModal() {
    lessonModal.hidden = false;
}


// ========================================
// إغلاق النافذة
// ========================================

function closeLessonModal() {
    lessonModal.hidden = true;
    lessonForm.reset();
}


// ========================================
// إضافة درس
// ========================================

function addLesson(event) {

    event.preventDefault();

    const subject =
        document.getElementById("subjectName").value.trim();

    const name =
        document.getElementById("lessonName").value.trim();

    const duration =
        document.getElementById("studyDuration").value;


    if (subject === "" || name === "") {
        alert("يرجى تعبئة جميع الحقول");
        return;
    }


    const lesson = {
        id: Date.now(),
        subject: subject,
        name: name,
        duration: duration
    };


    state.lessons.push(lesson);

    saveLessons();

    renderLessons();

    closeLessonModal();
}


// ========================================
// عرض الدروس
// ========================================

function renderLessons() {

    if (state.lessons.length === 0) {

        emptyState.hidden = false;
        lessonsList.hidden = true;

        return;
    }


    emptyState.hidden = true;
    lessonsList.hidden = false;


    lessonsList.innerHTML = "";


    state.lessons.forEach(function (lesson) {

        const card = document.createElement("div");

        card.className = "lesson-card";


        card.innerHTML = `
            <div>
                <span class="lesson-subject">
                    ${lesson.subject}
                </span>

                <h4>
                    ${lesson.name}
                </h4>
            </div>

            <div style="margin-top: 12px;">
                ⏱️ ${lesson.duration} دقيقة
            </div>

            <button
                class="start-lesson-button"
                data-id="${lesson.id}"
                style="
                    margin-top: 15px;
                    padding: 10px 15px;
                    border-radius: 10px;
                    background: #5b5bd6;
                    color: white;
                "
            >
                ابدأ الدراسة
            </button>
        `;


        lessonsList.appendChild(card);

    });
}


// ========================================
// حفظ الدروس
// ========================================

function saveLessons() {

    localStorage.setItem(
        "studyloop_lessons",
        JSON.stringify(state.lessons)
    );
}


// ========================================
// تحميل الدروس
// ========================================

function loadLessons() {

    const savedLessons =
        localStorage.getItem("studyloop_lessons");


    if (!savedLessons) {
        return;
    }


    try {

        state.lessons =
            JSON.parse(savedLessons);

    } catch (error) {

        console.error(error);

        state.lessons = [];

    }
}


// ========================================
// الأحداث
// ========================================

addLessonButton.addEventListener(
    "click",
    openLessonModal
);


emptyAddButton.addEventListener(
    "click",
    openLessonModal
);


closeModalButton.addEventListener(
    "click",
    closeLessonModal
);


lessonForm.addEventListener(
    "submit",
    addLesson
);


// إغلاق النافذة عند الضغط خارجها

lessonModal.addEventListener(
    "click",
    function (event) {

        if (event.target === lessonModal) {
            closeLessonModal();
        }

    }
);


// إغلاق النافذة بزر ESC

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {
            closeLessonModal();
        }

    }
);


// ========================================
// تشغيل التطبيق
// ========================================

loadLessons();

renderLessons();
