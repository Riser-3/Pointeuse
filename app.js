const STORE_KEY = "pointeuse_calendrier_v1";
const TARGET_HOURS = 507;
const TARGET_MINUTES = TARGET_HOURS * 60;

const state = {
    entries: {},
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    selectedDate: null
};

const el = {
    viewMain: document.getElementById("view-main"),
    viewForm: document.getElementById("view-form"),
    statWeek: document.getElementById("statWeek"),
    statMonth: document.getElementById("statMonth"),
    statRemaining507: document.getElementById("statRemaining507"),
    currentMonthLabel: document.getElementById("currentMonthLabel"),
    calendarGrid: document.getElementById("calendarGrid"),
    btnPrevMonth: document.getElementById("btnPrevMonth"),
    btnNextMonth: document.getElementById("btnNextMonth"),
    formDateLabel: document.getElementById("formDateLabel"),
    btnBackToCalendar: document.getElementById("btnBackToCalendar"),
    entryStart: document.getElementById("entryStart"),
    entryEnd: document.getElementById("entryEnd"),
    entryPause: document.getElementById("entryPause"),
    entryLocation: document.getElementById("entryLocation"),
    checkRepas: document.getElementById("checkRepas"),
    wrapRepasComment: document.getElementById("wrapRepasComment"),
    commentRepas: document.getElementById("commentRepas"),
    checkPeage: document.getElementById("checkPeage"),
    wrapPeageComment: document.getElementById("wrapPeageComment"),
    commentPeage: document.getElementById("commentPeage"),
    btnSaveDay: document.getElementById("btnSaveDay"),
    btnDeleteDay: document.getElementById("btnDeleteDay"),
    btnExportJson: document.getElementById("btnExportJson"),
    btnExportCsv: document.getElementById("btnExportCsv"),
    importJson: document.getElementById("importJson"),
    btnResetData: document.getElementById("btnResetData")
};

const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
};

