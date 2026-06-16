// ============================================
//  PORTFOLIO BI DASHBOARD - APP.JS
//  Full Interactive Logic with SheetJS Parsing
// ============================================

// Global Data Store
let unitData = [];
let countryAvg = {};
let subtotals = {}; // Store exact pre-calculated rows from Excel

// 1. Initial Load: Always fetch fresh data to avoid stale caches
const state = {
    tab: 'overall',      // 'overall' | 'l12m' | 'ticket'
    ticketSize: 'both',  // 'both' | 'below10' | 'ten20'
    drillLevel: 'zone',  // 'zone' | 'region' | 'territory' | 'unit'
    filters: { zone: 'all', region: 'all', territory: 'all', unit: 'all' },
    theme: localStorage.getItem('portfolioTheme') || 'dark',
    sortCol: '',
    sortDesc: false
};

const DOM = {
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
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    excelUpload: document.getElementById('excelUpload'),
    uploadStatus: document.getElementById('uploadStatus'),
    downloadJsonBtn: document.getElementById('downloadJsonBtn'),
    chartModal: document.getElementById('chartModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalChart: document.getElementById('modalChart'),
    themeToggle: document.getElementById('themeToggle'),
    // Load persisted JSON data if available
    loadJSONBtn: document.getElementById('loadJSONBtn')
};

let charts = {};
const chartConfig = {
    collectionPct: { id: '#chartCollectionPct', title: 'Collection %', color: '#4f46e5' },
    colVsCol: { id: '#chartColVsCol', title: 'Out vs Col', color: '#6366f1' },
    emiVsCol: { id: '#chartEmiVsCol', title: 'EMI %', color: '#06b4d4' },
    npl: { id: '#chartNpl', title: 'NPL %', color: '#ef4444' },
    par: { id: '#chartPar', title: 'PAR %', color: '#f59e0b' }
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
function pct(val) { let v = safeFloat(val); return (v > 0 && v <= 1.0) ? +(v * 100).toFixed(2) : +v.toFixed(2); }
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
            for (let i = 2; i < df3.length; i++) {
                let row = df3[i]; let name = (row[0] || "").toString().trim();
                let m = {
                    portfolio: amt(row[1]),
                    emi: amt(row[2]),
                    collectable: amt(row[3]),
                    collection: amt(row[4]),
                    emiVsCol: pct(row[5]),
                    collectionPct: pct(row[6]),
                    colVsCol: pct(row[7]),
                    par: amt(row[8]),
                    parPct: pct(row[9]),
                    npl: amt(row[10]),
                    nplPct: pct(row[11])
                };
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
                    l12m: matched_l12m || { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0 },
                    overall: matched_overall || { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0 }
                };

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

            unassigned_regions.forEach(r => { r.territories.forEach(t => { t.units.forEach(u => { if (!u.zone) u.zone = "Unassigned"; u.region = r.name; u.territory = t.name; flat_units.push(u); }); }); });
            unassigned_territories.forEach(t => { t.units.forEach(u => { if (!u.zone) u.zone = "Unassigned"; if (!u.region) u.region = "Unassigned"; u.territory = t.name; flat_units.push(u); }); });
            unassigned_units.forEach(u => { if (!u.zone) u.zone = "Unassigned"; if (!u.region) u.region = "Unassigned"; if (!u.territory) u.territory = "Unassigned"; flat_units.push(u); });

            // Apply bulletproof L12M & Overall Country Avg patch
            if (!country_avg) {
                country_avg = {
                    below10: { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0 },
                    ten20: { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0 },
                    l12m: s2_avg || { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0 },
                    overall: s3_avg || { collectable: 0, collection: 0, colVsCol: 0, emi: 0, emiVsCol: 0, portfolio: 0, npl: 0, nplPct: 0, par: 0, parPct: 0, collectionPct: 0 }
                };
            } else {
                if (s2_avg) country_avg.l12m = s2_avg;
                if (s3_avg) country_avg.overall = s3_avg;
            }

            let all_subtotals = {};
            for (let name in s2_lookup) {
                if (!all_subtotals[name]) all_subtotals[name] = {};
                all_subtotals[name].l12m = s2_lookup[name];
            }
            for (let name in s3_lookup) {
                if (!all_subtotals[name]) all_subtotals[name] = {};
                all_subtotals[name].overall = s3_lookup[name];
            }

            unitData = flat_units.map(u => ({ unit: u.name, territory: u.territory, region: u.region, zone: u.zone, metrics: u.metrics }));
            countryAvg = country_avg;
            subtotals = all_subtotals;

            // Save to localStorage so it persists on reload
            try {
                localStorage.setItem('portfolioData_unitData', JSON.stringify(unitData));
                localStorage.setItem('portfolioData_countryAvg', JSON.stringify(countryAvg));
                localStorage.setItem('portfolioData_subtotals', JSON.stringify(subtotals));
                // Store combined data for quick reload
                localStorage.setItem('persistedData', JSON.stringify({ unitData, countryAvg, subtotals }));
            } catch (e) {
                console.warn("Could not save to localStorage (quota exceeded?)", e);
            }

            DOM.uploadStatus.innerHTML = `<i class="fa-solid fa-check" style="color:var(--accent-green)"></i> Loaded ${unitData.length} units!`;
            DOM.downloadJsonBtn.style.display = 'block';

            populateDropdowns(); updateDashboard();
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
                localStorage.setItem('persistedData', JSON.stringify({ unitData, countryAvg, subtotals }));
                localStorage.setItem('portfolioData_unitData', JSON.stringify(unitData));
                localStorage.setItem('portfolioData_countryAvg', JSON.stringify(countryAvg));
                localStorage.setItem('portfolioData_subtotals', JSON.stringify(subtotals));
                DOM.downloadJsonBtn.style.display = 'block';
                populateDropdowns();
                updateDashboard();
            } catch (err) {
                console.error('Failed to load JSON:', err);
                alert('Invalid JSON file. Please select a valid exported JSON.');
            }
        };
        reader.readAsText(e.target.files[0]);
    });
}
// Automatically preload persisted data on page load
const preloadData = () => {
    const saved = localStorage.getItem('persistedData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            unitData = data.unitData || [];
            countryAvg = data.countryAvg || {};
            subtotals = data.subtotals || {};
            DOM.downloadJsonBtn.style.display = 'block';
            populateDropdowns();
            updateDashboard();
        } catch (e) {
            console.warn('Failed to parse persisted data:', e);
        }
    }
};
// Call preload after DOM ready
window.addEventListener('DOMContentLoaded', () => {
    applyTheme(state.theme);
    preloadData();
});
DOM.excelUpload.addEventListener('change', (e) => {
    if (!e.target.files[0]) return; const reader = new FileReader(); reader.onload = (evt) => parseExcelData(evt.target.result); reader.readAsArrayBuffer(e.target.files[0]);
});

