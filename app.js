import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

let currentUser = localStorage.getItem('study_tracker_user') || 'زائر';
let allLessons = [];
let activeLesson = null;
let currentFilter = 'ALL';
let searchQuery = '';
let isCardFlipped = false;

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

function updateUIUser() {
    const display = document.getElementById('currentUserNameDisplay');
    const userInput = document.getElementById('usernameInput');
    if (display) display.textContent = currentUser;
    if (userInput) userInput.value = currentUser === 'زائر' ? '' : currentUser;
}

async function loadUserLessons() {
    const listContainer = document.getElementById('lessonsList');
    const badge = document.getElementById('lessonCountBadge');
    if (!listContainer) return;

    if (!currentUser || currentUser === 'زائر') {
        listContainer.className = "col-span-full";
        listContainer.innerHTML = `<div class="text-center py-12 glass-card rounded-2xl"><p class="text-xs text-slate-400">ادخل اسمك في الأعلى واضغط (دخول) لعرض دروسك.</p></div>`;
        if (badge) badge.textContent = '0 دروس';
        return;
    }

    try {
        const q = query(lessonsCollection, where("user", "==", currentUser));
        const querySnapshot = await getDocs(q);

        allLessons = [];
        querySnapshot.forEach(docSnap => {
            allLessons.push({ id: docSnap.id, ...docSnap.data() });
        });

        renderLessons();
    } catch (err) {
        console.error("خطأ جلب البيانات:", err);
    }
}

function renderLessons() {
    const listContainer = document.getElementById('lessonsList');
    const badge = document.getElementById('lessonCountBadge');

    let filtered = allLessons.filter(lesson => {
        const matchQuery = lesson.title.toLowerCase().includes(searchQuery) || lesson.courseName.toLowerCase().includes(searchQuery);
        if (currentFilter === 'DUE') {
            const nextDate = new Date(lesson.srs?.nextReviewDate || new Date());
            return matchQuery && (nextDate <= new Date());
        }
        return matchQuery;
    });

    if (badge) badge.textContent = `${filtered.length} دروس`;

    if (filtered.length === 0) {
        listContainer.className = "col-span-full";
        listContainer.innerHTML = `<div class="text-center py-12 glass-card rounded-2xl"><p class="text-xs text-slate-400">لا توجد دروس تطابق بحثك حالياً.</p></div>`;
        return;
    }

    listContainer.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
    listContainer.innerHTML = '';

    filtered.forEach(lesson => {
        const nextDate = lesson.srs && lesson.srs.nextReviewDate 
            ? new Date(lesson.srs.nextReviewDate).toLocaleDateString('ar-EG') 
            : 'اليوم';

        const card = document.createElement('div');
        card.className = "glass-card hover:border-indigo-500/50 p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 group relative";
        
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">${lesson.courseName}</span>
                    <button class="delete-btn text-slate-500 hover:text-red-400 text-xs px-1" data-id="${lesson.id}">🗑️</button>
                </div>
                <h4 class="font-extrabold text-slate-100 text-sm group-hover:text-indigo-400 transition">${lesson.title}</h4>
                ${lesson.cardQuestion ? `<p class="text-[11px] text-amber-400/90 mt-1 line-clamp-1">🃏 ${lesson.cardQuestion}</p>` : ''}
            </div>
            
            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">المراجعة: <strong class="text-emerald-400">${nextDate}</strong></span>
                <span class="text-indigo-400 font-bold group-hover:translate-x-[-3px] transition">مراجعة 🤖</span>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                e.stopPropagation();
                deleteLesson(lesson.id);
            } else {
                openLessonModal(lesson.id, lesson);
            }
        });

        listContainer.appendChild(card);
    });
}

async function addLesson(courseName, lessonTitle) {
    if (!currentUser || currentUser === 'زائر') return alert("اكتب اسمك أولاً!");

    try {
        const initialSRS = calculateNextReview('HARD');
        await addDoc(lessonsCollection, {
            user: currentUser,
            courseName: courseName,
            title: lessonTitle,
            lessonContent: '',
            cardQuestion: '',
            cardAnswer: '',
            srs: initialSRS,
            createdAt: new Date().toISOString()
        });
        loadUserLessons();
    } catch (e) {
        console.error("خطأ الإضافة:", e);
    }
}

