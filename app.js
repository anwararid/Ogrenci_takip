import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ========================================
// Firebase Configuration
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyDU3O5vBeN7sBA8hNTmAFofkTcWYS1YjsQ",
    authDomain: "ogrenci-ders-takibi-e7d57.firebaseapp.com",
    projectId: "ogrenci-ders-takibi-e7d57",
    storageBucket: "ogrenci-ders-takibi-e7d57.firebasestorage.app",
    messagingSenderId: "762782404099",
    appId: "1:762782404099:web:67ba2c4aff1e8230360836",
    measurementId: "G-GPDLXNL3GZ"
};


// ========================================
// Initialize Firebase
// ========================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// ========================================
// State
// ========================================

const state = {
    lessons: []
};


// ========================================
// DOM
// ========================================

const lessonModal =
    document.getElementById("lessonModal");

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


// ========================================
// Open Modal
// ========================================

function openLessonModal() {
    lessonModal.hidden = false;
}


// ========================================
// Close Modal
// ========================================

function closeLessonModal() {
    lessonModal.hidden = true;
    lessonForm.reset();
}


// ========================================
// Add Lesson To Firestore
// ========================================

async function addLesson(event) {

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

        alert("يرجى تعبئة جميع الحقول");

        return;
    }


    try {

        const lessonData = {

            subject: subject,

            name: name,

            duration: duration,

            createdAt: new Date(),

            nextReview: new Date()

        };


        await addDoc(
            collection(db, "lessons"),
            lessonData
        );


        alert("تم حفظ الدرس بنجاح ✅");


        lessonForm.reset();

        closeLessonModal();


        await loadLessons();


    } catch (error) {

        console.error(
            "Firestore error:",
            error
        );


        alert(
            "حدث خطأ أثناء حفظ الدرس. تأكد من إعدادات Firestore."
        );
    }
}


// ========================================
// Load Lessons
// ========================================

async function loadLessons() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "lessons")
            );


        state.lessons = [];


        snapshot.forEach(
            function (document) {

                state.lessons.push({

                    id: document.id,

                    ...document.data()

                });

            }
        );


        renderLessons();


    } catch (error) {

        console.error(
            "Loading lessons failed:",
            error
        );

        renderLessons();
    }
}


// ========================================
// Render
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


    state.lessons.forEach(
        function (lesson) {

            const card =
                document.createElement("div");


            card.className =
                "lesson-card";


            card.innerHTML = `

                <div>

                    <span class="lesson-subject">
                        ${escapeHTML(lesson.subject)}
                    </span>

                    <h4>
                        ${escapeHTML(lesson.name)}
                    </h4>

                </div>

                <div style="margin-top: 12px;">
                    ⏱️ ${lesson.duration} دقيقة
                </div>

                <button
                    class="start-lesson-button"
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

        }
    );
}


// ========================================
// Escape HTML
// ========================================

function escapeHTML(value) {

    const element =
        document.createElement("div");

    element.textContent =
        value ?? "";

    return element.innerHTML;
}


// ========================================
// Events
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


lessonModal.addEventListener(
    "click",
    function (event) {

        if (event.target === lessonModal) {

            closeLessonModal();

        }

    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeLessonModal();

        }

    }
);


// ========================================
// Start
// ========================================

loadLessons();
