// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD4xuqY5FDdiEwlYpkC1cfMEN1aIwPtB_A",
    authDomain: "studentcom-3e387.firebaseapp.com",
    projectId: "studentcom-3e387",
    databaseURL: "https://studentcom-3e387-default-rtdb.firebaseio.com",
    messagingSenderId: "284949876238",
    appId: "1:284949876238:web:d6a8cde91411a033e9f65f"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Global Variables
let currentUser = { id: "", role: "", name: "", photo: "" };
let currentClass = "Class 5";
let studentsData = [];
let teacherAssignedClasses = [];
let classRoutine = {};
let teacherImageBase64 = "", studentImageBase64 = "";
let currentStudentsList = [];
let selectedFiles = [];
let selectedVideos = [];

const SELF_SMS_URL = "https://selfsms.onrender.com";

const classes = [
    "Class 5", "Class 6", "Class 7", "Class 8",
    "Class 9 (Science)", "Class 9 (Commerce)", "Class 9 (Humanities)",
    "Class 10 (Science)", "Class 10 (Commerce)", "Class 10 (Humanities)",
    "SSC Special Batch (Science)", "SSC Special Batch (Commerce)", "SSC Special Batch (Humanities)"
];

const days = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];

function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]); }

function getBanglaDayName(englishDay) {
    const dayMap = { 'Saturday': 'শনিবার', 'Sunday': 'রবিবার', 'Monday': 'সোমবার', 'Tuesday': 'মঙ্গলবার', 'Wednesday': 'বুধবার', 'Thursday': 'বৃহস্পতিবার', 'Friday': 'শুক্রবার' };
    return dayMap[englishDay] || englishDay;
}
function getTodayDayName() { const daysEng = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; return getBanglaDayName(daysEng[new Date().getDay()]); }
function getTomorrowDayName() { const daysEng = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']; const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); return getBanglaDayName(daysEng[tomorrow.getDay()]); }

function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    let clean = phoneNumber.toString().replace(/[^0-9]/g, '');
    if (clean.length === 13 && clean.startsWith('8801')) return clean;
    if (clean.length === 11 && clean.startsWith('01')) return '880' + clean.substring(1);
    let last10 = clean.slice(-10);
    return '8801' + last10;
}

