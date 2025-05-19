const API_BASE = "http://localhost:3000";

function setCookie(name, value, days = 1) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

function getCookie(name) {
    return document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
}

function deleteCookie(name) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
}

async function registerUser(username, password) {
    const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return res.json();
}

async function loginUser(username, password) {
    const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error("Invalid login");
    return res.json();
}

async function fetchTodos() {
    const token = getCookie('authToken');
    const res = await fetch(`${API_BASE}/todos`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
}

async function createTodo(title, description) {
    const token = getCookie('authToken');
    const res = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description })
    });
    return res.json();
}

async function updateTodo(id, title, description, completed) {
    const token = getCookie('authToken');
    const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, completed })
    });
    return res.json();
}

async function deleteTodo(id) {
    const token = getCookie('authToken');
    const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.ok;
}

function renderTodos(todos) {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';

    todos.forEach(todo => {
        const div = document.createElement('div');
        div.className = 'todo-item';
        if (todo.completed) div.classList.add('completed');

        const content = document.createElement('div');
        content.innerHTML = `<strong>${todo.title}</strong> - ${todo.description}<br>`;
        div.appendChild(content);

        const completeBtn = document.createElement('button');
        completeBtn.textContent = todo.completed ? 'Unmark' : 'Complete';
        completeBtn.addEventListener('click', () => markComplete(todo.id, todo.completed));

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => editTodo(todo.id, todo.title, todo.description, todo.completed));

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deleteTodoItem(todo.id));

        div.appendChild(completeBtn);
        div.appendChild(editBtn);
        div.appendChild(deleteBtn);

        list.appendChild(div);
    });
}


async function refreshTodos() {
    const todos = await fetchTodos();
    renderTodos(todos);
}

function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('todo-section').classList.add('hidden');
}

function showTodoSection() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('todo-section').classList.remove('hidden');
    refreshTodos();
}

document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    try {
        await registerUser(username, password);
        alert('Registered successfully! Now login.');
    } catch (err) {
        alert('Error registering user');
    }
});

document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
        const data = await loginUser(username, password);
        setCookie('authToken', data.token);
        showTodoSection();
    } catch (err) {
        alert('Login failed');
    }
});

document.getElementById('create-todo-form').addEventListener('submit', async e => {
    e.preventDefault();
    const title = document.getElementById('todo-title').value;
    const description = document.getElementById('todo-description').value;
    await createTodo(title, description);
    refreshTodos();
    e.target.reset();
});

document.getElementById('logout-btn').addEventListener('click', () => {
    deleteCookie('authToken');
    showAuthSection();
});

async function markComplete(id, completed) {
    const todo = await updateTodo(id, null, null, !completed);
    refreshTodos();
}

function editTodo(id, oldTitle, oldDesc, completed) {
    const title = prompt('Edit title', oldTitle);
    const description = prompt('Edit description', oldDesc);
    if (title && description) {
        updateTodo(id, title, description, completed).then(refreshTodos);
    }
}

function deleteTodoItem(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        deleteTodo(id).then(refreshTodos);
    }
}

if (getCookie('authToken')) {
    showTodoSection();
} else {
    showAuthSection();
}
