const initialShifts = [
    { morning: 'D', night: 'B' },
    { morning: 'C', night: 'D' },
    { morning: 'A', night: 'C' },
    { morning: 'B', night: 'A' },
    { morning: 'D', night: 'B' },
    { morning: 'C', night: 'D' },
    { morning: 'A', night: 'C' },
    { morning: 'B', night: 'A' }
];

let shifts = [...initialShifts];
let currentDate = new Date();
let holidays = [];
let holidayDescriptions = {};
let shiftColors = {
    A: '#e6f7ff',
    B: '#ffccff',
    C: '#e6ffe6',
    D: '#ffffcc'
};
let shiftNames = {
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D'
};
let showOffDays = true; // Option to show off days
let userShift = 'A'; // User selected shift
let userId = ''; // User ID for chat

// Connect to the WebSocket server
const ws = new WebSocket('wss://<YOUR_HEROKU_APP_NAME>.herokuapp.com');

ws.onopen = () => {
    console.log('Connected to the WebSocket server');
};

ws.onmessage = (event) => {
    const chatWindow = document.getElementById('chat-window');
    const messageElement = document.createElement('div');
    messageElement.textContent = event.data;
    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
};

function loadCalendar() {
    const monthYear = document.getElementById('current-month-year');
    const calendarBody = document.getElementById('calendar-body');
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    monthYear.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    calendarBody.innerHTML = '';

    let row = document.createElement('tr');
    for (let i = 0; i < firstDay.getDay(); i++) {
        const cell = document.createElement('td');
        row.appendChild(cell);
    }

    let shiftCounter = 0;

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const cell = document.createElement('td');
        const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        let content = '';

        let shiftPatternIndex = (shiftCounter % shifts.length);
        let morningShift = shifts[shiftPatternIndex].morning;
        let nightShift = shifts[shiftPatternIndex].night;

        // Check if it's an off day for the current user shift
        let isOffDay = (morningShift !== userShift && nightShift !== userShift);

        if (showOffDays || !isOffDay) {
            content = `<div class="shift-block" style="background-color: ${shiftColors[morningShift]}">
                            <span>${day} Morning: ${shiftNames[morningShift]}</span>
                       </div>
                       <div class="shift-block" style="background-color: ${shiftColors[nightShift]}">
                            <span>${day} Night: ${shiftNames[nightShift]}</span>
                       </div>`;
        }

        if (holidays.includes(cellDate.toISOString().split('T')[0])) {
            cell.classList.add('holiday');
            cell.title = "Holiday";
            if (holidayDescriptions[cellDate.toISOString().split('T')[0]]) {
                cell.title = holidayDescriptions[cellDate.toISOString().split('T')[0]];
            }
        }

        cell.innerHTML = content;
        cell.addEventListener('click', () => showShiftDetails(day, morningShift, 'morning', nightShift, 'night'));
        row.appendChild(cell);

        if (cellDate.getDay() === 6) {
            calendarBody.appendChild(row);
            row = document.createElement('tr');
        }

        shiftCounter++;
    }

    if (row.children.length > 0) {
        calendarBody.appendChild(row);
    }

    displayShifts();
    displayHolidayLegend();
}

function displayShifts() {
    const now = new Date();
    const currentShift = getShiftByDate(now);
    
    const nextShiftDate = (now.getHours() >= 7 && now.getHours() < 19) ? 
        new Date(now.setHours(19, 0, 0, 0)) : new Date(now.setHours(7, 0, 0, 0));
    
    const prevShiftDate = (now.getHours() >= 7 && now.getHours() < 19) ? 
        new Date(now.setHours(7, 0, 0, 0)) : new Date(now.setHours(19, 0, 0, 0));
    
    const nextShift = getShiftByDate(nextShiftDate);
    const prevShift = getShiftByDate(prevShiftDate);

    document.getElementById('current-shift-display').textContent = `Current Shift: ${currentShift}`;
    document.getElementById('next-shift-display').textContent = `Next Shift: ${nextShift}`;
    document.getElementById('previous-shift-display').textContent = `Previous Shift: ${prevShift}`;
}

function getShiftByDate(date) {
    const totalDays = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
    const cycleDay = totalDays % shifts.length;
    const shiftIndex = cycleDay < 0 ? shifts.length + cycleDay : cycleDay;
    const hour = date.getHours();
    const shiftPeriod = (hour >= 7 && hour < 19) ? 'morning' : 'night';
    const shift = shifts[shiftIndex][shiftPeriod];
    return `${shiftNames[shift]} ${shiftPeriod}`;
}

function showPreviousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    loadCalendar();
}

function showNextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    loadCalendar();
}

function showShiftDetails(day, morningShift, morningPeriod, nightShift, nightPeriod) {
    alert(`Day: ${day}\nMorning Shift: ${shiftNames[morningShift]}\nNight Shift: ${shiftNames[nightShift]}`);
}

