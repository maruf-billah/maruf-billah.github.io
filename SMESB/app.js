// ============================================
//  PORTFOLIO BI DASHBOARD - APP.JS
//  Full Interactive Logic with SheetJS Parsing
// ============================================

// Global Data Store
let unitData = [];
let countryAvg = {};
let subtotals = {}; // Store exact pre-calculated rows from Excel

// 1. Initial Load: Always fetch fresh data to avoid stale caches
const defaultMetrics = (typeof dashboardData !== 'undefined' && dashboardData.settings && dashboardData.settings.visibleMetrics) ? dashboardData.settings.visibleMetrics : {
    collectablePct: true,
    collectionPct: false,
    colVsOut: true,
    colVsCol: true,
    emiVsCol: true,
    nplPct: false,
    parPct: false
};

const defaultTabs = (typeof dashboardData !== 'undefined' && dashboardData.settings && dashboardData.settings.visibleTabs) ? dashboardData.settings.visibleTabs : {
    l12m: true,
    analysis: false,
    progress: true,
    trend: true
};

const state = {
    tab: 'overall',
    month: 'TOTAL',
    availableMonths: [],
    ticketSize: 'both',
    drillLevel: 'zone',
    filters: { zone: 'all', region: 'all', territory: 'all', unit: 'all' },
    theme: localStorage.getItem('portfolioTheme') || 'dark',
    sortCol: '',
    sortDesc: false,
    visibleMetrics: JSON.parse(localStorage.getItem('portfolioVisibleMetrics')) || defaultMetrics,
    visibleTabs: JSON.parse(localStorage.getItem('portfolioVisibleTabs')) || defaultTabs
};


if (state.visibleTabs.trend === undefined) {
    state.visibleTabs.trend = true;
    localStorage.setItem('portfolioVisibleTabs', JSON.stringify(state.visibleTabs));
}

const METRICS_CONFIG = [
    { id: 'collectablePct', label: 'CLTD %', icon: 'fa-percentage', gradient: 'var(--gradient-purple)', color: '#8b5cf6', higherBetter: true },
    { id: 'collectionPct', label: 'CLTN %', icon: 'fa-percentage', gradient: 'var(--gradient-purple)', color: '#8b5cf6', higherBetter: true },
    { id: 'colVsOut', label: 'CLTD vs OUT %', icon: 'fa-chart-pie', gradient: 'var(--gradient-cyan)', color: '#06b6d4', higherBetter: true },
    { id: 'colVsCol', label: 'CLTD vs CLTN %', icon: 'fa-chart-pie', gradient: 'var(--gradient-blue)', color: '#6366f1', higherBetter: true },
    { id: 'emiVsCol', label: 'EMI %', icon: 'fa-money-bill-trend-up', gradient: 'var(--gradient-green)', color: '#10b981', higherBetter: true },
    { id: 'nplPct', label: 'NPL %', icon: 'fa-triangle-exclamation', gradient: 'var(--gradient-red)', color: '#ef4444', higherBetter: false },
    { id: 'parPct', label: 'PAR %', icon: 'fa-chart-line', gradient: 'var(--gradient-amber)', color: '#f59e0b', higherBetter: false }
];

