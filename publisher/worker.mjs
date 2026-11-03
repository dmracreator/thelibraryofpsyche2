const OWNER = 'dmracreator';
const REPO = 'thelibraryofpsyche2';
const REPOSITORY_ID = '1443323037';
const SITE = 'https://thelibraryofpsyche.com';
const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/books.js`;
const MAX_BYTES = 8 * 1024 * 1024;
const enc = new TextEncoder();
function b64(bytes) { let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(binary); }
function unb64(value) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
function base64url(bytes) { return b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function from64url(value) { return unb64(value.replace(/-/g, '+').replace(/_/g, '/')); }
async function key(secret) { return crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', enc.encode(secret)), 'AES-GCM', false, ['encrypt','decrypt']); }
async function seal(value, secret) { const iv = crypto.getRandomValues(new Uint8Array(12)); const body = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv}, await key(secret), enc.encode(JSON.stringify(value)))); return base64url(iv) + '.' + base64url(body); }
async function open(value, secret) { const [iv,body] = value.split('.'); const data = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:from64url(iv)},await key(secret),from64url(body)))); if (!Number.isFinite(data.exp) || data.exp < Date.now()) throw new Error('Expired'); return data; }
function cookie(request, name) { return (request.headers.get('Cookie') || '').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1); }
function json(value, status = 200) { return new Response(JSON.stringify(value), {status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':SITE,'Vary':'Origin','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, PUT, OPTIONS','X-Content-Type-Options':'nosniff'}}); }
function redirect(location, setCookie) { const headers = {'Location':location,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}; if(setCookie) headers['Set-Cookie']=setCookie; return new Response(null,{status:302,headers}); }
async function github(url, token, options = {}) { return fetch(url,{...options,headers:{'Authorization':`Bearer ${token}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Psyche-Shelf-Publisher','Content-Type':'application/json'}}); }
export function cleanBooks(input) {
  if (!Array.isArray(input) || input.length > 1000) throw new Error('Invalid shelf');
  return input.map(b=>{
    if (!b || typeof b !== 'object') throw new Error('Invalid book');
    const out = {};
    for (const [field,max] of [['title',250],['author',250],['finished',80],['review',10000],['affiliate',4096],['cover',7*1024*1024]]) {
      const value = b[field] ?? ''; if(typeof value !== 'string' || value.length > max) throw new Error('Invalid '+field); out[field] = value.trim();
    }
    if(!out.title || !out.author) throw new Error('Title and author required');
    if(out.affiliate && !/^https?:\/\//i.test(out.affiliate)) throw new Error('Invalid affiliate link');
    if(out.cover && !/^(https?:\/\/|assets\/|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$)/i.test(out.cover)) throw new Error('Invalid cover');
    return out;
  });
}
export function parseShelf(text) {
  const match = text.match(/^(?:\s*\/\/[^\n]*\n)*\s*window\.READING_SHELF\s*=\s*([\s\S]*?);?\s*$/);
  if(!match) throw new Error('Unrecognised shelf format');
  return cleanBooks(JSON.parse(match[1]));
}
async function readShelf(token) {
  const response = await github(API+'?ref=main',token);
  if(!response.ok) return {error:response.status};
  const file = await response.json();
  // GitHub omits inline content for larger files; read its Git blob with the same token.
  let content = file.content;
  if (!content && file.sha) { const blob = await github(`https://api.github.com/repos/${OWNER}/${REPO}/git/blobs/${file.sha}`,token); if(!blob.ok) return {error:blob.status}; content=(await blob.json()).content; }
  if(!content) throw new Error('Shelf content unavailable');
  return {sha:file.sha,books:parseShelf(new TextDecoder().decode(unb64(content.replace(/\s/g,''))))};
}
export default {async fetch(request,env) {
  try {
    if(!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.SESSION_SECRET) return json({error:'Publishing setup is not complete.'},503);
    const url = new URL(request.url);
    if(url.pathname==='/auth' && request.method==='GET') {
      const state = base64url(crypto.getRandomValues(new Uint8Array(32)));
      const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
      const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(verifier))));
      const flow = await seal({state,verifier,exp:Date.now()+600000},env.SESSION_SECRET);
      const auth = new URL('https://github.com/login/oauth/authorize');
      auth.search = new URLSearchParams({client_id:env.GITHUB_CLIENT_ID,redirect_uri:url.origin+'/callback',state,code_challenge:challenge,code_challenge_method:'S256',login:OWNER,allow_signup:'false'});
      return redirect(auth.href,`__Host-psyche-flow=${flow}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600`);
    }
    if(url.pathname==='/callback' && request.method==='GET') {
      const clear='__Host-psyche-flow=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0';
      try {
        const flow=await open(cookie(request,'__Host-psyche-flow')||'',env.SESSION_SECRET);
        if(url.searchParams.get('state')!==flow.state || !url.searchParams.get('code')) throw new Error();
        const result=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code:url.searchParams.get('code'),redirect_uri:url.origin+'/callback',code_verifier:flow.verifier,repository_id:REPOSITORY_ID})});
        const token=await result.json(); if(!token.access_token) throw new Error();
        const userResponse=await github('https://api.github.com/user',token.access_token);
        const user=await userResponse.json();
        if(!userResponse.ok || user.login?.toLowerCase()!==OWNER) return redirect(SITE+'/edit-shelf.html#publish-error=owner',clear);
        const shelf=await readShelf(token.access_token);
        if(shelf.error) return redirect(SITE+'/edit-shelf.html#publish-error=installation',clear);
        const session=await seal({token:token.access_token,login:OWNER,exp:Date.now()+3600000},env.SESSION_SECRET);
        return redirect(SITE+'/edit-shelf.html#publish-session='+encodeURIComponent(session),clear);
      }catch{return redirect(SITE+'/edit-shelf.html#publish-error=signin',clear);}
    }
    if(request.headers.get('Origin')!==SITE) return json({error:'This publisher only accepts requests from your website.'},403);
    if(request.method==='OPTIONS') return json({});
    if(url.pathname!=='/shelf' || !['GET','PUT'].includes(request.method)) return json({error:'Not found'},404);
    let session;
    try {const auth=request.headers.get('Authorization')||'';if(!auth.startsWith('Bearer ')) throw new Error();session=await open(auth.slice(7),env.SESSION_SECRET);if(session.login!==OWNER)throw new Error();}catch{return json({error:'Please sign in with GitHub again.'},401);}
    if(request.method==='GET') {const shelf=await readShelf(session.token);return shelf.error?json({error:'Cannot read the shelf. Check the app installation or sign in again.'},shelf.error===401?401:403):json(shelf);}
    if(!request.headers.get('Content-Type')?.startsWith('application/json')) return json({error:'Expected JSON'},415);
    if(Number(request.headers.get('Content-Length'))>MAX_BYTES) return json({error:'The shelf is too large. Use smaller cover images.'},413);
    const raw=await request.text(); if(enc.encode(raw).length>MAX_BYTES) return json({error:'The shelf is too large. Use smaller cover images.'},413);
    let data,books;
    try {data=JSON.parse(raw);books=cleanBooks(data.books);if(typeof data.sha!=='string'||!/^[a-f0-9]{40}$/.test(data.sha))throw new Error();}catch{return json({error:'Invalid shelf data.'},400);}
    const current=await readShelf(session.token);
    if(current.error) return json({error:'Cannot read the current shelf. Sign in again.'},403);
    if(current.sha!==data.sha) return json({error:'Your published shelf changed elsewhere. Load the published shelf before publishing again.'},409);
    const content='// Published reading shelf\nwindow.READING_SHELF = '+JSON.stringify(books,null,2)+';\n';
    const saved=await github(API,session.token,{method:'PUT',body:JSON.stringify({message:'Update reading shelf',content:b64(enc.encode(content)),sha:data.sha,branch:'main'})});
    if(!saved.ok) return json({error:saved.status===409?'The shelf changed while saving. Load the latest shelf and try again.':'GitHub could not save your shelf. Check the app has Contents write access and sign in again.'},saved.status===409?409:502);
    const commit=await saved.json(); return json({sha:commit.content.sha,commit:commit.commit.html_url,books});
  }catch{return json({error:'Publishing is temporarily unavailable. Your draft is safe; please try again.'},500);}
}};
