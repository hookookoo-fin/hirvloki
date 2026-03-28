let historyData = JSON.parse(localStorage.getItem('hirvHistory')) || [];

document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
    setupListeners();
});

function setupListeners() {
    document.querySelectorAll('.calculator-card').forEach(card => {
        card.querySelectorAll('input[type="time"]').forEach(input => {
            input.addEventListener('input', () => calculateDifference(card));
        });
    });
}

function setNow(btn, targetClass) {
    const card = btn.closest('.calculator-card');
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + 
                    now.getMinutes().toString().padStart(2, '0');
    card.querySelector('.' + targetClass).value = timeStr;
    calculateDifference(card);
}

function setNowSpecial() {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + 
                    now.getMinutes().toString().padStart(2, '0');
    document.querySelector('.t-start').value = timeStr;
    calculateEndTime();
}

function addEventText(btn) {
    const card = btn.closest('.calculator-card');
    const timeInput = card.querySelector('.event-time');
    const textInput = card.querySelector('.event-text');
    const list = card.querySelector('.event-list');

    if (!timeInput.value || !textInput.value) return;

    const div = document.createElement('div');
    div.className = 'event-tag';
    div.dataset.time = timeInput.value;
    div.dataset.text = textInput.value;
    div.innerHTML = `<span>${timeInput.value} ${textInput.value}</span> <button onclick="this.parentElement.remove()">×</button>`;
    list.appendChild(div);
    
    textInput.value = "";
    timeInput.value = "";
}

function calculateDifference(card) {
    const t1 = card.querySelector('.t1')?.value;
    const t2 = card.querySelector('.t2')?.value;
    if (!t1 || !t2) return;

    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 1440;
    card.querySelector('.result').innerText = diff + " min";
}

function calculateEndTime() {
    const startVal = document.querySelector('.t-start').value;
    const durationVal = document.querySelector('.duration-input').value;
    const resultDiv = document.querySelector('.end-result');

    if (!startVal || !durationVal) {
        resultDiv.innerText = "--:--";
        return;
    }

    const [h, m] = startVal.split(':').map(Number);
    let totalMinutes = h * 60 + m + parseInt(durationVal);
    totalMinutes = totalMinutes % 1440;

    const endH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const endM = (totalMinutes % 60).toString().padStart(2, '0');
    resultDiv.innerText = `${endH}:${endM}`;
}

function saveResult(btn) {
    const card = btn.closest('.calculator-card');
    const title = card.querySelector('.header-input').value || "Nimetön";
    const t1 = card.querySelector('.t1').value;
    const t2 = card.querySelector('.t2').value;
    const duration = card.querySelector('.result').innerText;

    if (!t1 || !t2) return alert("Aseta ajat ensin");

    const events = Array.from(card.querySelectorAll('.event-tag')).map(el => ({
        time: el.dataset.time,
        text: el.dataset.text
    }));

    const entry = {
        id: Date.now(),
        title,
        start: t1,
        end: t2,
        duration,
        events: events.sort((a, b) => a.time.localeCompare(b.time))
    };

    historyData.push(entry);
    historyData.sort((a, b) => a.start.localeCompare(b.start));
    localStorage.setItem('hirvHistory', JSON.stringify(historyData));
    renderHistory();
    
    // Tyhjennys
    card.querySelector('.header-input').value = "";
    card.querySelector('.t1').value = "";
    card.querySelector('.t2').value = "";
    card.querySelector('.result').innerText = "0 min";
    card.querySelector('.event-list').innerHTML = "";
}

// MUOKKAUSTOIMINTO: Palauttaa tiedot korttiin 1
function editItem(id) {
    const item = historyData.find(i => i.id === id);
    if (!item) return;

    if(!confirm("Palautetaanko tämä tapahtuma muokattavaksi korttiin 1? (Vanha tallennus poistuu)")) return;

    const card = document.getElementById('calc-1');
    card.querySelector('.header-input').value = item.title;
    card.querySelector('.t1').value = item.start;
    card.querySelector('.t2').value = item.end;
    
    const list = card.querySelector('.event-list');
    list.innerHTML = "";
    item.events.forEach(e => {
        const div = document.createElement('div');
        div.className = 'event-tag';
        div.dataset.time = e.time;
        div.dataset.text = e.text;
        div.innerHTML = `<span>${e.time} ${e.text}</span> <button onclick="this.parentElement.remove()">×</button>`;
        list.appendChild(div);
    });

    calculateDifference(card);
    deleteItem(id); // Poistetaan vanha, jotta uusi korvaa sen tallennettaessa
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = historyData.length === 0 ? '<p style="text-align:center; color:gray;">Ei tallennettuja tapahtumia.</p>' : '';

    historyData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        let eventHtml = item.events.map(e => `<div class="event-row-saved">    ${e.time} ${e.text}</div>`).join('');
        
        div.innerHTML = `
            <div style="flex-grow: 1;">
                <strong>${item.title}</strong><br>
                ${item.start} - ${item.end} (${item.duration})
                ${eventHtml}
            </div>
            <div class="history-actions">
                <button class="edit-item-btn" onclick="editItem(${item.id})" title="Muokkaa">✏️</button>
                <button class="copy-item-btn" onclick="copySingleItem(${item.id})" title="Kopioi">📋</button>
                <button onclick="deleteItem(${item.id})" title="Poista">×</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function copySingleItem(id) {
    const item = historyData.find(i => i.id === id);
    let str = `${item.title}\n${item.start} - ${item.end} (${item.duration})`;
    item.events.forEach(e => { str += `\n    ${e.time} ${e.text}`; });
    navigator.clipboard.writeText(str).then(showToast);
}

function copyAllToClipboard() {
    const text = historyData.map(item => {
        let str = `${item.title}\n${item.start} - ${item.end} (${item.duration})`;
        item.events.forEach(e => { str += `\n    ${e.time} ${e.text}`; });
        return str;
    }).join('\n\n');
    navigator.clipboard.writeText(text).then(showToast);
}

function resetCard(id) {
    if(confirm("Tyhjennetäänkö kortti?")) {
        const card = document.getElementById(`calc-${id}`);
        card.querySelectorAll('input').forEach(i => i.value = "");
        if(id < 3) {
            card.querySelector('.result').innerText = "0 min";
            card.querySelector('.event-list').innerHTML = "";
        } else {
            card.querySelector('.end-result').innerText = "--:--";
        }
    }
}

function resetEverything() {
    if(confirm("Tyhjennetäänkö kaikki kortit?")) {
        document.querySelectorAll('input').forEach(i => i.value = "");
        document.querySelectorAll('.result').forEach(r => r.innerText = "0 min");
        document.querySelectorAll('.event-list').forEach(e => e.innerHTML = "");
        const special = document.querySelector('.end-result');
        if(special) special.innerText = "--:--";
    }
}

function deleteItem(id) {
    historyData = historyData.filter(i => i.id !== id);
    localStorage.setItem('hirvHistory', JSON.stringify(historyData));
    renderHistory();
}

function clearHistory() {
    if(confirm("Tyhjennetäänkö koko historia?")) {
        historyData = [];
        localStorage.removeItem('hirvHistory');
        renderHistory();
    }
}

function showToast() {
    const t = document.getElementById('toast');
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 2000);
}