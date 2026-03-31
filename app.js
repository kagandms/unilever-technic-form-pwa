// DozaTech Service Form Application V2.5 (Restored Standard Filenames)

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });

// --- DISHWASHER ITEMS ---
const checklistItems = [
    { id: 'yikama-kollari', label: 'Yıkama Kolları' },
    { id: 'deterjan-pompasi', label: 'Deterjan/Parlatıcı Pompası' },
    { id: 'pompa-mebrani', label: 'Pompa Mebranı Değişimi' },
    { id: 'parlatici-girisi', label: 'Parlatıcı Girişi Değişimi' },
    { id: 'cekvalf', label: 'Çekvalf Değişimi' }
];

// --- DOSAGE PUMP ITEMS ---
const pumpChecklistItems = [
    { id: 'hortum', label: 'Hortum Değişimi' },
    { id: 'mebran', label: 'Mebran Değişimi' },
    { id: 'pompa', label: 'Pompa Değişimi' }
];

let machineCount = 0;
const machineStates = {};

let pumpCount = 0;
const pumpStates = {};

let customers = [];
let selectedCustomerId = null;

// DOM Elements
const decreaseBtn = document.getElementById('decreaseBtn');
const increaseBtn = document.getElementById('increaseBtn');
const countDisplay = document.getElementById('machineCount');
const machinesContainer = document.getElementById('machinesContainer');

const generalNotes = document.getElementById('generalNotes');
const customerSelect = document.getElementById('customerSelect');
const saveBtn = document.getElementById('saveBtn');
const sendBtn = document.getElementById('sendBtn');
const customerModal = document.getElementById('customerModal');
const editCustomerModal = document.getElementById('editCustomerModal');
const manageCustomersBtn = document.getElementById('manageCustomersBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeEditModalBtn = document.getElementById('closeEditModalBtn');
const addCustomerBtn = document.getElementById('addCustomerBtn');
const saveEditCustomerBtn = document.getElementById('saveEditCustomerBtn');
const customerNameInput = document.getElementById('customerName');
const customerPhoneInput = document.getElementById('customerPhone');
const editCustomerIdInput = document.getElementById('editCustomerId');
const editCustomerNameInput = document.getElementById('editCustomerName');
const editCustomerPhoneInput = document.getElementById('editCustomerPhone');
const customerListContainer = document.getElementById('customerList');

// Dynamic elements
let decreasePumpBtn, increasePumpBtn, pumpCountDisplay, pumpsContainer;

function init() {
    // Inject Pump HTML if not exists
    if (!document.getElementById('pumpsSection')) {
        const pumpHTML = `
        <div class="counter-section" id="pumpsSection" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
            <div class="counter-header">
                <div class="counter-title">
                    <div class="icon-box">💦</div>
                    <h2>Dozaj Pompası</h2>
                </div>
                <div class="counter-controls">
                    <button class="control-btn" id="decreasePumpBtn" disabled>−</button>
                    <span class="count-display" id="pumpCount">0</span>
                    <button class="control-btn" id="increasePumpBtn">+</button>
                </div>
            </div>
            <div class="machines-container" id="pumpsContainer">
                <div class="empty-state">
                    <div class="empty-state-icon">💦</div>
                    <p class="empty-state-text">Pompa eklemek için + tıklayın</p>
                </div>
            </div>
        </div>
        `;
        machinesContainer.insertAdjacentHTML('afterend', pumpHTML);
    }

    decreasePumpBtn = document.getElementById('decreasePumpBtn');
    increasePumpBtn = document.getElementById('increasePumpBtn');
    pumpCountDisplay = document.getElementById('pumpCount');
    pumpsContainer = document.getElementById('pumpsContainer');

    loadState();
    updateUI();
    updatePumpUI();
    renderCustomerSelect();
    setupEventListeners();
    registerServiceWorker();
}

function setupEventListeners() {
    decreaseBtn.addEventListener('click', decreaseMachineCount);
    increaseBtn.addEventListener('click', increaseMachineCount);

    decreasePumpBtn.addEventListener('click', decreasePumpCount);
    increasePumpBtn.addEventListener('click', increasePumpCount);

    generalNotes.addEventListener('input', saveState);
    customerSelect.addEventListener('change', e => { selectedCustomerId = e.target.value || null; saveState(); });
    saveBtn.addEventListener('click', handleSavePDF);
    sendBtn.addEventListener('click', handleSendWhatsApp);
    manageCustomersBtn.addEventListener('click', () => { customerModal.classList.add('show'); renderCustomerList(); });
    closeModalBtn.addEventListener('click', () => { customerModal.classList.remove('show'); });
    addCustomerBtn.addEventListener('click', addCustomer);
    closeEditModalBtn.addEventListener('click', () => { editCustomerModal.classList.remove('show'); });
    saveEditCustomerBtn.addEventListener('click', saveEditedCustomer);
    customerModal.addEventListener('click', e => { if (e.target === customerModal) customerModal.classList.remove('show'); });
    editCustomerModal.addEventListener('click', e => { if (e.target === editCustomerModal) editCustomerModal.classList.remove('show'); });
}

function addCustomer() {
    const name = customerNameInput.value.trim();
    let phone = customerPhoneInput.value.trim();
    if (!name || !phone) { alert('Lütfen tüm alanları doldurun.'); return; }
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('90')) phone = '90' + phone;
    customers.push({ id: Date.now().toString(), name, phone });
    saveState();
    renderCustomerList();
    renderCustomerSelect();
    customerNameInput.value = '';
    customerPhoneInput.value = '';
}