const DOM = {
    monthFilter: document.getElementById('monthFilter'),
    zoneFilter: document.getElementById('zoneFilter'),
    regionFilter: document.getElementById('regionFilter'),
    territoryFilter: document.getElementById('territoryFilter'),
    unitFilter: document.getElementById('unitFilter'),
    ticketSizeFilter: document.getElementById('ticketSizeFilter'),
    ticketSizeFilterSection: document.getElementById('ticketSizeFilterSection'),
    drillLevel: document.getElementById('drillLevel'),
    resetBtn: document.getElementById('resetFiltersBtn'),
    tabs: document.querySelectorAll('.tab'),
    breadCrumb: document.getElementById('breadCrumb'),
    kpiGrid: document.getElementById('kpiGrid'),
    tableTitle: document.getElementById('tableTitle'),
    tableHeader: document.getElementById('tableHeader'),
    tableBody: document.getElementById('tableBody'),
    dashboardView: document.getElementById('dashboardView'),
    progressView: document.getElementById('progressView'),
    analysisView: document.getElementById('analysisView'),
    trendAnalysisView: document.getElementById('trendAnalysisView'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    excelUpload: document.getElementById('excelUpload'),
    uploadStatus: document.getElementById('uploadStatus'),
    downloadJsonBtn: document.getElementById('downloadJsonBtn'),
    chartModal: document.getElementById('chartModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalChart: document.getElementById('modalChart'),
    themeToggle: document.getElementById('themeToggle'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    settingsToggles: document.getElementById('settingsToggles'),
    // Load persisted JSON data if available
    loadJSONBtn: document.getElementById('loadJSONBtn')
};

let charts = {};
const chartConfig = {
    collectablePct: { id: '#chartCollectablePct', title: 'CLTD %', color: '#8b5cf6' },
    collectionPct: { id: '#chartCollectionPct', title: 'CLTN %', color: '#4f46e5' },
    colVsCol: { id: '#chartColVsCol', title: 'CLTD vs CLTN %', color: '#3b82f6' },
    colVsOut: { id: '#chartColVsOut', title: 'CLTD vs OUT %', color: '#06b6d4' },
    emiVsCol: { id: '#chartEmiVsCol', title: 'EMI %', color: '#10b981' },
    nplPct: { id: '#chartNplPct', title: 'NPL %', color: '#ef4444' },
    parPct: { id: '#chartParPct', title: 'PAR %', color: '#f59e0b' }
};

let currentChartLabels = [];
let modalChartInstance = null;

// Function for rendering
function createBarChart(selector, title, color, isModal = false) {
    const options = {
        series: [{ name: title, data: [] }],
        theme: { mode: state.theme },
        chart: {
            type: 'bar', height: isModal ? '100%' : 280,
            background: state.theme === 'dark' ? '#1a1f2e' : '#ffffff',
            toolbar: { show: true, tools: { download: true } },
            zoom: { enabled: false }
        },
        title: { text: null },
        colors: [color],
        plotOptions: { bar: { borderRadius: 4, dataLabels: { position: 'top' } } },
        dataLabels: { enabled: true, formatter: function (val) { return val.toFixed(1) + "%"; }, offsetY: -20, style: { fontSize: '10px', colors: [state.theme === 'dark' ? '#fff' : '#1e293b'] } },
        xaxis: { categories: [], labels: { style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#334155', fontSize: '9px' }, rotate: -45, rotateAlways: true, trim: true, hideOverlappingLabels: true, maxHeight: 120 } },
        yaxis: { labels: { formatter: function (val) { return val.toFixed(1) + "%"; }, style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#334155' } } },
        grid: { borderColor: state.theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0', strokeDashArray: 4 },
        tooltip: { theme: state.theme, y: { formatter: function (val) { return val.toFixed(2) + "%"; } } }
    };
    const el = document.querySelector(selector);
    if (!el) return null;
    const chart = new ApexCharts(el, options);
    chart.render();
    return chart;
}


window.openSettingsModal = function() {
    DOM.settingsModal.classList.add('active');
    renderSettingsToggles();
}
window.closeSettingsModal = function() {
    DOM.settingsModal.classList.remove('active');
}

function renderSettingsToggles() {
    DOM.settingsToggles.innerHTML = '';
    const TABS_CONFIG = [
        { id: 'l12m', label: 'L12M View' },
        { id: 'analysis', label: 'Analysis View' },
        { id: 'progress', label: 'Progress View' },
        { id: 'trend', label: 'Trend Analysis' }
    ];

    let metricsHeader = document.createElement('h4');
    metricsHeader.style.marginBottom = '8px';
    metricsHeader.textContent = 'Visible Metrics';
    DOM.settingsToggles.appendChild(metricsHeader);

    METRICS_CONFIG.forEach(m => {
        let isChecked = state.visibleMetrics[m.id];
        let el = document.createElement('label');
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.gap = '12px';
        el.style.cursor = 'pointer';
        el.style.padding = '8px 12px';
        el.style.background = 'var(--bg-secondary)';
        el.style.borderRadius = 'var(--radius-sm)';
        el.style.border = '1px solid var(--border-color)';
        el.style.marginBottom = '8px';
        
        el.innerHTML = `
            <input type="checkbox" data-metric="${m.id}" ${isChecked ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer;" />
            <span style="font-weight: 600; color: var(--text-primary);"><i class="fa-solid ${m.icon}" style="color:${m.color}; margin-right: 6px;"></i> ${m.label}</span>
        `;
        
        let cb = el.querySelector('input');
        cb.addEventListener('change', (e) => {
            state.visibleMetrics[m.id] = e.target.checked;
            localStorage.setItem('portfolioVisibleMetrics', JSON.stringify(state.visibleMetrics));
            populateAnalysisDropdown();
            // Handle Insight Modal active tab if needed
            if (!state.visibleMetrics[currentInsightMetricType]) {
                const firstVis = METRICS_CONFIG.find(mc => state.visibleMetrics[mc.id]);
                if (firstVis) currentInsightMetricType = firstVis.id;
            }
            if (DOM.settingsModal.classList.contains('active')) {
                // Settings modal stays open, but update dashboard behind it
            }
            updateDashboard();
            if (document.getElementById('insightModal').classList.contains('active')) {
                renderInsightTimeline();
            }
        });
        DOM.settingsToggles.appendChild(el);
    });

    let tabsHeader = document.createElement('h4');
    tabsHeader.style.marginTop = '16px';
    tabsHeader.style.marginBottom = '8px';
    tabsHeader.textContent = 'Visible Views';
    DOM.settingsToggles.appendChild(tabsHeader);

    TABS_CONFIG.forEach(t => {
        let isChecked = state.visibleTabs[t.id];
        let el = document.createElement('label');
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.gap = '12px';
        el.style.cursor = 'pointer';
        el.style.marginBottom = '8px';
        el.innerHTML = `<input type="checkbox" ${isChecked ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--accent-blue);">
                        <span style="color: var(--text-color); font-weight: 500;">${t.label}</span>`;
        let cb = el.querySelector('input');
        cb.addEventListener('change', (e) => {
            state.visibleTabs[t.id] = e.target.checked;
            localStorage.setItem('portfolioVisibleTabs', JSON.stringify(state.visibleTabs));
            updateTabsVisibility();
        });
        DOM.settingsToggles.appendChild(el);
    });
}

function updateTabsVisibility() {
    ['l12m', 'analysis', 'progress', 'trend'].forEach(tid => {
        let tabEl = document.querySelector(`.tab[data-tab="${tid}"]`);
        if (tabEl) {
            tabEl.style.display = state.visibleTabs[tid] ? 'inline-flex' : 'none';
        }
    });
    // If current tab is hidden, fallback to overall
    if (!state.visibleTabs[state.tab] && state.tab !== 'overall') {
        state.tab = 'overall';
        DOM.tabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`.tab[data-tab="overall"]`).classList.add('active');
        updateDashboard();
    }
}

if (DOM.settingsBtn) {
    DOM.settingsBtn.addEventListener('click', openSettingsModal);
}

function initCharts() { for (const [key, cfg] of Object.entries(chartConfig)) { charts[key] = createBarChart(cfg.id, cfg.title, cfg.color); } }

// ============================================
// MODAL FUNCTIONALITY
// ============================================
window.openChartModal = function (chartKey) {
    if (modalChartInstance) modalChartInstance.destroy();
    DOM.chartModal.classList.add('active');

    // Support both dashboard and analysis charts
    const cfg = chartConfig[chartKey];
    if (!cfg) return;

    DOM.modalTitle.textContent = cfg.title;
    modalChartInstance = createBarChart('#modalChart', cfg.title, cfg.color, true);

    setTimeout(() => {
        // Try to get config from either global charts or analysisCharts
        const sourceChart = charts[chartKey] || window.analysisCharts?.[chartKey];
        if (!sourceChart) return;

        let c = sourceChart.w.config;
        modalChartInstance.updateOptions({
            xaxis: c.xaxis,
            annotations: c.annotations,
            colors: c.colors,
            plotOptions: c.plotOptions,
            tooltip: c.tooltip
        });
        modalChartInstance.updateSeries(c.series);
    }, 50);
}
window.closeChartModal = function () { DOM.chartModal.classList.remove('active'); }

// ============================================
// SHEETJS EXCEL PARSING & L12M FIX
// ============================================
function safeFloat(val) { let f = parseFloat(val); return isNaN(f) ? 0 : f; }
function pct(val) { let v = safeFloat(val); return (v > 0 && v <= 2.5) ? +(v * 100).toFixed(2) : +v.toFixed(2); }
function amt(val) { return +safeFloat(val).toFixed(2); }

function parseExcelData(arrayBuffer) {
    DOM.uploadStatus.innerHTML = "Reading file... <i class='fa-solid fa-spinner fa-spin'></i>";
    setTimeout(() => {
        try {
            const wb = XLSX.read(arrayBuffer, { type: 'array' });

            const s1Name = wb.SheetNames.find(n => n.includes("Ticket")) || wb.SheetNames[0];
            const s2Name = wb.SheetNames.find(n => n.includes("12 Month")) || wb.SheetNames[1];
            const s3Name = wb.SheetNames.find(n => n.includes("Portfolio") && !n.includes("12 Month")) || (wb.SheetNames.length > 2 ? wb.SheetNames[2] : null);

            const df1 = XLSX.utils.sheet_to_json(wb.Sheets[s1Name], { header: 1, defval: 0 });
            const df2 = XLSX.utils.sheet_to_json(wb.Sheets[s2Name], { header: 1, defval: 0 });
            const df3 = s3Name && wb.Sheets[s3Name] ? XLSX.utils.sheet_to_json(wb.Sheets[s3Name], { header: 1, defval: 0 }) : [];

            let s2_lookup = {}; let s2_avg = null;
            for (let i = 2; i < df2.length; i++) {
                let row = df2[i]; let name = (row[0] || "").toString().trim();
                let collectable2 = amt(row[1]); let collection2 = amt(row[2]);
                let collectionPct2 = collectable2 > 0 ? +(collection2 / collectable2 * 100).toFixed(2) : 0;
                let m = { collectable: collectable2, collection: collection2, colVsCol: pct(row[3]), emi: amt(row[4]), emiVsCol: pct(row[5]), portfolio: amt(row[6]), npl: amt(row[7]), nplPct: pct(row[8]), par: amt(row[9]), parPct: pct(row[10]), collectionPct: collectionPct2 };
                if (!name || name === "nan" || name === "0") continue;
                s2_lookup[name] = m;
                let lowerName = name.toLowerCase();
                if (lowerName.includes("country average")) { s2_avg = m; }
                else if (!s2_avg && (i === df2.length - 1 || lowerName.includes("total") || lowerName.includes("avg"))) { s2_avg = m; }
            }

            let s3_lookup = {}; let s3_avg = null;
            let parsedMonths = [];
            if (df3.length > 2) {
                let row0 = df3[0] || [];
                for (let c = 1; c < row0.length; c += 13) {
                    let mName = (row0[c] || "").toString().trim();
                    if (mName) {
                        parsedMonths.push({ name: mName, colIdx: c });
                    }
                }
                state.availableMonths = parsedMonths.map(p => p.name);
            }

            for (let i = 2; i < df3.length; i++) {
                let row = df3[i]; let name = (row[0] || "").toString().trim();
                let m = {};
                parsedMonths.forEach(pm => {
                    let c = pm.colIdx;
                    m[pm.name] = {
                        portfolio: amt(row[c]),
                        emi: amt(row[c+1]),
                        collection: amt(row[c+2]),
                        collectable: amt(row[c+3]),
                        collectableCollection: amt(row[c+4]),
                        emiVsCol: pct(row[c+5]),
                        collectablePct: pct(row[c+6]),
                        collectionPct: 0,
                        colVsOut: pct(row[c+7]),
                        colVsCol: pct(row[c+8]),
                        par: amt(row[c+9]),
                        parPct: pct(row[c+10]),
                        npl: amt(row[c+11]),
                        nplPct: pct(row[c+12])
                    };
                });
                
                let overallData = m['TOTAL'] || (parsedMonths.length > 0 ? m[parsedMonths[parsedMonths.length-1].name] : { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0, collectablePct: 0, collectableCollection: 0, colVsOut: 0 });
                m['overall'] = overallData;

                if (!name || name === "nan" || name === "0") continue;
                s3_lookup[name] = m;
                let lowerName = name.toLowerCase();
                if (lowerName.includes("country average")) { s3_avg = m; }
                else if (!s3_avg && (i === df3.length - 1 || lowerName.includes("total") || lowerName.includes("avg"))) { s3_avg = m; }
            }

            let flat_units = []; let unassigned_regions = []; let unassigned_territories = []; let unassigned_units = []; let country_avg = null;

            for (let i = 2; i < df1.length; i++) {
                let row = df1[i]; let name = (row[0] || "").toString().trim();
                if (!name || name === "nan" || name === "0") continue;

                const n_cols = row.length;
                let t20_parAmt = n_cols > 19 ? amt(row[19]) : 0; let t20_portfolio = n_cols > 16 ? amt(row[16]) : 0;
                let t20_parPct = n_cols > 20 ? pct(row[20]) : (t20_portfolio > 0 ? +((t20_parAmt / t20_portfolio) * 100).toFixed(2) : 0);

                // FUZZY MATCHING FOR L12M (When User File has mismatched Sheet1 vs Sheet2 strings)
                let matched_l12m = s2_lookup[name];
                if (!matched_l12m) {
                    let normalized_name = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    for (let k in s2_lookup) {
                        let nk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (nk === normalized_name || nk.includes(normalized_name) || normalized_name.includes(nk)) {
                            matched_l12m = s2_lookup[k]; break;
                        }
                    }
                }

                // FUZZY MATCHING FOR OVERALL SHEET
                let matched_overall = s3_lookup[name];
                if (!matched_overall) {
                    let normalized_name = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    for (let k in s3_lookup) {
                        let nk = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (nk === normalized_name || nk.includes(normalized_name) || normalized_name.includes(nk)) {
                            matched_overall = s3_lookup[k]; break;
                        }
                    }
                }

                let b10_collectable = amt(row[1]); let b10_collection = amt(row[2]);
                let b10_collectionPct = b10_collectable > 0 ? +(b10_collection / b10_collectable * 100).toFixed(2) : 0;
                let t20_collectable = amt(row[11]); let t20_collection = amt(row[12]);
                let t20_collectionPct = t20_collectable > 0 ? +(t20_collection / t20_collectable * 100).toFixed(2) : 0;

                let metrics = {
                    below10: { collectable: b10_collectable, collection: b10_collection, colVsCol: pct(row[3]), emi: amt(row[4]), emiVsCol: pct(row[5]), portfolio: amt(row[6]), npl: amt(row[7]), nplPct: pct(row[8]), par: amt(row[9]), parPct: pct(row[10]), collectionPct: b10_collectionPct },
                    ten20: { collectable: t20_collectable, collection: t20_collection, colVsCol: pct(row[13]), emi: amt(row[14]), emiVsCol: pct(row[15]), portfolio: t20_portfolio, npl: amt(row[17]), nplPct: pct(row[18]), par: t20_parAmt, parPct: t20_parPct, collectionPct: t20_collectionPct },
                    l12m: matched_l12m || { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 },
                    overall: matched_overall ? matched_overall['overall'] : { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0, collectablePct: 0, collectableCollection: 0, colVsOut: 0 }
                };
                if (matched_overall) {
                    for (let k in matched_overall) {
                        metrics[k] = matched_overall[k];
                    }
                }

                let lowerName = name.toLowerCase();
                if (lowerName.includes("total") || lowerName.includes("average") || lowerName.includes("sub-total")) {
                    if (lowerName.includes("country average")) country_avg = metrics;
                    continue;
                }

                let obj = { name, metrics };
                if (name.includes("Zone")) {
                    unassigned_regions.forEach(r => {
                        r.zone = name; r.territories.forEach(t => {
                            t.zone = name; t.units.forEach(u => {
                                u.zone = name; u.region = r.name; u.territory = t.name; flat_units.push(u);
                            });
                        });
                    }); unassigned_regions = [];
                } else if (name.includes("Region")) {
                    obj.territories = unassigned_territories; unassigned_regions.push(obj); unassigned_territories = [];
                } else if (name.includes("Territory")) {
                    obj.units = unassigned_units; unassigned_territories.push(obj); unassigned_units = [];
                } else { obj.type = "Unit"; unassigned_units.push(obj); }
            }

            // unassigned_regions.forEach(r => { r.territories.forEach(t => { t.units.forEach(u => { if (!u.zone) u.zone = "Unassigned"; u.region = r.name; u.territory = t.name; flat_units.push(u); }); }); });
            // unassigned_territories.forEach(t => { t.units.forEach(u => { if (!u.zone) u.zone = "Unassigned"; if (!u.region) u.region = "Unassigned"; u.territory = t.name; flat_units.push(u); }); });
            // unassigned_units.forEach(u => { if (!u.zone) u.zone = "Unassigned"; if (!u.region) u.region = "Unassigned"; if (!u.territory) u.territory = "Unassigned"; flat_units.push(u); });

            // Apply bulletproof L12M & Overall Country Avg patch
            if (!country_avg) {
                country_avg = {
                    below10: { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 },
                    ten20: { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 },
                    l12m: s2_avg || { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 },
                    overall: s3_avg ? s3_avg['overall'] : { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 }
                };
            } else {
                if (s2_avg) country_avg.l12m = s2_avg;
            }
            if (s3_avg) {
                for (let k in s3_avg) {
                    country_avg[k] = s3_avg[k];
                }
            }

            let all_subtotals = {};
            for (let name in s2_lookup) {
                if (!all_subtotals[name]) all_subtotals[name] = {};
                all_subtotals[name].l12m = s2_lookup[name];
            }
            for (let name in s3_lookup) {
                if (!all_subtotals[name]) all_subtotals[name] = {};
                for (let k in s3_lookup[name]) {
                    all_subtotals[name][k] = s3_lookup[name][k];
                }
            }

            unitData = flat_units.map(u => ({ unit: u.name, territory: u.territory, region: u.region, zone: u.zone, metrics: u.metrics }));
            countryAvg = country_avg;
            subtotals = all_subtotals;

            // Save to localStorage so it persists on reload
            try {
                localStorage.setItem('portfolioData_unitData', JSON.stringify(unitData));
                localStorage.setItem('portfolioData_countryAvg', JSON.stringify(countryAvg));
                localStorage.setItem('portfolioData_subtotals', JSON.stringify(subtotals));
                localStorage.setItem('portfolioData_availableMonths', JSON.stringify(state.availableMonths));
            } catch (e) {
                console.warn("Could not save to localStorage (quota exceeded?)", e);
            }

            DOM.uploadStatus.innerHTML = `<i class="fa-solid fa-check" style="color:var(--accent-green)"></i> Loaded ${unitData.length} units! Saving...`;
            DOM.downloadJsonBtn.style.display = 'block';

            populateDropdowns(); updateDashboard();

            // Attempt to save permanently via local server
            fetch('/save_data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    unitData, countryAvg, subtotals, availableMonths: state.availableMonths,
                    settings: { visibleMetrics: state.visibleMetrics, visibleTabs: state.visibleTabs }
                })
            }).then(res => res.json()).then(data => {
                if (data.status === 'success') {
                    DOM.uploadStatus.innerHTML += " <span style='color:var(--accent-green)'><i class='fa-solid fa-hard-drive'></i> Permanently saved to realData.js!</span>";
                }
            }).catch(e => {
                // Ignore error, it just means they didn't run the server
                DOM.uploadStatus.innerHTML += " <br><small style='color:var(--text-muted)'>(Note: run start_dashboard.bat to auto-save permanently)</small>";
            });
        } catch (err) { console.error(err); DOM.uploadStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:var(--accent-red)"></i> ${err.message}`; }
    }, 100);
}
// =============================
// JSON LOAD HANDLING
// =============================
// Hidden file input for JSON
DOM.jsonUpload = document.getElementById('jsonUpload');
// When Load JSON button clicked, trigger hidden input
if (DOM.loadJSONBtn) {
    DOM.loadJSONBtn.addEventListener('click', () => {
        if (DOM.jsonUpload) DOM.jsonUpload.click();
    });
}
// Handle selected JSON file
if (DOM.jsonUpload) {
    DOM.jsonUpload.addEventListener('change', (e) => {
        if (!e.target.files[0]) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                unitData = data.unitData || [];
                countryAvg = data.countryAvg || {};
                subtotals = data.subtotals || {};
                // Save back to localStorage for future loads
                localStorage.setItem('portfolioData_unitData', JSON.stringify(unitData));
                localStorage.setItem('portfolioData_countryAvg', JSON.stringify(countryAvg));
                localStorage.setItem('portfolioData_subtotals', JSON.stringify(subtotals));
                localStorage.setItem('portfolioData_availableMonths', JSON.stringify(state.availableMonths));
                DOM.downloadJsonBtn.style.display = 'block';
                populateDropdowns();
                updateDashboard();

                // Attempt to save permanently via local server
                fetch('/save_data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        unitData, countryAvg, subtotals, availableMonths: state.availableMonths,
                        settings: { visibleMetrics: state.visibleMetrics, visibleTabs: state.visibleTabs }
                    })
                }).then(res => res.json()).then(data => {
                    if (data.status === 'success') {
                        console.log("JSON permanently saved to realData.js!");
                    }
                }).catch(e => {
                    // Ignore error
                });
            } catch (err) {
                console.error('Failed to load JSON:', err);
                alert('Invalid JSON file. Please select a valid exported JSON.');
            }
        };
        reader.readAsText(e.target.files[0]);
    });
}
// Call after DOM ready
window.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    updateTabsVisibility();
});
DOM.excelUpload.addEventListener('change', (e) => {
    if (!e.target.files[0]) return; const reader = new FileReader(); reader.onload = (evt) => parseExcelData(evt.target.result); reader.readAsArrayBuffer(e.target.files[0]);
});