async function sendAbsentSMS(phoneNumber, studentName, className, date, teacherName) {
    if (!phoneNumber) return { success: false, error: "ফোন নম্বর প্রয়োজন" };
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone || formattedPhone.length !== 13) return { success: false, error: `ফোন নম্বর সঠিক নয়` };
    const banglaDate = date ? new Date(date).toLocaleDateString('bn-BD') : 'আজ';
    const message = `মাস্টারমাইন্ড অ্যাকাডেমি\n\nপ্রিয় অভিভাবক,\n${studentName} ${banglaDate} তারিখে ${className} ক্লাসে উপস্থিত ছিলেন না।\n\nধন্যবাদ\n${teacherName || 'মাস্টারমাইন্ড অ্যাকাডেমি'}`;
    try {
        const response = await fetch(`${SELF_SMS_URL}/send-sms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: formattedPhone, message }) });
        return await response.json();
    } catch(error) { return { success: false, error: error.message }; }
}

const defaultRoutine = {
    "Class 5": { "শনিবার": "গণিত", "রবিবার": "বাংলা", "সোমবার": "ইংরেজি", "মঙ্গলবার": "বিজ্ঞান", "বুধবার": "সামাজিক", "বৃহস্পতিবার": "ধর্ম", "শুক্রবার": "ছুটি" },
    "Class 6": { "শনিবার": "বিজ্ঞান", "রবিবার": "গণিত", "সোমবার": "বাংলা", "মঙ্গলবার": "ইংরেজি", "বুধবার": "কম্পিউটার", "বৃহস্পতিবার": "সাধারণ জ্ঞান", "শুক্রবার": "ছুটি" },
    "Class 7": { "শনিবার": "ইংরেজি", "রবিবার": "বিজ্ঞান", "সোমবার": "গণিত", "মঙ্গলবার": "বাংলা", "বুধবার": "সামাজিক", "বৃহস্পতিবার": "ধর্ম", "শুক্রবার": "ছুটি" },
    "Class 8": { "শনিবার": "বাংলা", "রবিবার": "ইংরেজি", "সোমবার": "গণিত", "মঙ্গলবার": "বিজ্ঞান", "বুধবার": "কৃষি", "বৃহস্পতিবার": "কম্পিউটার", "শুক্রবার": "ছুটি" },
    "Class 9 (Science)": { "শনিবার": "পদার্থবিজ্ঞান", "রবিবার": "রসায়ন", "সোমবার": "জীববিজ্ঞান", "মঙ্গলবার": "উচ্চতর গণিত", "বুধবার": "বাংলা", "বৃহস্পতিবার": "ইংরেজি", "শুক্রবার": "ছুটি" },
    "Class 9 (Commerce)": { "শনিবার": "হিসাববিজ্ঞান", "রবিবার": "ব্যবসায় উদ্যোগ", "সোমবার": "অর্থনীতি", "মঙ্গলবার": "গণিত", "বুধবার": "বাংলা", "বৃহস্পতিবার": "ইংরেজি", "শুক্রবার": "ছুটি" },
    "Class 9 (Humanities)": { "শনিবার": "ইতিহাস", "রবিবার": "ভূগোল", "সোমবার": "নাগরিকতা", "মঙ্গলবার": "অর্থনীতি", "বুধবার": "বাংলা", "বৃহস্পতিবার": "ইংরেজি", "শুক্রবার": "ছুটি" },
    "Class 10 (Science)": { "শনিবার": "রসায়ন", "রবিবার": "পদার্থবিজ্ঞান", "সোমবার": "জীববিজ্ঞান", "মঙ্গলবার": "উচ্চতর গণিত", "বুধবার": "ইংরেজি", "বৃহস্পতিবার": "বাংলা", "শুক্রবার": "ছুটি" },
    "Class 10 (Commerce)": { "শনিবার": "ব্যবস্থাপনা", "রবিবার": "হিসাববিজ্ঞান", "সোমবার": "ব্যবসায় গণিত", "মঙ্গলবার": "অর্থনীতি", "বুধবার": "ইংরেজি", "বৃহস্পতিবার": "বাংলা", "শুক্রবার": "ছুটি" },
    "Class 10 (Humanities)": { "শনিবার": "ইতিহাস", "রবিবার": "ভূগোল", "সোমবার": "সমাজবিজ্ঞান", "মঙ্গলবার": "নীতিশাস্ত্র", "বুধবার": "ইংরেজি", "বৃহস্পতিবার": "বাংলা", "শুক্রবার": "ছুটি" },
    "SSC Special Batch (Science)": { "শনিবার": "বাংলা (MCQ)", "রবিবার": "ইংরেজি (MCQ)", "সোমবার": "গণিত (MCQ)", "মঙ্গলবার": "সাধারণ বিজ্ঞান", "বুধবার": "মডেল টেস্ট", "বৃহস্পতিবার": "মডেল টেস্ট", "শুক্রবার": "ছুটি" },
    "SSC Special Batch (Commerce)": { "শনিবার": "বাংলা (MCQ)", "রবিবার": "ইংরেজি (MCQ)", "সোমবার": "ব্যবসায় গণিত", "মঙ্গলবার": "হিসাববিজ্ঞান", "বুধবার": "মডেল টেস্ট", "বৃহস্পতিবার": "মডেল টেস্ট", "শুক্রবার": "ছুটি" },
    "SSC Special Batch (Humanities)": { "শনিবার": "বাংলা (MCQ)", "রবিবার": "ইংরেজি (MCQ)", "সোমবার": "ইতিহাস", "মঙ্গলবার": "ভূগোল", "বুধবার": "মডেল টেস্ট", "বৃহস্পতিবার": "মডেল টেস্ট", "শুক্রবার": "ছুটি" }
};

async function loadRoutineFromFirebase() {
    const snap = await db.ref('class_routines').get();
    if(snap.exists()) classRoutine = snap.val();
    else { classRoutine = JSON.parse(JSON.stringify(defaultRoutine)); await db.ref('class_routines').set(classRoutine); }
    return classRoutine;
}

async function showTodayTomorrowRoutine() {
    const routine = await loadRoutineFromFirebase();
    const container = document.getElementById('todayTomorrowRoutine');
    if(!container) return;
    const todayName = getTodayDayName(), tomorrowName = getTomorrowDayName();
    if(currentUser.role === 'student') {
        let clsRoutine = routine[currentClass] || routine["Class 5"];
        container.innerHTML = `<div class="today-routine-card"><h3>📚 আজকের ক্লাস (${todayName})</h3><div class="routine-subject">${clsRoutine[todayName] || 'ক্লাস নেই'}</div><p>আপনার ক্লাস: ${currentClass}</p></div><div class="tomorrow-routine-card"><h3>📚 আগামীকালের ক্লাস (${tomorrowName})</h3><div class="routine-subject">${clsRoutine[tomorrowName] || 'ক্লাস নেই'}</div></div>`;
    } else {
        let todayHtml = `<div class="today-routine-card"><h3>📚 আজকের ক্লাস (${todayName})</h3>`, tomorrowHtml = `<div class="tomorrow-routine-card"><h3>📚 আগামীকালের ক্লাস (${tomorrowName})</h3>`;
        for(let cls of classes) {
            let clsRoutine = routine[cls] || routine["Class 5"];
            todayHtml += `<p><strong>${cls}:</strong> ${clsRoutine[todayName] || 'ক্লাস নেই'}</p>`;
            tomorrowHtml += `<p><strong>${cls}:</strong> ${clsRoutine[tomorrowName] || 'ক্লাস নেই'}</p>`;
        }
        container.innerHTML = todayHtml + `</div>` + tomorrowHtml + `</div>`;
    }
}

async function loadDashboard() {
    const snap = await db.ref('registered_teachers').get();
    const container = document.getElementById('teachersGrid');
    if(!snap.exists()) { container.innerHTML = '<div class="empty-state">কোন শিক্ষক নেই</div>'; return; }
    let html = '';
    for(let key in snap.val()) {
        let t = snap.val()[key];
        let photo = t.photo || `https://ui-avatars.com/api/?background=0a3b2e&color=fff&name=${t.teacher_name}`;
        html += `<div class="teacher-card"><img src="${photo}"><h3>${escapeHtml(t.teacher_name)}</h3><p>📚 ${t.classes?.join(', ') || '—'}</p></div>`;
    }
    container.innerHTML = html;
}