async function deleteLesson(id) {
    if (confirm("هل أنت تأكد من رغبتك في حذف هذا الدرس؟")) {
        try {
            await deleteDoc(doc(db, "lessons", id));
            loadUserLessons();
        } catch (e) {
            console.error("خطأ الحذف:", e);
        }
    }
}

function openLessonModal(id, lessonData) {
    activeLesson = { id, ...lessonData };
    document.getElementById('modalCourseName').textContent = lessonData.courseName;
    document.getElementById('modalLessonTitle').textContent = lessonData.title;

    document.getElementById('lessonContentInput').value = lessonData.lessonContent || '';
    document.getElementById('cardQuestionDisplay').textContent = lessonData.cardQuestion || 'اضغط على زر (✨ توليد بطاقة ذكية) لتوليد بطاقات من المحتوى.';
    document.getElementById('cardAnswerDisplay').textContent = lessonData.cardAnswer || 'الإجابة تظهر هنا.';

    document.getElementById('aiChatBox').innerHTML = `<div class="bg-slate-800/60 text-slate-300 p-2 rounded-xl max-w-[85%]">مرحباً! أنا مساعدك في درس (${lessonData.title}). اسألني أي سؤال عن المحتوى! 👋</div>`;

    resetCardFlip();
    document.getElementById('lessonModal').classList.remove('hidden');
}

function closeLessonModal() {
    document.getElementById('lessonModal').classList.add('hidden');
    activeLesson = null;
}

function toggleCardFlip() {
    const inner = document.getElementById('flashcardInner');
    isCardFlipped = !isCardFlipped;
    if (isCardFlipped) {
        inner.classList.add('rotate-y-180');
    } else {
        inner.classList.remove('rotate-y-180');
    }
}

function resetCardFlip() {
    const inner = document.getElementById('flashcardInner');
    isCardFlipped = false;
    inner.classList.remove('rotate-y-180');
}

async function saveLessonContent() {
    if (!activeLesson) return;
    const content = document.getElementById('lessonContentInput').value.trim();

    try {
        const lessonRef = doc(db, "lessons", activeLesson.id);
        await updateDoc(lessonRef, { lessonContent: content });
        activeLesson.lessonContent = content;
        alert("✅ تم حفظ محتوى الدرس بنجاح!");
    } catch (e) {
        console.error("خطأ حفظ المحتوى:", e);
    }
}

