/* =========================================
   STUDYDAY APP
========================================= */


/* =========================================
   DATE
========================================= */

function updateDate() {

    const dateElement =
        document.getElementById("currentDate");

    if (!dateElement) return;

    const now = new Date();

    const formatter =
        new Intl.DateTimeFormat(
            "ar-SA",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    dateElement.textContent =
        formatter.format(now);
}

updateDate();


/* =========================================
   NAVIGATION
========================================= */

const navItems =
    document.querySelectorAll(".nav-item");

const pages =
    document.querySelectorAll(".page");


navItems.forEach(item => {

    item.addEventListener("click", () => {

        const pageId =
            item.dataset.page;

        navItems.forEach(nav => {

            nav.classList.remove("active");

        });

        item.classList.add("active");


        pages.forEach(page => {

            page.classList.remove(
                "active-page"
            );

        });


        const selectedPage =
            document.getElementById(pageId);

        if (selectedPage) {

            selectedPage.classList.add(
                "active-page"
            );

        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

});


/* =========================================
   ADD TASK MODAL
========================================= */

const taskModal =
    document.getElementById("taskModal");


function openModal() {

    taskModal.classList.add("show");

    document
        .getElementById("taskTitle")
        .focus();
}


function closeModal() {

    taskModal.classList.remove("show");
}


function closeModalOutside(event) {

    if (
        event.target === taskModal
    ) {

        closeModal();

    }

}


/* =========================================
   ADD TASK
========================================= */

const taskForm =
    document.getElementById("taskForm");


taskForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const title =
            document
                .getElementById("taskTitle")
                .value
                .trim();


        const subject =
            document
                .getElementById("taskSubject")
                .value;


        const minutes =
            parseInt(
                document
                    .getElementById("taskMinutes")
                    .value
            );


        if (!title || !minutes) {

            return;

        }


        createTask(
            title,
            subject,
            minutes
        );


        taskForm.reset();

        document
            .getElementById("taskMinutes")
            .value = 30;


        closeModal();

    }
);


/* =========================================
   CREATE TASK
========================================= */

function createTask(
    title,
    subject,
    minutes
) {

    const container =
        document.getElementById(
            "tasksContainer"
        );


    const number =
        container
            .querySelectorAll(
                ".task-card"
            ).length + 1;


    let color = "purple";

    let buttonColor =
        "purple-button";

    let textColor =
        "purple-text";


    if (subject === "برمجة") {

        color = "blue";
        buttonColor = "blue-button";
        textColor = "blue-text";

    }

    else if (subject === "إنجليزي") {

        color = "green";
        buttonColor = "purple-button";
        textColor = "green-text";

    }

    else if (subject === "فيزياء") {

        color = "orange";
        buttonColor = "purple-button";
        textColor = "purple-text";

    }


    let icon = "∫";


    if (subject === "برمجة") {

        icon = "&lt;/&gt;";

    }

    else if (subject === "إنجليزي") {

        icon = "A";

    }

    else if (subject === "فيزياء") {

        icon = "⚛";

    }


    const card =
        document.createElement("article");


    card.className =
        "task-card";


    card.innerHTML = `

        <div class="task-number">
            ${String(number).padStart(2,"0")}
        </div>

        <div class="subject-icon ${color}">
            ${icon}
        </div>

        <div class="task-info">

            <span class="subject-name ${textColor}">
                ${subject}
            </span>

            <h3>
                ${escapeHTML(title)}
            </h3>

            <span class="task-time">
                ◷ ${minutes} دقيقة
            </span>

        </div>

        <button
            class="start-button ${buttonColor}"
            onclick="startStudy('${escapeJS(title)}',${minutes})"
        >
            ابدأ الدراسة
            <span>▶</span>
        </button>

    `;


    container.appendChild(card);


    updateTaskProgress();

}


/* =========================================
   SAFE TEXT
========================================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


function escapeJS(text) {

    return text
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');

}


/* =========================================
   PROGRESS
========================================= */

function updateTaskProgress() {

    const tasks =
        document.querySelectorAll(
            "#tasksContainer .task-card"
        );

    const completed =
        document.querySelectorAll(
            "#tasksContainer .completed"
        );


    if (!tasks.length) return;


    const percentage =
        Math.round(
            (
                completed.length /
                tasks.length
            ) * 100
        );


    const progress =
        document.querySelector(
            ".hero-progress .progress-fill"
        );


    const progressText =
        document.querySelector(
            ".hero-progress .progress-info strong"
        );


    if (progress) {

        progress.style.width =
            Math.max(
                percentage,
                20
            ) + "%";

    }


    if (progressText) {

        progressText.textContent =
            Math.max(
                percentage,
                20
            ) + "%";

    }

}


/* =========================================
   STUDY TIMER
========================================= */

const timerOverlay =
    document.getElementById(
        "timerOverlay"
    );


const timerTitle =
    document.getElementById(
        "timerTitle"
    );


const timerDisplay =
    document.getElementById(
        "timerDisplay"
    );


const timerStart =
    document.getElementById(
        "timerStart"
    );


let timerSeconds = 0;

let timerInterval = null;

let timerRunning = false;

let currentTask = "";


/* =========================================
   START STUDY
========================================= */

function startStudy(
    title,
    minutes
) {

    currentTask = title;

    timerSeconds =
        minutes * 60;


    timerTitle.textContent =
        title;


    updateTimerDisplay();


    timerOverlay.classList.add(
        "show"
    );


    timerRunning = false;


    timerStart.textContent =
        "▶ ابدأ التركيز";

}


/* =========================================
   TOGGLE TIMER
========================================= */

function toggleTimer() {

    if (timerRunning) {

        pauseTimer();

    }

    else {

        runTimer();

    }

}


/* =========================================
   RUN
========================================= */

function runTimer() {

    if (
        timerSeconds <= 0
    ) {

        return;

    }


    timerRunning = true;


    timerStart.textContent =
        "Ⅱ إيقاف مؤقت";


    timerInterval =
        setInterval(() => {

            timerSeconds--;

            updateTimerDisplay();


            if (
                timerSeconds <= 0
            ) {

                finishTimer();

            }

        },1000);

}


/* =========================================
   PAUSE
========================================= */

function pauseTimer() {

    timerRunning = false;


    clearInterval(
        timerInterval
    );


    timerStart.textContent =
        "▶ استئناف";

}


/* =========================================
   UPDATE DISPLAY
========================================= */

function updateTimerDisplay() {

    const minutes =
        Math.floor(
            timerSeconds / 60
        );


    const seconds =
        timerSeconds % 60;


    timerDisplay.textContent =
        `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;

}


/* =========================================
   FINISH TIMER
========================================= */

function finishTimer() {

    clearInterval(
        timerInterval
    );


    timerRunning = false;


    timerOverlay.classList.remove(
        "show"
    );


    markTaskCompleted(
        currentTask
    );


    showSuccess();

}


/* =========================================
   CLOSE TIMER
========================================= */

function closeTimer() {

    clearInterval(
        timerInterval
    );


    timerRunning = false;


    timerOverlay.classList.remove(
        "show"
    );

}


/* =========================================
   MARK TASK COMPLETED
========================================= */

function markTaskCompleted(
    title
) {

    const cards =
        document.querySelectorAll(
            "#tasksContainer .task-card"
        );


    cards.forEach(card => {

        const heading =
            card.querySelector(
                ".task-info h3"
            );


        if (
            heading &&
            heading.textContent.trim()
                === title.trim()
        ) {

            card.classList.add(
                "completed"
            );


            const button =
                card.querySelector(
                    ".start-button"
                );


            if (button) {

                button.disabled = true;

                button.className =
                    "start-button completed-button";

                button.innerHTML =
                    "مكتملة ✓";

            }


            const time =
                card.querySelector(
                    ".task-time"
                );


            if (time) {

                time.textContent =
                    "✓ تم الإنجاز";

            }

        }

    });


    updateTaskProgress();

}


/* =========================================
   SUCCESS MESSAGE
========================================= */

function showSuccess() {

    const message =
        document.createElement(
            "div"
        );


    message.style.cssText = `

        position:fixed;

        top:25px;

        left:50%;

        transform:translateX(-50%);

        background:
            linear-gradient(
                135deg,
                #7654ff,
                #a65aff
            );

        color:white;

        padding:16px 24px;

        border-radius:18px;

        box-shadow:
            0 20px 50px
            rgba(118,84,255,.35);

        z-index:999;

        font-family:Cairo,sans-serif;

        font-size:13px;

        font-weight:800;

        animation:
            successIn .4s ease;

    `;


    message.textContent =
        "🎉 أحسنت! أنجزت جلسة الدراسة";


    document.body.appendChild(
        message
    );


    setTimeout(() => {

        message.remove();

    },3500);

}


/* =========================================
   DARK MODE
========================================= */

const darkModeToggle =
    document.getElementById(
        "darkModeToggle"
    );


darkModeToggle.addEventListener(
    "change",
    function() {

        document.body.classList.toggle(
            "dark",
            this.checked
        );


        localStorage.setItem(
            "studyday-dark",
            this.checked
        );

    }
);


/* =========================================
   LOAD DARK MODE
========================================= */

const savedDarkMode =
    localStorage.getItem(
        "studyday-dark"
    );


if (
    savedDarkMode === "true"
) {

    document.body.classList.add(
        "dark"
    );

    darkModeToggle.checked =
        true;

}


/* =========================================
   ESC KEY
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeModal();

            closeTimer();

        }

    }
);
