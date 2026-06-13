// ========== FIREBASE CONFIGURATION ==========
const firebaseConfig = {
    apiKey: "AIzaSyCcwdSFN9L8kD7QayZgaoqUvTVjbpzQ2mI",
    authDomain: "marksheet-72a4b.firebaseapp.com",
    databaseURL: "https://marksheet-72a4b-default-rtdb.firebaseio.com/",
    projectId: "marksheet-72a4b",
    storageBucket: "marksheet-72a4b.firebasestorage.app",
    messagingSenderId: "1052113315277",
    appId: "1:1052113315277:web:4d44ed3843db7969291084" 
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ========== MOBILE MENU TOGGLE ==========
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// ========== ACTIVE NAVIGATION ON SCROLL ==========
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;
        if(pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navItems.forEach(link => {
        link.classList.remove('active-nav');
        if(link.getAttribute('href') === `#${current}`) {
            link.classList.add('active-nav');
        }
    });
});

// ========== STATS COUNTER ANIMATION ==========
const statNumbers = document.querySelectorAll('.stat-number');
let animated = false;

function animateStats() {
    if(animated) return;
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if(current >= target) {
                stat.textContent = target;
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 30);
    });
    animated = true;
}

// Trigger animation when about section is in view
window.addEventListener('scroll', () => {
    const aboutSection = document.getElementById('about');
    if(aboutSection) {
        const rect = aboutSection.getBoundingClientRect();
        if(rect.top < window.innerHeight - 100) {
            animateStats();
        }
    }
});

// ========== ADMISSION FORM SUBMIT WITH FIREBASE ==========
const admissionForm = document.getElementById('admissionForm');
const formMsg = document.getElementById('formMsg');

if(admissionForm) {
    admissionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const studentName = document.getElementById('studentName').value;
        const className = document.getElementById('className').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const parentName = document.getElementById('parentName').value;
        
        if(!studentName || !className || !email || !phone) {
            formMsg.innerHTML = '<span style="color:#dc3545;">⚠️ সব ঘর পূরণ করুন!</span>';
            setTimeout(() => formMsg.innerHTML = '', 3000);
            return;
        }
        
        // Show loading state
        const submitBtn = document.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'জমা দেওয়া হচ্ছে...';
        submitBtn.disabled = true;
        
        // Save to Firebase
        const newAdmissionRef = database.ref('admissions/').push();
        newAdmissionRef.set({
            name: studentName,
            class: className,
            email: email,
            phone: phone,
            parentName: parentName || '',
            appliedOn: new Date().toLocaleString('bn-BD'),
            status: 'pending'
        }).then(() => {
            formMsg.innerHTML = '<span style="color:#28a745;">✅ আপনার আবেদন সফলভাবে জমা হয়েছে। শীঘ্রই যোগাযোগ করা হবে।</span>';
            admissionForm.reset();
            setTimeout(() => formMsg.innerHTML = '', 5000);
        }).catch((error) => {
            console.error("Firebase Error:", error);
            formMsg.innerHTML = '<span style="color:#dc3545;">❌ জমা দিতে ব্যর্থ! আবার চেষ্টা করুন।</span>';
            setTimeout(() => formMsg.innerHTML = '', 5000);
        }).finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });
}

// ========== RESULT CHECK FROM FIREBASE ==========
const checkResultBtn = document.getElementById('checkResultBtn');
const resultDisplay = document.getElementById('resultDisplay');

// Sample result data (in real scenario, this would come from Firebase)
// For demo, we're creating mock data in Firebase
const sampleResults = {
    '2025001': { name: 'রহিমা আক্তার', gpa: '5.00', grade: 'A+', position: 'মেধা তালিকায় ১ম' },
    '2025002': { name: 'করিম উদ্দিন', gpa: '4.80', grade: 'A', position: 'মেধা তালিকায় ৫ম' },
    '2025003': { name: 'ফাতেমা খাতুন', gpa: '4.50', grade: 'A-', position: 'মেধা তালিকায় ১০ম' }
};