async function loadStudentOwnAttendance() {
    if(currentUser.role !== 'student') return;
    const classKey = currentClass.replace(/\s+/g,'_').replace(/\(/g,'').replace(/\)/g,'');
    const studentId = currentUser.id;
    let year = new Date().getFullYear(), month = new Date().getMonth();
    const updateCalendar = async () => {
        const daysInMonth = new Date(year, month+1, 0).getDate();
        let presentCount = 0, absentCount = 0, totalDays = 0;
        let attendanceHtml = `<div class="calendar-grid">`;
        const weekdays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
        weekdays.forEach(day => attendanceHtml += `<div class="cal-day-header">${day}</div>`);
        const firstDay = new Date(year, month, 1).getDay();
        for(let i=0; i<firstDay; i++) attendanceHtml += `<div class="cal-day empty"></div>`;
        for(let d=1; d<=daysInMonth; d++) {
            let dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            let snap = await db.ref(`attendances/${classKey}/${dateStr}/${studentId}`).get();
            let isPresent = snap.exists() && snap.val() === true;
            let isToday = (new Date().toISOString().split('T')[0] === dateStr);
            let todayClass = isToday ? ' today' : '';
            if(isPresent) { presentCount++; totalDays++; attendanceHtml += `<div class="cal-day present${todayClass}"><div class="date-num">${d}</div><div class="status-icon">✅ উপস্থিত</div></div>`; }
            else if(snap.exists() && snap.val() === false) { absentCount++; totalDays++; attendanceHtml += `<div class="cal-day absent${todayClass}"><div class="date-num">${d}</div><div class="status-icon">❌ অনুপস্থিত</div></div>`; }
            else { attendanceHtml += `<div class="cal-day${todayClass}"><div class="date-num">${d}</div><div class="status-icon">—</div></div>`; }
        }
        attendanceHtml += `</div>`;
        document.getElementById('studentCalendarGrid').innerHTML = attendanceHtml;
        let percentage = totalDays ? ((presentCount/totalDays)*100).toFixed(1) : 0;
        document.getElementById('studentSummary').innerHTML = `<div class="summary-item"><div class="number">${presentCount}</div><div>উপস্থিত</div></div><div class="summary-item"><div class="number">${absentCount}</div><div>অনুপস্থিত</div></div><div class="summary-item"><div class="number">${percentage}%</div><div>উপস্থিতির হার</div></div><div class="summary-item"><div class="number">${totalDays}</div><div>মোট কার্যদিবস</div></div>`;
    };
    const months = ['জানুয়ারী','ফেব্রুয়ারী','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
    let selectorHtml = `<select id="studentMonthYearPicker">`;
    for(let y of [2025,2026]) for(let m=0; m<12; m++) selectorHtml += `<option value="${y}-${m}" ${(y===year && m===month)?'selected':''}>${months[m]} ${y}</option>`;
    selectorHtml += `</select><button class="btn btn-blue" id="refreshStudentMonthBtn">দেখুন</button>`;
    document.getElementById('studentMonthSelector').innerHTML = selectorHtml;
    document.getElementById('refreshStudentMonthBtn').onclick = () => { const val = document.getElementById('studentMonthYearPicker').value; [year, month] = val.split('-').map(Number); updateCalendar(); };
    await updateCalendar();
}

async function loadTeacherPanel() {
    const snap = await db.ref(`registered_teachers/${currentUser.id}`).get();
    if(!snap.exists()) return;
    const teacher = snap.val();
    teacherAssignedClasses = teacher.classes || [];
    let photoHtml = teacher.photo ? `<img src="${teacher.photo}" style="width:80px;height:80px;border-radius:50%;">` : `<i class="fas fa-chalkboard-user" style="font-size:60px;"></i>`;
    document.getElementById('teacherProfileArea').innerHTML = `<div>${photoHtml}<h3>${escapeHtml(teacher.teacher_name)}</h3><p>আইডি: ${teacher.teacher_id}</p></div>`;
    if(teacherAssignedClasses.length === 0) { document.getElementById('teacherAssignedClasses').innerHTML = '<div class="teacher-class-card"><p>আপনার কোনো ক্লাস বরাদ্দ নেই।</p></div>'; return; }
    let classHtml = `<div class="teacher-class-card"><h4>আমার ক্লাসসমূহ</h4><div style="display:flex; flex-wrap:wrap; gap:10px;">`;
    for(let cls of teacherAssignedClasses) classHtml += `<button class="btn btn-blue teacher-class-btn" data-class="${cls}">📖 ${cls}</button>`;
    classHtml += `</div></div>`;
    document.getElementById('teacherAssignedClasses').innerHTML = classHtml;
    document.querySelectorAll('.teacher-class-btn').forEach(btn => { btn.onclick = () => loadTeacherClassStudents(btn.dataset.class); });
    if(teacherAssignedClasses.length > 0) await loadTeacherClassStudents(teacherAssignedClasses[0]);
}

async function loadTeacherClassStudents(className) {
    const classKey = className.replace(/\s+/g,'_').replace(/\(/g,'').replace(/\)/g,'');
    const snap = await db.ref(`class_sheets/${classKey}/students`).get();
    const students = snap.exists() ? snap.val() : [];
    if(students.length === 0) { document.getElementById('teacherClassStudents').innerHTML = `<div class="teacher-class-card"><h4>${className}</h4><p>কোন ছাত্র/ছাত্রী নেই।</p></div>`; return; }
    let html = `<div class="teacher-class-card"><h4>${className} - ছাত্র/ছাত্রীবৃন্দ</h4>`;
    students.forEach(s => { html += `<div class="student-list-item"><img src="${s.photo || 'https://ui-avatars.com/api/?background=0a3b2e&color=fff&name='+s.name}"><div><strong>${escapeHtml(s.name)}</strong><br><small>ID: ${s.id}</small><br>${s.guardian_phone ? `<small>📱 ${s.guardian_phone}</small>` : '<small>⚠️ ফোন নেই</small>'}</div></div>`; });
    html += `</div>`;
    document.getElementById('teacherClassStudents').innerHTML = html;
}

async function loadStudentFeedback() {
    const area = document.getElementById('studentFeedbackArea');
    if(!area) return;
    const teachersSnap = await db.ref('registered_teachers').get();
    if(!teachersSnap.exists()) { area.innerHTML='<div class="empty-state">কোন শিক্ষক নেই</div>'; return; }
    const allTeachers = Object.values(teachersSnap.val());
    const classTeachers = allTeachers.filter(teacher => teacher.classes && teacher.classes.includes(currentClass));
    if(classTeachers.length === 0) { area.innerHTML='<div class="empty-state">আপনার ক্লাসের কোনো শিক্ষক নেই।</div>'; return; }
    const classKeyForDB = currentClass.replace(/\s+/g, '_').replace(/\(/g,'').replace(/\)/g,'');
    area.innerHTML = '';
    for(let t of classTeachers) {
        const existing = await db.ref(`secret_evaluations/${classKeyForDB}/${currentUser.id}/${t.teacher_id}`).get();
        const comment = existing.exists() ? existing.val().comment : '';
        const div = document.createElement('div');
        div.className = 'feedback-item';
        div.innerHTML = `<div style="display:flex; align-items:center; gap:10px;"><img src="${t.photo || 'https://ui-avatars.com/api/?background=1e7b4a&color=fff&name='+t.teacher_name}" style="width:40px;height:40px;border-radius:50%;"><strong>${escapeHtml(t.teacher_name)}</strong></div><textarea id="fb_${t.teacher_id}" rows="2" placeholder="আপনার মতামত দিন...">${escapeHtml(comment)}</textarea><div style="text-align:right;"><span id="saved_${t.teacher_id}" style="color:green; display:none;">✓ সংরক্ষিত</span></div>`;
        area.appendChild(div);
        const ta = document.getElementById(`fb_${t.teacher_id}`);
        let timer;
        ta.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(async () => {
                await db.ref(`secret_evaluations/${classKeyForDB}/${currentUser.id}/${t.teacher_id}`).set({ studentName: currentUser.name, teacherName: t.teacher_name, comment: ta.value, timestamp: new Date().toISOString() });
                const savedSpan = document.getElementById(`saved_${t.teacher_id}`);
                if(savedSpan) { savedSpan.style.display = 'inline-block'; setTimeout(()=>savedSpan.style.display='none', 1500); }
            }, 700);
        });
    }
}

