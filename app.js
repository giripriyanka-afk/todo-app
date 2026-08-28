(function () {
  'use strict';

  var STORAGE_KEY = 'todo.tasks';
  var THEME_KEY = 'todo.theme';

  var form = document.getElementById('task-form');
  var input = document.getElementById('task-input');
  var list = document.getElementById('task-list');
  var emptyState = document.getElementById('empty-state');
  var themeToggle = document.getElementById('theme-toggle');
  var themeIcon = document.getElementById('theme-icon');

  var tasks = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      // Keep only well-formed entries so a corrupted store can't break rendering.
      return parsed
        .filter(function (t) {
          return t && typeof t.text === 'string';
        })
        .map(function (t) {
          return { id: String(t.id || newId()), text: t.text, done: !!t.done };
        });
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      // Storage full or unavailable (e.g. private mode) — keep the app usable.
    }
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function render() {
    list.textContent = '';

    tasks.forEach(function (task) {
      var item = document.createElement('li');
      item.className = 'task' + (task.done ? ' done' : '');
      item.dataset.id = task.id;

      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-check';
      checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', 'Mark "' + task.text + '" as done');

      // textContent, not innerHTML — task text is user input and must not parse as markup.
      var text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'delete-btn';
      del.textContent = '\u00D7';
      del.setAttribute('aria-label', 'Delete "' + task.text + '"');

      item.appendChild(checkbox);
      item.appendChild(text);
      item.appendChild(del);
      list.appendChild(item);
    });

    emptyState.classList.toggle('hidden', tasks.length > 0);
  }

  function addTask(text) {
    tasks.push({ id: newId(), text: text, done: false });
    save();
    render();
  }

  function toggleTask(id) {
    var task = tasks.find(function (t) {
      return t.id === id;
    });
    if (!task) return;
    task.done = !task.done;
    save();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(function (t) {
      return t.id !== id;
    });
    save();
    render();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    addTask(text);
    input.value = '';
    input.focus();
  });

  // One delegated listener, so rows added later need no extra wiring.
  list.addEventListener('click', function (event) {
    var item = event.target.closest('.task');
    if (!item) return;

    if (event.target.classList.contains('delete-btn')) {
      deleteTask(item.dataset.id);
    } else if (event.target.classList.contains('task-check')) {
      toggleTask(item.dataset.id);
    }
  });

  // --- Theme -------------------------------------------------------------
  // index.html sets data-theme before paint. This keeps the button in sync.
  // It also saves the choice so it survives a reload.

  function storedTheme() {
    try {
      var value = localStorage.getItem(THEME_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch (e) {
      return null;
    }
  }

  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || systemTheme();
  }

  function applyTheme(theme) {
    var dark = theme === 'dark';
    // The label names the action, not the current state.
    var label = dark ? 'Switch to light theme' : 'Switch to dark theme';

    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = dark ? '\u2600' : '\u263E';
    themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', label);
    themeToggle.title = label;
  }

  themeToggle.addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      // Cannot save. The toggle still works for this visit.
    }
  });

  // Follow the system until the user picks a theme.
  if (window.matchMedia) {
    var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var onSystemChange = function () {
      if (!storedTheme()) applyTheme(systemTheme());
    };
    if (darkQuery.addEventListener) {
      darkQuery.addEventListener('change', onSystemChange);
    } else if (darkQuery.addListener) {
      darkQuery.addListener(onSystemChange);
    }
  }

  applyTheme(storedTheme() || systemTheme());

  render();
})();
