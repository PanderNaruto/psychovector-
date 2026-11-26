// ===== ХРАНИЛИЩЕ (теперь через сервер) =====
const API = ''; // относительный путь (работает и на localhost, и по IP)

const Storage = {
    async getUsers() {
        try {
            const res = await fetch(API + '/api/users');
            if (!res.ok) throw new Error('Ошибка сети');
            return await res.json();
        } catch (e) {
            console.error('Ошибка getUsers:', e);
            return [];
        }
    },
    async getUserById(id) {
        try {
            const res = await fetch(API + '/api/users/' + id);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) { return null; }
    },
    async updateUser(id, data) {
        try {
            const res = await fetch(API + '/api/users/' + id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (e) { return null; }
    },
    async deleteUser(id) {
        try {
            const res = await fetch(API + '/api/users/' + id, { method: 'DELETE' });
            return await res.json();
        } catch (e) { return null; }
    },
    getCurrentUser() {
        try { return JSON.parse(localStorage.getItem('pv_currentUser') || 'null'); }
        catch (e) { return null; }
    },
    setCurrentUser(user) {
        try { localStorage.setItem('pv_currentUser', JSON.stringify(user)); }
        catch (e) { console.error(e); }
    },
    logout() {
        try { localStorage.removeItem('pv_currentUser'); }
        catch (e) { console.error(e); }
    },
    async getTests() {
        try {
            const res = await fetch(API + '/api/tests');
            if (!res.ok) throw new Error('Ошибка сети');
            return await res.json();
        } catch (e) { return []; }
    },
    async createTest(test) {
        try {
            const res = await fetch(API + '/api/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(test)
            });
            return await res.json();
        } catch (e) { return null; }
    },
    async getResults() {
        try {
            const res = await fetch(API + '/api/results');
            if (!res.ok) throw new Error('Ошибка сети');
            return await res.json();
        } catch (e) { return []; }
    },
    async saveResult(result) {
        try {
            const res = await fetch(API + '/api/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result)
            });
            return await res.json();
        } catch (e) { return null; }
    },
    async saveTests(tests) {
        try {
            const res = await fetch('/api/tests-all', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tests)
            });
            return await res.json();
        } catch (e) {
            // Фолбэк на localStorage
            localStorage.setItem('pv_tests', JSON.stringify(tests));
            return { success: true };
        }
    },
    async saveResults(results) {
        try {
            const res = await fetch('/api/results-all', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(results)
            });
            return await res.json();
        } catch (e) {
            localStorage.setItem('pv_results', JSON.stringify(results));
            return { success: true };
        }
    },
    clearCurrentUser() {
    localStorage.removeItem('pv_currentUser');
    }
};

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const notif = document.createElement('div');
    notif.className = 'notification ' + type;
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 4000);
}

// ===== РЕГИСТРАЦИЯ =====
async function handleRegister() {
    const email = document.getElementById('reg-email').value.trim();
    const login = document.getElementById('reg-login').value.trim();
    const password = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;
    const isPsychologist = document.getElementById('reg-is-psychologist').checked;

    if (!login) { showNotification('Введите логин', 'error'); return; }
    if (!password) { showNotification('Введите пароль', 'error'); return; }
    if (password !== password2) { showNotification('Пароли не совпадают', 'error'); return; }
    if (password.length < 6) { showNotification('Пароль должен содержать минимум 6 символов', 'error'); return; }

    try {
        const res = await fetch(API + '/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email, login, password,
                role: isPsychologist ? 'psychologist' : 'user',
                fullName: login,
                education: document.getElementById('reg-education')?.value || '',
                qualification: document.getElementById('reg-qualification')?.value || '',
                birthDate: document.getElementById('reg-birthdate')?.value || ''
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showNotification(data.error || 'Ошибка регистрации', 'error');
            return;
        }

        showNotification('Регистрация успешна! Теперь войдите в аккаунт.', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    } catch (err) {
        showNotification('Ошибка подключения к серверу', 'error');
        console.error(err);
    }
}

// ===== ВХОД =====
async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) { showNotification('Заполните все поля', 'error'); return; }

    try {
        const res = await fetch(API + '/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showNotification(data.error || 'Ошибка входа', 'error');
            return;
        }

        Storage.setCurrentUser(data.user);
        showNotification('Добро пожаловать, ' + data.user.login + '!', 'success');

        setTimeout(() => {
            window.location.href = data.user.role === 'admin' ? 'admin.html' : 'dashboard.html';
        }, 1000);
    } catch (err) {
        showNotification('Ошибка подключения к серверу', 'error');
        console.error(err);
    }
}

