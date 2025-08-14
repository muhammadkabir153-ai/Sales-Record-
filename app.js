/* Kayan Miya PWA (Calendar + Debtors + Backup + Offline)
   LocalStorage keys:
   - KM_DAY_<YYYY-MM-DD>  -> { date, items: [...] }
   - KM_DEBTS             -> [ {name, amount, note, createdAt, dueDate, paid} ]
*/

const LS_DAY_PREFIX = 'KM_DAY_';
const LS_DEBTS = 'KM_DEBTS';

const DEFAULT_ITEMS = [
  { name: 'Attaruhu', purchaseCost: 1000, portionPrice: 50, qtySold: 0 },
  { name: 'Tumatur', purchaseCost: 1000, portionPrice: 150, qtySold: 0 },
  { name: 'Tattasai', purchaseCost: 1500, portionPrice: 100, qtySold: 0 },
  { name: 'Albasa me laushi', purchaseCost: 500, portionPrice: 50, qtySold: 0 },
  { name: 'Albasa', purchaseCost: 500, portionPrice: 50, qtySold: 0 },
  { name: 'Latas', purchaseCost: 500, portionPrice: 50, qtySold: 0 },
  { name: 'Alayyahu', purchaseCost: 300, portionPrice: 50, qtySold: 0 },
  { name: 'Spices Mix', purchaseCost: 400, portionPrice: 50, qtySold: 0 }
];

let activeDate = today();
let items = []; // items for activeDate
let debts = load(LS_DEBTS) || [];

function today(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

function keyForDate(dateStr){ return `${LS_DAY_PREFIX}${dateStr}`; }
function load(key){ try{ const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; }catch{ return null; } }
function save(key,v){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch(e){ console.error(e); } }
function currency(n){ return '₦' + Number(n||0).toLocaleString(); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function ymd(date){ const d=new Date(date); const mm=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); return `${d.getFullYear()}-${mm}-${dd}`; }

/* ---------- Day data ---------- */
function ensureDay(dateStr){
  const k = keyForDate(dateStr);
  let day = load(k);
  if(!day){ day = { date: dateStr, items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)) }; save(k, day); }
  return day;
}
function setDay(dateStr, day){ save(keyForDate(dateStr), day); }

function setActiveDate(dateStr){
  activeDate = dateStr;
  document.getElementById('activeDateLabel').textContent = activeDate;
  document.getElementById('datePicker').value = activeDate;
  const day = ensureDay(activeDate);
  items = day.items;
  renderItems();
}

