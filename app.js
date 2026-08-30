/* =========================================
   StudyLoop — Application Logic
========================================= */

const state = {
    lessons: []
};


/* =========================================
   DOM Elements
========================================= */

const lessonModal = document.getElementById("lessonModal");

const addLessonButton =
    document.getElementById("addLessonButton");

const emptyAddButton =
    document.getElementById("emptyAddButton");

const closeModalButton =
    document.getElementById("closeModalButton");

const lessonForm =
    document.getElementById("lessonForm");

const emptyState =
    document.getElementById("emptyState");

const lessonsList =
    document.getElementById("lessonsList");


/* =========================================
   Open Modal
========================================= */

function openLessonModal() {
    lessonModal.hidden = false;

    document.body.style.overflow = "hidden";

    setTimeout(() => {
        document.getElementById("subjectName").focus();
    }, 100);
}


/* =========================================
   Close Modal
========================================= */

function closeLessonModal() {
    lessonModal.hidden = true;

    document.body.style.overflow = "";

    lessonForm.reset();
}


/* =========================================
   Add Lesson
========================================= */

function addLesson(event) {
    event.preventDefault();

    const subject =
        document
            .getElementById("subjectName")
            .value
            .trim();

    const name =
        document
            .getElementById("lessonName")
            .value
            .trim();

    const duration =
        Number(
            document
                .getElementById("studyDuration")
                .value
        );


    if (!subject || !name) {
        return;
    }


    const lesson = {
        id: Date.now(),

        subject: subject,

        name: name,

        duration: duration,

        createdAt: new Date(),

        nextReview: new Date()
    };


    state.lessons.push(lesson);

    saveLessons();

    renderLessons();

    closeLessonModal();
}


/* =========================================
   Render Lessons
========================================= */

function renderLessons() {

    if (state.lessons.length === 0) {

        emptyState.hidden = false;

        lessonsList.hidden = true;

        return;
    }


    emptyState.hidden = true;

    lessonsList.hidden = false;


    lessonsList.innerHTML =
        state.lessons
            .map(createLessonCard)
            .join("");
}


/* =========================================
   Create Lesson Card
========================================= */

function createLessonCard(lesson) {

    return `
        <article class="lesson-card">

            <div class="lesson-card-top">

                <div>

                    <span class="lesson-subject">
                        ${escapeHTML(lesson.subject)}
                    </span>

                    <h4>
                        ${escapeHTML(lesson.name)}
                    </h4>

                </div>

                <span class="lesson-status">
                    اليوم
                </span>

            </div>


            <div class="lesson-card-bottom">

                <span>
                    ⏱️ ${lesson.duration} دقيقة
                </span>

                <button
                    class="start-lesson-button"
                    data-id="${lesson.id}"
                >
                    ابدأ الدراسة
                </button>

            </div>

        </article>
    `;
}


/* =========================================
   Start Lesson
========================================= */

function startLesson(id) {

    const lesson =
        state.lessons.find(
            item => item.id === id
        );


    if (!lesson) {
        return;
    }


    alert(
        `سنبدأ قريبًا جلسة دراسة: ${lesson.name}`
    );
}


/* =========================================
   Save Locally
========================================= */

function saveLessons() {

    localStorage.setItem(
        "studyloop_lessons",
        JSON.stringify(state.lessons)
    );
}


/* =========================================
   Load Locally
========================================= */

function loadLessons() {

    const saved =
        localStorage.getItem(
            "studyloop_lessons"
        );


    if (!saved) {
        return;
    }


    try {

        state.lessons =
            JSON.parse(saved);

    } catch (error) {

        console.error(
            "Unable to load lessons:",
            error
        );

        state.lessons = [];
    }
}


/* =========================================
   Escape HTML
========================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


/* =========================================
   Event Listeners
========================================= */

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


/* Close when clicking outside */

lessonModal.addEventListener(
    "click",
    event => {

        if (
            event.target === lessonModal
        ) {
            closeLessonModal();
        }

    }
);


/* Close with Escape */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !lessonModal.hidden
        ) {
            closeLessonModal();
        }

    }
);


/* Start lesson buttons */

lessonsList.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".start-lesson-button"
            );


        if (!button) {
            return;
        }


        const id =
            Number(
                button.dataset.id
            );


        startLesson(id);
    }
);


/* =========================================
   Initialize
========================================= */

loadLessons();

renderLessons();
