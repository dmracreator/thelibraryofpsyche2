/* Shared by the public shelf and the local editing page. Text is never inserted as HTML. */
function shelfURL(value, cover = false) {
  if (!value) return '';
  if (cover && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  try {
    const url = new URL(value, document.baseURI);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
function renderShelf(books, target) {
  target.replaceChildren();
  if (!books.length) {
    const empty = document.createElement('div');
    empty.className = 'shelf-empty';
    const mark = document.createElement('span'); mark.className = 'script'; mark.textContent = 'a little space for stories';
    const note = document.createElement('p'); note.textContent = 'My reading notes will find their home here soon.';
    empty.append(mark, note); target.append(empty); return;
  }
  books.forEach(book => {
    const article = document.createElement('article'); article.className = 'shelf-book';
    const cover = document.createElement('div'); cover.className = 'book-cover';
    const imageURL = shelfURL(book.cover, true);
    if (imageURL) {
      const image = document.createElement('img'); image.src = imageURL; image.alt = `${book.title} — book cover`; image.loading = 'lazy';
      image.addEventListener('error', () => { image.remove(); cover.textContent = book.title; }, { once: true }); cover.append(image);
    } else { cover.textContent = book.title; }
    const body = document.createElement('div'); body.className = 'book-note';
    const author = document.createElement('p'); author.className = 'eyebrow'; author.textContent = book.author;
    const title = document.createElement('h2'); title.textContent = book.title;
    body.append(author, title);
    if (book.finished) { const date = document.createElement('p'); date.className = 'book-date'; date.textContent = `Read ${book.finished}`; body.append(date); }
    const review = document.createElement('p'); review.className = 'book-review'; review.textContent = book.review || 'A reading note to follow.'; body.append(review);
    const affiliate = shelfURL(book.affiliate);
    if (affiliate) { const link = document.createElement('a'); link.className = 'text-link'; link.href = affiliate; link.target = '_blank'; link.rel = 'sponsored noopener noreferrer'; link.textContent = 'Find this book ↗ · affiliate link'; body.append(link); }
    article.append(cover, body); target.append(article);
  });
}
if (document.getElementById('reading-shelf')) renderShelf(Array.isArray(window.READING_SHELF) ? window.READING_SHELF : [], document.getElementById('reading-shelf'));