/* ---------- Rendering ---------- */
function renderItems(){
  const tbody = document.querySelector('#itemsTable tbody');
  tbody.innerHTML = '';
  items.forEach((it, idx)=>{
    const totalSales = (it.qtySold||0) * (it.portionPrice||0);
    const profit = totalSales - (it.purchaseCost||0);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(it.name)}</td>
      <td><input class="price-edit" data-field="purchaseCost" data-idx="${idx}" type="number" value="${it.purchaseCost||0}" min="0" step="1"/></td>
      <td><input class="price-edit" data-field="portionPrice" data-idx="${idx}" type="number" value="${it.portionPrice||0}" min="0" step="1"/></td>
      <td>${it.qtySold||0}</td>
      <td class="right">${currency(totalSales)}</td>
      <td class="right">${currency(profit)}</td>
      <td class="right actions">
        <button class="small" data-action="minus" data-idx="${idx}">−1</button>
        <button class="small" data-action="plus" data-idx="${idx}">+1</button>
        <button class="small" data-action="plus5" data-idx="${idx}">×5</button>
        <button class="small" data-action="delete" data-idx="${idx}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Totals
  const totals = items.reduce((a,it)=>{
    const t = (it.qtySold||0) * (it.portionPrice||0);
    a.qty += (it.qtySold||0);
    a.sales += t;
    a.profit += t - (it.purchaseCost||0);
    return a;
  }, {qty:0, sales:0, profit:0});
  document.getElementById('totQty').textContent = totals.qty;
  document.getElementById('totSales').textContent = currency(totals.sales);
  document.getElementById('totProfit').textContent = currency(totals.profit);

  // Persist
  setDay(activeDate, { date: activeDate, items });
}

function changeQty(idx, delta){
  const it = items[idx]; if(!it) return;
  const next = Math.max(0, (it.qtySold||0) + delta);
  it.qtySold = next;
  renderItems();
}

function handleItemsDelegation(e){
  const btn = e.target.closest('button[data-action]');
  if(btn){
    const idx = Number(btn.dataset.idx);
    const action = btn.dataset.action;
    if(action==='plus') changeQty(idx, +1);
    if(action==='minus') changeQty(idx, -1);
    if(action==='plus5') changeQty(idx, +5);
    if(action==='delete'){ if(confirm('Delete this item?')){ items.splice(idx,1); renderItems(); } }
    return;
  }
  const edit = e.target.closest('.price-edit');
  if(edit){
    const idx = Number(edit.dataset.idx);
    const field = edit.dataset.field;
    const val = Math.max(0, Math.round(Number(edit.value)||0));
    items[idx][field] = val;
    renderItems();
  }
}

function addItem(){
  const name = document.getElementById('newName').value.trim();
  const purchaseCost = Math.round(Number(document.getElementById('newPurchaseCost').value)||0);
  const portionPrice = Math.round(Number(document.getElementById('newPortionPrice').value)||0);
  if(!name){ alert('Enter item name'); return; }
  items.push({ name, purchaseCost, portionPrice, qtySold: 0 });
  document.getElementById('newName').value='';
  document.getElementById('newPurchaseCost').value='';
  document.getElementById('newPortionPrice').value='';
  renderItems();
}

/* ---------- CSV Export ---------- */
function exportCsv(){
  const rows = [['date','name','purchaseCost','portionPrice','qtySold','totalSales','profit']];
  items.forEach(it=>{
    const sales = (it.qtySold||0)*(it.portionPrice||0);
    const profit = sales - (it.purchaseCost||0);
    rows.push([activeDate, it.name, it.purchaseCost||0, it.portionPrice||0, it.qtySold||0, sales, profit]);
  });
  downloadCsv(rows, `kayan_miya_${activeDate}.csv`);
}

function downloadCsv(rows, filename){
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* ---------- Debtors ---------- */
function renderDebts(){
  const tbody = document.querySelector('#debtsTable tbody');
  tbody.innerHTML = '';
  const todayStr = today();
  debts.forEach((d, i)=>{
    const isPaid = !!d.paid;
    const dueStr = d.dueDate || '';
    const overdue = !isPaid && dueStr && (dueStr < todayStr); // compare YYYY-MM-DD strings
    const status = isPaid ? '<span class="badge ok">Paid</span>' : (overdue ? '<span class="badge overdue">Overdue</span>' : '<span class="badge pending">Pending</span>');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(d.name)}</td>
      <td>${currency(d.amount||0)}</td>
      <td>${(d.createdAt||'').slice(0,16).replace('T',' ')}</td>
      <td>${dueStr}</td>
      <td>${escapeHtml(d.note||'')}</td>
      <td>${status}</td>
      <td class="right">
        ${isPaid ? '' : `<button class="small" data-action="markPaid" data-idx="${i}">Mark Paid</button>`}
        <button class="small" data-action="deleteDebt" data-idx="${i}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  save(LS_DEBTS, debts);
}

function addDebtor(){
  const name = document.getElementById('debtorName').value.trim();
  const amount = Math.round(Number(document.getElementById('debtorAmount').value)||0);
  const dueDate = document.getElementById('debtorDue').value || null;
  const note = document.getElementById('debtorNote').value.trim();
  if(!name || amount<=0){ alert('Enter debtor name and positive amount'); return; }
  const createdAt = new Date().toISOString();
  debts.push({ name, amount, note, createdAt, dueDate, paid: false });
  document.getElementById('debtorName').value='';
  document.getElementById('debtorAmount').value='';
  document.getElementById('debtorDue').value='';
  document.getElementById('debtorNote').value='';
  renderDebts();
}

function debtsDelegation(e){
  const btn = e.target.closest('button[data-action]'); if(!btn) return;
  const idx = Number(btn.dataset.idx);
  if(btn.dataset.action==='markPaid'){ debts[idx].paid = true; renderDebts(); }
  if(btn.dataset.action==='deleteDebt'){ if(confirm('Delete this debt?')){ debts.splice(idx,1); renderDebts(); } }
}

/* ---------- Backup & Restore (.json) ---------- */
function buildBackup(){
  const data = {};
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k && (k.startsWith(LS_DAY_PREFIX) || k===LS_DEBTS)){
      data[k] = JSON.parse(localStorage.getItem(k));
    }
  }
  return { version:'KM_BACKUP_V1', exportedAt: new Date().toISOString(), data };
}
function handleBackup(){
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], {type:'application/json;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`kayan_miya_backup_${activeDate}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function handleRestoreFile(e){
  const file = e.target.files && e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result);
      if(parsed.version!=='KM_BACKUP_V1' || !parsed.data){ alert('Invalid backup file'); return; }
      // Clear existing KM keys
      const toRemove = [];
      for(let i=0;i<localStorage.length;i++){
        const k = localStorage.key(i);
        if(k && (k.startsWith(LS_DAY_PREFIX) || k===LS_DEBTS)) toRemove.push(k);
      }
      toRemove.forEach(k=> localStorage.removeItem(k));
      // Restore
      Object.entries(parsed.data).forEach(([k,v])=> localStorage.setItem(k, JSON.stringify(v)));
      debts = load(LS_DEBTS) || [];
      setActiveDate(activeDate);
      renderDebts();
      alert('Restore complete.');
    }catch(err){ alert('Could not restore backup.'); }
  };
  reader.readAsText(file);
}