async function initAttendancePanel() {
    const teacherSection = document.getElementById('teacherAttendanceSection');
    const studentSection = document.getElementById('studentHistorySection');
    if(currentUser.role === 'student') {
        if(teacherSection) teacherSection.style.display = 'none';
        if(studentSection) studentSection.style.display = 'block';
        await loadStudentOwnAttendance();
    } else {
        if(teacherSection) teacherSection.style.display = 'block';
        if(studentSection) studentSection.style.display = 'none';
        await loadAttendanceClassSelect();
        document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('loadStudentsBtn').onclick = () => loadStudentsForDate();
        document.getElementById('saveAttendanceBtn').onclick = () => saveAttendance();
        await loadClassMonthlyCalendar();
    }
}

async function loadAttendanceClassSelect() {
    const classSelect = document.getElementById('attendanceClassSelect');
    if(currentUser.role === 'teacher') classSelect.innerHTML = teacherAssignedClasses.map(c => `<option value="${c}">${c}</option>`).join('');
    else classSelect.innerHTML = classes.map(c => `<option value="${c}">${c}</option>`).join('');
}

async function loadStudentsForDate() {
    const className = document.getElementById('attendanceClassSelect').value;
    const date = document.getElementById('attendanceDate').value;
    if(!className || !date) { alert('ক্লাস এবং তারিখ নির্বাচন করুন'); return; }
    if(currentUser.role === 'teacher' && !teacherAssignedClasses.includes(className)) { alert('আপনি এই ক্লাসে উপস্থিতি দিতে পারবেন না।'); return; }
    const classKey = className.replace(/\s+/g,'_').replace(/\(/g,'').replace(/\)/g,'');
    const studentsSnap = await db.ref(`class_sheets/${classKey}/students`).get();
    const students = studentsSnap.exists() ? studentsSnap.val() : [];
    if(students.length === 0) { alert('এই ক্লাসে কোনো ছাত্র/ছাত্রী নেই'); return; }
    let attendanceMap = {};
    const attSnap = await db.ref(`attendances/${classKey}/${date}`).get();
    if(attSnap.exists()) attendanceMap = attSnap.val();
    currentStudentsList = students.map(s => ({ ...s, present: attendanceMap[s.id] === true }));
    let html = `<div class="attendance-info">মোট ছাত্র/ছাত্রী: ${students.length} জন</div>`;
    currentStudentsList.forEach((s, idx) => {
        let photo = s.photo || `https://ui-avatars.com/api/?background=0a3b2e&color=fff&name=${s.name}`;
        html += `<div class="student-att-row"><img src="${photo}" style="width:40px;height:40px;border-radius:50%;"><div style="flex:1;"><strong>${escapeHtml(s.name)}</strong><br><small>ID: ${s.id}</small><br>${s.guardian_phone ? `<small>📱 ${s.guardian_phone}</small>` : ''}</div><label class="toggle-switch"><input type="checkbox" class="att-student-cb" data-idx="${idx}" ${s.present ? 'checked' : ''}><span class="slider"></span></label></div>`;
    });
    document.getElementById('studentAttendanceList').innerHTML = html;
    document.getElementById('selectedDateDisplay').innerText = date;
    document.getElementById('studentAttendanceSection').style.display = 'block';
    document.querySelectorAll('.att-student-cb').forEach(cb => { cb.addEventListener('change', (e) => { let idx = parseInt(cb.dataset.idx); currentStudentsList[idx].present = cb.checked; }); });
}