// ===== ВЫХОД =====
function handleLogout() {
    Storage.logout();
    window.location.href = 'login.html';
}

// ===== ПРОВЕРКИ =====
function requireAuth() {
    const user = Storage.getCurrentUser();
    if (!user) { window.location.href = 'login.html'; return null; }
    return user;
}

function requirePsychologist() {
    const user = requireAuth();
    if (!user) return null;
    if (user.role !== 'psychologist') {
        showNotification('Доступ только для психологов', 'error');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
        return null;
    }
    return user;
}

// ===== СОЗДАНИЕ ТЕСТА =====
async function createTest() {
    const user = requirePsychologist();
    if (!user) return;

    const title = document.getElementById('test-title').value.trim();
    const description = document.getElementById('test-description').value.trim();
    const methodology = document.getElementById('test-methodology').value.trim();

    if (!title) { showNotification('Укажите название тестирования', 'error'); return; }

    const questions = [];
    document.querySelectorAll('.question-block').forEach((block, index) => {
        const text = block.querySelector('.q-text-input').value.trim();
        const options = [];
        block.querySelectorAll('.answer-option').forEach(opt => {
            const answerText = opt.querySelector('.answer-text').value.trim();
            const score = parseInt(opt.querySelector('.answer-score').value) || 0;
            if (answerText) options.push({ text: answerText, score: score });
        });
        if (text && options.length > 0) questions.push({ id: index + 1, text: text, options: options });
    });

    if (questions.length === 0) { showNotification('Добавьте хотя бы один вопрос', 'error'); return; }

    const result = await Storage.createTest({
        title, description, methodology, questions,
        createdBy: user.id,
        createdByName: user.fullName || user.login,
        status: 'active',
        participants: 0
    });

    if (result && result.success) {
        showNotification('Тестирование успешно создано!', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
    } else {
        showNotification('Ошибка создания теста', 'error');
    }
}

// ===== ВОПРОСЫ =====
let questionCounter = 0;

function addQuestion() {
    questionCounter++;
    const container = document.getElementById('questions-container');
    const block = document.createElement('div');
    block.className = 'question-block';
    block.dataset.qid = questionCounter;
    block.innerHTML = `
        <div class="question-header">
            <span class="question-number">Вопрос ${questionCounter}</span>
            <button class="remove-question" onclick="removeQuestion(this)">✕</button>
        </div>
        <div class="form-group">
            <label>Текст вопроса</label>
            <input type="text" class="q-text-input" placeholder="Введите вопрос...">
        </div>
        <div class="answer-options">
            <label style="font-size:12px;color:var(--text-muted);margin-bottom:8px;display:block;">Варианты ответов</label>
            <div class="answer-option">
                <input type="text" class="answer-text" placeholder="Вариант ответа">
                <input type="number" class="answer-score" placeholder="Балл" value="0">
            </div>
            <div class="answer-option">
                <input type="text" class="answer-text" placeholder="Вариант ответа">
                <input type="number" class="answer-score" placeholder="Балл" value="0">
            </div>
            <div class="answer-option">
                <input type="text" class="answer-text" placeholder="Вариант ответа">
                <input type="number" class="answer-score" placeholder="Балл" value="0">
            </div>
        </div>
        <button class="btn-add-question" onclick="addAnswerOption(this)" style="margin-top:12px;padding:8px;font-size:13px;">+ Добавить вариант ответа</button>
    `;
    container.appendChild(block);
}

function removeQuestion(btn) { btn.closest('.question-block').remove(); renumberQuestions(); }

function addAnswerOption(btn) {
    const optionsContainer = btn.previousElementSibling;
    const option = document.createElement('div');
    option.className = 'answer-option';
    option.innerHTML = `
        <input type="text" class="answer-text" placeholder="Вариант ответа">
        <input type="number" class="answer-score" placeholder="Балл" value="0">
    `;
    optionsContainer.appendChild(option);
}

function renumberQuestions() {
    document.querySelectorAll('.question-block').forEach((block, i) => {
        block.querySelector('.question-number').textContent = 'Вопрос ' + (i + 1);
    });
    questionCounter = document.querySelectorAll('.question-block').length;
}

// ===== ПРОХОЖДЕНИЕ ТЕСТА =====
async function loadTestForUser() {
    const params = new URLSearchParams(window.location.search);
    const testId = params.get('id');
    const tests = await Storage.getTests();
    const test = tests.find(t => t.id === testId);

    if (!test) {
        document.getElementById('test-area').innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">Тест не найден.</p>';
        return;
    }

    const user = Storage.getCurrentUser();
    if (user) {
        const results = await Storage.getResults();
        const alreadyPassed = results.find(r => r.testId === testId && r.userId === user.id);

        if (alreadyPassed) {
            const pct = alreadyPassed.maxScore > 0 ? Math.round((alreadyPassed.score / alreadyPassed.maxScore) * 100) : 0;
            let interpClass = 'interpretation-low';
            let interpText = 'Низкий уровень';
            if (pct > 66) { interpClass = 'interpretation-high'; interpText = 'Высокий уровень'; }
            else if (pct > 33) { interpClass = 'interpretation-medium'; interpText = 'Средний уровень'; }

            document.getElementById('test-title-display').textContent = test.title;
            document.getElementById('test-description-display').textContent = '';
            document.getElementById('progress-bar').style.width = '100%';

            document.getElementById('test-area').innerHTML = `
                <div class="form-card" style="text-align:center;padding:48px;">
                    <div style="font-size:64px;margin-bottom:16px;">✅</div>
                    <h2 style="color:var(--dark-green);margin-bottom:16px;">Вы уже прошли этот тест</h2>
                    <p style="font-size:15px;color:var(--text-muted);margin-bottom:24px;">Повторное прохождение невозможно.</p>
                    <div class="result-score" style="max-width:320px;margin:0 auto 20px;">
                        <div>
                            <div class="score-value">${alreadyPassed.score}</div>
                            <div class="score-label">из ${alreadyPassed.maxScore} баллов (${pct}%)</div>
                        </div>
                    </div>
                    <div class="result-interpretation ${interpClass}" style="max-width:320px;margin:0 auto 24px;">
                        <strong>${interpText}</strong>
                    </div>
                    <button class="btn-primary" onclick="window.location.href='dashboard.html'" style="margin-top:8px;">Вернуться в кабинет</button>
                </div>
            `;
            return;
        }
    }

    document.getElementById('test-title-display').textContent = test.title;
    document.getElementById('test-description-display').textContent = test.description || '';

    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    test.questions.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'test-question-card';
        card.innerHTML = `
            <div class="q-number">Вопрос ${index + 1} из ${test.questions.length}</div>
            <div class="q-text">${q.text}</div>
            ${q.options.map((opt, oi) => `
                <div class="test-answer-option" onclick="selectAnswer(this, ${index}, ${oi})">
                    <input type="radio" name="q${index}" id="q${index}_${oi}" value="${opt.score}">
                    <label for="q${index}_${oi}">${opt.text}</label>
                </div>
            `).join('')}
        `;
        container.appendChild(card);
    });

    window._currentTest = test;
    window._answers = {};
    updateProgress();
}