/* ---------- PWA install + Service Worker ---------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt = e; document.getElementById('installBtn').style.display='inline-block'; });
document.getElementById('installBtn').addEventListener('click', async ()=>{
  if(deferredPrompt){ deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; document.getElementById('installBtn').style.display='none'; }
});

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=> navigator.serviceWorker.register('./service-worker.js'));
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  const dp = document.getElementById('datePicker');
  dp.value = activeDate;
  dp.addEventListener('change', ()=> setActiveDate(dp.value || today()));
  document.getElementById('activeDateLabel').textContent = activeDate;

  document.getElementById('addItem').addEventListener('click', addItem);
  document.getElementById('itemsTable').addEventListener('click', handleItemsDelegation);
  document.getElementById('itemsTable').addEventListener('change', handleItemsDelegation);
  document.getElementById('exportCsv').addEventListener('click', exportCsv);
  document.getElementById('resetToday').addEventListener('click', ()=>{ if(!confirm('Reset SOLD counts for this day to zero?')) return; items.forEach(it=> it.qtySold=0); renderItems(); });

  document.getElementById('addDebtor').addEventListener('click', addDebtor);
  document.getElementById('debtsTable').addEventListener('click', debtsDelegation);
  document.getElementById('notifyDue').addEventListener('click', ()=>{
    if(!('Notification' in window)){ alert('Notifications not supported'); return; }
    if(Notification.permission === 'default'){ Notification.requestPermission().then(p=>{ if(p==='granted') notifyOverdue(); else alert('Notification permission denied'); }); }
    else if(Notification.permission === 'granted'){ notifyOverdue(); }
    else{ alert('Notifications blocked in browser settings.'); }
  });
  document.getElementById('exportDebts').addEventListener('click', ()=>{
    const rows = [['name','amount','createdAt','dueDate','note','paid']];
    debts.forEach(d=> rows.push([d.name, d.amount||0, d.createdAt||'', d.dueDate||'', d.note||'', !!d.paid]));
    downloadCsv(rows, `kayan_miya_debts_${today()}.csv`);
  });

  document.getElementById('backupBtn').addEventListener('click', handleBackup);
  document.getElementById('restoreFile').addEventListener('change', handleRestoreFile);

  // load initial
  ensureDay(activeDate); setActiveDate(activeDate); renderDebts();
});

function notifyOverdue(){
  const overdues = (debts||[]).filter(d=> !d.paid && d.dueDate && d.dueDate < today());
  const body = overdues.length ? `${overdues.length} debtor(s) overdue.` : 'No overdue debtors.';
  try{ new Notification('Kayan Miya — Debtors', { body }); }catch{ alert(body); }
}