async function saveAttendance() {
    const className = document.getElementById('attendanceClassSelect').value;
    const date = document.getElementById('attendanceDate').value;
    const classKey = className.replace(/\s+/g,'_').replace(/\(/g,'').replace(/\)/g,'');
    let attendanceData = {};
    currentStudentsList.forEach(s => { attendanceData[s.id] = s.present === true; });
    await db.ref(`attendances/${classKey}/${date}`).set(attendanceData);
    const absentStudents = currentStudentsList.filter(s => s.present !== true && s.guardian_phone);
    const presentCount = currentStudentsList.filter(s => s.present === true).length;
    alert(`✅ উপস্থিতি সংরক্ষিত! উপস্থিত: ${presentCount}, অনুপস্থিত: ${absentStudents.length}`);
    await loadClassMonthlyCalendar();
}

async function loadClassMonthlyCalendar() {
    const className = document.getElementById('attendanceClassSelect').value;
    if(!className) return;
    const classKey = className.replace(/\s+/g,'_').replace(/\(/g,'').replace(/\)/g,'');
    let year = new Date().getFullYear(), month = new Date().getMonth();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    let attendanceData = {};
    for(let d=1; d<=daysInMonth; d++) {
        let dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        let snap = await db.ref(`attendances/${classKey}/${dateStr}`).get();
        if(snap.exists()) { let data = snap.val(); let total = Object.keys(data).length; let present = Object.values(data).filter(v=>v===true).length; attendanceData[dateStr] = { present, total }; }
    }
    let html = `<div class="calendar-grid">`;
    const weekdays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
    weekdays.forEach(day => html += `<div class="cal-day-header">${day}</div>`);
    for(let i=0; i<firstDay; i++) html += `<div class="cal-day empty"></div>`;
    for(let d=1; d<=daysInMonth; d++) {
        let dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        let att = attendanceData[dateStr];
        if(att) html += `<div class="cal-day present"><div class="date-num">${d}</div><div class="status-icon">✅ ${att.present}/${att.total}</div></div>`;
        else html += `<div class="cal-day absent"><div class="date-num">${d}</div><div class="status-icon">❌ ডাটা নেই</div></div>`;
    }
    html += `</div>`;
    document.getElementById('classMonthlyCalendar').innerHTML = html;
}

// Social Feed Functions
function setupMediaPreview() {
    const fileInput = document.getElementById('feedImageInput');
    if(!fileInput) return;
    fileInput.addEventListener('change', (e) => {
        selectedFiles = []; selectedVideos = [];
        const preview = document.getElementById('imagePreviewContainer');
        preview.innerHTML = '';
        Array.from(e.target.files).forEach(file => {
            if(file.type.startsWith('image/')) {
                selectedFiles.push(file);
                const reader = new FileReader();
                reader.onload = ev => { preview.innerHTML += `<div style="position:relative; display:inline-block; margin:5px;"><img src="${ev.target.result}" style="width:80px;height:80px;object-fit:cover;border-radius:10px;"><button onclick="this.parentElement.remove()" style="position:absolute;top:-5px;right:-5px;background:red;color:white;border-radius:50%;">&times;</button></div>`; };
                reader.readAsDataURL(file);
            } else if(file.type.startsWith('video/')) { selectedVideos.push(file); const url = URL.createObjectURL(file); preview.innerHTML += `<div style="position:relative;"><video src="${url}" style="width:80px;height:80px;object-fit:cover;"></video><button onclick="this.parentElement.remove()">×</button></div>`; }
        });
    });
}

window.publishPost = async () => {
    let cap = document.getElementById('feedCaption').value.trim();
    if(!cap) { alert('ক্যাপশন লিখুন'); return; }
    let author = currentUser.role === 'admin' ? '🎓 প্রশাসক' : (currentUser.role === 'teacher' ? `👨‍🏫 ${currentUser.name}` : `🧑‍🎓 ${currentUser.name}`);
    let media = [];
    for(let f of selectedFiles) { const reader = new FileReader(); reader.readAsDataURL(f); await new Promise(r => { reader.onload = () => { media.push({ type:'image', data:reader.result }); r(); }; }); }
    for(let v of selectedVideos) { const reader = new FileReader(); reader.readAsDataURL(v); await new Promise(r => { reader.onload = () => { media.push({ type:'video', data:reader.result }); r(); }; }); }
    await db.ref('social_feed').push({ caption: cap, media, author, authorId: currentUser.id, authorRole: currentUser.role, timestamp: Date.now(), userId: currentUser.id, reactions: { '👍':0,'❤️':0 }, userReactions: {}, comments: {} });
    document.getElementById('feedCaption').value = ''; document.getElementById('feedImageInput').value = ''; document.getElementById('imagePreviewContainer').innerHTML = ''; selectedFiles = []; selectedVideos = [];
    alert('✅ পোস্ট প্রকাশিত হয়েছে!');
};