DOM.downloadJsonBtn.addEventListener('click', () => {
    const dataStr = "data:text/javascript;charset=utf-8," + encodeURIComponent("const dashboardData = " + JSON.stringify({ unitData, countryAvg, subtotals }, null, 2) + ";");
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
        if (state.filters.zone !== 'all' && item.zone !== state.filters.zone) return false;
        if (state.filters.region !== 'all' && item.region !== state.filters.region) return false;
        if (state.filters.territory !== 'all' && item.territory !== state.filters.territory) return false;
        if (state.filters.unit !== 'all' && item.unit !== state.filters.unit) return false; return true;
    });
}
function getUniqueValues(data, key) { return [...new Set(data.map(item => item[key]))].sort(); }
function getMetricKey() {
    if (state.tab === 'l12m') return 'l12m';
    if (state.tab === 'overall' || state.tab === 'analysis') return 'overall';
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
        collectionPct,
        emiVsCol: (metricKey === 'overall') ? (t.emi > 0 ? +(t.collection / t.emi * 100).toFixed(2) : 0) : (t.collection > 0 ? +(t.emi / t.collection * 100).toFixed(2) : 0),
        nplPct: t.portfolio > 0 ? +(t.npl / t.portfolio * 100).toFixed(2) : 0,
        parPct: t.portfolio > 0 ? +(t.par / t.portfolio * 100).toFixed(2) : 0
    };
}
function getGroupedData(units, groupKey, metricKey) {
    const groups = {}; units.forEach(u => { const key = u[groupKey]; if (!groups[key]) groups[key] = []; groups[key].push(u); });
    return Object.keys(groups).sort().map(name => {
        let agg = aggregateMetrics(groups[name], metricKey);

        // If the exact pre-calculated row exists in the Excel file, OVERRIDE the aggregated math.
        if (subtotals[name] && subtotals[name][metricKey]) {
            let exact = subtotals[name][metricKey];
            if (exact.colVsCol > 0 || exact.nplPct > 0 || exact.parPct > 0 || exact.collectionPct > 0) {
                agg.colVsCol = exact.colVsCol;
                agg.emiVsCol = exact.emiVsCol;
                agg.collectionPct = exact.collectionPct;
                agg.nplPct = exact.nplPct;
                agg.parPct = exact.parPct;
            }
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

function populateDropdowns() {
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
    currentInsightMetricType = 'nplPct';
    document.getElementById('insightModal').classList.add('active');
    renderInsightTimeline();
}

window.renderInsightTimeline = function (overrideMetric) {
    if (overrideMetric) currentInsightMetricType = overrideMetric;

    let name = currentInsightTarget;
    let level = currentInsightLevel;
    let baseMetricKey = getMetricKey();
    if (baseMetricKey === 'both') baseMetricKey = 'below10'; // Default to Below 10 Lacs for Modal if 'both' is selected

    let cAvg = Object.assign({ nplPct: 0, parPct: 0, colVsCol: 0, emiVsCol: 0, collectionPct: 0 }, countryAvg[baseMetricKey] || {});

    let targetData = getFilteredUnits().filter(u => u[level] === name);
    let targetAgg = aggregateMetrics(targetData, baseMetricKey);

    if (subtotals[name] && subtotals[name][baseMetricKey]) {
        let exact = subtotals[name][baseMetricKey];
        if (exact.colVsCol > 0 || exact.nplPct > 0 || exact.parPct > 0 || exact.collectionPct > 0) {
            targetAgg.colVsCol = exact.colVsCol || targetAgg.colVsCol;
            targetAgg.emiVsCol = exact.emiVsCol || targetAgg.emiVsCol;
            targetAgg.nplPct = exact.nplPct || targetAgg.nplPct;
            targetAgg.parPct = exact.parPct || targetAgg.parPct;
            targetAgg.collectionPct = exact.collectionPct || targetAgg.collectionPct;
        }
    }

    const levelLabels = { zone: 'Zone', region: 'Region', territory: 'Territory', unit: 'Unit' };

    const mConfig = {
        collectionPct: { title: 'Collection %', color: 'var(--accent-purple)', higherBetter: true },
        colVsCol: { title: 'Out vs Col', color: 'var(--accent-blue)', higherBetter: true },
        emiVsCol: { title: 'EMI', color: 'var(--accent-green)', higherBetter: true },
        nplPct: { title: 'NPL', color: 'var(--accent-red)', higherBetter: false },
        parPct: { title: 'PAR', color: 'var(--accent-amber)', higherBetter: false }
    };
    let mc = mConfig[currentInsightMetricType];

    let tabsHtml = `<div class="insight-tabs">
        ${Object.keys(mConfig).map(k => `<button class="insight-tab ${k === currentInsightMetricType ? 'active' : ''}" onclick="renderInsightTimeline('${k}')">${mConfig[k].title} %</button>`).join('')}
    </div>`;

    let html = tabsHtml + `<div class="timeline-container"><div class="timeline-center-line"></div>`;

    html += `<div class="timeline-node center-node"><div class="node-content">
        <div class="node-title">Country Average</div>
        <div class="node-value" style="color:${mc.color}">${mc.title}: ${cAvg[currentInsightMetricType].toFixed(2)}%</div>
    </div></div>`;

    html += `<div class="timeline-node center-node target-node"><div class="node-content" style="border-color:var(--accent-purple); background:rgba(168, 85, 247, 0.1);">
        <div class="node-title">${name} (${levelLabels[level] || level})</div>
        <div class="node-value" style="color:var(--accent-purple)">${mc.title}: ${targetAgg[currentInsightMetricType].toFixed(2)}%</div>
    </div></div>`;

    const renderNodes = (arr, label) => {
        if (!arr.length) return '';
        let res = `<div class="timeline-label-divider"><span>${label} Breakdown</span></div>`;
        arr.sort((a, b) => b[currentInsightMetricType] - a[currentInsightMetricType]);
        arr.forEach(child => {
            let val = child[currentInsightMetricType];
            let avgVal = cAvg[currentInsightMetricType];
            let isGood = mc.higherBetter ? (val >= avgVal) : (val <= avgVal);
            let isLeft = val < avgVal;

            let sideClass = isLeft ? 'left-node' : 'right-node';
            let qualityClass = isGood ? 'good-node' : 'bad-node';
            let colorClass = isGood ? 'good-val' : 'bad-val';

            res += `<div class="timeline-node ${sideClass} ${qualityClass}">
                <div class="node-content">
                    <div class="node-title">${child.name}</div>
                    <div class="node-value ${colorClass}">${mc.title}: ${val.toFixed(2)}%</div>
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
        const defaultAvg = { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0 };
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
            agg.colVsCol = avg.colVsCol;
            agg.emiVsCol = avg.emiVsCol;
            agg.collectionPct = avg.collectionPct;
            agg.nplPct = avg.nplPct;
            agg.parPct = avg.parPct;
        } else {
            // Try to lookup exact filter match
            let currentFilterName = state.filters.unit !== 'all' ? state.filters.unit :
                (state.filters.territory !== 'all' ? state.filters.territory :
                    (state.filters.region !== 'all' ? state.filters.region : state.filters.zone));
            if (subtotals[currentFilterName] && subtotals[currentFilterName][metricKey]) {
                let exact = subtotals[currentFilterName][metricKey];
                agg.colVsCol = exact.colVsCol || agg.colVsCol;
                agg.emiVsCol = exact.emiVsCol || agg.emiVsCol;
                agg.nplPct = exact.nplPct || agg.nplPct;
                agg.parPct = exact.parPct || agg.parPct;
                agg.collectionPct = exact.collectionPct || agg.collectionPct;
            }
        }

        const kpis = [
            { label: 'Collection %', value: agg.collectionPct || 0, avg: avg.collectionPct || 0, higherBetter: true, icon: 'fa-percentage', gradient: 'var(--gradient-purple)' },
            { label: 'Out vs Col %', value: agg.colVsCol || 0, avg: avg.colVsCol || 0, higherBetter: true, icon: 'fa-chart-pie', gradient: 'var(--gradient-blue)' },
            { label: 'EMI %', value: agg.emiVsCol || 0, avg: avg.emiVsCol || 0, higherBetter: true, icon: 'fa-money-bill-trend-up', gradient: 'var(--gradient-green)' },
            { label: 'NPL %', value: agg.nplPct || 0, avg: avg.nplPct || 0, higherBetter: false, icon: 'fa-triangle-exclamation', gradient: 'var(--gradient-red)' },
            { label: 'PAR %', value: agg.parPct || 0, avg: avg.parPct || 0, higherBetter: false, icon: 'fa-chart-line', gradient: 'var(--gradient-amber)' }
        ];
        kpis.forEach(k => {
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
        const defaultAvg = { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0 };
        const aB10 = Object.assign({}, defaultAvg, countryAvg.below10 || {}); const aT20 = Object.assign({}, defaultAvg, countryAvg.ten20 || {});

        charts.collectionPct?.updateOptions({ ...getChartOptions(labels, aB10.collectionPct, '#8b5cf6', Math.max(getMax(gB10, aB10, 'collectionPct'), getMax(gT20, aT20, 'collectionPct'))), series: [{ name: 'Below 10 Lacs', data: gB10.map(g => g.collectionPct) }, { name: '10-20 Lacs', data: gT20.map(g => g.collectionPct) }] }, false, true, true);
        charts.colVsCol?.updateOptions({ ...getChartOptions(labels, aB10.colVsCol, '#818cf8', Math.max(getMax(gB10, aB10, 'colVsCol'), getMax(gT20, aT20, 'colVsCol'))), series: [{ name: 'Below 10 Lacs', data: gB10.map(g => g.colVsCol) }, { name: '10-20 Lacs', data: gT20.map(g => g.colVsCol) }] }, false, true, true);
        charts.emiVsCol?.updateOptions({ ...getChartOptions(labels, aB10.emiVsCol, '#22d3ee', Math.max(getMax(gB10, aB10, 'emiVsCol'), getMax(gT20, aT20, 'emiVsCol'))), series: [{ name: 'Below 10 Lacs', data: gB10.map(g => g.emiVsCol) }, { name: '10-20 Lacs', data: gT20.map(g => g.emiVsCol) }] }, false, true, true);
        charts.npl?.updateOptions({ ...getChartOptions(labels, aB10.nplPct, '#f87171', Math.max(getMax(gB10, aB10, 'nplPct'), getMax(gT20, aT20, 'nplPct'))), series: [{ name: 'Below 10 Lacs', data: gB10.map(g => g.nplPct) }, { name: '10-20 Lacs', data: gT20.map(g => g.nplPct) }] }, false, true, true);
        charts.par?.updateOptions({ ...getChartOptions(labels, aB10.parPct, '#fbbf24', Math.max(getMax(gB10, aB10, 'parPct'), getMax(gT20, aT20, 'parPct'))), series: [{ name: 'Below 10 Lacs', data: gB10.map(g => g.parPct) }, { name: '10-20 Lacs', data: gT20.map(g => g.parPct) }] }, false, true, true);
    } else {
        const metricKey = getMetricKey(); const grouped = getGroupedData(filteredUnits, level, metricKey); 
        const defaultAvg = { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0 };
        const avg = Object.assign({}, defaultAvg, countryAvg[metricKey] || {});
        const activeLabels = grouped.map(g => g.name);

        charts.collectionPct?.updateOptions({ ...getChartOptions(activeLabels, avg.collectionPct, '#8b5cf6', getMax(grouped, avg, 'collectionPct')), series: [{ name: 'Collection %', data: grouped.map(g => g.collectionPct) }] }, false, true, true);
        charts.colVsCol?.updateOptions({ ...getChartOptions(activeLabels, avg.colVsCol, '#6366f1', getMax(grouped, avg, 'colVsCol')), series: [{ name: 'Out vs Col %', data: grouped.map(g => g.colVsCol) }] }, false, true, true);
        charts.emiVsCol?.updateOptions({ ...getChartOptions(activeLabels, avg.emiVsCol, '#06b6d4', getMax(grouped, avg, 'emiVsCol')), series: [{ name: 'EMI %', data: grouped.map(g => g.emiVsCol) }] }, false, true, true);
        charts.npl?.updateOptions({ ...getChartOptions(activeLabels, avg.nplPct, '#ef4444', getMax(grouped, avg, 'nplPct')), series: [{ name: 'NPL %', data: grouped.map(g => g.nplPct) }] }, false, true, true);
        charts.par?.updateOptions({ ...getChartOptions(activeLabels, avg.parPct, '#f59e0b', getMax(grouped, avg, 'parPct')), series: [{ name: 'PAR %', data: grouped.map(g => g.parPct) }] }, false, true, true);
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
        const defaultAvg = { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0 };
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
            const t20Row = t20Map[b10Row.name] || { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0 };
            const tr = document.createElement('tr'); tr.className = level !== 'unit' ? 'clickable-row' : '';
            tr.innerHTML = `<td class="cell-name border-right" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.name}${level !== 'unit' ? ' <i class="fa-solid fa-chevron-right"></i>' : ''}</td><td class="${cellClass(b10Row.colVsCol, avgB10.colVsCol, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.colVsCol.toFixed(2)}%</td><td class="${cellClass(b10Row.emiVsCol, avgB10.emiVsCol, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.emiVsCol.toFixed(2)}%</td><td class="${cellClass(b10Row.collectionPct, avgB10.collectionPct, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.collectionPct.toFixed(2)}%</td><td class="${cellClass(b10Row.nplPct, avgB10.nplPct, false)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.nplPct.toFixed(2)}%</td><td class="${cellClass(b10Row.parPct, avgB10.parPct, false)} border-right" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${b10Row.parPct.toFixed(2)}%</td><td class="${cellClass(t20Row.colVsCol, avgT20.colVsCol, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${t20Row.colVsCol.toFixed(2)}%</td><td class="${cellClass(t20Row.emiVsCol, avgT20.emiVsCol, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${t20Row.emiVsCol.toFixed(2)}%</td><td class="${cellClass(t20Row.collectionPct, avgT20.collectionPct, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${t20Row.collectionPct.toFixed(2)}%</td><td class="${cellClass(t20Row.nplPct, avgT20.nplPct, false)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${t20Row.nplPct.toFixed(2)}%</td><td class="${cellClass(t20Row.parPct, avgT20.parPct, false)} border-right" onclick="if('${level}' !== 'unit') handleTableRowClick('${b10Row.name}')">${t20Row.parPct.toFixed(2)}%</td><td class="action-cell"><button class="btn-insight" onclick="event.stopPropagation(); openInsightModal('${b10Row.name}', '${level}')"><i class="fa-solid fa-eye"></i> View</button></td>`;
            DOM.tableBody.appendChild(tr);
        });
    } else {
        let grouped = getGroupedData(filteredUnits, level, metricKey); 
        const defaultAvg = { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectionPct: 0 };
        const avg = Object.assign({}, defaultAvg, countryAvg[metricKey] || {});
        const subRow = DOM.tableHeader.parentElement.querySelector('.sub-header-row'); if (subRow) subRow.remove();
        DOM.tableHeader.innerHTML = ` <th class="border-right sortable" onclick="sortTable('name')">${levelLabels[level]} ${sortIcon('name')}</th> <th class="sortable" onclick="sortTable('colVsCol')">Out vs Col % ${sortIcon('colVsCol')}</th> <th class="sortable" onclick="sortTable('emiVsCol')">EMI % ${sortIcon('emiVsCol')}</th> <th class="sortable" onclick="sortTable('collectionPct')">Collection % ${sortIcon('collectionPct')}</th> <th class="sortable" onclick="sortTable('nplPct')">NPL % ${sortIcon('nplPct')}</th> <th class="border-right sortable" onclick="sortTable('parPct')">PAR % ${sortIcon('parPct')}</th> <th>Action</th> `; DOM.tableBody.innerHTML = '';
        const avgRow = document.createElement('tr'); avgRow.className = 'row-avg';
        avgRow.innerHTML = `<td class="border-right">Total Small Business</td><td>${avg.colVsCol.toFixed(2)}%</td><td>${avg.emiVsCol.toFixed(2)}%</td><td>${avg.collectionPct.toFixed(2)}%</td><td>${avg.nplPct.toFixed(2)}%</td><td class="border-right">${avg.parPct.toFixed(2)}%</td><td class="action-cell">-</td>`; DOM.tableBody.appendChild(avgRow);

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
            tr.innerHTML = `<td class="cell-name border-right" onclick="if('${level}' !== 'unit') handleTableRowClick('${row.name}')">${row.name}${level !== 'unit' ? ' <i class="fa-solid fa-chevron-right"></i>' : ''}</td><td class="${cellClass(row.colVsCol, avg.colVsCol, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${row.name}')">${row.colVsCol.toFixed(2)}%</td><td class="${cellClass(row.emiVsCol, avg.emiVsCol, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${row.name}')">${row.emiVsCol.toFixed(2)}%</td><td class="${cellClass(row.collectionPct, avg.collectionPct, true)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${row.name}')">${row.collectionPct.toFixed(2)}%</td><td class="${cellClass(row.nplPct, avg.nplPct, false)}" onclick="if('${level}' !== 'unit') handleTableRowClick('${row.name}')">${row.nplPct.toFixed(2)}%</td><td class="${cellClass(row.parPct, avg.parPct, false)} border-right" onclick="if('${level}' !== 'unit') handleTableRowClick('${row.name}')">${row.parPct.toFixed(2)}%</td><td class="action-cell"><button class="btn-insight" onclick="event.stopPropagation(); openInsightModal('${row.name}', '${level}')"><i class="fa-solid fa-eye"></i> View</button></td>`;
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

function updateDashboard() {
    if (!unitData.length) { DOM.uploadStatus.innerHTML = "<span style='color:var(--accent-red)'>Awaiting Excel Upload...</span>"; return; }
    const filteredUnits = getFilteredUnits();

    DOM.dashboardView.style.display = 'block';
    DOM.ticketSizeFilterSection.style.display = (state.tab === 'ticket') ? 'block' : 'none';

    if (state.tab === 'analysis') {
        document.getElementById('dashboardView').style.display = 'none';
        document.getElementById('analysisView').style.display = 'block';
        document.getElementById('analysisLevelSelect').value = state.drillLevel;
        updateAnalysisView();
        return;
    } else {
        document.getElementById('dashboardView').style.display = 'block';
        document.getElementById('analysisView').style.display = 'none';
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

    let cAvg = Object.assign({ nplPct: 0, parPct: 0, colVsCol: 0, emiVsCol: 0, collectionPct: 0 }, countryAvg[baseMetricKey] || {});
    let avgVal = cAvg[metricKey];

    let grouped = getGroupedData(filteredUnits, level, baseMetricKey);

    const mConfig = {
        collectionPct: { title: 'Collection', format: '%', higherBetter: true },
        colVsCol: { title: 'Out vs Col', format: '%', higherBetter: true },
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
        <div class="gap-kpi"><div class="gap-kpi-label">Country Average</div><div class="gap-kpi-value" style="color:var(--text-primary)">${avgVal.toFixed(2)}${mc.format}</div></div>
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
                    <div style="font-weight: 800; font-size: 1.1rem; color: ${colorVar};">${item[metricKey].toFixed(2)}${mc.format}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${(Math.abs(item[metricKey] - avgVal)).toFixed(2)}${mc.format} Diff</div>
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
try {
    const storedUnitData = localStorage.getItem('portfolioData_unitData');
    if (storedUnitData) {
        let parsedData = JSON.parse(storedUnitData);
        if (parsedData && parsedData.length > 0) {
            unitData = parsedData;
            countryAvg = JSON.parse(localStorage.getItem('portfolioData_countryAvg') || '{}');
            subtotals = JSON.parse(localStorage.getItem('portfolioData_subtotals') || '{}');
            loadedFromLocal = true;
        }
    }
} catch (e) {
    console.error("Error loading from localStorage", e);
}

if (!loadedFromLocal && typeof dashboardData !== 'undefined' && dashboardData && dashboardData.unitData && dashboardData.unitData.length) {
    unitData = dashboardData.unitData;
    countryAvg = dashboardData.countryAvg || {};
    subtotals = dashboardData.subtotals || {};
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