// دالة الاتصال بـ Gemini API المحسنة والمضمونة
async function askGeminiAI(promptText) {
    let apiKey = localStorage.getItem('gemini_api_key');
    
    if (!apiKey) {
        apiKey = prompt("أدخل مفتاح Gemini API الخاص بك للتجربة:");
        if (apiKey) {
            apiKey = apiKey.trim();
            localStorage.setItem('gemini_api_key', apiKey);
        } else {
            return "يرجى إدخال مفتاح API أولاً.";
        }
    }

    const content = activeLesson?.lessonContent || '';
    const fullPrompt = `أنت مساعد تعليمي لدرس (${activeLesson?.title || ''}) في مادة (${activeLesson?.courseName || ''}).\nمحتوى الدرس الحالي:\n${content}\n\nسؤال الطالب: ${promptText}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: fullPrompt }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            console.error("Gemini Error API Response:", data);
            if (data.error?.code === 400 || data.error?.code === 403 || data.error?.status === "UNAUTHENTICATED") {
                localStorage.removeItem('gemini_api_key');
                return "المفتاح غير صحيح أو منتهي الصلاحية. يرجى إعادة كتابة السؤال وتجربة مفتاح جديد.";
            }
            return `حدث خطأ: ${data.error?.message || 'تعذر الاتصال بالخدمة'}`;
        }

        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "لم يتم استلام رد واضح من الذكاء الاصطناعي.";
        }

    } catch (err) {
        console.error("Network Error:", err);
        return "حدث خطأ في الاتصال بالشبكة، تأكد من اتصال الإنترنت وحاول مجدداً.";
    }
}

// إرسال سؤال في الشات
async function handleSendAiChat() {
    const input = document.getElementById('aiChatInput');
    const text = input.value.trim();
    if (!text) return;

    const chatBox = document.getElementById('aiChatBox');
    
    chatBox.innerHTML += `<div class="bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 p-2 rounded-xl max-w-[85%] mr-auto">${text}</div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    const loadingId = "loading-" + Date.now();
    chatBox.innerHTML += `<div id="${loadingId}" class="bg-slate-800/60 text-amber-400 p-2 rounded-xl max-w-[85%] text-[10px]">جاري التفكير... ⏳</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    const aiResponse = await askGeminiAI(text);

    const loader = document.getElementById(loadingId);
    if (loader) loader.remove();

    chatBox.innerHTML += `<div class="bg-slate-800/80 text-slate-200 p-2 rounded-xl max-w-[85%] border border-slate-700/50">${aiResponse.replace(/\n/g, '<br>')}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

// توليد بطاقة Flashcard تلقائياً من محتوى الدرس
async function generateAutoFlashcard() {
    const content = document.getElementById('lessonContentInput').value.trim();
    if (!content) return alert("يرجى إدخال ملخص أو محتوى الدرس أولاً في الصندوق أعلاه ليتمكن AI من استخراج سؤال منه!");

    const btn = document.getElementById('autoGenFlashcardBtn');
    btn.textContent = "جاري التوليد... ⏳";

    const promptText = `بناءً على النص التالي من الدرس، استخرج سؤالاً مهم وإجابته القصيرة. أرجع الإجابة بتنسيق JSON فقط بالشكل التالي دون أي مقدمات:
{"question": "السؤال هنا", "answer": "الإجابة هنا"}

النص:
${content}`;

    try {
        const rawResponse = await askGeminiAI(promptText);
        const cleanJsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJsonStr);

        const lessonRef = doc(db, "lessons", activeLesson.id);
        await updateDoc(lessonRef, { cardQuestion: parsed.question, cardAnswer: parsed.answer });

        activeLesson.cardQuestion = parsed.question;
        activeLesson.cardAnswer = parsed.answer;

        document.getElementById('cardQuestionDisplay').textContent = parsed.question;
        document.getElementById('cardAnswerDisplay').textContent = parsed.answer;

        alert("✨ تم توليد سؤال وإجابة ذكية بنجاح!");
        loadUserLessons();
    } catch (e) {
        console.error("JSON parse error:", e);
        alert("لم نتمكن من صياغة بطاقة تلقائياً، تأكد من كتابة نص كافٍ في المحتوى واعد المحاولة.");
    } finally {
        btn.textContent = "✨ توليد بطاقة ذكية";
    }
}

async function rateLesson(difficulty) {
    if (!activeLesson) return;
    const currentSRS = activeLesson.srs || { intervalDays: 1, repetitionCount: 0, easeFactor: 2.5 };
    const updatedSRS = calculateNextReview(difficulty, currentSRS);

    try {
        const lessonRef = doc(db, "lessons", activeLesson.id);
        await updateDoc(lessonRef, { srs: updatedSRS });
        closeLessonModal();
        loadUserLessons();
    } catch (e) {
        console.error("خطأ التحديث:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateUIUser();
    loadUserLessons();

    document.getElementById('saveUserBtn').addEventListener('click', () => {
        const val = document.getElementById('usernameInput').value.trim();
        if (val) {
            currentUser = val;
            localStorage.setItem('study_tracker_user', currentUser);
            updateUIUser();
            loadUserLessons();
        }
    });

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

    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderLessons();
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.className = "filter-btn bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold px-3 py-1.5 rounded-lg transition border border-slate-800";
            });
            e.currentTarget.className = "filter-btn bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition";
            currentFilter = e.currentTarget.getAttribute('data-filter');
            renderLessons();
        });
    });

    document.getElementById('flashcardContainer').addEventListener('click', toggleCardFlip);
    document.getElementById('saveContentBtn').addEventListener('click', saveLessonContent);
    document.getElementById('autoGenFlashcardBtn').addEventListener('click', generateAutoFlashcard);
    document.getElementById('sendAiChatBtn').addEventListener('click', handleSendAiChat);
    document.getElementById('aiChatInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSendAiChat(); });
    document.getElementById('closeModalBtn').addEventListener('click', closeLessonModal);

    document.querySelectorAll('.rate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = e.currentTarget.getAttribute('data-level');
            rateLesson(level);
        });
    });
});