function loadSocialFeed() {
    db.ref('social_feed').on('value', (snap) => {
        let container = document.getElementById('socialFeedContainer');
        container.innerHTML = '';
        let data = snap.val();
        if(!data) { container.innerHTML = '<div class="empty-feed">কোনো পোস্ট নেই</div>'; return; }
        Object.entries(data).sort((a,b)=>b[1].timestamp-a[1].timestamp).forEach(([pid, post]) => {
            let reactions = post.reactions || { '👍':0,'❤️':0 };
            let showDelete = (currentUser.role === 'admin') || (currentUser.id === post.userId);
            let mediaHtml = '';
            if(post.media && post.media.length) mediaHtml = `<div class="fb-single-media"><img src="${post.media[0].data}" style="width:100%"></div>`;
            let card = document.createElement('div');
            card.className = 'fb-post-card';
            card.innerHTML = `<div class="fb-post-header"><div class="fb-post-avatar"><i class="fas fa-user"></i></div><div class="fb-post-info"><div class="fb-post-author">${escapeHtml(post.author)}</div><div class="fb-post-time">${new Date(post.timestamp).toLocaleString()}</div></div>${showDelete ? `<button onclick="db.ref('social_feed/${pid}').remove()" style="background:none;border:none;">🗑️</button>` : ''}</div><div class="fb-post-caption">${escapeHtml(post.caption)}</div>${mediaHtml}<div class="fb-reaction-bar"><span>👍 ${reactions['👍']} ❤️ ${reactions['❤️']}</span></div><div class="fb-action-buttons"><button class="fb-action-btn" onclick="addReaction('${pid}','👍')">👍 পছন্দ</button><button class="fb-action-btn" onclick="addReaction('${pid}','❤️')">❤️ ভালো লাগে</button></div>`;
            container.appendChild(card);
        });
    });
}
window.addReaction = async (postId, emoji) => { const postRef = db.ref(`social_feed/${postId}`); const snap = await postRef.get(); if(snap.exists()) { let reactions = snap.val().reactions || { '👍':0,'❤️':0 }; reactions[emoji] = (reactions[emoji]||0)+1; await postRef.update({ reactions }); } };

// Admin Functions
let currentManageClass = "Class 5";
function loadClassButtons() {
    let cont = document.getElementById('classButtons');
    cont.innerHTML = '';
    for(let c of classes) {
        let btn = document.createElement('div');
        btn.className = 'class-btn';
        btn.innerHTML = `📖 ${c}`;
        btn.onclick = () => { document.querySelectorAll('.class-btn').forEach(b=>b.style.background='#eef2f5'); btn.style.background='#f5b042'; currentManageClass=c; document.getElementById('selectedClassName').innerHTML=currentManageClass; loadClassData(currentManageClass); };
        cont.appendChild(btn);
    }
    loadClassData(currentManageClass);
}
async function loadClassData(className) {
    const classKey = className.replace(/\s+/g,'_').replace(/\(/g,'').replace(/\)/g,'');
    const snap = await db.ref(`class_sheets/${classKey}/students`).get();
    studentsData = snap.exists() ? snap.val() : [];
    renderStudentsTable();
}
function renderStudentsTable() {
    let cont = document.getElementById('classStudentsTable');
    if(!studentsData.length) { cont.innerHTML='<div class="empty-state">কোন ছাত্র/ছাত্রী নেই</div>'; return; }
    let html = `<table><thead><tr><th>ছবি</th><th>ক্রমিক</th><th>আইডি</th><th>নাম</th><th>পাসওয়ার্ড</th><th>মোবাইল</th><th>অ্যাকশন</th></tr></thead><tbody>`;
    studentsData.forEach((s,i) => {
        html += `<tr><td><i class="fas fa-user-circle"></i></td><td>${i+1}</td><td>${escapeHtml(s.id)}</td><td><input class="editName" data-idx="${i}" value="${escapeHtml(s.name)}"></td><td><input class="editPass" data-idx="${i}" value="${escapeHtml(s.password)}"></td><td><input class="editPhone" data-idx="${i}" value="${escapeHtml(s.guardian_phone||'')}"></td><td><button class="btn-red btn-sm" onclick="studentsData.splice(${i},1); renderStudentsTable()">মুছুন</button></td></tr>`;
    });
    html += `</tbody></table>`;
    cont.innerHTML = html;
    document.querySelectorAll('.editName').forEach(inp => inp.onchange = (e) => studentsData[inp.dataset.idx].name = inp.value);
    document.querySelectorAll('.editPass').forEach(inp => inp.onchange = (e) => studentsData[inp.dataset.idx].password = inp.value);
    document.querySelectorAll('.editPhone').forEach(inp => inp.onchange = (e) => studentsData[inp.dataset.idx].guardian_phone = inp.value);
}
document.getElementById('addCousinBtn').onclick = () => {
    let name = document.getElementById('cousinName').value.trim();
    let id = document.getElementById('cousinId').value.trim().toLowerCase();
    let pwd = document.getElementById('cousinPass').value.trim();
    if(!name || !id || !pwd) { alert('নাম, আইডি, পাসওয়ার্ড দরকার'); return; }
    studentsData.push({ id, name, password:pwd, photo: studentImageBase64, guardian_phone: document.getElementById('cousinGuardianPhone').value.trim() });
    document.getElementById('cousinName').value = ''; document.getElementById('cousinId').value = ''; document.getElementById('cousinPass').value = ''; document.getElementById('cousinGuardianPhone').value = '';
    renderStudentsTable();
};
document.getElementById('saveClassBtn').onclick = async () => { const classKey = currentManageClass.replace(/\s+/g,'_').replace(/\(/g,'').replace(/\)/g,''); await db.ref(`class_sheets/${classKey}`).set({ students: studentsData }); alert('সংরক্ষিত!'); };
document.getElementById('createTeacherBtn').onclick = async () => {
    const name = document.getElementById('newTeacherName').value.trim(), id = document.getElementById('newTeacherId').value.trim().toLowerCase(), pwd = document.getElementById('newTeacherPass').value.trim();
    if(!name || !id || !pwd) { alert('সব তথ্য দিন'); return; }
    const selected = []; document.querySelectorAll('.teacherClassCheckbox:checked').forEach(cb => selected.push(cb.value));
    await db.ref(`registered_teachers/${id}`).set({ teacher_name: name, teacher_id: id, password: pwd, classes: selected, photo: teacherImageBase64 });
    alert('শিক্ষক তৈরি সফল!');
    loadTeachersTableView(); loadDashboard();
};
async function loadTeachersTableView() {
    const snap = await db.ref('registered_teachers').get();
    const container = document.getElementById('teachersTable');
    if(!snap.exists()) { container.innerHTML = '<div class="empty-state">কোন শিক্ষক নেই</div>'; return; }
    let html = `<table><thead><tr><th>ছবি</th><th>নাম</th><th>আইডি</th><th>ক্লাস</th><th>অ্যাকশন</th></tr></thead><tbody>`;
    for(let key in snap.val()) {
        let t = snap.val()[key];
        html += `<tr><td><i class="fas fa-user-circle"></i></td><td>${escapeHtml(t.teacher_name)}</td><td>${t.teacher_id}</td><td>${t.classes?.join(', ')||'—'}</td><td><button class="btn-red btn-sm" onclick="db.ref('registered_teachers/${t.teacher_id}').remove(); loadTeachersTableView(); loadDashboard();">মুছুন</button></td></tr>`;
    }
    html += `</tbody></table>`;
    container.innerHTML = html;
}
function loadClassCheckboxes() { let cont = document.getElementById('classCheckboxes'); cont.innerHTML = ''; for(let c of classes) cont.innerHTML += `<label style="margin:5px;"><input type="checkbox" value="${c}" class="teacherClassCheckbox"> ${c}</label>`; }
async function loadRoutineEditForm() {
    const routine = await loadRoutineFromFirebase();
    let html = '';
    for(let cls of classes) {
        let clsRoutine = routine[cls] || {};
        html += `<div><h3>${cls}</h3><table class="routine-table"><thead><tr><th>দিন</th><th>বিষয়</th></tr></thead><tbody>`;
        days.forEach((day, idx) => {
            html += `<tr><td>${day}</td><td><input type="text" id="input_${cls.replace(/[()\s]/g,'_')}_${idx}" value="${escapeHtml(clsRoutine[day]||'')}" style="width:100%;"></td></tr>`;
        });
        html += `</tbody></table></div>`;
    }
    document.getElementById('routineEditArea').innerHTML = html;
}
document.getElementById('saveAllRoutinesBtn').onclick = async () => {
    const routine = await loadRoutineFromFirebase();
    for(let cls of classes) {
        if(!routine[cls]) routine[cls] = {};
        for(let i=0; i<days.length; i++) {
            const val = document.getElementById(`input_${cls.replace(/[()\s]/g,'_')}_${i}`)?.value;
            if(val) routine[cls][days[i]] = val;
        }
    }
    await db.ref('class_routines').set(routine);
    alert('রুটিন সংরক্ষিত!');
    showTodayTomorrowRoutine();
};
async function showRoutine() {
    const routine = await loadRoutineFromFirebase();
    let html = '';
    for(let cls of classes) {
        let clsRoutine = routine[cls] || routine["Class 5"];
        html += `<h4>${cls}</h4><table class="routine-table"><thead><tr><th>দিন</th><th>বিষয়</th></tr></thead><tbody>`;
        days.forEach(day => { html += `<tr><td>${day}</td><td>${clsRoutine[day]||'ক্লাস নেই'}</td></tr>`; });
        html += `</tbody></table>`;
    }
    document.getElementById('routineContent').innerHTML = html;
    document.getElementById('routineModal').style.display = 'flex';
}

