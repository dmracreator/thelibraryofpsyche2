(() => {
  const service = window.PSYCHE_PUBLISHER;
  const state = document.getElementById('publisher-status');
  const comparison = document.getElementById('publisher-comparison');
  const signin = document.getElementById('publisher-signin');
  const publish = document.getElementById('publisher-save');
  const load = document.getElementById('publisher-load');
  const signout = document.getElementById('publisher-signout');
  let session = '';
  let revision = '';
  let published = [];
  let busy = false;
  let conflict = false;
  const initial = JSON.stringify(window.READING_SHELF || []);
  const sessionKey = 'psyche-publisher-session';
  function normalise(list) { return JSON.stringify(list.map(b=>Object.fromEntries(['title','author','finished','review','affiliate','cover'].map(k=>[k,(b[k]||'').trim()])))); }
  function updateButtons() {
    signin.hidden = !!session; signout.hidden = !session; load.hidden = !session;
    publish.disabled = busy || !session || !revision || conflict;
    load.disabled = busy; signin.disabled = busy; signout.disabled = busy;
    comparison.textContent = session && revision ? `Published: ${published.length} ${published.length===1?'book':'books'}. Your draft: ${books.length} ${books.length===1?'book':'books'}.` : '';
  }
  function clearSession() { session='';revision='';conflict=false;try{sessionStorage.removeItem(sessionKey);}catch{}updateButtons(); }
  async function api(method, payload) {
    const response = await fetch(service+'/shelf',{method,headers:{Authorization:'Bearer '+session,...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{})});
    const result=await response.json();
    if(!response.ok) { if(response.status===401)clearSession();if(response.status===409){conflict=true;updateButtons();}throw new Error(result.error || 'Could not connect to the publisher.'); }
    return result;
  }
  async function connect() {
    busy=true;updateButtons();state.textContent='Checking your published shelf…';
    try {
      const result=await api('GET');published=result.books;revision=result.sha;
      if(normalise(published)!==normalise(JSON.parse(initial)) && normalise(published)!==normalise(books)) {
        conflict=true;state.textContent='Your website has newer reading notes than this page. Download your draft as a backup, then load the published shelf and add your changes there.';
      } else {state.textContent='Signed in as Dani. Your saved draft is ready to publish.';}
    } catch(error){state.textContent=error.message;}finally{busy=false;updateButtons();}
  }
  if(!service || !/^https:\/\/[a-z0-9.-]+\.workers\.dev$/i.test(service)) {state.textContent='The publishing connection is not configured yet. You can still download your shelf as a backup.';signin.disabled=true;return;}
  const fragment=new URLSearchParams(location.hash.slice(1));
  if(fragment.has('publish-session')) {
    session=fragment.get('publish-session');history.replaceState(null,'',location.pathname+location.search);
    try{sessionStorage.setItem(sessionKey,session);}catch{}
  } else if(fragment.has('publish-error')) {
    const error=fragment.get('publish-error');history.replaceState(null,'',location.pathname+location.search);
    state.textContent=error==='owner'?'Only the website owner can publish. Please sign in as dmracreator.':error==='installation'?'Install the Psyche publishing GitHub App on thelibraryofpsyche2, then sign in again.':'Sign-in did not finish. Please try again.';
  } else {try{session=sessionStorage.getItem(sessionKey)||'';}catch{}}
  signin.addEventListener('click',()=>{
    if(form.elements.title.value.trim() || form.elements.review.value.trim()) {state.textContent='Save your open book entry before signing in, so it stays in your draft.';return;}
    try{localStorage.setItem(draftKey,JSON.stringify(books));}catch{state.textContent='Save a downloaded backup before signing in: this browser cannot retain your draft.';return;}
    location.assign(service+'/auth');
  });
  signout.addEventListener('click',()=>{clearSession();state.textContent='Signed out on this tab. Your draft is still here.';});
  publish.addEventListener('click',async()=>{
    if(!validBooks(books)){state.textContent='Please correct your book entries before publishing.';return;}
    if(form.elements.title.value.trim() || form.elements.review.value.trim()){state.textContent='Save your open book entry before publishing.';return;}
    if(!books.length && !confirm('Publish an empty shelf? This removes all books from the public shelf.'))return;
    busy=true;updateButtons();state.textContent='Publishing your reading shelf…';
    try{const result=await api('PUT',{books,sha:revision});revision=result.sha;published=result.books;state.textContent='Published to GitHub. Your reading shelf will update when GitHub Pages finishes deploying.';const link=document.createElement('a');link.href=result.commit;link.target='_blank';link.rel='noopener noreferrer';link.className='text-link';link.textContent='View saved update ↗';state.append(' ',link);}catch(error){state.textContent=error.message;}finally{busy=false;updateButtons();}
  });
  load.addEventListener('click',async()=>{
    if(!confirm('Replace this browser draft with the published shelf? Download a backup first if you want to keep unpublished notes.'))return;
    busy=true;updateButtons();
    try{const result=await api('GET');books=result.books;published=result.books;revision=result.sha;conflict=false;resetForm();persist('Loaded your published shelf.');state.textContent='Published shelf loaded. You can edit and publish your next update.';}catch(error){state.textContent=error.message;}finally{busy=false;updateButtons();}
  });
  document.addEventListener('psyche-shelf-changed',updateButtons);
  if(session)connect();else updateButtons();
})();
