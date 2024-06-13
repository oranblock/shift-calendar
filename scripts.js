const shifts = ['B', 'C', 'A', 'D'];
let currentDate = new Date();
let holidays = [];

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

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const cell = document.createElement('td');
        const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayOffset = (firstDay.getDay() + day - 1) % 7;
        const shiftIndex = Math.floor((dayOffset + firstDay.getDay()) / 2) % shifts.length;
        cell.className = `shift-${shifts[shiftIndex].toLowerCase()}`;

        if (holidays.includes(cellDate.toISOString().split('T')[0])) {
            cell.classList.add('holiday');
            cell.title = "Holiday";
        }

        cell.textContent = day;
        cell.addEventListener('click', () => showShiftDetails(day, shifts[shiftIndex]));
        row.appendChild(cell);

        if (cellDate.getDay() === 6) {
            calendarBody.appendChild(row);
            row = document.createElement('tr');
        }
    }

    if (row.children.length > 0) {
        calendarBody.appendChild(row);
    }
}

function showPreviousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    loadCalendar();
}

function showNextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    loadCalendar();
}

function showCurrentShift() {
    const currentShift = getShiftByDate(new Date());
    document.getElementById('shift-display').textContent = `Current Shift: ${currentShift}`;
}

function showNextShift() {
    const nextShift = getShiftByDate(new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000));
    document.getElementById('shift-display').textContent = `Next Shift: ${nextShift}`;
}

function showPreviousShift() {
    const prevShift = getShiftByDate(new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000));
    document.getElementById('shift-display').textContent = `Previous Shift: ${prevShift}`;
}

function getShiftByDate(date) {
    const shiftIndex = (Math.floor(date.getTime() / (2 * 24 * 60 * 60 * 1000))) % shifts.length;
    return shifts[shiftIndex];
}

function showShiftDetails(day, shift) {
    alert(`Day: ${day}\nShift: ${shift}`);
}

function fetchHolidays() {
    const apiKey = '8eq0WDPLXW3OdwgLM2kkT7GAtROKMl0u';
    const country = 'KW';
    const year = currentDate.getFullYear();
    const url = `https://calendarific.com/api/v2/holidays?&api_key=${apiKey}&country=${country}&year=${year}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            holidays = data.response.holidays.map(holiday => holiday.date.iso); // Adjust according to API response format
            loadCalendar();
        })
        .catch(error => {
            console.error('Error fetching holidays:', error);
            loadCalendar(); // Load calendar even if fetching holidays fails
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
    // Example of processing imported shifts
    shiftsData.forEach(shift => {
        // Apply shift data to calendar
        // The format and application depend on the JSON structure
    });
    loadCalendar();
}

document.addEventListener('DOMContentLoaded', () => {
    fetchHolidays();
});