// Navigation & Session
function setupMenu() {
    document.getElementById('menuDashboard').onclick = () => { showPanel('dashboardPanel'); showTodayTomorrowRoutine(); loadDashboard(); };
    document.getElementById('menuClassManager').onclick = () => { if(currentUser.role==='admin') { showPanel('adminClassPanel'); loadClassButtons(); } };
    document.getElementById('menuTeachers').onclick = () => { if(currentUser.role==='admin') { showPanel('adminTeachersPanel'); loadClassCheckboxes(); loadTeachersTableView(); } };
    document.getElementById('menuAttendance').onclick = () => { showPanel('attendancePanel'); initAttendancePanel(); };
    document.getElementById('menuSocialFeed').onclick = () => showPanel('socialFeedPanel');
    document.getElementById('menuLogout').onclick = () => { localStorage.removeItem('userSession'); location.reload(); };
    document.getElementById('menuToggle').onclick = (e) => { e.stopPropagation(); document.getElementById('dropdownMenu').classList.toggle('show'); };
    document.addEventListener('click', () => document.getElementById('dropdownMenu').classList.remove('show'));
    document.getElementById('viewRoutineBtn').onclick = showRoutine;
    document.getElementById('aboutUsBtn').onclick = () => document.getElementById('aboutModal').style.display='flex';
    document.getElementById('viewResultBtn').onclick = () => document.getElementById('resultModal').style.display='flex';
}
function hideAllPanels() { document.querySelectorAll('.panel').forEach(p => p.classList.remove('active-panel')); }
function showPanel(panelId) { hideAllPanels(); document.getElementById(panelId).classList.add('active-panel'); }