// Store sample data in Firebase (run once)
function initializeSampleResults() {
    Object.entries(sampleResults).forEach(([roll, data]) => {
        database.ref(`results/${roll}`).set(data).catch(err => console.log(err));
    });
}
// Uncomment to initialize sample data
// initializeSampleResults();

if(checkResultBtn) {
    checkResultBtn.addEventListener('click', () => {
        const examType = document.getElementById('examType').value;
        const rollNo = document.getElementById('rollNo').value;
        
        if(!rollNo) {
            resultDisplay.innerHTML = '<p style="color:#dc3545;">⚠️ রোল নম্বর দিন!</p>';
            resultDisplay.classList.add('show');
            return;
        }
        
        resultDisplay.innerHTML = '<p>🔍 রেজাল্ট খোঁজা হচ্ছে...</p>';
        resultDisplay.classList.add('show');
        
        // Query Firebase for result
        database.ref(`results/${rollNo}`).once('value').then((snapshot) => {
            const result = snapshot.val();
            
            if(result) {
                resultDisplay.innerHTML = `
                    <div style="text-align: center;">
                        <h4 style="color:#0a2b3e;">${result.name}</h4>
                        <p><strong>রোল নম্বর:</strong> ${rollNo}</p>
                        <p><strong>জিপিএ:</strong> ${result.gpa}</p>
                        <p><strong>গ্রেড:</strong> ${result.grade}</p>
                        <p><strong>অবস্থান:</strong> ${result.position || 'পাস'}</p>
                        <hr>
                        <p style="color:#28a745;">🎉 অভিনন্দন! আপনার ফলাফল চমৎকার।</p>
                    </div>
                `;
            } else {
                resultDisplay.innerHTML = `
                    <div style="text-align: center; color:#dc3545;">
                        <p>❌ ${rollNo} নম্বরের কোনো রেজাল্ট পাওয়া যায়নি।</p>
                        <p>সঠিক রোল নম্বর দিন অথবা প্রশাসনের সাথে যোগাযোগ করুন।</p>
                    </div>
                `;
            }
        }).catch((error) => {
            console.error("Error fetching result:", error);
            resultDisplay.innerHTML = '<p style="color:#dc3545;">❌ সার্ভার সমস্যা! পরে আবার চেষ্টা করুন।</p>';
        });
    });
}

// ========== DOWNLOAD FUNCTIONALITY (Demo) ==========
function downloadPDF(type) {
    if(type === 'calendar') {
        alert('একাডেমিক ক্যালেন্ডার ডাউনলোড শুরু হবে। (ডেমো ভার্সন)');
    } else if(type === 'routine') {
        alert('ক্লাস রুটিন ডাউনলোড শুরু হবে। (ডেমো ভার্সন)');
    }
}

function showCurriculumDetails() {
    alert('পাঠ্যক্রম সম্পর্কে বিস্তারিত:\n\nজাতীয় শিক্ষাক্রম (NCTB) অনুযায়ী প্লে থেকে ১০ম শ্রেণি পর্যন্ত।\nক্যামব্রিজ IGCSE ৯ম ও ১০ম শ্রেণিতে।\nবিজ্ঞান, বাণিজ্য ও মানবিক শাখায় ১১-১২শ শ্রেণি।');
}

// ========== AUTO SCROLL NOTICE (using CSS animation already) ==========
// Duplicate notice items for continuous scroll
const noticeScroll = document.getElementById('noticeScroll');
if(noticeScroll) {
    const items = noticeScroll.innerHTML;
    noticeScroll.innerHTML = items + items;
}

// ========== SMOOTH SCROLL FOR ALL ANCHORS ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if(target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ========== PAGE LOAD ANIMATION ==========
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s';
    document.body.style.opacity = '1';
});

// ========== CONTACT FORM (Optional - if you add contact form) ==========
// Add any additional functionality here

console.log('Mastermind Academy Website Loaded Successfully!');
