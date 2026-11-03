const draftKey = 'psyche-reading-shelf-v1';
const form = document.getElementById('book-form');
const status = document.getElementById('editor-status');
let books = Array.isArray(window.READING_SHELF) ? window.READING_SHELF : [];
let editing = -1;
function validBooks(value) {
  return Array.isArray(value) && value.every(b => b && typeof b.title === 'string' && b.title.trim() && typeof b.author === 'string' && ['cover','affiliate','review','finished'].every(k => b[k] === undefined || typeof b[k] === 'string'));
}
try { const saved = localStorage.getItem(draftKey); if (saved && validBooks(JSON.parse(saved))) books = JSON.parse(saved); } catch { status.textContent = 'Browser storage is unavailable. Download your shelf to keep your changes.'; }
function refresh(message = '') {
  renderShelf(books, document.getElementById('shelf-preview'));
  const controls = document.getElementById('edit-controls'); controls.replaceChildren();
  books.forEach((book, i) => {
    const row = document.createElement('div'); row.className = 'edit-row';
    const title = document.createElement('span'); title.textContent = book.title;
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'text-button'; edit.textContent = 'Edit';
    edit.addEventListener('click', () => { editing = i; for (const key of ['title','author','cover','affiliate','review','finished']) form.elements[key].value = book[key] || ''; document.getElementById('cover-file').value = ''; document.getElementById('save-book').textContent = 'Save changes'; document.getElementById('cancel-edit').hidden = false; form.elements.title.focus(); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button'; remove.textContent = 'Remove';
    remove.addEventListener('click', () => { if (confirm(`Remove “${book.title}” from this draft?`)) { books.splice(i, 1); resetForm(); persist('Book removed from your draft.'); } });
    row.append(title, edit, remove); controls.append(row);
  });
  if (message) status.textContent = message;
}
function persist(message) { try { localStorage.setItem(draftKey, JSON.stringify(books)); } catch { message += ' Browser storage is full or unavailable; download your shelf now to keep it.'; } refresh(message); document.dispatchEvent(new Event('psyche-shelf-changed')); }
function resetForm() { editing = -1; form.reset(); document.getElementById('save-book').textContent = 'Add to my shelf'; document.getElementById('cancel-edit').hidden = true; }
document.getElementById('cancel-edit').addEventListener('click', resetForm);
form.addEventListener('submit', async event => {
  event.preventDefault();
  const book = Object.fromEntries(['title','author','cover','affiliate','review','finished'].map(k => [k, form.elements[k].value.trim()]));
  if (!book.title || !book.author) { status.textContent = 'Please add a title and author.'; return; }
  if (book.affiliate && !shelfURL(book.affiliate)) { status.textContent = 'Use an https:// or http:// affiliate link.'; return; }
  const file = document.getElementById('cover-file').files[0];
  if (file) {
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { status.textContent = 'Choose a PNG, JPEG or WebP image smaller than 5 MB.'; return; }
    try { book.cover = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); } catch { status.textContent = 'The cover could not be read. Please choose it again.'; return; }
  }
  if (book.cover && !shelfURL(book.cover, true)) { status.textContent = 'Use a local image path or an http:// or https:// cover address.'; return; }
  if (editing < 0) books.unshift(book); else books[editing] = book;
  resetForm(); persist('Saved to your draft. Publish when ready, or download a backup.');
});
document.getElementById('download-shelf').addEventListener('click', () => {
  const data = '// Published reading shelf\nwindow.READING_SHELF = ' + JSON.stringify(books, null, 2) + ';\n';
  const url = URL.createObjectURL(new Blob([data], {type:'text/javascript'}));
  const link = document.createElement('a'); link.href = url; link.download = 'books.js'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'Downloaded. Replace books.js in your GitHub repository to publish this shelf.';
});
document.getElementById('import-shelf').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try {
    const text = await file.text(); const prefix = 'window.READING_SHELF = '; const start = text.indexOf(prefix);
    if (start < 0) throw new Error();
    const imported = JSON.parse(text.slice(start + prefix.length).trim().replace(/;$/, ''));
    if (!validBooks(imported)) throw new Error();
    if (books.length && !confirm('Replace this browser’s draft with the imported shelf?')) return;
    books = imported; resetForm(); persist('Shelf imported.');
  } catch { status.textContent = 'Could not import that file. Choose a books.js downloaded from this editor.'; }
  event.target.value = '';
});
refresh();
