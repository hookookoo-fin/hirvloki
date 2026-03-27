let historyData = JSON.parse(localStorage.getItem('hirvHistory')) || [];

// Alustus
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
}

function calculateDifference(card) {
    const t1 = card.querySelector('.t1').value;
    const t2 = card.querySelector('.t2').value;
    if (!t1 || !t2) return;

    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 1440;
    card.querySelector('.result').innerText = diff + " min";
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
    // Sorttaus aloitusaikojen mukaan (vanhin ensin)
    historyData.sort((a, b) => a.start.localeCompare(b.start));
    
    localStorage.setItem('hirvHistory', JSON.stringify(historyData));
    renderHistory();
    
    // Tyhjennä tapahtumat kortista
    card.querySelector('.event-list').innerHTML = "";
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = "";

    historyData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        let eventHtml = item.events.map(e => `<div class="event-row-saved">    ${e.time} ${e.text}</div>`).join('');
        
        div.innerHTML = `
            <div>
                <strong>${item.title}</strong><br>
                ${item.start} - ${item.end} (${item.duration})
                ${eventHtml}
            </div>
            <button onclick="deleteItem(${item.id})">×</button>
        `;
        list.appendChild(div);
    });
}

function copyAllToClipboard() {
    const text = historyData.map(item => {
        let str = `${item.title}\n${item.start} - ${item.end} (${item.duration})`;
        item.events.forEach(e => {
            str += `\n    ${e.time} ${e.text}`;
        });
        return str;
    }).join('\n\n');
    
    navigator.clipboard.writeText(text);
    showToast();
}

function deleteItem(id) {
    historyData = historyData.filter(i => i.id !== id);
    localStorage.setItem('hirvHistory', JSON.stringify(historyData));
    renderHistory();
}

function showToast() {
    const t = document.getElementById('toast');
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 2000);
}