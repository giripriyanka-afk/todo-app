(function () {
  'use strict';

  var STORAGE_KEY = 'todo.tasks';

  var form = document.getElementById('task-form');
  var input = document.getElementById('task-input');
  var list = document.getElementById('task-list');
  var emptyState = document.getElementById('empty-state');

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

  render();
})();