DOM.downloadJsonBtn.addEventListener('click', () => {
    const settings = { visibleMetrics: state.visibleMetrics, visibleTabs: state.visibleTabs };
    const dataStr = "data:text/javascript;charset=utf-8," + encodeURIComponent("const dashboardData = " + JSON.stringify({ unitData, countryAvg, subtotals, availableMonths: state.availableMonths, settings }, null, 2) + ";");
    const dlAnchorElem = document.createElement('a'); dlAnchorElem.setAttribute("href", dataStr); dlAnchorElem.setAttribute("download", "realData.js"); dlAnchorElem.click();
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
function getTextColor(npl) {
    if (npl === 0) return 'var(--text-muted)';
    if (npl <= 2.0) return 'var(--accent-green)';
    if (npl <= 5.0) return 'var(--accent-amber)';
    return 'var(--accent-red)';
}
function nplBorder(npl) {
    if (npl === 0) return 'transparent';
    if (npl <= 2.0) return 'var(--accent-green)';
    if (npl <= 5.0) return 'var(--accent-amber)';
    return 'var(--accent-red)';
}

// ============================================
// DATA FILTERING & AGGREGATION
// ============================================
function getFilteredUnits() {
    if (!unitData.length) return [];
    return unitData.filter(item => {
        if (item.zone === "Unassigned" || item.region === "Unassigned" || item.territory === "Unassigned" || item.unit === "Unassigned") return false;
        if (state.filters.zone !== 'all' && item.zone !== state.filters.zone) return false;
        if (state.filters.region !== 'all' && item.region !== state.filters.region) return false;
        if (state.filters.territory !== 'all' && item.territory !== state.filters.territory) return false;
        if (state.filters.unit !== 'all' && item.unit !== state.filters.unit) return false; return true;
    });
}
function getUniqueValues(data, key) { return [...new Set(data.map(item => item[key]).filter(val => val !== 'Unassigned'))].sort(); }
function getMetricKey() {
    if (state.tab === 'l12m') return 'l12m';
    if (state.tab === 'overall' || state.tab === 'analysis' || state.tab === 'progress') return state.month;
    if (state.ticketSize === 'both') return 'both';
    return state.ticketSize;
}

function aggregateMetrics(units, metricKey) {
    if (!units.length) return { collectionPct: 0, colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectable: 0, collection: 0, emi: 0, portfolio: 0, npl: 0, par: 0 };
    let t = { collectable: 0, collection: 0, emi: 0, portfolio: 0, npl: 0, par: 0 };
    units.forEach(u => {
        let val = null;
        const m = u.metrics || u;
        if (metricKey === 'both') {
            const b10 = m.below10 || m['below10'];
            const t20 = m.ten20 || m['ten20'];
            if (b10 && t20) {
                val = { collectable: b10.collectable + t20.collectable, collection: b10.collection + t20.collection, emi: b10.emi + t20.emi, portfolio: b10.portfolio + t20.portfolio, npl: b10.npl + t20.npl, par: b10.par + t20.par };
            } else if (b10) { val = b10; }
            else if (t20) { val = t20; }
        } else {
            val = m[metricKey] || null;
        }
        if (!val) return;
        t.collectable += val.collectable || 0; t.collection += val.collection || 0; t.emi += val.emi || 0; t.portfolio += val.portfolio || 0; t.npl += val.npl || 0; t.par += val.par || 0;
    });
    const colVsCol = (metricKey === 'overall') ? (t.portfolio > 0 ? +(t.collection / t.portfolio * 100).toFixed(2) : 0) : (t.collectable > 0 ? +(t.collection / t.collectable * 100).toFixed(2) : 0);
    const collectionPct = t.collectable > 0 ? +(t.collection / t.collectable * 100).toFixed(2) : 0;
    return {
        collectable: t.collectable,
        collection: t.collection,
        emi: t.emi,
        portfolio: t.portfolio,
        npl: t.npl,
        par: t.par,
        colVsCol,
        colVsOut: t.portfolio > 0 ? +(t.collectable / t.portfolio * 100).toFixed(2) : 0,
        collectionPct,
        collectablePct: t.portfolio > 0 ? +(t.collectable / t.portfolio * 100).toFixed(2) : 0,
        emiVsCol: (metricKey === 'overall') ? (t.emi > 0 ? +(t.collection / t.emi * 100).toFixed(2) : 0) : (t.collection > 0 ? +(t.emi / t.collection * 100).toFixed(2) : 0),
        nplPct: t.portfolio > 0 ? +(t.npl / t.portfolio * 100).toFixed(2) : 0,
        parPct: t.portfolio > 0 ? +(t.par / t.portfolio * 100).toFixed(2) : 0
    };
}

function getExactSubtotal(name, month) {
    if (!name) return null;
    let possibleNames = [name, "Total " + name, name + " Total", "Total " + name.replace(/Zone/i, "").trim()];
    for (let p of possibleNames) {
        if (subtotals[p] && subtotals[p][month]) {
            return subtotals[p][month];
        }
    }
    for (let key in subtotals) {
        if (key.toLowerCase().includes(name.toLowerCase()) && subtotals[key][month]) {
            return subtotals[key][month];
        }
    }
    return null;
}

function getGroupedData(units, groupKey, metricKey) {
    const groups = {}; units.forEach(u => { const key = u[groupKey]; if (!groups[key]) groups[key] = []; groups[key].push(u); });
    return Object.keys(groups).sort().map(name => {
        let agg = aggregateMetrics(groups[name], metricKey);

        // If the exact pre-calculated row exists in the Excel file, OVERRIDE the aggregated math.
        let exact = getExactSubtotal(name, metricKey);
        if (exact) {
            METRICS_CONFIG.forEach(mc => {
                if (exact[mc.id] !== undefined) {
                    agg[mc.id] = exact[mc.id];
                }
            });
        }
        return { name, ...agg, unitCount: groups[name].length };
    });
}

function handleChartClick(index) {
    const label = currentChartLabels[index]; if (!label) return;
    if (state.drillLevel === 'zone') { state.filters.zone = label; state.drillLevel = 'region'; } else if (state.drillLevel === 'region') { state.filters.region = label; state.drillLevel = 'territory'; } else if (state.drillLevel === 'territory') { state.filters.territory = label; state.drillLevel = 'unit'; }
    DOM.drillLevel.value = state.drillLevel; populateDropdowns(); updateBreadcrumb(); updateDashboard();
}

function handleTableRowClick(name) {
    if (state.drillLevel === 'zone') { state.filters.zone = name; state.drillLevel = 'region'; } else if (state.drillLevel === 'region') { state.filters.region = name; state.drillLevel = 'territory'; } else if (state.drillLevel === 'territory') { state.filters.territory = name; state.drillLevel = 'unit'; }
    DOM.drillLevel.value = state.drillLevel; populateDropdowns(); updateBreadcrumb(); updateDashboard();
}


function populateAnalysisDropdown() {
    const analysisSelect = document.getElementById('analysisMetricSelect');
    if (!analysisSelect) return;
    const currentVal = analysisSelect.value;
    analysisSelect.innerHTML = '';
    let foundCurrent = false;
    METRICS_CONFIG.forEach(m => {
        if (state.visibleMetrics[m.id]) {
            let opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.label;
            analysisSelect.appendChild(opt);
            if (m.id === currentVal) foundCurrent = true;
        }
    });
    // If the currently selected option is now hidden, fallback to first available
    if (!foundCurrent && analysisSelect.options.length > 0) {
        analysisSelect.value = analysisSelect.options[0].value;
    }
}

function populateDropdowns() {
    populateAnalysisDropdown();
    if (state.availableMonths && DOM.monthFilter) {
        DOM.monthFilter.innerHTML = '';
        state.availableMonths.forEach(m => {
            let opt = document.createElement('option'); opt.value = m; opt.textContent = m;
            if (m === state.month) opt.selected = true;
            DOM.monthFilter.appendChild(opt);
        });
    }
    const zones = getUniqueValues(unitData, 'zone'); populateSelect(DOM.zoneFilter, zones, state.filters.zone, 'All Zones');
    let regionPool = state.filters.zone !== 'all' ? unitData.filter(u => u.zone === state.filters.zone) : unitData;
    const regions = getUniqueValues(regionPool, 'region'); populateSelect(DOM.regionFilter, regions, state.filters.region, 'All Regions');
    let territoryPool = state.filters.region !== 'all' ? regionPool.filter(u => u.region === state.filters.region) : regionPool;
    const territories = getUniqueValues(territoryPool, 'territory'); populateSelect(DOM.territoryFilter, territories, state.filters.territory, 'All Territories');
    let unitPool = state.filters.territory !== 'all' ? territoryPool.filter(u => u.territory === state.filters.territory) : territoryPool;
    const units = getUniqueValues(unitPool, 'unit'); populateSelect(DOM.unitFilter, units, state.filters.unit, 'All Units');
}

function populateSelect(el, options, currentValue, placeholder) {
    el.innerHTML = `<option value="all">${placeholder}</option>`;
    options.forEach(opt => { const option = document.createElement('option'); option.value = opt; option.textContent = opt; if (opt === currentValue) option.selected = true; el.appendChild(option); }); el.disabled = false;
}

// ============================================
// UI RENDERING
// ============================================
function isGood(value, avg, higherBetter) { return higherBetter ? value >= avg : value <= avg; }
function cellClass(value, avg, higherBetter) { return isGood(value, avg, higherBetter) ? 'cell-good' : 'cell-bad'; }
function getAnnotation(val, color) { if (!val) return {}; return { y: val, borderColor: color, strokeDashArray: 4, label: { text: 'Avg: ' + val.toFixed(1) + '%', style: { color: '#fff', background: color, fontSize: '10px', fontWeight: 'bold' }, position: 'left' } }; }

function sortIcon(col) {
    if (state.sortCol !== col) return '<i class="fa-solid fa-sort" style="opacity:0.3; margin-left:4px"></i>';
    return state.sortDesc ? '<i class="fa-solid fa-sort-down" style="color:var(--accent-blue); margin-left:4px"></i>' : '<i class="fa-solid fa-sort-up" style="color:var(--accent-blue); margin-left:4px"></i>';
}

window.sortTable = function (col) {
    if (state.sortCol === col) {
        state.sortDesc = !state.sortDesc;
    } else {
        state.sortCol = col;
        state.sortDesc = col !== 'name';
    }
    updateDashboard();
}

window.goUpward = function () {
    if (state.drillLevel === 'unit') {
        state.drillLevel = 'territory';
        state.filters.territory = 'all';
        state.filters.unit = 'all';
    }
    else if (state.drillLevel === 'territory') {
        state.drillLevel = 'region';
        state.filters.region = 'all';
        state.filters.territory = 'all';
        state.filters.unit = 'all';
    }
    else if (state.drillLevel === 'region') {
        state.drillLevel = 'zone';
        state.filters.zone = 'all';
        state.filters.region = 'all';
        state.filters.territory = 'all';
        state.filters.unit = 'all';
    }
    DOM.drillLevel.value = state.drillLevel;
    populateDropdowns(); updateBreadcrumb(); updateDashboard();
}

let currentInsightTarget = null;
let currentInsightLevel = null;
let currentInsightMetricType = 'nplPct';

window.openInsightModal = function (name, level) {
    currentInsightTarget = name;
    currentInsightLevel = level;
    const firstVis = METRICS_CONFIG.find(mc => state.visibleMetrics[mc.id]);
    currentInsightMetricType = firstVis ? firstVis.id : 'nplPct';
    document.getElementById('insightModal').classList.add('active');
    renderInsightTimeline();
}

window.renderInsightTimeline = function (overrideMetric) {
    if (overrideMetric) currentInsightMetricType = overrideMetric;

    let name = currentInsightTarget;
    let level = currentInsightLevel;
    let baseMetricKey = getMetricKey();
    if (baseMetricKey === 'both') baseMetricKey = 'below10'; // Default to Below 10 Lacs for Modal if 'both' is selected

    let cAvg = Object.assign({ nplPct: 0, parPct: 0, colVsCol: 0, emiVsCol: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 }, countryAvg[baseMetricKey] || {});

    let targetData = getFilteredUnits().filter(u => u[level] === name);
    let targetAgg = aggregateMetrics(targetData, baseMetricKey);

    let exact = getExactSubtotal(name, baseMetricKey);
    if (exact) {
        METRICS_CONFIG.forEach(mc => {
            if (exact[mc.id] !== undefined) {
                targetAgg[mc.id] = exact[mc.id];
            }
        });
    }

    const levelLabels = { zone: 'Zone', region: 'Region', territory: 'Territory', unit: 'Unit' };

    const mConfig = {};
    METRICS_CONFIG.forEach(mc => {
        mConfig[mc.id] = { title: mc.label, color: mc.color, higherBetter: mc.higherBetter, label: mc.label };
    });
    let mc = mConfig[currentInsightMetricType];

    let tabsHtml = `<div class="insight-tabs">
        ${Object.keys(mConfig).map(k => `<button class="insight-tab ${k === currentInsightMetricType ? 'active' : ''}" onclick="renderInsightTimeline('${k}')">${mConfig[k].title} %</button>`).join('')}
    </div>`;

    let html = tabsHtml + `<div class="timeline-container"><div class="timeline-center-line"></div>`;

    html += `<div class="timeline-node center-node"><div class="node-content">
        <div class="node-title">Country Average</div>
        <div class="node-value" style="color:${mc.color}">${mc.label}: ${(cAvg[currentInsightMetricType]||0).toFixed(2)}%</div>
    </div></div>`;

    html += `<div class="timeline-node center-node target-node"><div class="node-content" style="border-color:var(--accent-purple); background:rgba(168, 85, 247, 0.1);">
        <div class="node-title">${name} (${levelLabels[level] || level})</div>
        <div class="node-value" style="color:var(--accent-purple)">${mc.label}: ${(targetAgg[currentInsightMetricType]||0).toFixed(2)}%</div>
    </div></div>`;

    const renderNodes = (arr, label) => {
        if (!arr.length) return '';
        let res = `<div class="timeline-label-divider"><span>${label} Breakdown</span></div>`;
        arr.sort((a, b) => b[currentInsightMetricType] - a[currentInsightMetricType]);
        arr.forEach(child => {
            let val = child[currentInsightMetricType];
            let avgVal = cAvg[currentInsightMetricType] || 0;
            let isGood = mc.higherBetter ? (val >= avgVal) : (val <= avgVal);
            let isLeft = val < avgVal;

            let sideClass = isLeft ? 'left-node' : 'right-node';
            let qualityClass = isGood ? 'good-node' : 'bad-node';
            let colorClass = isGood ? 'good-val' : 'bad-val';

            res += `<div class="timeline-node ${sideClass} ${qualityClass}">
                <div class="node-content">
                    <div class="node-title">${child.name}</div>
                    <div class="node-value ${colorClass}">${mc.label}: ${val.toFixed(2)}%</div>
                    <div style="font-size:0.7rem; color:var(--text-muted);">${isGood ? 'Better than Avg' : 'Worse than Avg'}</div>
                </div>
            </div>`;
        });
        return res;
    };

    if (level === 'zone') {
        html += renderNodes(getGroupedData(targetData, 'region', baseMetricKey), 'Region');
        html += renderNodes(getGroupedData(targetData, 'territory', baseMetricKey), 'Territory');
        html += renderNodes(getGroupedData(targetData, 'unit', baseMetricKey), 'Unit');
    } else if (level === 'region') {
        html += renderNodes(getGroupedData(targetData, 'territory', baseMetricKey), 'Territory');
        html += renderNodes(getGroupedData(targetData, 'unit', baseMetricKey), 'Unit');
    } else if (level === 'territory') {
        html += renderNodes(getGroupedData(targetData, 'unit', baseMetricKey), 'Unit');
    }

    html += `</div>`;
    document.getElementById('insightTimelineContainer').innerHTML = html;
}

window.closeInsightModal = function () {
    document.getElementById('insightModal').classList.remove('active');
}

function renderKPIs(filteredUnits) {
    const grid = DOM.kpiGrid; grid.innerHTML = '';
    if (!unitData.length || !countryAvg) return;
    if (state.tab === 'ticket' && state.ticketSize === 'both') {
        const b10 = aggregateMetrics(filteredUnits, 'below10'); const t20 = aggregateMetrics(filteredUnits, 'ten20');
        const defaultAvg = { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 };
        const avgB10 = Object.assign({}, defaultAvg, countryAvg.below10 || {}); const avgT20 = Object.assign({}, defaultAvg, countryAvg.ten20 || {});
        const metrics = [
            { label: 'Collection %', b10Key: 'collectionPct', t20Key: 'collectionPct', avgB10: avgB10.collectionPct || 0, avgT20: avgT20.collectionPct || 0, higherBetter: true, icon: 'fa-percentage', gradient: 'var(--gradient-purple)' },
            { label: 'Out vs Col %', b10Key: 'colVsCol', t20Key: 'colVsCol', avgB10: avgB10.colVsCol || 0, avgT20: avgT20.colVsCol || 0, higherBetter: true, icon: 'fa-chart-pie', gradient: 'var(--gradient-blue)' },
            { label: 'EMI %', b10Key: 'emiVsCol', t20Key: 'emiVsCol', avgB10: avgB10.emiVsCol || 0, avgT20: avgT20.emiVsCol || 0, higherBetter: true, icon: 'fa-money-bill-trend-up', gradient: 'var(--gradient-green)' },
            { label: 'NPL %', b10Key: 'nplPct', t20Key: 'nplPct', avgB10: avgB10.nplPct || 0, avgT20: avgT20.nplPct || 0, higherBetter: false, icon: 'fa-triangle-exclamation', gradient: 'var(--gradient-red)' },
            { label: 'PAR %', b10Key: 'parPct', t20Key: 'parPct', avgB10: avgB10.parPct || 0, avgT20: avgT20.parPct || 0, higherBetter: false, icon: 'fa-chart-line', gradient: 'var(--gradient-amber)' }
        ];
        metrics.forEach(m => {
            const b10Val = b10[m.b10Key]; const t20Val = t20[m.t20Key]; const card = document.createElement('div'); card.className = 'kpi-card-ticket';
            card.innerHTML = `<div class="kpi-accent-bar" style="background: ${m.gradient}"></div><div class="ticket-header"><i class="fa-solid ${m.icon}"></i> ${m.label}</div><div class="ticket-row"> <span class="ticket-label">Below 10 Lacs</span> <span class="ticket-value ${isGood(b10Val, m.avgB10, m.higherBetter) ? 'good' : 'bad'}">${b10Val.toFixed(2)}%</span> </div><div class="ticket-row"> <span class="ticket-label">10-20 Lacs</span> <span class="ticket-value ${isGood(t20Val, m.avgT20, m.higherBetter) ? 'good' : 'bad'}">${t20Val.toFixed(2)}%</span> </div><div class="ticket-row" style="opacity:0.5"> <span class="ticket-label">Country Avg</span> <span class="ticket-label">${m.avgB10.toFixed(2)}% / ${m.avgT20.toFixed(2)}%</span> </div>`; grid.appendChild(card);
        });
    } else {
        let metricKey = getMetricKey();
        let agg = aggregateMetrics(filteredUnits, metricKey);
        const avg = countryAvg[metricKey] || { collectionPct: 0, colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0 };

        // If viewing the entire country level without filters, FORCE the Exact Country Average values 
        // because mathematical aggregation of rows will differ from the user's custom Excel formula
        let isCountryLevel = state.filters.zone === 'all';
        if (isCountryLevel) {
            METRICS_CONFIG.forEach(mc => {
                if (avg[mc.id] !== undefined) {
                    agg[mc.id] = avg[mc.id];
                }
            });
        } else {
            // Try to lookup exact filter match
            let currentFilterName = state.filters.unit !== 'all' ? state.filters.unit :
                (state.filters.territory !== 'all' ? state.filters.territory :
                    (state.filters.region !== 'all' ? state.filters.region : state.filters.zone));
            if (subtotals[currentFilterName] && subtotals[currentFilterName][metricKey]) {
                let exact = subtotals[currentFilterName][metricKey];
                METRICS_CONFIG.forEach(mc => {
                    if (exact[mc.id] !== undefined) {
                        agg[mc.id] = exact[mc.id];
                    }
                });
            }
        }

        const kpis = METRICS_CONFIG.map(m => ({ ...m, value: agg[m.id] || 0, avg: avg[m.id] || 0 }));
        kpis.forEach(k => { if (!state.visibleMetrics[k.id]) return;
            const diff = k.value - k.avg; const card = document.createElement('div'); card.className = 'kpi-card';
            card.innerHTML = `<div class="kpi-accent-bar" style="background: ${k.gradient}"></div><div class="kpi-header-row"><div class="kpi-icon" style="background: ${k.gradient}"><i class="fa-solid ${k.icon}" style="color:#fff"></i></div><div class="kpi-label">${k.label}</div></div><div class="kpi-value">${k.value.toFixed(2)}%</div><div class="kpi-sub ${isGood(k.value, k.avg, k.higherBetter) ? 'positive' : 'negative'}"><i class="fa-solid ${isGood(k.value, k.avg, k.higherBetter) ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>${Math.abs(diff).toFixed(2)}% vs Avg</div>`; grid.appendChild(card);
        });
    }
}

function getMax(data, avg, key) { 
    let dMax = Math.max(...data.map(d => d[key] || 0));
    let aMax = (avg && typeof avg[key] === 'number' && !isNaN(avg[key])) ? avg[key] * 1.15 : 0;
    let m = Math.max(dMax, aMax);
    if (isNaN(m) || !isFinite(m)) m = 5;
    return m < 5 ? 5 : m; 
}
function getChartOptions(categories, avgVal, color, maxVal) { return { xaxis: { categories }, yaxis: { max: maxVal > 0 ? maxVal : undefined }, annotations: { yaxis: [getAnnotation(avgVal, color)] } }; }

function updateCharts(filteredUnits) {
    if (!unitData.length || !countryAvg) return;
    const level = state.drillLevel; const labels = getGroupedData(filteredUnits, level, 'below10').map(g => g.name); currentChartLabels = labels;
    if (state.tab === 'ticket' && state.ticketSize === 'both') {
        const gB10 = getGroupedData(filteredUnits, level, 'below10'); const gT20 = getGroupedData(filteredUnits, level, 'ten20');
        const defaultAvg = { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 };
        const aB10 = Object.assign({}, defaultAvg, countryAvg.below10 || {}); const aT20 = Object.assign({}, defaultAvg, countryAvg.ten20 || {});


        // Show/Hide chart cards based on visibility
        METRICS_CONFIG.forEach(m => {
            let cardId = 'chartCard' + m.id.charAt(0).toUpperCase() + m.id.slice(1);
            let el = document.getElementById(cardId);
            if (el) {
                el.style.display = state.visibleMetrics[m.id] ? 'block' : 'none';
            }
        });
        charts.collectablePct?.updateOptions({ ...getChartOptions(labels, aB10.collectablePct, '#8b5cf6', Math.max(getMax(gB10, aB10, 'collectablePct'), getMax(gT20, aT20, 'collectablePct'))), series: [{ name: 'Below 10 Lacs', data: gB10.map(g => g.collectablePct) }, { name: '10-20 Lacs', data: gT20.map(g => g.collectablePct) }] }, false, true, true);
        charts.collectionPct?.updateOptions({ ...getChartOptions(labels, aB10.collectionPct, '#8b5cf6', Math.max(getMax(gB10, aB10, 'collectionPct'), getMax(gT20, aT20, 'collectionPct'))), series: [{ name: 'Below 10 Lacs', data: gB10.map(g => g.collectionPct) }, { name: '10-20 Lacs', data: gT20.map(g => g.collectionPct) }] }, false, true, true);
        charts.colVsCol?.updateOptions({ ...getChartOptions(labels, aB10.colVsCol, '#818cf8', Math.max(getMax(gB10, aB10, 'colVsCol'), getMax(gT20, aT20, 'colVsCol'))), series: [{ name: 'Below 10 Lacs', data: gB10.map(g => g.colVsCol) }, { name: '10-20 Lacs', data: gT20.map(g => g.colVsCol) }] }, false, true, true);
        charts.emiVsCol?.updateOptions({ ...getChartOptions(labels, aB10.emiVsCol, '#22d3ee', Math.max(getMax(gB10, aB10, 'emiVsCol'), getMax(gT20, aT20, 'emiVsCol'))), series: [{ name: 'Below 10 Lacs', data: gB10.map(g => g.emiVsCol) }, { name: '10-20 Lacs', data: gT20.map(g => g.emiVsCol) }] }, false, true, true);
        charts.nplPct?.updateOptions({ ...getChartOptions(labels, aB10.nplPct, '#f87171', Math.max(getMax(gB10, aB10, 'nplPct'), getMax(gT20, aT20, 'nplPct'))), series: [{ name: 'Below 10 Lacs', data: gB10.map(g => g.nplPct) }, { name: '10-20 Lacs', data: gT20.map(g => g.nplPct) }] }, false, true, true);
        charts.parPct?.updateOptions({ ...getChartOptions(labels, aB10.parPct, '#fbbf24', Math.max(getMax(gB10, aB10, 'parPct'), getMax(gT20, aT20, 'parPct'))), series: [{ name: 'Below 10 Lacs', data: gB10.map(g => g.parPct) }, { name: '10-20 Lacs', data: gT20.map(g => g.parPct) }] }, false, true, true);
    } else {
        const metricKey = getMetricKey(); const grouped = getGroupedData(filteredUnits, level, metricKey); 
        const defaultAvg = { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 };
        const avg = Object.assign({}, defaultAvg, countryAvg[metricKey] || {});
        const activeLabels = grouped.map(g => g.name);


        // Show/Hide chart cards based on visibility
        METRICS_CONFIG.forEach(m => {
            let cardId = 'chartCard' + m.id.charAt(0).toUpperCase() + m.id.slice(1);
            let el = document.getElementById(cardId);
            if (el) {
                el.style.display = state.visibleMetrics[m.id] ? 'block' : 'none';
            }
        });
        charts.collectablePct?.updateOptions({ ...getChartOptions(activeLabels, avg.collectablePct, '#8b5cf6', getMax(grouped, avg, 'collectablePct')), series: [{ name: 'CLTD %', data: grouped.map(g => g.collectablePct) }] }, false, true, true);
        charts.collectionPct?.updateOptions({ ...getChartOptions(activeLabels, avg.collectionPct, '#8b5cf6', getMax(grouped, avg, 'collectionPct')), series: [{ name: 'Collection %', data: grouped.map(g => g.collectionPct) }] }, false, true, true);
        charts.colVsCol?.updateOptions({ ...getChartOptions(activeLabels, avg.colVsCol, '#6366f1', getMax(grouped, avg, 'colVsCol')), series: [{ name: 'Out vs Col %', data: grouped.map(g => g.colVsCol) }] }, false, true, true);
        charts.colVsOut?.updateOptions({ ...getChartOptions(activeLabels, avg.colVsOut, '#06b6d4', getMax(grouped, avg, 'colVsOut')), series: [{ name: 'Col vs Out %', data: grouped.map(g => g.colVsOut) }] }, false, true, true);
        charts.emiVsCol?.updateOptions({ ...getChartOptions(activeLabels, avg.emiVsCol, '#06b6d4', getMax(grouped, avg, 'emiVsCol')), series: [{ name: 'EMI %', data: grouped.map(g => g.emiVsCol) }] }, false, true, true);
        charts.nplPct?.updateOptions({ ...getChartOptions(activeLabels, avg.nplPct, '#ef4444', getMax(grouped, avg, 'nplPct')), series: [{ name: 'NPL %', data: grouped.map(g => g.nplPct) }] }, false, true, true);
        charts.parPct?.updateOptions({ ...getChartOptions(activeLabels, avg.parPct, '#f59e0b', getMax(grouped, avg, 'parPct')), series: [{ name: 'PAR %', data: grouped.map(g => g.parPct) }] }, false, true, true);
    }
}

function updateTable(filteredUnits) {
    if (!unitData.length || !countryAvg) return;
    const metricKey = getMetricKey(); const level = state.drillLevel; const levelLabels = { zone: 'Zone', region: 'Region', territory: 'Territory', unit: 'Unit / Area' };
    const upLevels = { unit: 'territory', territory: 'region', region: 'zone', zone: null };

    let backBtnHTML = '';
    if (state.drillLevel !== 'zone') {
        backBtnHTML = `<button class="btn-back" onclick="goUpward()"><i class="fa-solid fa-arrow-left"></i> Back to ${levelLabels[upLevels[state.drillLevel]]}</button>`;
    }
    DOM.tableTitle.innerHTML = `Breakdown by ${levelLabels[level]} ${backBtnHTML}`;

    if (state.tab === 'ticket' && state.ticketSize === 'both') {
        let groupedB10 = getGroupedData(filteredUnits, level, 'below10'); let groupedT20 = getGroupedData(filteredUnits, level, 'ten20');
        const defaultAvg = { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 };
        const avgB10 = Object.assign({}, defaultAvg, countryAvg.below10 || {}); const avgT20 = Object.assign({}, defaultAvg, countryAvg.ten20 || {});
        const t20Map = {}; groupedT20.forEach(g => t20Map[g.name] = g);

        DOM.tableHeader.innerHTML = `<th rowspan="2" class="border-right sortable" onclick="sortTable('name')">${levelLabels[level]} ${sortIcon('name')}</th><th colspan="5" class="border-right" style="text-align:center;color:var(--accent-blue);border-bottom:2px solid var(--accent-blue)">Below 10 Lacs</th><th colspan="5" class="border-right" style="text-align:center;color:var(--accent-purple);border-bottom:2px solid var(--accent-purple)">10-20 Lacs</th><th rowspan="2">Action</th>`;
        let subRow = DOM.tableHeader.parentElement.querySelector('.sub-header-row'); if (!subRow) { subRow = document.createElement('tr'); subRow.className = 'sub-header-row'; DOM.tableHeader.parentElement.appendChild(subRow); }
        subRow.innerHTML = `<th class="sortable" onclick="sortTable('b10_colVsCol')">Out vs Col ${sortIcon('b10_colVsCol')}</th><th class="sortable" onclick="sortTable('b10_emiVsCol')">EMI % ${sortIcon('b10_emiVsCol')}</th><th class="sortable" onclick="sortTable('b10_collectionPct')">Collection % ${sortIcon('b10_collectionPct')}</th><th class="sortable" onclick="sortTable('b10_nplPct')">NPL % ${sortIcon('b10_nplPct')}</th><th class="border-right sortable" onclick="sortTable('b10_parPct')">PAR % ${sortIcon('b10_parPct')}</th><th class="sortable" onclick="sortTable('t20_colVsCol')">Out vs Col ${sortIcon('t20_colVsCol')}</th><th class="sortable" onclick="sortTable('t20_emiVsCol')">EMI % ${sortIcon('t20_emiVsCol')}</th><th class="sortable" onclick="sortTable('t20_collectionPct')">Collection % ${sortIcon('t20_collectionPct')}</th><th class="sortable" onclick="sortTable('t20_nplPct')">NPL % ${sortIcon('t20_nplPct')}</th><th class="border-right sortable" onclick="sortTable('t20_parPct')">PAR % ${sortIcon('t20_parPct')}</th>`;
        DOM.tableBody.innerHTML = '';
        const avgRow = document.createElement('tr'); avgRow.className = 'row-avg';
        avgRow.innerHTML = `<td class="border-right">Total Small Business</td><td>${avgB10.colVsCol.toFixed(2)}%</td><td>${avgB10.emiVsCol.toFixed(2)}%</td><td>${avgB10.collectionPct.toFixed(2)}%</td><td>${avgB10.nplPct.toFixed(2)}%</td><td class="border-right">${avgB10.parPct.toFixed(2)}%</td><td>${avgT20.colVsCol.toFixed(2)}%</td><td>${avgT20.emiVsCol.toFixed(2)}%</td><td>${avgT20.collectionPct.toFixed(2)}%</td><td>${avgT20.nplPct.toFixed(2)}%</td><td class="border-right">${avgT20.parPct.toFixed(2)}%</td><td class="action-cell">-</td>`;
        DOM.tableBody.appendChild(avgRow);

        if (state.sortCol) {
            groupedB10.sort((a, b) => {
                let valA, valB;
                if (state.sortCol === 'name') { valA = a.name; valB = b.name; }
                else if (state.sortCol.startsWith('b10_')) { let k = state.sortCol.replace('b10_', ''); valA = a[k]; valB = b[k]; }
                else if (state.sortCol.startsWith('t20_')) { let k = state.sortCol.replace('t20_', ''); valA = t20Map[a.name] ? t20Map[a.name][k] : 0; valB = t20Map[b.name] ? t20Map[b.name][k] : 0; }
                if (valA < valB) return state.sortDesc ? 1 : -1;
                if (valA > valB) return state.sortDesc ? -1 : 1;
                return 0;
            });
        }

        groupedB10.forEach(b10Row => {
            const t20Row = t20Map[b10Row.name] || { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 };
            const tr = document.createElement('tr'); tr.className = level !== 'unit' ? 'clickable-row' : '';
            tr.innerHTML = `<td class="cell-name border-right" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.name}${level !== 'unit' ? ' <i class="fa-solid fa-chevron-right"></i>' : ''}</td><td class="${cellClass(b10Row.colVsCol, avgB10.colVsCol, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.colVsCol.toFixed(2)}%</td><td class="${cellClass(b10Row.emiVsCol, avgB10.emiVsCol, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.emiVsCol.toFixed(2)}%</td><td class="${cellClass(b10Row.collectionPct, avgB10.collectionPct, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.collectionPct.toFixed(2)}%</td><td class="${cellClass(b10Row.nplPct, avgB10.nplPct, false)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.nplPct.toFixed(2)}%</td><td class="${cellClass(b10Row.parPct, avgB10.parPct, false)} border-right" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.parPct.toFixed(2)}%</td><td class="${cellClass(t20Row.colVsCol, avgT20.colVsCol, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${t20Row.colVsCol.toFixed(2)}%</td><td class="${cellClass(t20Row.emiVsCol, avgT20.emiVsCol, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${t20Row.emiVsCol.toFixed(2)}%</td><td class="${cellClass(t20Row.collectionPct, avgT20.collectionPct, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${t20Row.collectionPct.toFixed(2)}%</td><td class="${cellClass(t20Row.nplPct, avgT20.nplPct, false)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${t20Row.nplPct.toFixed(2)}%</td><td class="${cellClass(t20Row.parPct, avgT20.parPct, false)} border-right" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${t20Row.parPct.toFixed(2)}%</td><td class="action-cell"><button class="btn-insight" onclick="event.stopPropagation(); openInsightModal('${b10Row.name}', '${level}')"><i class="fa-solid fa-eye"></i> View</button></td>`;
            DOM.tableBody.appendChild(tr);
        });
    } else {
        let grouped = getGroupedData(filteredUnits, level, metricKey); 
        const defaultAvg = { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 };
        const avg = Object.assign({}, defaultAvg, countryAvg[metricKey] || {});
        const subRow = DOM.tableHeader.parentElement.querySelector('.sub-header-row'); if (subRow) subRow.remove();
                let headersHTML = `<th class="border-right sortable" onclick="sortTable('name')">${levelLabels[level]} ${sortIcon('name')}</th>`;
        METRICS_CONFIG.forEach(m => {
            if (state.visibleMetrics[m.id]) {
                headersHTML += `<th class="sortable" onclick="sortTable('${m.id}')">${m.label} ${sortIcon(m.id)}</th>`;
            }
        });
        headersHTML += `<th>Action</th>`;
        DOM.tableHeader.innerHTML = headersHTML; DOM.tableBody.innerHTML = '';
        const avgRow = document.createElement('tr'); avgRow.className = 'row-avg';
                let avgCellsHTML = `<td class="border-right">Total Small Business</td>`;
        METRICS_CONFIG.forEach(m => {
            if (state.visibleMetrics[m.id]) {
                avgCellsHTML += `<td>${(avg[m.id]||0).toFixed(2)}%</td>`;
            }
        });
        avgCellsHTML += `<td class="action-cell">-</td>`;
        avgRow.innerHTML = avgCellsHTML; DOM.tableBody.appendChild(avgRow);

        if (state.sortCol) {
            grouped.sort((a, b) => {
                let valA = a[state.sortCol]; let valB = b[state.sortCol];
                if (valA < valB) return state.sortDesc ? 1 : -1;
                if (valA > valB) return state.sortDesc ? -1 : 1;
                return 0;
            });
        }

        grouped.forEach(row => {
            const tr = document.createElement('tr'); tr.className = level !== 'unit' ? 'clickable-row' : '';
            let trCellsHTML = `<td class="cell-name border-right" onclick="if('${level}' !== 'unit') handleTableRowClick('${row.name}')">${row.name}${level !== 'unit' ? ' <i class="fa-solid fa-chevron-right"></i>' : ''}</td>`;
            METRICS_CONFIG.forEach(m => {
                if (state.visibleMetrics[m.id]) {
                    trCellsHTML += `<td class="${cellClass(row[m.id], avg[m.id], m.higherBetter)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${row.name}')">${(row[m.id]||0).toFixed(2)}%</td>`;
                }
            });
            trCellsHTML += `<td class="action-cell"><button class="btn-insight" onclick="event.stopPropagation(); openInsightModal('${row.name}', '${level}')"><i class="fa-solid fa-eye"></i> View</button></td>`;
            tr.innerHTML = trCellsHTML;
            DOM.tableBody.appendChild(tr);
        });
    }
}

function updateBreadcrumb() {
    let parts = [];
    parts.push({ text: 'Country Level', level: 'zone', filters: { zone: 'all', region: 'all', territory: 'all', unit: 'all' } });
    if (state.filters.zone !== 'all') {
        parts.push({ text: state.filters.zone, level: 'region', filters: { zone: state.filters.zone, region: 'all', territory: 'all', unit: 'all' } });
    }
    if (state.filters.region !== 'all') {
        parts.push({ text: state.filters.region, level: 'territory', filters: { zone: state.filters.zone, region: state.filters.region, territory: 'all', unit: 'all' } });
    }
    if (state.filters.territory !== 'all') {
        parts.push({ text: state.filters.territory, level: 'unit', filters: { zone: state.filters.zone, region: state.filters.region, territory: state.filters.territory, unit: 'all' } });
    }
    if (state.filters.unit !== 'all') {
        parts.push({ text: state.filters.unit, level: 'unit', filters: { zone: state.filters.zone, region: state.filters.region, territory: state.filters.territory, unit: state.filters.unit } });
    }

    DOM.breadCrumb.innerHTML = parts.map((p, i) => {
        if (i === parts.length - 1) return `<span class="crumb-current">${p.text}</span>`;
        return `<a href="#" class="crumb-link" data-level="${p.level}" data-zone="${p.filters.zone}" data-region="${p.filters.region}" data-territory="${p.filters.territory}" data-unit="${p.filters.unit}">${p.text}</a>`;
    }).join(' <span class="crumb-separator">></span> ');

    DOM.breadCrumb.querySelectorAll('.crumb-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            state.drillLevel = e.target.dataset.level;
            state.filters.zone = e.target.dataset.zone;
            state.filters.region = e.target.dataset.region;
            state.filters.territory = e.target.dataset.territory;
            state.filters.unit = e.target.dataset.unit;
            DOM.drillLevel.value = state.drillLevel;
            populateDropdowns();
            updateBreadcrumb();
            updateDashboard();
        });
    });
}