function fetchHolidays() {
    const apiKey = '8eq0WDPLXW3OdwgLM2kkT7GAtROKMl0u';
    const country = 'KW';
    const year = currentDate.getFullYear();
    const url = `https://calendarific.com/api/v2/holidays?&api_key=${apiKey}&country=${country}&year=${year}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            holidays = data.response.holidays.map(holiday => holiday.date.iso);
            holidayDescriptions = data.response.holidays.reduce((acc, holiday) => {
                acc[holiday.date.iso] = holiday.description;
                return acc;
            }, {});
            loadCalendar();
        })
        .catch(error => {
            console.error('Error fetching holidays:', error);
            loadCalendar();
        });
}

function displayHolidayLegend() {
    const holidayList = document.getElementById('holiday-list');
    holidayList.innerHTML = '';

    holidays.forEach(date => {
        const listItem = document.createElement('li');
        listItem.textContent = `${date}: ${holidayDescriptions[date]}`;
        holidayList.appendChild(listItem);
    });
}

function jumpToDate() {
    const datePicker = document.getElementById('date-picker');
    const selectedDate = new Date(datePicker.value);
    if (!isNaN(selectedDate.getTime())) {
        currentDate = selectedDate;
        loadCalendar();
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function toggleShowOffDays() {
    showOffDays = !showOffDays;
    saveSettings();
    loadCalendar();
}

function setUserShift(shift) {
    userShift = shift;
    saveSettings();
    loadCalendar();
}

function exportCalendar() {
    const calendarContainer = document.getElementById('calendar-container');
    const opt = {
        margin: 1,
        filename: 'Shift_Calendar.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().from(calendarContainer).set(opt).save();
}

function importShifts() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const content = event.target.result;
            const shiftsData = JSON.parse(content);
            applyImportedShifts(shiftsData);
        };
        reader.readAsText(file);
    }
}

function applyImportedShifts(shiftsData) {
    shiftsData.forEach(shift => {
        // Apply shift data to calendar
        // The format and application depend on the JSON structure
    });
    loadCalendar();
}

function reorderShifts() {
    shifts = reorderShiftArray(shifts);
    loadCalendar();
}

function reorderShiftArray(shifts) {
    const reorderedShifts = [...shifts];
    const lastElement = reorderedShifts.pop();
    reorderedShifts.unshift(lastElement);
    return reorderedShifts;
}

function applyShiftColors() {
    shiftColors.A = document.getElementById('color-a').value;
    shiftColors.B = document.getElementById('color-b').value;
    shiftColors.C = document.getElementById('color-c').value;
    shiftColors.D = document.getElementById('color-d').value;
    saveSettings();
    loadCalendar();
}

function applyShiftNames() {
    shiftNames.A = document.getElementById('shift-a-name').value;
    shiftNames.B = document.getElementById('shift-b-name').value;
    shiftNames.C = document.getElementById('shift-c-name').value;
    shiftNames.D = document.getElementById('shift-d-name').value;
    saveSettings();
    loadCalendar();
}

function openSettingsModal() {
    document.getElementById('settings-modal').style.display = 'block';
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

function saveUserId() {
    userId = document.getElementById('user-id').value;
    localStorage.setItem('userId', userId);
}

function loadUserId() {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
        userId = savedUserId;
        document.getElementById('user-id').value = userId;
    }
}

function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value;
    if (message.trim() === '') return;

    const chatWindow = document.getElementById('chat-window');
    const messageElement = document.createElement('div');
    messageElement.textContent = `${userId}: ${message}`;
    chatWindow.appendChild(messageElement);
    chatInput.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Send the message to the WebSocket server
    ws.send(`${userId}: ${message}`);
}

function saveSettings() {
    const settings = {
        shiftNames: shiftNames,
        shiftColors: shiftColors,
        userShift: userShift,
        showOffDays: showOffDays
    };
    localStorage.setItem('shiftCalendarSettings', JSON.stringify(settings));
}

function loadSettings() {
    const savedSettings = localStorage.getItem('shiftCalendarSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        shiftNames = settings.shiftNames;
        shiftColors = settings.shiftColors;
        userShift = settings.userShift;
        showOffDays = settings.showOffDays;

        // Update the settings modal with the loaded values
        document.getElementById('shift-a-name').value = shiftNames.A;
        document.getElementById('shift-b-name').value = shiftNames.B;
        document.getElementById('shift-c-name').value = shiftNames.C;
        document.getElementById('shift-d-name').value = shiftNames.D;

        document.getElementById('color-a').value = shiftColors.A;
        document.getElementById('color-b').value = shiftColors.B;
        document.getElementById('color-c').value = shiftColors.C;
        document.getElementById('color-d').value = shiftColors.D;

        document.getElementById('user-shift').value = userShift;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadUserId();
    fetchHolidays();
    loadCalendar();
});

document.getElementById('prev-month').addEventListener('click', showPreviousMonth);
document.getElementById('next-month').addEventListener('click', showNextMonth);
document.getElementById('toggle-dark-mode').addEventListener('click', toggleDarkMode);
document.getElementById('toggle-off-days').addEventListener('click', toggleShowOffDays);
document.getElementById('user-shift').addEventListener('change', (event) => setUserShift(event.target.value));
document.getElementById('export-calendar').addEventListener('click', exportCalendar);
document.getElementById('import-file').addEventListener('change', importShifts);
document.getElementById('reorder-shifts').addEventListener('click', reorderShifts);
document.getElementById('apply-colors').addEventListener('click', applyShiftColors);
document.getElementById('jump-to-date').addEventListener('click', jumpToDate);
document.getElementById('settings-button').addEventListener('click', openSettingsModal);
document.getElementById('close-settings-modal').addEventListener('click', closeSettingsModal);
