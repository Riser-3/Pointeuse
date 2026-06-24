const STORE_KEY = "pointeuse_calendrier_v1";
const TARGET_HOURS = 507;
const TARGET_MINUTES = TARGET_HOURS * 60;

// L'état de l'application
const state = {
    entries: {}, // Dictionnaire: { "2026-06-22": { start: "09:00"... } }
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(), // 0 à 11
    selectedDate: null // Date cliquée (YYYY-MM-DD)
};

// Éléments du DOM
const el = {
    viewMain: document.getElementById("view-main"),
    viewForm: document.getElementById("view-form"),
    
    // Dashboard
    statWeek: document.getElementById("statWeek"),
    statMonth: document.getElementById("statMonth"),
    statRemaining507: document.getElementById("statRemaining507"),
    
    // Calendrier
    currentMonthLabel: document.getElementById("currentMonthLabel"),
    calendarGrid: document.getElementById("calendarGrid"),
    btnPrevMonth: document.getElementById("btnPrevMonth"),
    btnNextMonth: document.getElementById("btnNextMonth"),
    
    // Formulaire
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
    
    // Exports
    btnExportJson: document.getElementById("btnExportJson"),
    btnExportCsv: document.getElementById("btnExportCsv")
};

// --- UTILITAIRES TEMPS & MATHS ---

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

// --- SAUVEGARDE & CHARGEMENT ---

const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(state.entries));

const load = () => {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
        try { state.entries = JSON.parse(raw); } 
        catch (e) { state.entries = {}; }
    }
};

// --- CALCULS DU DASHBOARD ---

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour que Lundi soit le 1er jour
    return new Date(d.setDate(diff));
};

const updateDashboard = () => {
    let totalAllTime = 0;
    let totalMonth = 0;
    let totalWeek = 0;

    const today = new Date();
    const currentIsoMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const startOfWeek = getIsoDate(getStartOfWeek(today));
    
    // Pour simplifier le calcul de la semaine, on compare les dates ISO sous forme de string (qui sont triables alphabétiquement)
    const endOfWeekObj = new Date(getStartOfWeek(today));
    endOfWeekObj.setDate(endOfWeekObj.getDate() + 6);
    const endOfWeek = getIsoDate(endOfWeekObj);

    Object.values(state.entries).forEach(entry => {
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

// --- RENDU DU CALENDRIER ---

const renderCalendar = () => {
    el.calendarGrid.innerHTML = "";
    
    const firstDayOfMonth = new Date(state.currentYear, state.currentMonth, 1);
    const lastDayOfMonth = new Date(state.currentYear, state.currentMonth + 1, 0);
    
    // Nom du mois et année
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    el.currentMonthLabel.textContent = `${monthNames[state.currentMonth]} ${state.currentYear}`;

    // Calculer les cases vides avant le 1er jour du mois (Lundi = 0, Dimanche = 6)
    let startDayIndex = firstDayOfMonth.getDay() - 1;
    if (startDayIndex === -1) startDayIndex = 6; // Si c'est Dimanche

    // Ajouter les cases vides
    for (let i = 0; i < startDayIndex; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "calendar-day empty";
        el.calendarGrid.appendChild(emptyDiv);
    }

    const todayIso = getIsoDate(new Date());

    // Ajouter les jours du mois
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const dateStr = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = state.entries[dateStr];
        
        const dayDiv = document.createElement("div");
        dayDiv.className = `calendar-day ${entry ? 'worked' : ''} ${dateStr === todayIso ? 'today' : ''}`;
        
        let htmlContent = `<span>${day}</span>`;
        if (entry) {
            htmlContent += `<span class="hours-badge">${formatMinutes(calculateWorkedMinutes(entry))}</span>`;
        }
        
        dayDiv.innerHTML = htmlContent;
        dayDiv.addEventListener("click", () => openForm(dateStr));
        
        el.calendarGrid.appendChild(dayDiv);
    }
};

// --- GESTION DES VUES ET DU FORMULAIRE ---

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

    // Affichage de la date (ex: "22 Juin 2026")
    const dateObj = new Date(dateStr);
    el.formDateLabel.textContent = dateObj.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Remplissage du formulaire
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

    el.btnDeleteDay.classList.toggle("d-none", !state.entries[dateStr]); // Masquer si nouvelle saisie

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

// --- EXPORTS ---

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

const exportCsv = () => {
    // Trier les entrées par date
    const sortedEntries = Object.values(state.entries).sort((a, b) => a.date.localeCompare(b.date));
    
    if (sortedEntries.length === 0) {
        alert("Aucune donnée à exporter.");
        return;
    }

    // Création de l'entête CSV (séparateur point-virgule pour Excel français)
    const headers = ["Date", "Prise de poste", "Fin de service", "Pause (min)", "Temps de travail", "Lieu", "Repas", "Commentaire Repas", "Peage", "Commentaire Peage"];
    let csvContent = headers.join(";") + "\n";

    sortedEntries.forEach(e => {
        const workedStr = formatMinutes(calculateWorkedMinutes(e));
        // Nettoyer les commentaires pour éviter de casser le CSV (remplacer les points-virgules par des virgules)
        const safeLoc = e.location.replace(/;/g, ',');
        const safeRepC = e.repasComment.replace(/;/g, ',');
        const safePeaC = e.peageComment.replace(/;/g, ',');
        
        const row = [
            e.date, e.start, e.end, e.pauseMinutes, workedStr, safeLoc,
            e.repas ? "Oui" : "Non", safeRepC,
            e.peage ? "Oui" : "Non", safePeaC
        ];
        csvContent += row.join(";") + "\n";
    });

    // Encodage BOM pour forcer Excel à lire l'UTF-8 correctement
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `heures_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// --- ECOUTEURS D'EVENEMENTS ---

el.btnPrevMonth.addEventListener("click", () => {
    state.currentMonth--;
    if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
    }
    renderCalendar();
});

el.btnNextMonth.addEventListener("click", () => {
    state.currentMonth++;
    if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
    }
    renderCalendar();
});

el.btnBackToCalendar.addEventListener("click", () => toggleView(true));
el.btnSaveDay.addEventListener("click", saveDay);
el.btnDeleteDay.addEventListener("click", deleteDay);

// Affichage dynamique des champs de commentaires (Repas / Péage)
el.checkRepas.addEventListener("change", (e) => el.wrapRepasComment.classList.toggle("d-none", !e.target.checked));
el.checkPeage.addEventListener("change", (e) => el.wrapPeageComment.classList.toggle("d-none", !e.target.checked));

// Événements d'export
el.btnExportJson.addEventListener("click", exportJson);
el.btnExportCsv.addEventListener("click", exportCsv);

// --- INITIALISATION ---
load();
toggleView(true);