DOM.exportCsvBtn.addEventListener('click', () => {
    let csv = []; const rows = document.querySelectorAll('#dataTable tr');
    for (let i = 0; i < rows.length; i++) { let row = [], cols = rows[i].querySelectorAll('td, th'); for (let j = 0; j < cols.length; j++) row.push('"' + cols[j].innerText.replace(/"/g, '""') + '"'); csv.push(row.join(',')); }
    const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' }); const downloadLink = document.createElement('a'); downloadLink.download = 'Portfolio_Export.csv';
    downloadLink.href = window.URL.createObjectURL(csvFile); downloadLink.style.display = 'none'; document.body.appendChild(downloadLink); downloadLink.click();
});


let progressChartInstances = [];
let progressCombinedChartInstances = [];
function updateProgressView() {
    if (!state.availableMonths || !state.availableMonths.length) return;
    const filteredUnits = getFilteredUnits();
    document.body.classList.toggle('trend-active', state.tab === 'trend');
    const months = state.availableMonths.filter(m => m !== 'TOTAL' && m !== 'overall');
    if (!months.length) return;

    const grid = document.getElementById('progressChartsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (progressChartInstances) {
        progressChartInstances.forEach(c => { if(c) c.destroy(); });
    }
    progressChartInstances = [];

    const combinedGrid = document.getElementById('progressCombinedChartsGrid');
    if (combinedGrid) {
        combinedGrid.innerHTML = '';
        if (progressCombinedChartInstances) {
            progressCombinedChartInstances.forEach(c => { if(c) c.destroy(); });
        }
        progressCombinedChartInstances = [];
    }

    const requestedMetrics = ['collectablePct', 'colVsCol', 'colVsOut', 'emiVsCol'];

    METRICS_CONFIG.forEach(m => {
        if (state.visibleMetrics[m.id] && requestedMetrics.includes(m.id)) {
            let seriesData = [];
            const level = state.drillLevel;
            let groups = getUniqueValues(filteredUnits, level);
            
            if (!groups || groups.length === 0 || state.filters.unit !== 'all') {
                let mData = [];
                months.forEach(mo => {
                    let exact = getExactSubtotal(state.filters.unit !== 'all' ? state.filters.unit :
                        (state.filters.territory !== 'all' ? state.filters.territory :
                            (state.filters.region !== 'all' ? state.filters.region : state.filters.zone)), mo);
                    if (exact && exact[m.id] !== undefined) { mData.push(exact[m.id]); }
                    else { mData.push(aggregateMetrics(filteredUnits, mo)[m.id] || 0); }
                });
                seriesData.push({ name: state.filters.unit !== 'all' ? state.filters.unit : 'Current View', data: mData });
            } else {
                groups.forEach(gName => {
                    let mData = [];
                    months.forEach(mo => {
                        let exact = getExactSubtotal(gName, mo);
                        if (exact && exact[m.id] !== undefined) {
                            mData.push(exact[m.id]);
                        } else {
                            let unitsForGroup = filteredUnits.filter(u => u[level] === gName);
                            let agg = aggregateMetrics(unitsForGroup, mo);
                            mData.push(agg[m.id] || 0);
                        }
                    });
                    seriesData.push({ name: gName, data: mData });
                });
            }

            const card = document.createElement('div');
            card.className = 'card chart-card';
            const chartDiv = document.createElement('div');
            chartDiv.id = 'progressChart_' + m.id;
            card.appendChild(chartDiv);
            grid.appendChild(card);

            const options = {
                series: seriesData,
                chart: {
                    type: 'line',
                    height: 350,
                    background: state.theme === 'dark' ? '#1a1f2e' : '#ffffff',
                    toolbar: { show: true }
                },
                title: { text: m.label, align: 'left', style: { color: state.theme === 'dark' ? '#fff' : '#333' } },
                colors: [m.color],
                stroke: { curve: 'smooth', width: 3 },
                markers: { size: 5 },
                xaxis: { categories: months, labels: { style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#334155' } } },
                yaxis: { min: 0, labels: { formatter: val => val.toFixed(1) + "%", style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#334155' } } },
                grid: { borderColor: state.theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0', strokeDashArray: 4 },
                tooltip: { theme: state.theme, y: { formatter: val => val.toFixed(2) + "%" } }
            };

            const chart = new ApexCharts(chartDiv, options);
            chart.render();
            progressChartInstances.push(chart);

            // Combined Bar + Line Chart
            if (combinedGrid) {
                let avgData = [];
                months.forEach(mo => {
                    let exact = getExactSubtotal(state.filters.unit !== 'all' ? state.filters.unit :
                        (state.filters.territory !== 'all' ? state.filters.territory :
                            (state.filters.region !== 'all' ? state.filters.region : state.filters.zone)), mo);
                    if (exact && exact[m.id] !== undefined) { avgData.push(exact[m.id]); }
                    else { avgData.push(aggregateMetrics(filteredUnits, mo)[m.id] || 0); }
                });

                let combinedSeries = seriesData.map(s => ({
                    name: s.name,
                    type: 'column',
                    data: s.data
                }));
                
                if (groups && groups.length > 0 && state.filters.unit === 'all') {
                    combinedSeries.push({
                        name: 'Overall ' + m.label,
                        type: 'line',
                        data: avgData
                    });
                }

                const combinedCard = document.createElement('div');
                combinedCard.className = 'card chart-card';
                const combinedChartDiv = document.createElement('div');
                combinedChartDiv.id = 'progressCombinedChart_' + m.id;
                combinedCard.appendChild(combinedChartDiv);
                combinedGrid.appendChild(combinedCard);

                const combinedOptions = {
                    series: combinedSeries,
                    chart: {
                        height: 350,
                        type: 'line',
                        background: state.theme === 'dark' ? '#1a1f2e' : '#ffffff',
                        toolbar: { show: true }
                    },
                    title: { text: m.label + ' (Combined)', align: 'left', style: { color: state.theme === 'dark' ? '#fff' : '#333' } },
                    stroke: { width: combinedSeries.map(s => s.type === 'line' ? 3 : 0), curve: 'smooth' },
                    plotOptions: { bar: { columnWidth: '50%' } },
                    xaxis: { categories: months, labels: { style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#334155' } } },
                    yaxis: { min: 0, labels: { formatter: val => val.toFixed(1) + "%", style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#334155' } } },
                    grid: { borderColor: state.theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0', strokeDashArray: 4 },
                    tooltip: { theme: state.theme, shared: true, intersect: false, y: { formatter: val => val.toFixed(2) + "%" } }
                };

                const combinedChart = new ApexCharts(combinedChartDiv, combinedOptions);
                combinedChart.render();
                progressCombinedChartInstances.push(combinedChart);
            }
        }
    });
}

function updateDashboard() {
    if (!unitData.length) { DOM.uploadStatus.innerHTML = "<span style='color:var(--accent-red)'>Awaiting Excel Upload...</span>"; return; }
    const filteredUnits = getFilteredUnits();
    document.body.classList.toggle('trend-active', state.tab === 'trend');

    DOM.dashboardView.style.display = 'block';
    DOM.ticketSizeFilterSection.style.display = (state.tab === 'ticket') ? 'block' : 'none';

    DOM.dashboardView.style.display = 'none';
    if (DOM.analysisView) DOM.analysisView.style.display = 'none';
    if (DOM.progressView) DOM.progressView.style.display = 'none';
    if (DOM.trendAnalysisView) DOM.trendAnalysisView.style.display = 'none';

    if (state.tab === 'analysis') {
        DOM.analysisView.style.display = 'block';
        document.getElementById('analysisLevelSelect').value = state.drillLevel;
        updateAnalysisView();
        return;
    } else if (state.tab === 'progress') {
        DOM.progressView.style.display = 'block';
        updateProgressView();
        return;
    } else if (state.tab === 'trend') {
        if (DOM.trendAnalysisView) DOM.trendAnalysisView.style.display = 'block';
        if (typeof buildTrendHierarchy === 'function' && !window.trendHierarchyBuilt) {
            buildTrendHierarchy();
            window.trendHierarchyBuilt = true;
        }
        if (typeof updateTrendDashboard === 'function') updateTrendDashboard();
        return;
    } else {
        DOM.dashboardView.style.display = 'block';
    }

    renderKPIs(filteredUnits);
    updateCharts(filteredUnits);
    updateTable(filteredUnits);
}

function updateAnalysisView() {
    let filteredUnits = getFilteredUnits();
    if (!unitData.length || !countryAvg) return;

    const level = state.drillLevel;
    const metricKey = document.getElementById('analysisMetricSelect').value;
    let baseMetricKey = 'overall';

    let cAvg = Object.assign({ nplPct: 0, parPct: 0, colVsCol: 0, emiVsCol: 0, collectionPct: 0, collectablePct: 0, colVsOut: 0 }, countryAvg[baseMetricKey] || {});
    let avgVal = cAvg[metricKey];

    let grouped = getGroupedData(filteredUnits, level, baseMetricKey);

    const mConfig = {
        collectablePct: { title: 'CLTD %', format: '%', higherBetter: true },
        collectionPct: { title: 'Collection', format: '%', higherBetter: true },
        colVsOut: { title: 'CLTD vs OUT %', format: '%', higherBetter: true },
        colVsCol: { title: 'CLTD vs CLTN %', format: '%', higherBetter: true },
        emiVsCol: { title: 'EMI', format: '%', higherBetter: true },
        nplPct: { title: 'NPL', format: '%', higherBetter: false },
        parPct: { title: 'PAR', format: '%', higherBetter: false }
    };
    let mc = mConfig[metricKey];

    let goodList = [];
    let warnList = [];
    let critList = [];

    grouped.forEach(item => {
        let val = item[metricKey];
        if (mc.higherBetter) {
            if (val >= avgVal) { goodList.push(item); }
            else if (val >= avgVal * 0.85) { warnList.push(item); }
            else { critList.push(item); }
        } else {
            if (val <= avgVal) { goodList.push(item); }
            else if (val <= avgVal * 1.15) { warnList.push(item); }
            else { critList.push(item); }
        }
    });

    if (mc.higherBetter) {
        goodList.sort((a, b) => b[metricKey] - a[metricKey]);
        warnList.sort((a, b) => b[metricKey] - a[metricKey]);
        critList.sort((a, b) => b[metricKey] - a[metricKey]);
    } else {
        goodList.sort((a, b) => a[metricKey] - b[metricKey]);
        warnList.sort((a, b) => a[metricKey] - b[metricKey]);
        critList.sort((a, b) => a[metricKey] - b[metricKey]);
    }

    document.getElementById('analysisKpiRow').innerHTML = `
        <div class="gap-kpi"><div class="gap-kpi-label">Country Average</div><div class="gap-kpi-value" style="color:var(--text-primary)">${(avgVal||0).toFixed(2)}%</div></div>
        <div class="gap-kpi"><div class="gap-kpi-label">Performing Well</div><div class="gap-kpi-value" style="color:var(--accent-green)">${goodList.length}</div></div>
        <div class="gap-kpi"><div class="gap-kpi-label">Below Average</div><div class="gap-kpi-value" style="color:var(--accent-amber)">${warnList.length}</div></div>
        <div class="gap-kpi"><div class="gap-kpi-label">Critical Risk</div><div class="gap-kpi-value" style="color:var(--accent-red)">${critList.length}</div></div>
    `;

    document.getElementById('countGood').textContent = goodList.length;
    document.getElementById('countWarn').textContent = warnList.length;
    document.getElementById('countCritical').textContent = critList.length;

    const renderItems = (arr, colorVar) => {
        if (!arr.length) return `<div style="text-align:center; padding: 20px; color:var(--text-muted); font-size: 0.85rem;"><i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 10px; opacity:0.3; display:block;"></i>No items in this segment</div>`;
        return arr.map(item => `
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 12px 15px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid ${colorVar};">
                <div>
                    <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary); margin-bottom: 4px;">${item.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Count: ${item.unitCount || 1} Units</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 800; font-size: 1.1rem; color: ${colorVar};">${(item[metricKey]||0).toFixed(2)}%</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${(Math.abs((item[metricKey]||0) - (avgVal||0))).toFixed(2)}% Diff</div>
                </div>
            </div>
        `).join('');
    };

    document.getElementById('listGood').innerHTML = renderItems(goodList, 'var(--accent-green)');
    document.getElementById('listWarn').innerHTML = renderItems(warnList, 'var(--accent-amber)');
    document.getElementById('listCritical').innerHTML = renderItems(critList, 'var(--accent-red)');
}

document.getElementById('analysisMetricSelect').addEventListener('change', updateAnalysisView);
document.getElementById('analysisLevelSelect').addEventListener('change', (e) => {
    state.drillLevel = e.target.value;
    DOM.drillLevel.value = state.drillLevel;
    updateDashboard();
});

if (DOM.monthFilter) DOM.monthFilter.addEventListener('change', (e) => { state.month = e.target.value; updateDashboard(); });
DOM.zoneFilter.addEventListener('change', (e) => { state.filters.zone = e.target.value; if (e.target.value === 'all') { state.filters.region = 'all'; state.filters.territory = 'all'; state.filters.unit = 'all'; } populateDropdowns(); updateBreadcrumb(); updateDashboard(); });
DOM.regionFilter.addEventListener('change', (e) => { state.filters.region = e.target.value; if (e.target.value === 'all') { state.filters.territory = 'all'; state.filters.unit = 'all'; } populateDropdowns(); updateBreadcrumb(); updateDashboard(); });
DOM.territoryFilter.addEventListener('change', (e) => { state.filters.territory = e.target.value; if (e.target.value === 'all') { state.filters.unit = 'all'; } populateDropdowns(); updateBreadcrumb(); updateDashboard(); });
DOM.unitFilter.addEventListener('change', (e) => { state.filters.unit = e.target.value; updateBreadcrumb(); updateDashboard(); });
DOM.ticketSizeFilter.addEventListener('change', (e) => { state.ticketSize = e.target.value; updateDashboard(); });
DOM.drillLevel.addEventListener('change', (e) => { state.drillLevel = e.target.value; updateDashboard(); });
DOM.tabs.forEach(tab => { tab.addEventListener('click', (e) => { DOM.tabs.forEach(t => t.classList.remove('active')); e.currentTarget.classList.add('active'); state.tab = e.currentTarget.dataset.tab; updateDashboard(); }); });
DOM.resetBtn.addEventListener('click', () => { state.filters = { zone: 'all', region: 'all', territory: 'all', unit: 'all' }; state.drillLevel = 'zone'; state.ticketSize = 'both'; DOM.drillLevel.value = 'zone'; DOM.ticketSizeFilter.value = 'both'; populateDropdowns(); updateBreadcrumb(); updateDashboard(); });

initCharts();

// Try to load from localStorage first, then fallback to dashboardData
let loadedFromLocal = false;
// Force cache invalidation to prevent stale/corrupt data
const CACHE_VERSION = 'v3';
const currentVersion = localStorage.getItem('portfolioData_version');
if (currentVersion !== CACHE_VERSION) {
    localStorage.removeItem('persistedData');
    localStorage.removeItem('portfolioData_unitData');
    localStorage.removeItem('portfolioData_countryAvg');
    localStorage.removeItem('portfolioData_subtotals');
    localStorage.removeItem('portfolioData_availableMonths');
    localStorage.setItem('portfolioData_version', CACHE_VERSION);
} else {
    try {
        const storedUnitData = localStorage.getItem('portfolioData_unitData');
        if (storedUnitData) {
            let parsedData = JSON.parse(storedUnitData);
            if (parsedData && parsedData.length > 0) {
                unitData = parsedData;
                countryAvg = JSON.parse(localStorage.getItem('portfolioData_countryAvg') || '{}');
                subtotals = JSON.parse(localStorage.getItem('portfolioData_subtotals') || '{}');
                state.availableMonths = JSON.parse(localStorage.getItem('portfolioData_availableMonths') || '[]');
                loadedFromLocal = true;
            }
        }
    } catch (e) {
        console.error("Error loading from localStorage", e);
    }
}

if (!loadedFromLocal && typeof dashboardData !== 'undefined' && dashboardData && dashboardData.unitData && dashboardData.unitData.length) {
    unitData = dashboardData.unitData;
    countryAvg = dashboardData.countryAvg || {};
    subtotals = dashboardData.subtotals || {};
    if (dashboardData.availableMonths) state.availableMonths = dashboardData.availableMonths;
}

if (unitData.length) {
    populateDropdowns(); updateBreadcrumb(); updateDashboard();
    DOM.uploadStatus.innerHTML = `<i class="fa-solid fa-check" style="color:var(--accent-green)"></i> Loaded From Cache!`;
    DOM.downloadJsonBtn.style.display = 'block';
} else {
    // Auto load Excel file with cache buster
    fetch('Monitoring Dashboard.xlsx?v=' + new Date().getTime())
        .then(response => {
            if (!response.ok) throw new Error('File not found');
            return response.arrayBuffer();
        })
        .then(buffer => {
            parseExcelData(buffer);
        })
        .catch(err => {
            console.error('Fetch error:', err);
            updateDashboard();
        });
}

// ============================================
//  THEME TOGGLE LOGIC
// ============================================
function applyTheme(theme) {
    const isDark = (theme === 'dark');
    document.body.classList.toggle('light-mode', !isDark);

    // Update Toggle Icon
    const themeIcon = DOM.themeToggle ? DOM.themeToggle.querySelector('i') : null;
    if (themeIcon) {
        themeIcon.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    // Refresh charts config for new theme
    const chartOptions = {
        theme: { mode: isDark ? 'dark' : 'light' },
        chart: { background: isDark ? '#1a1f2e' : '#ffffff' },
        dataLabels: { style: { colors: [isDark ? '#fff' : '#1e293b'] } },
        xaxis: { labels: { style: { colors: isDark ? 'rgba(255,255,255,0.7)' : '#334155' } } },
        yaxis: { labels: { style: { colors: isDark ? 'rgba(255,255,255,0.7)' : '#334155' } } },
        grid: { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' },
        tooltip: { theme: isDark ? 'dark' : 'light' }
    };

    for (const key in charts) {
        if (charts[key] && typeof charts[key].updateOptions === 'function') {
            charts[key].updateOptions(chartOptions);
        }
    }

    // Force re-render of analysis if tab active
    if (state.tab === 'analysis' && typeof renderAnalysis === 'function') {
        renderAnalysis(getFilteredUnits());
    }
}

function toggleTheme() {
    state.theme = (state.theme === 'dark' ? 'light' : 'dark');
    localStorage.setItem('portfolioTheme', state.theme);
    applyTheme(state.theme);
}

if (DOM.themeToggle) {
    DOM.themeToggle.addEventListener('click', toggleTheme);
}
window.addEventListener('DOMContentLoaded', () => applyTheme(state.theme));

/* ============================================
   TREND ANALYSIS LOGIC
   ============================================ */
let trendMonths = [];
let trendHierarchyTree = [];
let trendChartInstance = null;
const trendStandardColors = [
    '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#ea580c', '#4f46e5', '#16a34a', '#dc2626',
    '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#84cc16', '#06b6d4', '#ec4899', '#f97316'
];

function buildTrendHierarchy() {
    trendMonths = state.availableMonths.filter(m => m !== 'TOTAL');
    trendHierarchyTree = [];

    let treeMap = {};
    unitData.forEach(u => {
        if(!treeMap[u.zone]) treeMap[u.zone] = {};
        if(!treeMap[u.zone][u.region]) treeMap[u.zone][u.region] = {};
        if(!treeMap[u.zone][u.region][u.territory]) treeMap[u.zone][u.region][u.territory] = [];
        if(!treeMap[u.zone][u.region][u.territory].includes(u.unit)) {
            treeMap[u.zone][u.region][u.territory].push(u.unit);
        }
    });

    Object.keys(treeMap).forEach(zName => {
        let zoneNode = { name: zName, type: 'zone', children: [] };
        Object.keys(treeMap[zName]).forEach(rName => {
            let regionNode = { name: rName, type: 'region', children: [] };
            Object.keys(treeMap[zName][rName]).forEach(tName => {
                let terrNode = { name: tName, type: 'territory', children: [] };
                treeMap[zName][rName][tName].forEach(uName => {
                    terrNode.children.push({ name: uName, type: 'unit', children: [] });
                });
                regionNode.children.push(terrNode);
            });
            zoneNode.children.push(regionNode);
        });
        trendHierarchyTree.push(zoneNode);
    });

    const container = document.getElementById('trendTreeContainer');
    if (container) {
        container.innerHTML = renderTrendTreeHTML(trendHierarchyTree);
        
        // Initial setup for Tree - check first Zone and cascade down
        const initialCheck = document.querySelector('.entity-checkbox[data-level="zone"]');
        if(initialCheck) {
            initialCheck.checked = true;
            const li = initialCheck.closest('li');
            if (li) {
                li.querySelectorAll('.tree-children .entity-checkbox').forEach(cb => { cb.checked = true; cb.indeterminate = false; });
            }
        }
    }
}

function renderTrendTreeHTML(nodes, isRoot = true) {
    let html = `<ul class="${isRoot ? '' : 'pl-5 border-l trend-border ml-2 mt-1 space-y-1'}">`;
    nodes.forEach(node => {
        const hasChildren = node.children && node.children.length > 0;
        const targetId = 'trend-' + node.name.replace(/[^a-zA-Z0-9]/g, '-');
        html += `
            <li class="relative mt-1">
                <div class="flex items-center gap-2 py-1 px-1 rounded hover-trend transition-colors group">
                    ${hasChildren ? `
                        <button type="button" class="tree-toggle flex-shrink-0 w-5 h-5 flex items-center justify-center trend-text-muted hover:text-blue-600 transition-colors" data-target="${targetId}">
                            <svg class="chevron w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                    ` : `<div class="w-5 h-5 flex-shrink-0"></div>`}
                    <input type="checkbox" data-level="${node.type}" class="entity-checkbox w-4 h-4 text-blue-600 trend-secondary border trend-border rounded focus:ring-blue-500 cursor-pointer" value="${node.name}">
                    <span class="text-sm font-medium trend-text cursor-pointer select-none hover:text-blue-500" onclick="this.previousElementSibling.click()">${node.name}</span>
                </div>
                ${hasChildren ? `<div id="${targetId}" class="tree-children">${renderTrendTreeHTML(node.children, false)}</div>` : ''}
            </li>
        `;
    });
    html += '</ul>';
    return html;
}

// Bind Tree Events once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const treeContainer = document.getElementById('trendTreeContainer');
    if (treeContainer) {
        treeContainer.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('.tree-toggle');
            if (toggleBtn) {
                const targetId = toggleBtn.getAttribute('data-target');
                const targetEl = document.getElementById(targetId);
                const chevron = toggleBtn.querySelector('.chevron');
                if(targetEl) {
                    targetEl.classList.toggle('open');
                    chevron.classList.toggle('open');
                }
            }
        });

        treeContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('entity-checkbox')) {
                const cb = e.target;
                const li = cb.closest('li');
                
                const childCbs = li.querySelectorAll('.tree-children .entity-checkbox');
                childCbs.forEach(childCb => {
                    childCb.checked = cb.checked;
                    childCb.indeterminate = false;
                });
                
                let currentLi = li.parentElement.closest('li');
                while (currentLi) {
                    const parentCb = currentLi.querySelector('.entity-checkbox');
                    const treeChildren = currentLi.querySelector('.tree-children');
                    if (treeChildren) {
                        const childLis = treeChildren.querySelector('ul').children;
                        const siblingCbs = Array.from(childLis).map(child => child.querySelector('.entity-checkbox'));
                        
                        const allChecked = siblingCbs.length > 0 && siblingCbs.every(c => c.checked);
                        const someChecked = siblingCbs.some(c => c.checked || c.indeterminate);
                        
                        if (allChecked) {
                            parentCb.checked = true;
                            parentCb.indeterminate = false;
                        } else if (someChecked) {
                            parentCb.checked = false;
                            parentCb.indeterminate = true;
                        } else {
                            parentCb.checked = false;
                            parentCb.indeterminate = false;
                        }
                    }
                    currentLi = currentLi.parentElement.closest('li');
                }
                if (typeof updateTrendDashboard === 'function') updateTrendDashboard();
            }
        });
    }

    const clearBtn = document.getElementById('trendClearTreeBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.querySelectorAll('#trendTreeContainer .entity-checkbox').forEach(cb => {
                cb.checked = false;
                cb.indeterminate = false;
            });
            if (typeof updateTrendDashboard === 'function') updateTrendDashboard();
        });
    }

    const metricSel = document.getElementById('trendMetricSelect');
    const dispSel = document.getElementById('trendDisplayLevelSelect');
    const perfSel = document.getElementById('trendPerformanceSelect');
    const tableToggle = document.getElementById('trendTableToggle');

    if(metricSel) metricSel.addEventListener('change', updateTrendDashboard);
    if(dispSel) dispSel.addEventListener('change', updateTrendDashboard);
    if(perfSel) perfSel.addEventListener('change', updateTrendDashboard);
    
    if(tableToggle) {
        tableToggle.addEventListener('change', () => {
            const tblContainer = document.getElementById('trendDataTableContainer');
            const chrtContainer = document.getElementById('trendChartContainer');
            if (tblContainer) tblContainer.classList.toggle('hidden', !tableToggle.checked);
            if (chrtContainer) chrtContainer.classList.toggle('hidden', tableToggle.checked);
        });
    }

    const expCsv = document.getElementById('trendExportCSVBtn');
    const expImg = document.getElementById('trendExportImageBtn');
    const expPdf = document.getElementById('trendExportPDFBtn');
    if(expCsv) expCsv.addEventListener('click', exportTrendCSV);
    if(expImg) expImg.addEventListener('click', exportTrendImage);
    if(expPdf) expPdf.addEventListener('click', exportTrendPDF);
});

function getTrendActiveEntities() {
    const metric = document.getElementById('trendMetricSelect').value;
    const perfFilter = document.getElementById('trendPerformanceSelect').value;
    const displayLevel = document.getElementById('trendDisplayLevelSelect').value;
    
    const currentMonth = trendMonths[trendMonths.length - 1];
    const currentAvg = getTrendMetricValue(countryAvg[currentMonth], metric) || 0;

    const checkedBoxes = Array.from(document.querySelectorAll(`#trendTreeContainer .entity-checkbox[data-level="${displayLevel}"]:checked`)).map(cb => cb.value);
    let filteredEntities = {};

    checkedBoxes.forEach(name => {
        let dataArray = trendMonths.map(m => {
            let exact = getExactSubtotal(name, m);
            if (exact) {
                let v = getTrendMetricValue(exact, metric);
                if (v !== undefined) return v;
            }
            
            // fallback if exact not found
            let entityUnits = [];
            if (displayLevel === 'zone') entityUnits = unitData.filter(u => u.zone === name);
            else if (displayLevel === 'region') entityUnits = unitData.filter(u => u.region === name);
            else if (displayLevel === 'territory') entityUnits = unitData.filter(u => u.territory === name);
            else if (displayLevel === 'unit') entityUnits = unitData.filter(u => u.unit === name);
            
            let aggr = aggregateMetrics(entityUnits, m);
            return aggr[metric] || 0;
        });

        const val = dataArray[dataArray.length - 1]; // current month
        let keep = false;
        if (perfFilter === 'all') keep = true;
        else if (perfFilter === 'above' && val >= currentAvg) keep = true;
        else if (perfFilter === 'below' && val < currentAvg) keep = true;
        else if (perfFilter === 'critical' && val <= currentAvg - 5) keep = true;

        if (keep) {
            filteredEntities[name] = dataArray;
        }
    });

    return filteredEntities;
}

function getTrendMetricValue(obj, metric) {
    if (!obj) return undefined;
    if (metric === 'colVsCol') {
        if (obj[metric]) return obj[metric];
        if (obj.collectable) return +(obj.collection / obj.collectable * 100).toFixed(2);
    }
    return obj[metric];
}

function updateTrendDashboard() {
    if (!trendMonths || trendMonths.length === 0) return;
    const metric = document.getElementById('trendMetricSelect').value;
    const activeEntities = getTrendActiveEntities();
    const displayLevel = document.getElementById('trendDisplayLevelSelect').value;
    
    const count = Object.keys(activeEntities).length;
    const checkedCount = document.querySelectorAll(`#trendTreeContainer .entity-checkbox[data-level="${displayLevel}"]:checked`).length;
    let subText = `Displaying ${count} Entit${count === 1 ? 'y' : 'ies'}`;
    if(checkedCount > count) subText += ` (Filtered from ${checkedCount})`;
    
    const subTextEl = document.getElementById('trendChartSubtext');
    if (subTextEl) subTextEl.innerText = subText;

    renderTrendKPIs(metric, activeEntities);
    renderTrendChart(metric, activeEntities);
    renderTrendTable(metric, activeEntities);
}

function renderTrendKPIs(metric, activeEntities) {
    const currentMonthIdx = trendMonths.length - 1; 
    const currentMonth = trendMonths[currentMonthIdx];
    const currentAvg = getTrendMetricValue(countryAvg[currentMonth], metric) || 0;
    const kpiContainer = document.getElementById('trendKpiContainer');
    if (!kpiContainer) return;
    
    let html = '';
    const iconWrap = (color, svg) => `<div class="p-3 trend-icon-bg rounded-xl"><svg class="w-6 h-6 text-${color}-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">${svg}</svg></div>`;
    
    html += `
        <div class="trend-card p-5 rounded-2xl shadow-sm border trend-border flex flex-col justify-between hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xs font-bold trend-text-muted uppercase tracking-wider mb-1">Country Average</h3>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold trend-secondary trend-text-muted">${currentMonth}</span>
                </div>
                ${iconWrap('indigo', '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>')}
            </div>
            <div class="mt-4 flex items-baseline text-3xl font-extrabold trend-text">${currentAvg ? currentAvg.toFixed(1) : 0}%</div>
        </div>
    `;

    let count = Object.keys(activeEntities).length;
    if (count === 0) {
        html += `<div class="col-span-3 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-500 font-medium text-sm">Please select entities from the tree to view KPIs.</div>`;
    } else if (count === 1) {
        const name = Object.keys(activeEntities)[0];
        const val = activeEntities[name][currentMonthIdx];
        const variance = val - currentAvg;
        const isPos = variance >= 0;
        html += `
            <div class="trend-card p-5 rounded-2xl shadow-sm border trend-border flex flex-col justify-between hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div><h3 class="text-xs font-bold trend-text-muted uppercase tracking-wider mb-1 truncate" title="${name}">${name}</h3>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold trend-secondary trend-text-muted">Current</span></div>
                    ${iconWrap('blue', '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>')}
                </div>
                <div class="mt-4 flex items-baseline text-3xl font-extrabold trend-text">${val.toFixed(1)}%</div>
            </div>
            <div class="trend-card p-5 rounded-2xl shadow-sm border trend-border flex flex-col justify-between hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div><h3 class="text-xs font-bold trend-text-muted uppercase tracking-wider mb-1">Gap vs Average</h3>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold trend-secondary trend-text-muted">Variance</span></div>
                    ${iconWrap(isPos ? 'emerald' : 'rose', isPos ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>' : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>')}
                </div>
                <div class="mt-4 flex items-baseline text-3xl font-extrabold ${isPos ? 'text-emerald-600' : 'text-rose-600'}">${isPos ? '+' : ''}${variance.toFixed(1)}%</div>
            </div>
            <div class="trend-secondary rounded-2xl border trend-border"></div>
        `;
    } else {
        let bestNames = [], bestVal = -Infinity;
        let worstNames = [], worstVal = Infinity;
        let criticalCount = 0;
        
        for (const [name, data] of Object.entries(activeEntities)) {
            const val = data[currentMonthIdx];
            if (val > bestVal) { bestVal = val; bestNames = [name]; } else if (val === bestVal) { bestNames.push(name); }
            if (val < worstVal) { worstVal = val; worstNames = [name]; } else if (val === worstVal) { worstNames.push(name); }
            if (val <= currentAvg - 5) criticalCount++;
        }

        html += `
            <div class="trend-card p-5 rounded-2xl shadow-sm border trend-border flex flex-col justify-between hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="pr-2"><h3 class="text-xs font-bold trend-text-muted uppercase tracking-wider mb-1">Top Performer(s)</h3>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold trend-secondary trend-text-muted truncate max-w-[100px]" title="${bestNames.join(', ')}">${bestNames.join(', ')}</span></div>
                    ${iconWrap('emerald', '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>')}
                </div>
                <div class="mt-4 flex items-baseline text-3xl font-extrabold trend-text">${bestVal.toFixed(1)}%</div>
            </div>
            ${worstVal >= currentAvg ? `
            <div class="trend-card p-5 rounded-2xl shadow-sm border trend-border flex flex-col justify-between hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="pr-2"><h3 class="text-xs font-bold trend-text-muted uppercase tracking-wider mb-1">Action Required</h3>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold trend-secondary trend-text-muted">None</span></div>
                    ${iconWrap('slate', '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>')}
                </div>
                <div class="mt-4 flex items-baseline text-3xl font-extrabold text-slate-400">N/A</div>
            </div>` : `
            <div class="trend-card p-5 rounded-2xl shadow-sm border trend-border flex flex-col justify-between hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="pr-2"><h3 class="text-xs font-bold trend-text-muted uppercase tracking-wider mb-1">Action Required</h3>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold trend-secondary trend-text-muted truncate max-w-[100px]" title="${worstNames.join(', ')}">${worstNames.join(', ')}</span></div>
                    ${iconWrap('rose', '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>')}
                </div>
                <div class="mt-4 flex items-baseline text-3xl font-extrabold trend-text">${worstVal.toFixed(1)}%</div>
            </div>`}
            <div class="trend-card p-5 rounded-2xl shadow-sm border trend-border flex flex-col justify-between hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div><h3 class="text-xs font-bold trend-text-muted uppercase tracking-wider mb-1">Critical Entities</h3>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold trend-secondary trend-text-muted">> 5% Below Avg</span></div>
                    ${iconWrap('amber', '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>')}
                </div>
                <div class="mt-4 flex items-baseline text-3xl font-extrabold ${criticalCount > 0 ? 'text-amber-600' : 'text-emerald-600'}">${criticalCount} <span class="text-sm font-bold trend-text-muted ml-1">/ ${count}</span></div>
            </div>
        `;
    }
    kpiContainer.innerHTML = html;
}

if (window.Chart) {
    Chart.register({
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, args, options) => {
            const {ctx} = chart; ctx.save(); ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = options.color || '#ffffff'; ctx.fillRect(0, 0, chart.width, chart.height); ctx.restore();
        }
    });
}

function renderTrendChart(metric, activeEntities) {
    const canvas = document.getElementById('trendPerformanceChart');
    if (!canvas || !window.Chart) return;
    const ctx = canvas.getContext('2d');
    if (trendChartInstance) trendChartInstance.destroy();
    
    const entityCount = Object.keys(activeEntities).length;
    if(entityCount === 0) return;

    const datasets = [];
    const avgData = trendMonths.map(m => getTrendMetricValue(countryAvg[m], metric) || 0);
    let globalMin = Math.min(...avgData);
    
    const isHighDensity = entityCount > 10;

    datasets.push({
        label: 'Country Average', data: avgData,
        borderColor: '#dc2626', backgroundColor: 'transparent',
        borderWidth: isHighDensity ? 4 : 3, borderDash: [8, 6], 
        pointRadius: isHighDensity ? 0 : 4, pointHoverRadius: 8, pointBackgroundColor: '#dc2626',
        tension: 0.4, order: 1, fill: true, backgroundColor: !document.body.classList.contains('light-mode') ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)'
    });

    let colorIndex = 0;
    for (const [name, data] of Object.entries(activeEntities)) {
        globalMin = Math.min(globalMin, ...data);
        const baseColor = trendStandardColors[colorIndex % trendStandardColors.length];
        const lineColor = isHighDensity ? baseColor + '99' : baseColor;
        
        datasets.push({
            label: name, data: data,
            borderColor: lineColor, backgroundColor: 'transparent',
            borderWidth: isHighDensity ? 1.5 : 2.5, pointRadius: isHighDensity ? 0 : 3, 
            hoverBorderWidth: 4, hoverBorderColor: baseColor, pointHoverRadius: 6,
            tension: 0.4, order: 2
        });
        colorIndex++;
    }

    const calculatedMin = Math.max(0, Math.floor(globalMin / 10) * 10 - 5);
    const isDark = !document.body.classList.contains('light-mode');
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b';

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: trendMonths, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: isHighDensity ? 'nearest' : 'index', intersect: isHighDensity ? true : false, axis: 'xy' },
            plugins: {
                legend: { display: !isHighDensity, position: 'top', align: 'end', labels: { padding: 20, font: { size: 12, weight: '600' }, usePointStyle: true, boxWidth: 8 } },
                tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#fff', bodyColor: '#fff', padding: 12, cornerRadius: 8, callbacks: { label: (c) => ` ${c.dataset.label}: ${c.parsed.y.toFixed(1)}%` } },
                customCanvasBackgroundColor: { color: isDark ? 'transparent' : 'white' }
            },
            scales: {
                y: { min: calculatedMin, suggestedMax: 100, grid: { color: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', drawBorder: false }, ticks: { callback: (val) => val + '%', font: { size: 11, weight: '500' } } },
                x: { grid: { display: false }, ticks: { font: { size: 11, weight: '500' } } }
            }
        }
    });
}

window.currentTrendSort = window.currentTrendSort || { key: 'Entity Name', dir: 'asc' };

window.sortTrendTable = function(key) {
    if (window.currentTrendSort && window.currentTrendSort.key === key) {
        window.currentTrendSort.dir = window.currentTrendSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        window.currentTrendSort = { key: key, dir: 'asc' };
    }
    updateTrendDashboard();
}

function renderTrendTable(metric, activeEntities) {
    const tHead = document.getElementById('trendTableHead');
    const tBody = document.getElementById('trendTableBody');
    if (!tHead || !tBody) return;
    
    if(Object.keys(activeEntities).length === 0) { tHead.innerHTML=''; tBody.innerHTML=''; return; }

    const sortIcon = (key) => window.currentTrendSort.key === key ? (window.currentTrendSort.dir === 'asc' ? ' ↑' : ' ↓') : '';

    let headHTML = `<tr><th class="px-6 py-4 font-bold trend-text trend-secondary border-b trend-border cursor-pointer hover:text-blue-500 transition-colors select-none" onclick="sortTrendTable('Entity Name')">Entity Name${sortIcon('Entity Name')}</th>`;
    trendMonths.forEach((m, idx) => headHTML += `<th class="px-6 py-4 font-bold trend-text trend-secondary border-b trend-border cursor-pointer hover:text-blue-500 transition-colors select-none" onclick="sortTrendTable(${idx})">${m}${sortIcon(idx)}</th>`);
    headHTML += `</tr>`;
    tHead.innerHTML = headHTML;
    
    let entries = Object.entries(activeEntities);
    if (window.currentTrendSort.key === 'Entity Name') {
        entries.sort((a,b) => window.currentTrendSort.dir === 'asc' ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]));
    } else {
        const mIdx = window.currentTrendSort.key;
        entries.sort((a,b) => window.currentTrendSort.dir === 'asc' ? a[1][mIdx] - b[1][mIdx] : b[1][mIdx] - a[1][mIdx]);
    }
    
    const avgData = trendMonths.map(m => getTrendMetricValue(countryAvg[m], metric) || 0);
    let bodyHTML = `<tr class="trend-icon-bg"><td class="px-6 py-3 font-bold trend-text border-b trend-border">Country Average</td>`;
    avgData.forEach(val => bodyHTML += `<td class="px-6 py-3 font-bold text-blue-500 border-b trend-border">${val ? val.toFixed(1) : 0}%</td>`);
    bodyHTML += `</tr>`;
    
    for (const [name, data] of entries) {
        bodyHTML += `<tr class="hover:trend-icon-bg transition-colors"><td class="px-6 py-3 font-semibold trend-text border-b trend-border">${name}</td>`;
        data.forEach((val, idx) => {
            const avgVal = avgData[idx] || 0;
            let colorClass = 'trend-text';
            if (val <= avgVal - 5) {
                colorClass = 'text-red-500 font-bold';
            } else if (val < avgVal) {
                colorClass = 'text-yellow-500 font-bold';
            }
            bodyHTML += `<td class="px-6 py-3 ${colorClass} border-b trend-border">${val ? val.toFixed(1) : 0}%</td>`;
        });
        bodyHTML += `</tr>`;
    }
    tBody.innerHTML = bodyHTML;
}

function exportTrendCSV() {
    const metric = document.getElementById('trendMetricSelect').value;
    const activeEntities = getTrendActiveEntities();
    if(Object.keys(activeEntities).length === 0) return alert('No data to export.');
    
    let csv = "Entity," + trendMonths.join(",") + "\n";
    const avgData = trendMonths.map(m => getTrendMetricValue(countryAvg[m], metric) || 0);
    csv += "Country Average," + avgData.map(n => n ? n.toFixed(2) : 0).join(",") + "\n";
    for(const [name, data] of Object.entries(activeEntities)) {
        csv += `"${name}",${data.map(n => n ? n.toFixed(2) : 0).join(",")}\n`;
    }
    
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `Data_Export_${metric}.csv`;
    document.body.appendChild(link);
    link.click(); document.body.removeChild(link);
}

function exportTrendImage() {
    if(!trendChartInstance) return;
    const link = document.createElement('a');
    link.download = 'Chart_Export.png';
    link.href = document.getElementById('trendPerformanceChart').toDataURL('image/png', 1.0); 
    link.click();
}

function exportTrendPDF() {
    if (!window.html2pdf) {
        alert('PDF generator library not loaded yet.');
        return;
    }
    const element = document.getElementById('printable-dashboard');
    const opt = {
        margin:       0.3, filename: 'Dashboard_Report.pdf', image: { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#ffffff'; 
    html2pdf().set(opt).from(element).save().then(() => element.style.backgroundColor = originalBg);
}