async function startApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userNameDisplay').innerText = currentUser.name;
    document.getElementById('roleDisplay').innerText = currentUser.role === 'admin' ? 'প্রশাসক' : (currentUser.role === 'teacher' ? 'শিক্ষক' : 'ছাত্র');
    let isAdmin = currentUser.role === 'admin', isTeacher = currentUser.role === 'teacher', isStudent = currentUser.role === 'student';
    document.getElementById('menuClassManager').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('menuTeachers').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('menuRoutineManager').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('menuFeedback').style.display = isAdmin ? 'block' : 'none';
    if(isStudent) { document.getElementById('menuStudentFeedback').style.display = 'block'; document.getElementById('menuStudentFeedback').onclick = () => { showPanel('studentPanel'); loadStudentFeedback(); }; }
    else document.getElementById('menuStudentFeedback').style.display = 'none';
    await loadDashboard(); loadSocialFeed(); await loadRoutineFromFirebase(); await showTodayTomorrowRoutine();
    if(isStudent) { document.getElementById('studentClassInfo').style.display = 'block'; document.getElementById('studentNameDisplay').innerText = currentUser.name; document.getElementById('studentClassDisplay').innerText = currentClass; document.getElementById('studentIdDisplay').innerText = currentUser.id; showPanel('dashboardPanel'); }
    else if(isTeacher) { await loadTeacherPanel(); showPanel('teacherPanel'); }
    else { showPanel('dashboardPanel'); }
    setupMenu();
}

// Login & Session
document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    let role = document.getElementById('loginRole').value;
    let id = document.getElementById('loginId').value.trim().toLowerCase();
    let pwd = document.getElementById('loginPassword').value.trim();
    if(role === 'admin') {
        if(id === 'admin' && pwd === '#$t') { currentUser = { id, role:'admin', name:'প্রশাসক' }; localStorage.setItem('userSession', JSON.stringify(currentUser)); startApp(); }
        else alert('অ্যাডমিন আইডি/পাসওয়ার্ড ভুল!');
    } else if(role === 'teacher') {
        let snap = await db.ref(`registered_teachers/${id}`).get();
        if(snap.exists() && snap.val().password === pwd) { currentUser = { id, role:'teacher', name: snap.val().teacher_name }; teacherAssignedClasses = snap.val().classes || []; localStorage.setItem('userSession', JSON.stringify(currentUser)); startApp(); }
        else alert('শিক্ষক আইডি/পাসওয়ার্ড ভুল!');
    } else {
        let found = false;
        for(let cls of classes) {
            let classKey = cls.replace(/\s+/g,'_').replace(/\(/g,'').replace(/\)/g,'');
            let snap = await db.ref(`class_sheets/${classKey}/students`).get();
            if(snap.exists()) {
                let match = snap.val().find(s => s.id === id && s.password === pwd);
                if(match) { currentUser = { id, role:'student', name: match.name, className: cls }; currentClass = cls; localStorage.setItem('userSession', JSON.stringify({ ...currentUser, className: cls })); found = true; break; }
            }
        }
        if(found) startApp(); else alert('ছাত্র আইডি/পাসওয়ার্ড ভুল!');
    }
};

window.addEventListener('DOMContentLoaded', async () => {
    const saved = localStorage.getItem('userSession');
    if(saved) {
        try {
            let session = JSON.parse(saved);
            if(session.role === 'admin') { currentUser = session; startApp(); }
            else if(session.role === 'teacher') { let snap = await db.ref(`registered_teachers/${session.id}`).get(); if(snap.exists()) { currentUser = session; teacherAssignedClasses = snap.val().classes || []; startApp(); } else localStorage.removeItem('userSession'); }
            else if(session.role === 'student') { let classKey = session.className?.replace(/\s+/g,'_').replace(/\(/g,'').replace(/\)/g,''); let snap = await db.ref(`class_sheets/${classKey}/students`).get(); if(snap.exists() && snap.val().find(s=>s.id===session.id)) { currentUser = session; currentClass = session.className; startApp(); } else localStorage.removeItem('userSession'); }
        } catch(e) { localStorage.removeItem('userSession'); document.getElementById('loginScreen').style.display='flex'; }
    } else { document.getElementById('loginScreen').style.display='flex'; }
    setupMediaPreview();
    document.getElementById('teacherImageInput')?.addEventListener('change', e => { let file=e.target.files[0]; if(file){ let r=new FileReader(); r.onload=ev=>{ teacherImageBase64=ev.target.result; document.getElementById('teacherImagePreview').src=ev.target.result; }; r.readAsDataURL(file); } });
    document.getElementById('studentImageInput')?.addEventListener('change', e => { let file=e.target.files[0]; if(file){ let r=new FileReader(); r.onload=ev=>{ studentImageBase64=ev.target.result; document.getElementById('studentImagePreview').src=ev.target.result; }; r.readAsDataURL(file); } });
});

// Background Slideshow
const slides = document.querySelectorAll('.bg-slide');
let currentBgSlide = 0;
if(slides.length) { slides[0].classList.add('active'); setInterval(() => { slides[currentBgSlide].classList.remove('active'); currentBgSlide = (currentBgSlide + 1) % slides.length; slides[currentBgSlide].classList.add('active'); }, 5000); }

// Demo Data
async function initDemoData() {
    let tSnap = await db.ref('registered_teachers').get();
    if(!tSnap.exists()) { await db.ref('registered_teachers/teacher1').set({ teacher_name:'জন প্রধান শিক্ষক', teacher_id:'teacher1', password:'1234', classes:['Class 6','Class 7'] }); }
    let c6 = await db.ref('class_sheets/Class_6/students').get();
    if(!c6.exists()) { await db.ref('class_sheets/Class_6/students').set([{ id:'student1', name:'রহিম উদ্দিন', password:'1234', guardian_phone:'+8801889343480' }]); }
}
initDemoData();
