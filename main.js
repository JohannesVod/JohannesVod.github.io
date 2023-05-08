let errorTimeout;

function showError(message) {
    console.log("Error found: " + message);
    const errorElement = document.getElementById('error');
    errorElement.style.backgroundColor = "#85332d";
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.textContent = message;
    errorElement.classList.add('show');

    clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
    errorElement.classList.remove('show');
    }, 3000);
}

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}


function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return "";
}

function LoadAllNames(cookieName) { // setCookie(cookieName, "", 1);
    all_names = getCookie(cookieName);
    const names_splitted = all_names.split(", ");
    names_splitted.forEach(element => {
        AddNameToContainer(cookieName, element);
    });
}

function AddNameToContainer(cookieName, keyword){
    if (keyword == ""){
        return;
    }
    const input = document.getElementById("input_" + cookieName);
    var div = document.createElement("div");
    div.style.color = "black";
    div.className = "keyword";
    div.innerHTML = keyword + `<span class='remove' onclick='removeName("${cookieName}", this)'>❌</span>`;
    document.getElementById("keywords_" + cookieName).appendChild(div);
    input.value = "";
}

LoadAllNames("mainNames");
LoadAllNames("mainNamesKantoren");

function addName(cookieName, keyword) {
    input = document.getElementById("input_" + cookieName);
    if (keyword == null){
        keyword = input.value;
    }
    if (keyword) {
        var current_names = getCookie(cookieName);
        if (current_names.indexOf(", " + keyword) != -1){
            showError("Name bereits vorhanden!");
            return;
        }
        AddNameToContainer(cookieName, keyword);
        current_names = current_names + ", " + keyword;
        setCookie(cookieName, current_names, 10000);
    }
}

function removeName(cookieName, element) {
    element.parentNode.remove();
    var current_names = getCookie(cookieName);
    var element_name = element.parentNode.innerText;
    element_name = element_name.substring(0, element_name.length-1);
    current_names = current_names.replace(", " + element_name, "");
    setCookie(cookieName, current_names, 10000);
}

function getCellValue(ws, k, j) {
    const row = ws.getRow(k);
    const cell = row.getCell(j);
    if (cell.isMerged && cell.master) {
        if (cell !== cell.master) {
        return '';
        } else {
        return cell.value;
        }
    } else {
        return cell.value;
    }
}

