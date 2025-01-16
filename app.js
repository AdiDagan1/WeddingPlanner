let originalData = []; // משתנה גלובלי לשמירת הנתונים

// טיפול בקובץ האקסל שהועלה
document.getElementById('fileInput').addEventListener('change', handleFile);

function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // נשתמש בגיליון הראשון
        const sheet = workbook.Sheets[sheetName];
        originalData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // שמירת הטבלה במשתנה גלובלי

        displayTable(originalData); // הצגת הטבלה
    };

    reader.readAsArrayBuffer(file);
}

// הצגת הטבלה בממשק
function displayTable(data) {
    const tableBody = document.querySelector('#guestTable tbody');
    const summaryDiv = document.querySelector('#summary');
    tableBody.innerHTML = ''; // נקה את הטבלה הקיימת
    summaryDiv.innerHTML = ''; // נקה את הסיכום הקיים

    let totalGuests = 0;
    let confirmedGuests = 0;

    data.slice(1).forEach((row, index) => {
        const tr = document.createElement('tr');

        if (isNaN(row[0])) {
            const th = document.createElement('th');
            th.setAttribute('colspan', 6);
            th.textContent = row[0] || '';
            th.style.textAlign = 'right';
            th.style.backgroundColor = '#f0f0f0';
            th.style.fontWeight = 'bold';
            tr.appendChild(th);
        } else {
            const columns = {
                id: row[0] || '',
                name: row[1] || '',
                phone: row[2] || '',
                guests: parseInt(row[3]) || 0,
                status: row[4] || 'ממתין לתשובה',
                notes: row[5] || ''
            };

            totalGuests += columns.guests;

            if (columns.status.startsWith('מגיעים')) {
                const guestsConfirmed = parseInt(columns.status.split(' ')[1]) || 0;
                confirmedGuests += guestsConfirmed;
            } else if (columns.status === 'מגיע' || columns.status === 'אגיע לבד') {
                confirmedGuests += 1;
            }

            let guestOptions = `<option value="ממתין לתשובה" ${columns.status === 'ממתין לתשובה' ? 'selected' : ''}>ממתין לתשובה</option>`;

            if (columns.guests === 1) {
                guestOptions += `<option value="מגיע" ${columns.status === 'מגיע' ? 'selected' : ''}>מגיע</option>`;
                guestOptions += `<option value="לא מגיע" ${columns.status === 'לא מגיע' ? 'selected' : ''}>לא מגיע</option>`;
            } else {
                guestOptions += `<option value="אגיע לבד" ${columns.status === 'אגיע לבד' ? 'selected' : ''}>אגיע לבד</option>`;
                guestOptions += `<option value="לא מגיעים" ${columns.status === 'לא מגיעים' ? 'selected' : ''}>לא מגיעים</option>`;
                for (let i = 2; i <= columns.guests; i++) {
                    guestOptions += `<option value="מגיעים ${i}" ${columns.status === `מגיעים ${i}` ? 'selected' : ''}>מגיעים ${i}</option>`;
                }
            }

            tr.innerHTML = `
                <td>${columns.id}</td>
                <td>${columns.name}</td>
                <td>${columns.phone}</td>
                <td>${columns.guests}</td>
                <td>
                    <select class="guest-count">
                        ${guestOptions}
                    </select>
                </td>
                <td>${columns.notes}</td>
            `;

            const select = tr.querySelector('.guest-count');
            select.addEventListener('change', (e) => {
                const newStatus = e.target.value;
                updateStatus(index + 1, newStatus);
            });
        }

        tableBody.appendChild(tr);
    });

    summaryDiv.innerHTML = `
        <p>סה"כ אורחים: <strong>${totalGuests}</strong></p>
        <p>אורחים שאישרו הגעה: <strong>${confirmedGuests}</strong></p>
    `;
}

// עדכון סטטוס במשתנה הגלובלי
function updateStatus(rowIndex, newStatus) {
    if (originalData[rowIndex]) {
        originalData[rowIndex][4] = newStatus; // עדכון הסטטוס בעמודה 4 (סטטוס הגעה)
    }
}

// הורדת הטבלה המעודכנת
function downloadUpdatedExcel() {
    if (originalData.length === 0) {
        alert('אין נתונים להורדה.');
        return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet(originalData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, 'updated_guests.xlsx');
}

// שליחת הזמנות דרך WhatsApp
function sendInvitations() {
    originalData.forEach(guest => {
        const phoneNumber = guest[2];
        if (phoneNumber) {
            const message = `שלום ${guest[1]}, הזמנתך לחתונה התקבלה. אנא אשר אם אתה מגיע.`;
            const messageLink = `https://wa.me/9720509000574?text=${encodeURIComponent(message)}`;
            window.open(messageLink, '_blank');
        }
    });
    alert("ההזמנות נשלחו בהצלחה!");
}

// שליחת תזכורות למי שלא אישר הגעה
function sendReminders() {
    originalData.forEach(guest => {
        if (guest[4] === 'ממתין לתשובה') {
            const phoneNumber = guest[2];
            const message = `שלום ${guest[1]}, תזכורת - הזמנתך לחתונה התקבלה. אנא אשר אם אתה מגיע.`;
            const messageLink = `https://wa.me/9720509000574?text=${encodeURIComponent(message)}`;
            window.open(messageLink, '_blank');
        }
    });
    alert("תזכורות נשלחו למי שלא אישר הגעה!");
}