function deleteCustomer(id) {
    if (confirm('Silmek istediğinize emin misiniz?')) {
        customers = customers.filter(c => c.id !== id);
        if (selectedCustomerId === id) { selectedCustomerId = null; customerSelect.value = ''; }
        saveState();
        renderCustomerList();
        renderCustomerSelect();
    }
}

function openEditCustomerModal(id) {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    editCustomerIdInput.value = c.id;
    editCustomerNameInput.value = c.name;
    editCustomerPhoneInput.value = c.phone;
    editCustomerModal.classList.add('show');
}

function saveEditedCustomer() {
    const id = editCustomerIdInput.value;
    const name = editCustomerNameInput.value.trim();
    let phone = editCustomerPhoneInput.value.trim();
    if (!name || !phone) { alert('Lütfen tüm alanları doldurun.'); return; }
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('90')) phone = '90' + phone;
    const idx = customers.findIndex(c => c.id === id);
    if (idx > -1) {
        customers[idx] = { id, name, phone };
        saveState();
        renderCustomerList();
        renderCustomerSelect();
        editCustomerModal.classList.remove('show');
    }
}

function renderCustomerList() {
    if (customers.length === 0) {
        customerListContainer.innerHTML = '<div class="customer-list-empty"><p>Henüz müşteri yok</p></div>';
        return;
    }
    customerListContainer.innerHTML = customers.map(c => `
        <div class="customer-item">
            <div class="customer-info">
                <div class="customer-name">${c.name}</div>
                <div class="customer-phone">${c.phone}</div>
            </div>
            <div class="customer-actions">
                <button class="customer-action-btn edit" onclick="openEditCustomerModal('${c.id}')">✏️</button>
                <button class="customer-action-btn delete" onclick="deleteCustomer('${c.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function renderCustomerSelect() {
    let html = '<option value="">-- Seçin --</option>';
    customers.forEach(c => {
        html += `<option value="${c.id}" ${c.id === selectedCustomerId ? 'selected' : ''}>${c.name}</option>`;
    });
    customerSelect.innerHTML = html;
}

// === SAFE MODE: CHARACTER MAPPING ===
function convertTurkish(t) {
    if (!t) return '';
    return t.replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
}

function getImageDataUrl(selector, maxDim) {
    const img = document.querySelector(selector);
    if (!img) return null;
    try {
        const canvas = document.createElement('canvas');
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        const limit = maxDim || 200;
        if (w > limit || h > limit) {
            if (w >= h) { h = Math.round(h * (limit / w)); w = limit; }
            else { w = Math.round(w * (limit / h)); h = limit; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        return canvas.toDataURL('image/png');
    } catch (e) {
        return null;
    }
}

function generatePDFBlob() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const setPdfFont = (weight) => {
        if (window.pdfFont) {
            doc.setFont('Roboto', 'normal');
        } else {
            doc.setFont('helvetica', weight);
        }
    };

    // Using Standard Helvetica
    setPdfFont('normal');

    const customer = customers.find(c => c.id === selectedCustomerId);
    const date = new Date().toLocaleDateString('tr-TR');
    const time = new Date().toLocaleTimeString('tr-TR');
    const pw = doc.internal.pageSize.width;
    const ph = doc.internal.pageSize.height;

    const colDark = [14, 61, 140];
    const colPrimary = [76, 201, 240];
    const colAccent = [67, 97, 238];

    let y = 0;

    // === HEADER ===
    doc.setFillColor(...colDark);
    doc.rect(0, 0, pw, 45, 'F');

    // Logo
    const logoData = getImageDataUrl('.logo-image', 200);
    if (logoData) {
        try {
            const imgProps = doc.getImageProperties(logoData);
            const ratio = imgProps.height / imgProps.width;
            const boxW = 46, boxH = 31;
            let logoW = boxW, logoH = logoW * ratio;
            if (logoH > boxH) { logoH = boxH; logoW = logoH / ratio; }
            const logoX = 15 + (50 - logoW) / 2;
            const logoY = 5 + (35 - logoH) / 2;
            doc.addImage(logoData, 'PNG', logoX, logoY, logoW, logoH);
        } catch (e) { }
    }

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    setPdfFont('bold');
    doc.text('SERVIS FORMU', pw - 15, 22, { align: 'right' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    setPdfFont('normal');
    doc.text(`Tarih: ${date}   Saat: ${time}`, pw - 15, 32, { align: 'right' });

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(15, 45, pw - 15, 45);

    y = 60;

    // === CUSTOMER INFO ===
    if (customer) {
        doc.setDrawColor(...colAccent);
        doc.setLineWidth(0.3);
        doc.setFillColor(250, 250, 255);
        doc.roundedRect(15, y, pw - 30, 25, 2, 2, 'FD');
        doc.setFillColor(...colAccent);
        doc.circle(24, y + 12, 5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('M', 24, y + 13.5, { align: 'center' });
        doc.setTextColor(...colDark);
        doc.setFontSize(12);
        setPdfFont('bold');
        doc.text(customer.name, 34, y + 10);
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        setPdfFont('normal');
        doc.text(customer.phone, 34, y + 18);
        y += 32;
    } else {
        y += 8;
    }

    // === SECTION: DISHWASHERS ===
    if (machineCount > 0) {
        doc.setTextColor(...colDark);
        doc.setFontSize(14);
        setPdfFont('bold');
        doc.text(`BULASIK MAKINELERI (${machineCount})`, 15, y);
        doc.setDrawColor(...colPrimary);
        doc.line(15, y + 3, 100, y + 3);
        y += 10;

        for (let i = 1; i <= machineCount; i++) {
            if (y > 245) { doc.addPage(); y = 20; }

            doc.setFillColor(...colPrimary);
            doc.roundedRect(15, y, pw - 30, 8, 2, 2, 'F');
            doc.setTextColor(...colDark);
            doc.setFontSize(10);
            setPdfFont('bold');
            doc.text(`Bulasik Makinesi ${i}`, 20, y + 5.5);

            y += 12;

            const state = machineStates[i] || {};
            doc.setFontSize(9);
            setPdfFont('normal');

            let xPos = 20;

            checklistItems.forEach((item, index) => {
                const status = state[item.id];

                // Icon
                doc.setFillColor(255, 255, 255);
                if (status === 'ok') doc.setFillColor(46, 204, 113);
                if (status === 'fail') doc.setFillColor(239, 71, 111);

                if (status) {
                    doc.circle(xPos + 2, y - 1, 3, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(7);
                    const mark = status === 'ok' ? 'V' : 'X';
                    doc.text(mark, xPos + 2, y, { align: 'center' });
                } else {
                    doc.setDrawColor(200, 200, 200);
                    doc.circle(xPos + 2, y - 1, 3, 'S');
                }

                doc.setTextColor(80, 80, 80);
                doc.setFontSize(9);
                doc.text(item.label, xPos + 7, y);

                if (index % 2 === 0) {
                    xPos = pw / 2 + 5;
                } else {
                    xPos = 20;
                    y += 6;
                }
            });
            if (checklistItems.length % 2 !== 0) y += 6;
            y += 6;
        }
        y += 6;
    }

    // === SECTION: DOSAGE PUMPS ===
    if (pumpCount > 0) {
        if (y > 245) { doc.addPage(); y = 20; }
        doc.setTextColor(...colDark);
        doc.setFontSize(14);
        setPdfFont('bold');
        doc.text(`DOZAJ POMPALARI (${pumpCount})`, 15, y);
        doc.setDrawColor(...colPrimary);
        doc.line(15, y + 3, 100, y + 3);
        y += 10;

        for (let i = 1; i <= pumpCount; i++) {
            if (y > 245) { doc.addPage(); y = 20; }

            doc.setFillColor(...colAccent);
            doc.roundedRect(15, y, pw - 30, 8, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            setPdfFont('bold');
            doc.text(`Dozaj Pompasi ${i}`, 20, y + 5.5);

            y += 12;

            const state = pumpStates[i] || {};
            doc.setFontSize(9);
            setPdfFont('normal');

            let xPos = 20;

            pumpChecklistItems.forEach((item, index) => {
                const status = state[item.id];

                doc.setFillColor(255, 255, 255);
                if (status === 'ok') doc.setFillColor(46, 204, 113);
                if (status === 'fail') doc.setFillColor(239, 71, 111);

                if (status) {
                    doc.circle(xPos + 2, y - 1, 3, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(7);
                    const mark = status === 'ok' ? 'V' : 'X';
                    doc.text(mark, xPos + 2, y, { align: 'center' });
                } else {
                    doc.setDrawColor(200, 200, 200);
                    doc.circle(xPos + 2, y - 1, 3, 'S');
                }

                doc.setTextColor(80, 80, 80);
                doc.setFontSize(9);
                doc.text(item.label, xPos + 7, y);

                if (index % 2 === 0) {
                    xPos = pw / 2 + 5;
                } else {
                    xPos = 20;
                    y += 6;
                }
            });
            if (pumpChecklistItems.length % 2 !== 0) y += 6;
            y += 6;
        }
    }

    // === NOTES ===
    if (generalNotes.value.trim()) {
        if (y > 240) { doc.addPage(); y = 20; }
        const txt = generalNotes.value;
        setPdfFont('bold');
        doc.setFontSize(10);
        doc.setTextColor(...colDark);
        doc.text('NOTLAR:', 15, y);
        y += 6;
        setPdfFont('normal');
        doc.setFontSize(9);
        const lines = doc.splitTextToSize(txt, pw - 30);
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(230, 230, 230);
        const boxH = Math.max(15, lines.length * 5 + 10);
        doc.rect(15, y, pw - 30, boxH, 'FD');
        doc.setTextColor(50, 50, 50);
        doc.text(lines, 20, y + 6);
        y += boxH + 8;
    } else {
        y += 6;
    }

    // === SIGNATURES ===
    if (y > ph - 45) { doc.addPage(); y = 20; }
    const bottomY = Math.max(y, ph - 55);

    // Left: Teknik Servis
    doc.setTextColor(...colDark);
    doc.setFontSize(10);
    setPdfFont('bold');
    doc.text('Servis Teknisyeni', 40, bottomY + 5, { align: 'center' });
    doc.setFontSize(9);
    setPdfFont('normal');
    doc.text('Ahmet Durmus', 40, bottomY + 12, { align: 'center' });

    // Right: Customer
    doc.text('Musteri', pw - 45, bottomY + 5, { align: 'center' });
    if (customer) {
        setPdfFont('normal');
        doc.setFontSize(9);
        doc.text(customer.name, pw - 45, bottomY + 30, { align: 'center' });
    }
    doc.setDrawColor(150, 150, 150);
    doc.line(pw - 70, bottomY + 35, pw - 20, bottomY + 35);

    // === FOOTER ===
    doc.setFillColor(...colDark);
    doc.rect(0, ph - 15, pw, 15, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    // Filename: servisformu_...
    const safeName = customer ? customer.name.replace(/\s+/g, '_') : 'Musteri';
    const fn = `servisformu_${safeName}_${date.replace(/\./g, '-')}.pdf`;

    doc.text('Unilever', pw / 2, ph - 9, { align: 'center' });
    doc.text('Bu form dijital olarak olusturulmustur.', pw / 2, ph - 5, { align: 'center' });

    return { blob: doc.output('blob'), fileName: fn };
}

function handleSavePDF() {
    showToast('PDF oluşturuluyor...');
    try {
        const { blob, fileName } = generatePDFBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
        showToast('PDF indirildi.');
    } catch (error) {
        console.error(error);
        showToast('Hata: ' + error.message);
    }
}

function handleSendWhatsApp() {
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) { alert('Lütfen müşteri seçin.'); return; }

    try {
        const { blob, fileName } = generatePDFBlob();
        const file = new File([blob], fileName, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            const noteText = customer.name;
            navigator.share({
                files: [file],
                title: noteText,
                text: noteText
            }).catch(e => { if (e.name !== 'AbortError') openWA(customer, blob, fileName); });
        } else {
            openWA(customer, blob, fileName);
        }
    } catch (error) {
        showToast('Hata: ' + error.message);
    }
}

function openWA(customer, blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);

    const msg = customer.name;
    setTimeout(() => { window.open('https://wa.me/' + customer.phone + '?text=' + encodeURIComponent(msg), '_blank'); }, 500);
}

// Global Exports
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(e => console.log(e));
    }
}

// Global Exports
window.increaseMachineCount = increaseMachineCount;
window.decreaseMachineCount = decreaseMachineCount;
window.increasePumpCount = increasePumpCount;
window.decreasePumpCount = decreasePumpCount;
window.setCheck = setCheck;
window.addCustomer = addCustomer;
window.deleteCustomer = deleteCustomer;
window.openEditCustomerModal = openEditCustomerModal;
window.saveEditedCustomer = saveEditedCustomer;

init();