layout = [["Liturgiedienst", "", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
        ["Morgens", "akolythieren", "", "", "", "", "", "", "", ""],
        ["", "lesen", "", "", "", "", "", "", "", ""],
        ["Abends", "akolythieren", "", "", "", "", "", "", "", ""],
        ["", "lesen", "", "", "", "", "", "", "", ""],
        ["", "Skrutatio", "", "", "", "", "", "", "", ""],
        ["Brot", "", "", "", "", "", "", "", "", ""],
        ["Telefon/Licht", "", "", "", "", "", "", "", "", ""],
];

layoutKantoren = [
    ["Kantorendienst","", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
    ["Morgens","", "", "", "", "", "", "", ""],
    ["Mittags","", "", "", "", "", "", "", ""],
    ["Abends","", "", "", "", "", "", "", ""],
];

function ColourColumns(worksheet, plan){
    // Set fill color of first column
    const startColor = { red: 255, green: 165, blue: 0 }; // Orange
    const endColor = { red: 0, green: 128, blue: 0 }; // Green
    const columnCount = plan[0].length;
    for (let i = 3; i <= columnCount; i++) {
        const ratio = (i - 1) / (columnCount - 1);
        const red = Math.round(startColor.red + ratio * (endColor.red - startColor.red));
        const green = Math.round(startColor.green + ratio * (endColor.green - startColor.green));
        const blue = Math.round(startColor.blue + ratio * (endColor.blue - startColor.blue));
        const argb = `FF${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
        worksheet.getColumn(i).eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb }
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
            };
        });
    }
}

async function Generate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Liturgiedienst');
    const worksheetKantoren = workbook.addWorksheet('Kantorendienst');
    let plan = structuredClone(layout);
    let planKantoren = structuredClone(layoutKantoren);
    const inputStartDate = document.getElementById('input_date_start').valueAsDate;
    const inputEndDate =  document.getElementById('input_date').valueAsDate;
    const mondays = getMondaysBetweenDates(inputStartDate, inputEndDate);
    const sundays = getSundaysBetweenDates(inputStartDate, inputEndDate);
    if (mondays.length == 0){
        showError("Bitte intervall angeben");
        return;
    }
    let ind = -1;
    mondays.forEach(element => {
        ind += 1;
        const sunday = sundays[ind];
        let task_distr = DistributeTasks();
        let numRows = plan.length;
        let numCols = plan[0].length;
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                if (i >= 1 && j >= 2){
                    plan[i][j] = task_distr[0][ConvertToCellOccupationIndex(i, j)].join("/");
                }
            }
        }
        plan[0][1] = element + " - " + sunday;
        numRows = planKantoren.length;
        numCols = planKantoren[0].length;
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                if (i >= 1 && j >= 2){
                    planKantoren[i][j] = task_distr[1][ConvertToCellOccupationIndexKantoren(i, j)].join("/");
                }
            }
        }
        planKantoren[0][1] = element + " - " + sunday;
        plan.forEach(row => {worksheet.addRow(row);});
        worksheet.addRow([]);
        worksheet.columns.forEach(column => {column.width = 15;});
        planKantoren.forEach(row => {worksheetKantoren.addRow(row);});
        worksheetKantoren.columns.forEach(column => {column.width = 15;}); 
        worksheetKantoren.addRow([]);
    });

    ColourColumns(worksheet, plan);
    ColourColumns(worksheetKantoren, planKantoren);
    
    // Write to file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'table.xlsx');
}

function GetInitCellValue(i, j){
    return layout[i][j];
}

function GetInitCellValueKantoren(i, j){
    return layoutKantoren[i][j];
}

function SetCellOccupation(i, value){
    cell_occupations = cell_occupations.substring(0, i) + value + cell_occupations.substring(i + 1);
    setCookie("CellOccupations", cell_occupations, 10000000);
}

function SetCellOccupationKantoren(i, value){
    cell_occupationsKantoren = cell_occupationsKantoren.substring(0, i) + value + cell_occupationsKantoren.substring(i + 1);
    setCookie("CellOccupationsKantoren", cell_occupationsKantoren, 10000000);
}

var cell_occupations = getCookie("CellOccupations");
//cell_occupations = null;
if (cell_occupations == null){
    cell_occupations = "1111111111111111111111111111111111111111111111111";
    // 1111111111111111111111111111111111111111111111111
    setCookie("CellOccupations", cell_occupations, 10000000);
}

var cell_occupationsKantoren = getCookie("CellOccupationsKantoren");
//cell_occupationsKantoren = null;
if (cell_occupationsKantoren == null){
    cell_occupationsKantoren = "111111111111111111111";
    // 000000000000000000000
    // 111111111111111111111
    setCookie("CellOccupationsKantoren", cell_occupationsKantoren, 10000000);
}

function ConvertToCellOccupationIndex(i, j){
    return (i-1)*7+(j-2);
}
function ConvertToCellOccupationIndexKantoren(i, j){
    return (i-1)*7+(j-2);
}

function GetCellOccupation(i, j){
    return cell_occupations.charAt(ConvertToCellOccupationIndex(i, j));
}

function GetCellOccupationKantoren(i, j){
    return cell_occupationsKantoren.charAt(ConvertToCellOccupationIndexKantoren(i, j));
}

function MakeSettableField(td, i, j, getFunction, setFunction, CalcIndexFunction){
    if (getFunction(i, j) == '0'){
        td.classList.add("redCell");
    }
    else if (getFunction(i, j) == '1'){
        td.classList.add("greenCell");
    }
    else{
        td.classList.add("greengreenCell");
    }
    td.addEventListener("click", (event) => {
        if (td.classList.contains("redCell")){
            td.classList.remove("redCell");
            td.classList.add("greenCell");
            setFunction(CalcIndexFunction(i, j), "1");
        }
        else if (td.classList.contains("greenCell")){
            td.classList.remove("greenCell");
            td.classList.add("greengreenCell");
            setFunction(CalcIndexFunction(i, j), "2");
        }
        else {
            td.classList.remove("greengreenCell");
            td.classList.add("redCell");
            setFunction(CalcIndexFunction(i, j), "0");
        }
    })
}

function InitKantoren(){
    const dataTable = document.getElementById('data-tableKantoren');
    dataTable.innerHTML = '';
    const numRows = layoutKantoren.length;
    const numCols = layoutKantoren[0].length;
    for (let i = 0; i < numRows; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < numCols; j++) {
            const td = document.createElement('td');
            if (i >= 1 && j >= 2){
                MakeSettableField(td, i, j, GetCellOccupationKantoren, SetCellOccupationKantoren, ConvertToCellOccupationIndexKantoren)
            }
            td.textContent = GetInitCellValueKantoren(i, j);
            tr.appendChild(td);
        }
    dataTable.appendChild(tr);
    }
}

let start_date = null;
let end_date = null; 

function Init(){
    const dataTable = document.getElementById('data-table');
    dataTable.innerHTML = '';
    const numRows = layout.length;
    const numCols = layout[0].length;
    for (let i = 0; i < numRows; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < numCols; j++) {
            const td = document.createElement('td');
            if (i >= 1 && j >= 2){
                MakeSettableField(td, i, j, GetCellOccupation, SetCellOccupation, ConvertToCellOccupationIndex)
            }
            td.textContent = GetInitCellValue(i, j);
            tr.appendChild(td);
        }
    dataTable.appendChild(tr);
    }
    InitKantoren();
    const dateInput = document.querySelector('#input_date');
    const dateInputStart = document.querySelector('#input_date_start');
    currentDate = new Date();
    const nextMonday = new Date(currentDate.setDate(currentDate.getDate() + 8 - currentDate.getDay()));
    var currentDate = new Date();
    const overnextSunday = new Date(currentDate.setDate(currentDate.getDate() + 14 - currentDate.getDay()));
    dateInputStart.value = nextMonday.toISOString().slice(0, 10);
    dateInput.value = overnextSunday.toISOString().slice(0, 10);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getMondaysBetweenDates(startDate, endDate) {
    const mondays = [];
    const date = new Date(startDate);
    date.setDate(date.getDate() + (1 + 7 - date.getDay()) % 7);
    while (date <= endDate) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      mondays.push(`${day}.${month}.`);
      date.setDate(date.getDate() + 7);
    }
    return mondays;
}

function getSundaysBetweenDates(startDate, endDate) {
    const sundays = [];
    const date = new Date(startDate);
    date.setDate(date.getDate() + (7 - date.getDay()) % 7);
    while (date <= endDate) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      sundays.push(`${day}.${month}.`);
      date.setDate(date.getDate() + 7);
    }
    return sundays;
}

function AssignSlotsRandomly(tasks, names){
    shuffle(names);
    // let sum = tasks.reduce((a, b) => a + b, 0);
    raw_verteilung = []
    let curr_ind = 0;
    tasks.forEach((tasks_l) => {
        let new_tasks = []
        for (let index = 0; index < tasks_l; index++) {
            new_tasks.push(names[curr_ind]);
            curr_ind += 1;
            curr_ind = curr_ind % names.length;
        }
        shuffle(new_tasks);
        raw_verteilung.push(new_tasks);
    })
    return raw_verteilung;
}

function removeEmptyStrings(arr) {
    return arr.filter(str => str !== "");
}

function DistributeTasks(){
    let names_normal = getCookie("mainNames").split(", ");
    let names_kantoren = getCookie("mainNamesKantoren").split(", ");
    names_normal = removeEmptyStrings(names_normal);
    names_kantoren = removeEmptyStrings(names_kantoren);

    if (names_normal.length <= 2 || names_kantoren.length <= 2){
        showError("Bitte alle Namen angeben!");
        return null;
    }

    const loadout_1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const loadout_2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    remapping1 = [
        0, 1, 2, 3, 4, 5, 6,
        0, 1, 2, 3, 4, 5, 6,
        7, 8, 9, 10, 11, 12, 13,
        7, 8, 9, 10, 11, 12, 13,
        7, 8, 9, 10, 11, 12, 13,
        14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27
    ];

    remapping2 = [
        0, 1, 2, 3, 4, 5, 6,
        0, 1, 2, 3, 4, 5, 6,
        0, 1, 2, 3, 4, 5, 6
    ];

    for (let index = 0; index < cell_occupations.length; index++) {
        const element = cell_occupations[index];
        loadout_1[remapping1[index]] += parseInt(element);
    }

    for (let index = 0; index < cell_occupationsKantoren.length; index++) {
        const element = cell_occupationsKantoren[index];
        loadout_2[remapping2[index]] += parseInt(element);
    }

    const assignment = AssignSlotsRandomly(loadout_1, names_normal);
    const assignment2 = AssignSlotsRandomly(loadout_2, names_kantoren);
    
    used_cells = new Array(loadout_1.length).fill(0);
    used_cells2 = new Array(loadout_2.length).fill(0);
    tasks_with_names = [[], [], [], [], [], [], [], [], [], [], [], [], [], [],[], [], [], [], [], [], [],[], [], [], [], [], [], [],[], [], [], [], [], [], [],[], [], [], [], [], [], [],[], [], [], [], [], [], [],]
    tasks_with_names_2 = [[], [], [], [], [], [], [],[], [], [], [], [], [], [],[], [], [], [], [], [], []];

    for (let index = 0; index < tasks_with_names.length; index++) {
        const remap = remapping1[index];
        for (let ind = 0; ind < parseInt(cell_occupations[index]); ind++) {
            const worker = assignment[remap][used_cells[remap]];
            tasks_with_names[index].push(worker);
            used_cells[remap] += 1;
        }
    }

    for (let index = 0; index < tasks_with_names_2.length; index++) {
        const remap = remapping2[index];
        for (let ind = 0; ind < parseInt(cell_occupationsKantoren[index]); ind++) {
            const worker = assignment2[remap][used_cells2[remap]];
            tasks_with_names_2[index].push(worker);
            used_cells2[remap] += 1;
        }
    }

    return [tasks_with_names, tasks_with_names_2];
}

Init();

function loadFile() {
    console.log("Load file");
    const fileUpload = document.getElementById('fileUpload');
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        const wb = new ExcelJS.Workbook();
        wb.xlsx.load(data).then(function() {
            const ws = wb.getWorksheet('Liturgiedienst');
            const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
            const names = {};
            for (let j = 1; j <= ws.columnCount; j++) {
                const column = ws.getColumn(j);
                if (days.includes(column.values[1])) {
                    for (let i = 2; i <= column.values.length; i++) {
                        const name = column.values[i];
                        var regex = /[\/-]/;
                        if (name && typeof name === 'string' && !regex.test(name)) {
                            names[name] = true;
                        }
                    }
                }
            }
            for (const name in names) {
                addName(name);
            }
            const dataTable = document.getElementById('data-table');
            dataTable.innerHTML = '';
            const numRows = ws.actualRowCount;
            const numCols = ws.actualColumnCount;
            for (let i = 1; i <= numRows; i++) {
                const tr = document.createElement('tr');
                for (let j = 1; j <= numCols; j++) {
                    const td = document.createElement('td');
                    td.textContent = getCellValue(ws, i, j);
                    tr.appendChild(td);
                }
            dataTable.appendChild(tr);
            }
        });
    };
    reader.readAsArrayBuffer(fileUpload.files[0]);
}