const formatMinutes = (totalMins) => {
    const isNegative = totalMins < 0;
    const absMins = Math.abs(totalMins);
    const h = Math.floor(absMins / 60);
    const m = absMins % 60;
    return `${isNegative ? "-" : ""}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const calculateWorkedMinutes = (entry) => {
    if (!entry || !entry.start || !entry.end) return 0;
    const start = toMinutes(entry.start);
    const end = toMinutes(entry.end);
    if (end <= start) return 0;
    return Math.max(0, end - start - Number(entry.pauseMinutes || 0));
};

const getIsoDate = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(state.entries));

const load = () => {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
        try { state.entries = JSON.parse(raw); } 
        catch (e) { state.entries = {}; }
    }
};

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

const updateDashboard = () => {
    let totalAllTime = 0;
    let totalMonth = 0;
    let totalWeek = 0;

    const today = new Date();
    const currentIsoMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const startOfWeek = getIsoDate(getStartOfWeek(today));
    
    const endOfWeekObj = new Date(getStartOfWeek(today));
    endOfWeekObj.setDate(endOfWeekObj.getDate() + 6);
    const endOfWeek = getIsoDate(endOfWeekObj);

    Object.values(state.entries).forEach(entry => {
        // PROTECTION ANTI-CRASH : Ignore les données corrompues sans date
        if (!entry || !entry.date) return;

        const worked = calculateWorkedMinutes(entry);
        totalAllTime += worked;

        if (entry.date.startsWith(currentIsoMonth)) {
            totalMonth += worked;
        }
        if (entry.date >= startOfWeek && entry.date <= endOfWeek) {
            totalWeek += worked;
        }
    });

    el.statWeek.textContent = formatMinutes(totalWeek);
    el.statMonth.textContent = formatMinutes(totalMonth);
    
    const remaining = TARGET_MINUTES - totalAllTime;
    el.statRemaining507.textContent = remaining > 0 ? formatMinutes(remaining) : `Objectif Atteint ! (+${formatMinutes(Math.abs(remaining))})`;
};

const renderCalendar = () => {
    el.calendarGrid.innerHTML = "";
    
    const firstDayOfMonth = new Date(state.currentYear, state.currentMonth, 1);
    const lastDayOfMonth = new Date(state.currentYear, state.currentMonth + 1, 0);
    
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    el.currentMonthLabel.textContent = `${monthNames[state.currentMonth]} ${state.currentYear}`;

    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6;

    for (let i = 0; i < startDayIndex; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "calendar-day empty";
        el.calendarGrid.appendChild(emptyDiv);
    }

    const todayIso = getIsoDate(new Date());

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const dateStr = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = state.entries[dateStr];
        
        // PROTECTION ANTI-CRASH pour le rendu visuel
        const isValidEntry = entry && entry.date; 

        const dayDiv = document.createElement("div");
        dayDiv.className = `calendar-day ${isValidEntry ? 'worked' : ''} ${dateStr === todayIso ? 'today' : ''}`;
        
        let htmlContent = `<span>${day}</span>`;
        if (isValidEntry) {
            htmlContent += `<span class="hours-badge">${formatMinutes(calculateWorkedMinutes(entry))}</span>`;
        }
        
        dayDiv.innerHTML = htmlContent;
        dayDiv.addEventListener("click", () => openForm(dateStr));
        
        el.calendarGrid.appendChild(dayDiv);
    }
};

const toggleView = (showMain) => {
    if (showMain) {
        el.viewForm.classList.add("d-none");
        el.viewMain.classList.remove("d-none");
        updateDashboard();
        renderCalendar();
    } else {
        el.viewMain.classList.add("d-none");
        el.viewForm.classList.remove("d-none");
    }
};

const openForm = (dateStr) => {
    state.selectedDate = dateStr;
    const entry = state.entries[dateStr] || {};

    const dateObj = new Date(dateStr);
    el.formDateLabel.textContent = dateObj.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    el.entryStart.value = entry.start || "";
    el.entryEnd.value = entry.end || "";
    el.entryPause.value = entry.pauseMinutes || 0;
    el.entryLocation.value = entry.location || "";
    
    el.checkRepas.checked = !!entry.repas;
    el.commentRepas.value = entry.repasComment || "";
    el.wrapRepasComment.classList.toggle("d-none", !entry.repas);
    
    el.checkPeage.checked = !!entry.peage;
    el.commentPeage.value = entry.peageComment || "";
    el.wrapPeageComment.classList.toggle("d-none", !entry.peage);

    el.btnDeleteDay.classList.toggle("d-none", !state.entries[dateStr]);

    toggleView(false);
};

const saveDay = () => {
    const start = el.entryStart.value;
    const end = el.entryEnd.value;
    
    if (!start || !end) {
        alert("L'heure de début et de fin sont obligatoires.");
        return;
    }

    state.entries[state.selectedDate] = {
        date: state.selectedDate,
        start,
        end,
        pauseMinutes: Number(el.entryPause.value) || 0,
        location: el.entryLocation.value.trim(),
        repas: el.checkRepas.checked,
        repasComment: el.commentRepas.value.trim(),
        peage: el.checkPeage.checked,
        peageComment: el.commentPeage.value.trim()
    };

    save();
    toggleView(true);
};

const deleteDay = () => {
    if (confirm("Supprimer les données de cette journée ?")) {
        delete state.entries[state.selectedDate];
        save();
        toggleView(true);
    }
};

const exportJson = () => {
    const dataStr = JSON.stringify(state.entries, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pointeuse_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

const importJson = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(String(reader.result));
            // SÉCURITÉ : Nettoie automatiquement si le fichier est enveloppé dans "entries"
            const dataToImport = parsed.entries ? parsed.entries : parsed;
            
            if (typeof dataToImport !== "object" || Array.isArray(dataToImport)) throw new Error("Format invalide");
            
            if (confirm("Importer cette sauvegarde ? Cela écrasera tes données actuelles.")) {
                state.entries = dataToImport;
                save();
                toggleView(true);
                alert("Heures importées avec succès !");
            }
        } catch (_) {
            alert("Erreur : Le fichier sélectionné n'est pas une sauvegarde JSON valide.");
        }
        el.importJson.value = ""; 
    };
    reader.readAsText(file);
};

const resetData = () => {
    if (confirm("⚠️ ATTENTION : Es-tu sûr de vouloir tout effacer ? (Remise à zéro des 507h)")) {
        if (confirm("Dernier avertissement : Confirmer la suppression totale de l'historique ?")) {
            state.entries = {};
            save();
            toggleView(true);
        }
    }
};

const exportCsv = () => {
    const sortedEntries = Object.values(state.entries)
        .filter(e => e && e.date) // Évite les bugs à l'export
        .sort((a, b) => a.date.localeCompare(b.date));
    
    if (sortedEntries.length === 0) {
        alert("Aucune donnée à exporter.");
        return;
    }

    const headers = ["Date", "Prise de poste", "Fin de service", "Pause (min)", "Temps de travail", "Lieu", "Repas", "Commentaire Repas", "Peage", "Commentaire Peage"];
    let csvContent = headers.join(";") + "\n";

    sortedEntries.forEach(e => {
        const workedStr = formatMinutes(calculateWorkedMinutes(e));
        const safeLoc = (e.location || "").replace(/;/g, ',');
        const safeRepC = (e.repasComment || "").replace(/;/g, ',');
        const safePeaC = (e.peageComment || "").replace(/;/g, ',');
        
        const row = [
            e.date, e.start, e.end, e.pauseMinutes, workedStr, safeLoc,
            e.repas ? "Oui" : "Non", safeRepC,
            e.peage ? "Oui" : "Non", safePeaC
        ];
        csvContent += row.join(";") + "\n";
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `heures_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// ECOUTEURS D'EVENEMENTS
el.btnPrevMonth.addEventListener("click", () => {
    state.currentMonth--;
    if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
    renderCalendar();
});

el.btnNextMonth.addEventListener("click", () => {
    state.currentMonth++;
    if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
    renderCalendar();
});

el.btnBackToCalendar.addEventListener("click", () => toggleView(true));
el.btnSaveDay.addEventListener("click", saveDay);
el.btnDeleteDay.addEventListener("click", deleteDay);

el.checkRepas.addEventListener("change", (e) => el.wrapRepasComment.classList.toggle("d-none", !e.target.checked));
el.checkPeage.addEventListener("change", (e) => el.wrapPeageComment.classList.toggle("d-none", !e.target.checked));

el.btnExportJson.addEventListener("click", exportJson);
el.btnExportCsv.addEventListener("click", exportCsv);
el.importJson.addEventListener("change", (e) => importJson(e.target.files[0]));
el.btnResetData.addEventListener("click", resetData);

// INITIALISATION
load();
toggleView(true);