function selectAnswer(element, questionIndex, optionIndex) {
    const radio = element.querySelector('input[type="radio"]');
    radio.checked = true;
    element.closest('.test-question-card').querySelectorAll('.test-answer-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    window._answers[questionIndex] = parseInt(radio.value) || 0;
    updateProgress();
}

function updateProgress() {
    const test = window._currentTest;
    if (!test) return;
    const total = test.questions.length;
    const answered = Object.keys(window._answers).length;
    const pct = (answered / total) * 100;
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = pct + '%';
}

async function submitTest() {
    const test = window._currentTest;
    if (!test) return;

    const totalQuestions = test.questions.length;
    const answered = Object.keys(window._answers).length;

    if (answered < totalQuestions) {
        showNotification('Ответьте на все вопросы (' + answered + '/' + totalQuestions + ')', 'error');
        return;
    }

    let totalScore = 0;
    Object.values(window._answers).forEach(v => totalScore += v);

    const user = Storage.getCurrentUser();

    const maxScore = test.questions.reduce((sum, q) => {
        const maxOpt = q.options.reduce((m, o) => Math.max(m, o.score), 0);
        return sum + maxOpt;
    }, 0);

    const result = {
        id: Date.now().toString(),
        testId: test.id,
        testTitle: test.title,
        userId: user ? user.id : 'anonymous',
        userName: user ? (user.fullName || user.login) : 'Аноним',
        userEmail: user ? user.email : '',
        score: totalScore,
        maxScore: maxScore,
        answers: window._answers,
        completedAt: new Date().toISOString()
    };

    const saved = await Storage.saveResult(result);

    if (saved && saved.success) {
        showNotification('Тест завершён! Результаты сохранены.', 'success');
        document.getElementById('test-area').innerHTML = `
            <div class="form-card" style="text-align:center;padding:48px;">
                <h2 style="color:var(--dark-green);margin-bottom:16px;">Тест завершён!</h2>
                <p style="font-size:18px;margin-bottom:8px;">Ваш результат: <strong>${totalScore}</strong> из ${maxScore} баллов</p>
                <button class="btn-primary" onclick="window.location.href='dashboard.html'" style="margin-top:24px;">Вернуться в кабинет</button>
            </div>
        `;
    } else {
        showNotification('Ошибка сохранения результата', 'error');
    }
}

// ===== РЕЗУЛЬТАТЫ ПСИХОЛОГА =====
async function loadResults() {
    const user = requireAuth();
    if (!user) return;

    const results = await Storage.getResults();
    const tests = await Storage.getTests();
    const myTestIds = tests.filter(t => t.createdBy === user.id).map(t => t.id);
    const myResults = results.filter(r => myTestIds.includes(r.testId));

    const container = document.getElementById('results-container');
    if (!container) return;

    if (myResults.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;padding:40px;">Пока нет результатов.</p>';
        return;
    }

    container.innerHTML = myResults.map(r => {
        const pct = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0;
        let interpClass = 'interpretation-low';
        let interpText = 'Низкий уровень';
        if (pct > 66) { interpClass = 'interpretation-high'; interpText = 'Высокий уровень'; }
        else if (pct > 33) { interpClass = 'interpretation-medium'; interpText = 'Средний уровень'; }

        return `
            <div class="result-user-card">
                <div class="user-info">
                    <div class="user-avatar">${r.userName.charAt(0).toUpperCase()}</div>
                    <div class="user-details">
                        <h4>${r.userName}</h4>
                        <p>${r.userEmail || 'Аноним'} · ${new Date(r.completedAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                </div>
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">${r.testTitle}</div>
                <div class="result-score">
                    <div>
                        <div class="score-value">${r.score}</div>
                        <div class="score-label">из ${r.maxScore} баллов (${pct}%)</div>
                    </div>
                </div>
                <div class="result-interpretation ${interpClass}">
                    <strong>${interpText}</strong>
                </div>
            </div>
        `;
    }).join('');
}

// ===== РЕЗУЛЬТАТЫ ПОЛЬЗОВАТЕЛЯ =====
async function loadUserResults(user) {
    const results = await Storage.getResults();
    const myResults = results.filter(r => r.userId === user.id);

    const container = document.getElementById('results-container');
    if (!container) return;

    if (myResults.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;padding:40px;">Вы ещё не прошли ни одного тестирования.</p>';
        return;
    }

    container.innerHTML = myResults.map(r => {
        const pct = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0;
        let interpClass = 'interpretation-low';
        let interpText = 'Низкий уровень';
        if (pct > 66) { interpClass = 'interpretation-high'; interpText = 'Высокий уровень'; }
        else if (pct > 33) { interpClass = 'interpretation-medium'; interpText = 'Средний уровень'; }

        return `
            <div class="result-user-card">
                <div class="user-info">
                    <div class="user-avatar">${(user.fullName || user.login).charAt(0).toUpperCase()}</div>
                    <div class="user-details">
                        <h4>${user.fullName || user.login}</h4>
                        <p>${user.email} · ${new Date(r.completedAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                </div>
                <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">${r.testTitle}</div>
                <div class="result-score">
                    <div>
                        <div class="score-value">${r.score}</div>
                        <div class="score-label">из ${r.maxScore} баллов (${pct}%)</div>
                    </div>
                </div>
                <div class="result-interpretation ${interpClass}">
                    <strong>${interpText}</strong>
                </div>
            </div>
        `;
    }).join('');
}

// ===== ДАШБОРД =====
async function loadDashboard() {
    const user = requireAuth();
    if (!user) return;

    // Обновляем данные пользователя с сервера (на случай изменений)
    const freshUser = await Storage.getUserById(user.id);
    if (freshUser) {
        Storage.setCurrentUser(freshUser);
        Object.assign(user, freshUser);
        document.body.dataset.role = user.role;
    }

    // Показ/скрытие полей психолога
    const psychFields = document.getElementById('psychologist-profile-fields');
    const psychEditFields = document.getElementById('psychologist-edit-fields');
    if (psychFields) psychFields.style.display = user.role === 'psychologist' ? 'block' : 'none';
    if (psychEditFields) psychEditFields.style.display = user.role === 'psychologist' ? 'block' : 'none';

    // Профиль
    const nameEl = document.getElementById('user-fullname');
    if (nameEl) nameEl.textContent = user.fullName || user.login;

    const profileBtn = document.getElementById('profile-role-btn');
    if (profileBtn) profileBtn.textContent = user.role === 'psychologist' ? 'Психолог' : 'Пользователь';

    const birthEl = document.getElementById('profile-birthdate');
    if (birthEl) birthEl.textContent = user.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Не указана';

    const eduEl = document.getElementById('profile-education');
    if (eduEl) eduEl.textContent = user.education || 'Не указано';
    const qualEl = document.getElementById('profile-qualification');
    if (qualEl) qualEl.textContent = user.qualification || 'Не указана';

    // Таблица тестов
    const tests = await Storage.getTests();
    const results = await Storage.getResults();
    let myTests;

    if (user.role === 'psychologist') {
        myTests = tests.filter(t => t.createdBy === user.id);
    } else {
        const passedTestIds = results.filter(r => r.userId === user.id).map(r => r.testId);
        myTests = tests.filter(t => passedTestIds.includes(t.id));
    }

    const tableBody = document.getElementById('tests-table-body');
    if (tableBody) {
        if (myTests.length === 0) {
            const emptyMessage = user.role === 'psychologist'
                ? 'Нет тестирований'
                : 'Вы ещё не прошли ни одного тестирования';
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">' + emptyMessage + '</td></tr>';
        } else {
            tableBody.innerHTML = myTests.map(t => {
                const statusClass = t.status === 'active' ? 'status-active' : 'status-draft';
                const statusText = t.status === 'active' ? 'Активно' : 'Черновик';
                const date = new Date(t.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

                let secondColContent;
                if (user.role === 'psychologist') {
                    secondColContent = t.participants || 0;
                } else {
                    const userResult = results.find(r => r.testId === t.id && r.userId === user.id);
                    if (userResult) {
                        const maxScore = userResult.maxScore || 1;
                        const pct = Math.round((userResult.score / maxScore) * 100);
                        secondColContent = '<strong style="color:var(--dark-green);">' + userResult.score + ' / ' + maxScore + '</strong><br><span style="font-size:12px;color:var(--text-muted);">' + pct + '%</span>';
                    } else {
                        secondColContent = '—';
                    }
                }

                return `
                    <tr>
                        <td class="test-name-cell">
                            <div class="test-title">${t.title}</div>
                            <div class="test-date">Создано ${date}</div>
                        </td>
                        <td>${secondColContent}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td class="row-arrow" onclick="window.location.href='take-test.html?id=${t.id}'">→</td>
                    </tr>
                `;
            }).join('');
        }
    }

    // Скрываем блоки для не-психологов
    const createCard = document.getElementById('create-test-card');
    const resultsCard = document.getElementById('results-view-card');

    if (user.role !== 'psychologist') {
        if (createCard) createCard.style.display = 'none';
        if (resultsCard) resultsCard.style.display = 'none';
    }
}

// ===== РЕДАКТИРОВАНИЕ ПРОФИЛЯ =====
function openEditProfile() {
    const user = Storage.getCurrentUser();
    if (!user) return;

    document.getElementById('edit-fullname').value = user.fullName || '';
    document.getElementById('edit-birthdate').value = user.birthDate || '';

    if (user.role === 'psychologist') {
        document.getElementById('edit-education').value = user.education || '';
        document.getElementById('edit-qualification').value = user.qualification || '';
    }

    document.getElementById('edit-profile-modal').classList.add('active');
}

function closeEditProfile() {
    document.getElementById('edit-profile-modal').classList.remove('active');
}

async function saveProfile() {
    const user = Storage.getCurrentUser();
    if (!user) return;

    const updates = {
        fullName: document.getElementById('edit-fullname').value.trim(),
        birthDate: document.getElementById('edit-birthdate').value
    };

    if (user.role === 'psychologist') {
        updates.education = document.getElementById('edit-education').value.trim();
        updates.qualification = document.getElementById('edit-qualification').value.trim();
    }

    const result = await Storage.updateUser(user.id, updates);

    if (result && result.success) {
        Storage.setCurrentUser(result.user);
        closeEditProfile();
        showNotification('Профиль обновлён', 'success');
        loadDashboard();
    } else {
        showNotification('Ошибка сохранения', 'error');
    }
} // <-- ВАЖНО: Здесь заканчивается функция saveProfile!

// ===== АВТОМАТИЧЕСКАЯ ПРОВЕРКА СЕССИИ (ВЫНЕСЕНО НАВЕРХ) =====
function startSessionCheck() {
    const currentUser = Storage.getCurrentUser();
    if (!currentUser || !currentUser.id) return;

    const CHECK_INTERVAL = 10000; // Проверка каждые 10 секунд

    const checkInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/users/check-session/${currentUser.id}`);
            
            // Если сервер вернул 404 — пользователь удалён админом
            if (response.status === 404) {
                clearInterval(checkInterval);
                Storage.clearCurrentUser();
                
                showNotification('Ваш аккаунт был удалён администратором. Выполняется выход...', 'error');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } catch (error) {
            // Если сервер временно недоступен, не ломаем интерфейс
            console.warn('Не удалось проверить сессию:', error);
        }
    }, CHECK_INTERVAL);

    // Очищаем интервал при закрытии вкладки, чтобы не грузить сервер
    window.addEventListener('beforeunload', () => {
        clearInterval(checkInterval);
    });
}

// Запускаем проверку при загрузке любой страницы
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = Storage.getCurrentUser();
    if (currentUser) {
        startSessionCheck();
    }
});

// ===== УПРАВЛЕНИЕ ТЁМНОЙ ТЕМОЙ =====
function initTheme() {
    const savedTheme = localStorage.getItem('pv_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    
    updateAllThemeButtons(theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('pv_theme', newTheme);
    updateAllThemeButtons(newTheme);
}

function updateAllThemeButtons(theme) {
    document.querySelectorAll('#theme-toggle-btn').forEach(btn => {
        btn.textContent = theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная';
    });
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', initTheme);