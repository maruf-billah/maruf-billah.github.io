// ============================================
//  PORTFOLIO BI DASHBOARD - APP.JS
//  Full Interactive Logic with SheetJS Parsing
// ============================================

// Global Data Store
let unitData = [];
let countryAvg = {};

// 1. Initial Load: Try LocalStorage -> then realData.js -> else empty
const CACHE_VERSION = 'v4_nomap'; // Bump this when data structure changes
const cached = localStorage.getItem('portfolioData');
const cachedVersion = localStorage.getItem('portfolioDataVersion');
if (cached && cachedVersion === CACHE_VERSION) {
    try {
        const pd = JSON.parse(cached);
        unitData = pd.unitData || [];
        countryAvg = pd.countryAvg || {};
    } catch(e) { console.error('Cache load error', e); }
} else {
    // Clear stale cache from previous versions
    localStorage.removeItem('portfolioData');
    if (typeof dashboardData !== 'undefined') {
        unitData = dashboardData.unitData || [];
        countryAvg = dashboardData.countryAvg || {};
    }
}



const state = {
    tab: 'ticket',       // 'ticket' | 'l12m' | 'overall'
    ticketSize: 'both',  // 'both' | 'below10' | 'ten20'
    drillLevel: 'zone',  // 'zone' | 'region' | 'territory' | 'unit'
    filters: { zone: 'all', region: 'all', territory: 'all', unit: 'all' },
    theme: localStorage.getItem('portfolioTheme') || 'dark'
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
    analysisView: document.getElementById('analysisView'),
    themeToggle: document.getElementById('themeToggle')
};

let charts = {};
const chartConfig = {
    colVsCol: { id: '#chartColVsCol', title: 'CLTD vs CLTN %', color: '#6366f1' },
    emiVsCol: { id: '#chartEmiVsCol', title: 'EMI vs CLTN %', color: '#06b6d4' },
    npl: { id: '#chartNpl', title: 'NPL %', color: '#ef4444' },
    par: { id: '#chartPar', title: 'PAR %', color: '#f59e0b' },
    gap: { id: '#gapChart', title: 'Collection Gap Analysis', color: '#ef4444' },
    heatmap: { id: '#heatmapChart', title: 'Geo-Performance Heatmap', color: '#6366f1' }
};

let currentChartLabels = [];
let modalChartInstance = null;

// Function for rendering
function createBarChart(selector, title, color, isModal = false) {
    const options = {
        series: [{ name: title, data: [] }],
        theme: { mode: state.theme },
        chart: {
            type: 'bar', height: isModal ? '100%' : 230,
            background: state.theme === 'dark' ? '#1a1f2e' : '#ffffff',
            toolbar: { show: true, tools: { download: true } },
            zoom: { enabled: false }
        },
        title: { text: null },
        colors: [color],
        plotOptions: { bar: { borderRadius: 4, dataLabels: { position: 'top' } } },
        dataLabels: { enabled: true, formatter: function (val) { return val.toFixed(1) + "%"; }, offsetY: -20, style: { fontSize: '10px', colors: ["#fff"] } },
        xaxis: { categories: [], labels: { style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#334155', fontSize: '10px' }, rotate: -45, trim: false, hideOverlappingLabels: false } },
        yaxis: { labels: { formatter: function (val) { return val.toFixed(1) + "%"; }, style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#334155' } } },
        grid: { borderColor: state.theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0', strokeDashArray: 4 },
        tooltip: { theme: state.theme, y: { formatter: function (val) { return val.toFixed(2) + "%"; } } }
    };
    const chart = new ApexCharts(document.querySelector(selector), options);
    chart.render();
    return chart;
}

function initCharts() { for (const [key, cfg] of Object.entries(chartConfig)) { charts[key] = createBarChart(cfg.id, cfg.title, cfg.color); } }

// ============================================
// MODAL FUNCTIONALITY
// ============================================
window.openChartModal = function(chartKey) {
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
window.closeChartModal = function() { DOM.chartModal.classList.remove('active'); }

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
            const wb = XLSX.read(arrayBuffer, {type: 'array'});
            const df1 = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1, defval: 0});
            const df2 = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[1]], {header: 1, defval: 0});
            const df3 = wb.SheetNames.length > 2 ? XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[2]], {header: 1, defval: 0}) : [];

            let s2_lookup = {}; let s2_avg = null;
            for(let i=2; i<df2.length; i++) {
                let row = df2[i]; let name = (row[0]||"").toString().trim();
                let m = { collectable: amt(row[1]), collection: amt(row[2]), colVsCol: pct(row[3]), emi: amt(row[4]), emiVsCol: pct(row[5]), portfolio: amt(row[6]), npl: amt(row[7]), nplPct: pct(row[8]), par: amt(row[9]), parPct: pct(row[10]) };
                if(!name || name==="nan" || name==="0") continue;
                s2_lookup[name] = m;
                if(i === df2.length - 1 || name.includes("Total") || name.toUpperCase().includes("AVG")) { s2_avg = m; }
            }
            
            let s3_lookup = {}; let s3_avg = null;
            for(let i=2; i<df3.length; i++) {
                let row = df3[i]; let name = (row[0]||"").toString().trim();
                let m = { collectable: amt(row[1]), collection: amt(row[2]), colVsCol: pct(row[3]), emi: amt(row[4]), emiVsCol: pct(row[5]), portfolio: amt(row[6]), npl: amt(row[7]), nplPct: pct(row[8]), par: amt(row[9]), parPct: pct(row[10]) };
                if(!name || name==="nan" || name==="0") continue;
                s3_lookup[name] = m;
                if(i === df3.length - 1 || name.includes("Total") || name.toUpperCase().includes("AVG")) { s3_avg = m; }
            }

            let flat_units = []; let unassigned_regions = []; let unassigned_territories = []; let unassigned_units = []; let country_avg = null;

            for(let i=2; i<df1.length; i++) {
                let row = df1[i]; let name = (row[0]||"").toString().trim();
                if(!name || name==="nan" || name==="0") continue;

                const n_cols = row.length;
                let t20_parAmt = n_cols > 19 ? amt(row[19]) : 0; let t20_portfolio = n_cols > 16 ? amt(row[16]) : 0;
                let t20_parPct = n_cols > 20 ? pct(row[20]) : (t20_portfolio > 0 ? +((t20_parAmt/t20_portfolio)*100).toFixed(2) : 0);
                
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
                
                let metrics = {
                    below10: { collectable: amt(row[1]), collection: amt(row[2]), colVsCol: pct(row[3]), emi: amt(row[4]), emiVsCol: pct(row[5]), portfolio: amt(row[6]), npl: amt(row[7]), nplPct: pct(row[8]), par: amt(row[9]), parPct: pct(row[10]) },
                    ten20: { collectable: amt(row[11]), collection: amt(row[12]), colVsCol: pct(row[13]), emi: amt(row[14]), emiVsCol: pct(row[15]), portfolio: t20_portfolio, npl: amt(row[17]), nplPct: pct(row[18]), par: t20_parAmt, parPct: t20_parPct },
                    l12m: matched_l12m || { collectable:0, collection:0, colVsCol:0, emi:0, emiVsCol:0, portfolio:0, npl:0, nplPct:0, par:0, parPct:0 },
                    overall: matched_overall || { collectable:0, collection:0, colVsCol:0, emi:0, emiVsCol:0, portfolio:0, npl:0, nplPct:0, par:0, parPct:0 }
                };

                if (name.includes("Total") || name.toUpperCase().includes("AVERAGE") || name.includes("Sub-Total")) { 
                    if (name.includes("Country Average")) country_avg = metrics; 
                    continue; 
                }

                let obj = { name, metrics };
                if (name.includes("Zone")) {
                    unassigned_regions.forEach(r => { r.zone = name; r.territories.forEach(t => { t.zone = name; t.units.forEach(u => {
                        u.zone = name; u.region = r.name; u.territory = t.name; flat_units.push(u); });});}); unassigned_regions = [];
                } else if (name.includes("Region")) { obj.territories = unassigned_territories; unassigned_regions.push(obj); unassigned_territories = [];
                } else if (name.includes("Territory")) { obj.units = unassigned_units; unassigned_territories.push(obj); unassigned_units = [];
                } else { obj.type = "Unit"; unassigned_units.push(obj); }
            }

            unassigned_regions.forEach(r => { r.territories.forEach(t => { t.units.forEach(u => { if(!u.zone) u.zone = "Unassigned"; u.region = r.name; u.territory = t.name; flat_units.push(u); }); }); });
            unassigned_territories.forEach(t => { t.units.forEach(u => { if(!u.zone) u.zone = "Unassigned"; if(!u.region) u.region = "Unassigned"; u.territory = t.name; flat_units.push(u); }); });
            unassigned_units.forEach(u => { if(!u.zone) u.zone = "Unassigned"; if(!u.region) u.region = "Unassigned"; if(!u.territory) u.territory = "Unassigned"; flat_units.push(u); });

            // Apply bulletproof L12M & Overall Country Avg patch
            if (country_avg) { 
                if (s2_avg) country_avg.l12m = s2_avg; 
                if (s3_avg) country_avg.overall = s3_avg; 
            }

            unitData = flat_units.map(u => ({ unit: u.name, territory: u.territory, region: u.region, zone: u.zone, metrics: u.metrics }));
            countryAvg = country_avg;

            localStorage.setItem('portfolioData', JSON.stringify({ unitData, countryAvg }));
            localStorage.setItem('portfolioDataVersion', CACHE_VERSION);
            DOM.uploadStatus.innerHTML = `<i class="fa-solid fa-check" style="color:var(--accent-green)"></i> Loaded ${unitData.length} units!`;
            DOM.downloadJsonBtn.style.display = 'block';

            populateDropdowns(); updateDashboard();
        } catch(err) { console.error(err); DOM.uploadStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:var(--accent-red)"></i> ${err.message}`; }
    }, 100);
}
DOM.excelUpload.addEventListener('change', (e) => {
    if(!e.target.files[0]) return; const reader = new FileReader(); reader.onload = (evt) => parseExcelData(evt.target.result); reader.readAsArrayBuffer(e.target.files[0]);
});

DOM.downloadJsonBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({unitData, countryAvg}, null, 2));
    const dlAnchorElem = document.createElement('a'); dlAnchorElem.setAttribute("href", dataStr); dlAnchorElem.setAttribute("download", "realData.json"); dlAnchorElem.click();
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
function getTextColor(npl) {
    if(npl === 0) return 'var(--text-muted)';
    if(npl <= 2.0) return 'var(--accent-green)';
    if(npl <= 5.0) return 'var(--accent-amber)';
    return 'var(--accent-red)';
}
function nplBorder(npl) {
    if(npl === 0) return 'transparent';
    if(npl <= 2.0) return 'var(--accent-green)';
    if(npl <= 5.0) return 'var(--accent-amber)';
    return 'var(--accent-red)';
}

// ============================================
// DATA FILTERING & AGGREGATION
// ============================================
function getFilteredUnits() {
    if(!unitData.length) return [];
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
    if (state.tab === 'overall') return 'overall';
    return state.ticketSize === 'ten20' ? 'ten20' : 'below10';
}

function aggregateMetrics(units, metricKey) {
    if (!units.length) return { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectable: 0, collection: 0, emi: 0, portfolio: 0, npl: 0, par: 0 };
    let t = { collectable: 0, collection: 0, emi: 0, portfolio: 0, npl: 0, par: 0 };
    units.forEach(u => {
        let val = null;
        const m = u.metrics || u; // Support both nested (parsed from Excel) and flat (legacy) structures
        if (state.tab === 'ticket' && state.ticketSize === 'both') {
            const b10 = m.below10 || m['below10'];
            const t20 = m.ten20 || m['ten20'];
            if (b10 && t20) {
                val = { collectable: b10.collectable + t20.collectable, collection: b10.collection + t20.collection, emi: b10.emi + t20.emi, portfolio: b10.portfolio + t20.portfolio, npl: b10.npl + t20.npl, par: b10.par + t20.par };
            } else if (b10) { val = b10; }
            else if (t20) { val = t20; }
        } else {
            val = m[metricKey] || null;
        }
        if(!val) return;
        t.collectable += val.collectable||0; t.collection += val.collection||0; t.emi += val.emi||0; t.portfolio += val.portfolio||0; t.npl += val.npl||0; t.par += val.par||0;
    });
    return { collectable: t.collectable, collection: t.collection, emi: t.emi, portfolio: t.portfolio, npl: t.npl, par: t.par,
        colVsCol: t.collectable > 0 ? +(t.collection / t.collectable * 100).toFixed(2) : 0, emiVsCol: t.collection > 0 ? +(t.emi / t.collection * 100).toFixed(2) : 0,
        nplPct: t.portfolio > 0 ? +(t.npl / t.portfolio * 100).toFixed(2) : 0, parPct: t.portfolio > 0 ? +(t.par / t.portfolio * 100).toFixed(2) : 0 };
}
function getGroupedData(units, groupKey, metricKey) {
    const groups = {}; units.forEach(u => { const key = u[groupKey]; if (!groups[key]) groups[key] = []; groups[key].push(u); });
    return Object.keys(groups).sort().map(name => ({ name, ...aggregateMetrics(groups[name], metricKey), unitCount: groups[name].length }));
}

function handleChartClick(index) {
    const label = currentChartLabels[index]; if (!label) return;
    if (state.drillLevel === 'zone') { state.filters.zone = label; state.drillLevel = 'region'; }  else if (state.drillLevel === 'region') { state.filters.region = label; state.drillLevel = 'territory'; }  else if (state.drillLevel === 'territory') { state.filters.territory = label; state.drillLevel = 'unit'; }
    DOM.drillLevel.value = state.drillLevel; populateDropdowns(); updateBreadcrumb(); updateDashboard();
}

function handleTableRowClick(name) {
    if (state.drillLevel === 'zone') { state.filters.zone = name; state.drillLevel = 'region'; }  else if (state.drillLevel === 'region') { state.filters.region = name; state.drillLevel = 'territory'; }  else if (state.drillLevel === 'territory') { state.filters.territory = name; state.drillLevel = 'unit'; }
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
function getAnnotation(val, color) { if(!val) return {}; return { y: val, borderColor: color, strokeDashArray: 4, label: { text: 'Avg: ' + val.toFixed(1) + '%', style: { color: '#fff', background: color, fontSize: '10px', fontWeight: 'bold' }, position: 'left' } }; }

function renderKPIs(filteredUnits) {
    const grid = DOM.kpiGrid; grid.innerHTML = '';
    if(!unitData.length || !countryAvg) return;
    if (state.tab === 'ticket' && state.ticketSize === 'both') {
        const b10 = aggregateMetrics(filteredUnits, 'below10'); const t20 = aggregateMetrics(filteredUnits, 'ten20');
        const avgB10 = countryAvg.below10||{colVsCol:0, emiVsCol:0, nplPct:0, parPct:0}; const avgT20 = countryAvg.ten20||{colVsCol:0, emiVsCol:0, nplPct:0, parPct:0};
        const metrics = [
            { label: 'CLTD vs CLTN %', b10Key: 'colVsCol', t20Key: 'colVsCol', avgB10: avgB10.colVsCol, avgT20: avgT20.colVsCol, higherBetter: true, icon: 'fa-chart-pie', gradient: 'var(--gradient-blue)' },
            { label: 'EMI vs CLTN %', b10Key: 'emiVsCol', t20Key: 'emiVsCol', avgB10: avgB10.emiVsCol, avgT20: avgT20.emiVsCol, higherBetter: true, icon: 'fa-money-bill-trend-up', gradient: 'var(--gradient-green)' },
            { label: 'NPL %', b10Key: 'nplPct', t20Key: 'nplPct', avgB10: avgB10.nplPct, avgT20: avgT20.nplPct, higherBetter: false, icon: 'fa-triangle-exclamation', gradient: 'var(--gradient-red)' },
            { label: 'PAR %', b10Key: 'parPct', t20Key: 'parPct', avgB10: avgB10.parPct, avgT20: avgT20.parPct, higherBetter: false, icon: 'fa-chart-line', gradient: 'var(--gradient-amber)' }
        ];
        metrics.forEach(m => {
            const b10Val = b10[m.b10Key]; const t20Val = t20[m.t20Key]; const card = document.createElement('div'); card.className = 'kpi-card-ticket';
            card.innerHTML = `<div class="kpi-accent-bar" style="background: ${m.gradient}"></div><div class="ticket-header"><i class="fa-solid ${m.icon}"></i> ${m.label}</div><div class="ticket-row"> <span class="ticket-label">Below 10 Lacs</span> <span class="ticket-value ${isGood(b10Val, m.avgB10, m.higherBetter) ? 'good' : 'bad'}">${b10Val.toFixed(2)}%</span> </div><div class="ticket-row"> <span class="ticket-label">10-20 Lacs</span> <span class="ticket-value ${isGood(t20Val, m.avgT20, m.higherBetter) ? 'good' : 'bad'}">${t20Val.toFixed(2)}%</span> </div><div class="ticket-row" style="opacity:0.5"> <span class="ticket-label">Country Avg</span> <span class="ticket-label">${m.avgB10.toFixed(2)}% / ${m.avgT20.toFixed(2)}%</span> </div>`; grid.appendChild(card);
        });
    } else {
        const metricKey = getMetricKey(); const agg = aggregateMetrics(filteredUnits, metricKey); const avg = countryAvg[metricKey]||{colVsCol:0, emiVsCol:0, nplPct:0, parPct:0};
        const kpis = [
            { label: 'CLTD vs CLTN %', value: agg.colVsCol, avg: avg.colVsCol, higherBetter: true, icon: 'fa-chart-pie', gradient: 'var(--gradient-blue)' },
            { label: 'EMI vs CLTN %', value: agg.emiVsCol, avg: avg.emiVsCol, higherBetter: true, icon: 'fa-money-bill-trend-up', gradient: 'var(--gradient-green)' },
            { label: 'NPL %', value: agg.nplPct, avg: avg.nplPct, higherBetter: false, icon: 'fa-triangle-exclamation', gradient: 'var(--gradient-red)' },
            { label: 'PAR %', value: agg.parPct, avg: avg.parPct, higherBetter: false, icon: 'fa-chart-line', gradient: 'var(--gradient-amber)' }
        ];
        kpis.forEach(k => {
            const diff = k.value - k.avg; const card = document.createElement('div'); card.className = 'kpi-card';
            card.innerHTML = `<div class="kpi-accent-bar" style="background: ${k.gradient}"></div><div class="kpi-icon" style="background: ${k.gradient}"><i class="fa-solid ${k.icon}" style="color:#fff"></i></div><div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value.toFixed(2)}%</div><div class="kpi-sub ${isGood(k.value, k.avg, k.higherBetter) ? 'positive' : 'negative'}"><i class="fa-solid ${isGood(k.value, k.avg, k.higherBetter) ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>${Math.abs(diff).toFixed(2)}% vs Avg</div>`; grid.appendChild(card);
        });
    }
}

function getMax(data, avg, key) { let m = Math.max(...data.map(d => d[key]), avg[key] * 1.15); return m < 5 ? 5 : m; }
function getChartOptions(categories, avgVal, color, maxVal) { return { xaxis: { categories }, yaxis: { max: maxVal > 0 ? maxVal : undefined }, annotations: { yaxis: [getAnnotation(avgVal, color)] } }; }

function updateCharts(filteredUnits) {
    if(!unitData.length || !countryAvg) return;
    const level = state.drillLevel; const labels = getGroupedData(filteredUnits, level, 'below10').map(g => g.name); currentChartLabels = labels;
    if (state.tab === 'ticket' && state.ticketSize === 'both') {
        const gB10 = getGroupedData(filteredUnits, level, 'below10'); const gT20 = getGroupedData(filteredUnits, level, 'ten20');
        const aB10 = countryAvg.below10||{colVsCol:0, emiVsCol:0, nplPct:0, parPct:0}; const aT20 = countryAvg.ten20||{colVsCol:0, emiVsCol:0, nplPct:0, parPct:0};
        
        charts.colVsCol.updateOptions(getChartOptions(labels, aB10.colVsCol, '#818cf8', Math.max(getMax(gB10, aB10, 'colVsCol'), getMax(gT20, aT20, 'colVsCol'))));
        charts.colVsCol.updateSeries([{ name: 'Below 10 Lacs', data: gB10.map(g => g.colVsCol) }, { name: '10-20 Lacs', data: gT20.map(g => g.colVsCol) }]);
        
        charts.emiVsCol.updateOptions(getChartOptions(labels, aB10.emiVsCol, '#22d3ee', Math.max(getMax(gB10, aB10, 'emiVsCol'), getMax(gT20, aT20, 'emiVsCol'))));
        charts.emiVsCol.updateSeries([{ name: 'Below 10 Lacs', data: gB10.map(g => g.emiVsCol) }, { name: '10-20 Lacs', data: gT20.map(g => g.emiVsCol) }]);
        
        charts.npl.updateOptions(getChartOptions(labels, aB10.nplPct, '#f87171', Math.max(getMax(gB10, aB10, 'nplPct'), getMax(gT20, aT20, 'nplPct'))));
        charts.npl.updateSeries([{ name: 'Below 10 Lacs', data: gB10.map(g => g.nplPct) }, { name: '10-20 Lacs', data: gT20.map(g => g.nplPct) }]);
        
        charts.par.updateOptions(getChartOptions(labels, aB10.parPct, '#fbbf24', Math.max(getMax(gB10, aB10, 'parPct'), getMax(gT20, aT20, 'parPct'))));
        charts.par.updateSeries([{ name: 'Below 10 Lacs', data: gB10.map(g => g.parPct) }, { name: '10-20 Lacs', data: gT20.map(g => g.parPct) }]);
    } else {
        const metricKey = getMetricKey(); const grouped = getGroupedData(filteredUnits, level, metricKey); const avg = countryAvg[metricKey]||{colVsCol:0, emiVsCol:0, nplPct:0, parPct:0};
        const activeLabels = grouped.map(g => g.name);
        
        charts.colVsCol.updateOptions(getChartOptions(activeLabels, avg.colVsCol, '#6366f1', getMax(grouped, avg, 'colVsCol')));
        charts.colVsCol.updateSeries([{ name: 'CLTD vs CLTN', data: grouped.map(g => g.colVsCol) }]);
        
        charts.emiVsCol.updateOptions(getChartOptions(activeLabels, avg.emiVsCol, '#06b6d4', getMax(grouped, avg, 'emiVsCol')));
        charts.emiVsCol.updateSeries([{ name: 'EMI vs CLTN', data: grouped.map(g => g.emiVsCol) }]);
        
        charts.npl.updateOptions(getChartOptions(activeLabels, avg.nplPct, '#ef4444', getMax(grouped, avg, 'nplPct')));
        charts.npl.updateSeries([{ name: 'NPL %', data: grouped.map(g => g.nplPct) }]);
        
        charts.par.updateOptions(getChartOptions(activeLabels, avg.parPct, '#f59e0b', getMax(grouped, avg, 'parPct')));
        charts.par.updateSeries([{ name: 'PAR %', data: grouped.map(g => g.parPct) }]);
    }
}

function updateTable(filteredUnits) {
    if(!unitData.length || !countryAvg) return;
    const metricKey = getMetricKey(); const level = state.drillLevel; const levelLabels = { zone: 'Zone', region: 'Region', territory: 'Territory', unit: 'Unit / Area' };
    DOM.tableTitle.textContent = `Breakdown by ${levelLabels[level]}`;
    if (state.tab === 'ticket' && state.ticketSize === 'both') {
        const groupedB10 = getGroupedData(filteredUnits, level, 'below10'); const groupedT20 = getGroupedData(filteredUnits, level, 'ten20');
        const avgB10 = countryAvg.below10||{colVsCol:0, emiVsCol:0, nplPct:0, parPct:0}; const avgT20 = countryAvg.ten20||{colVsCol:0, emiVsCol:0, nplPct:0, parPct:0};
        const t20Map = {}; groupedT20.forEach(g => t20Map[g.name] = g);

        DOM.tableHeader.innerHTML = `<th rowspan="2" class="border-right">${levelLabels[level]}</th><th colspan="4" class="border-right" style="text-align:center;color:var(--accent-blue);border-bottom:2px solid var(--accent-blue)">Below 10 Lacs</th><th colspan="4" style="text-align:center;color:var(--accent-purple);border-bottom:2px solid var(--accent-purple)">10-20 Lacs</th>`;
        let subRow = DOM.tableHeader.parentElement.querySelector('.sub-header-row'); if (!subRow) { subRow = document.createElement('tr'); subRow.className = 'sub-header-row'; DOM.tableHeader.parentElement.appendChild(subRow); }
        subRow.innerHTML = `<th>CLTD vs CLTN</th><th>EMI vs CLTN</th><th>NPL %</th><th class="border-right">PAR %</th><th>CLTD vs CLTN</th><th>EMI vs CLTN</th><th>NPL %</th><th>PAR %</th>`;
        DOM.tableBody.innerHTML = '';
        const avgRow = document.createElement('tr'); avgRow.className = 'row-avg';
        avgRow.innerHTML = `<td class="border-right">Total Small Business</td><td>${avgB10.colVsCol.toFixed(2)}%</td><td>${avgB10.emiVsCol.toFixed(2)}%</td><td>${avgB10.nplPct.toFixed(2)}%</td><td class="border-right">${avgB10.parPct.toFixed(2)}%</td><td>${avgT20.colVsCol.toFixed(2)}%</td><td>${avgT20.emiVsCol.toFixed(2)}%</td><td>${avgT20.nplPct.toFixed(2)}%</td><td>${avgT20.parPct.toFixed(2)}%</td>`;
        DOM.tableBody.appendChild(avgRow);
        groupedB10.forEach(b10Row => {
            const t20Row = t20Map[b10Row.name] || { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0 };
            const tr = document.createElement('tr'); tr.className = level !== 'unit' ? 'clickable-row' : '';
            tr.innerHTML = `<td class="cell-name border-right">${b10Row.name}${level !== 'unit' ? ' <i class="fa-solid fa-chevron-right"></i>' : ''}</td><td class="${cellClass(b10Row.colVsCol, avgB10.colVsCol, true)}">${b10Row.colVsCol.toFixed(2)}%</td><td class="${cellClass(b10Row.emiVsCol, avgB10.emiVsCol, true)}">${b10Row.emiVsCol.toFixed(2)}%</td><td class="${cellClass(b10Row.nplPct, avgB10.nplPct, false)}">${b10Row.nplPct.toFixed(2)}%</td><td class="${cellClass(b10Row.parPct, avgB10.parPct, false)} border-right">${b10Row.parPct.toFixed(2)}%</td><td class="${cellClass(t20Row.colVsCol, avgT20.colVsCol, true)}">${t20Row.colVsCol.toFixed(2)}%</td><td class="${cellClass(t20Row.emiVsCol, avgT20.emiVsCol, true)}">${t20Row.emiVsCol.toFixed(2)}%</td><td class="${cellClass(t20Row.nplPct, avgT20.nplPct, false)}">${t20Row.nplPct.toFixed(2)}%</td><td class="${cellClass(t20Row.parPct, avgT20.parPct, false)}">${t20Row.parPct.toFixed(2)}%</td>`;
            if (level !== 'unit') { tr.onclick = () => handleTableRowClick(b10Row.name); } DOM.tableBody.appendChild(tr);
        });
    } else {
        const grouped = getGroupedData(filteredUnits, level, metricKey); const avg = countryAvg[metricKey]||{colVsCol:0, emiVsCol:0, nplPct:0, parPct:0};
        const subRow = DOM.tableHeader.parentElement.querySelector('.sub-header-row'); if (subRow) subRow.remove();
        DOM.tableHeader.innerHTML = ` <th class="border-right">${levelLabels[level]}</th> <th>CLTD vs CLTN</th> <th>EMI vs CLTN</th> <th>NPL %</th> <th>PAR %</th> `; DOM.tableBody.innerHTML = '';
        const avgRow = document.createElement('tr'); avgRow.className = 'row-avg';
        avgRow.innerHTML = `<td class="border-right">Total Small Business</td><td>${avg.colVsCol.toFixed(2)}%</td><td>${avg.emiVsCol.toFixed(2)}%</td><td>${avg.nplPct.toFixed(2)}%</td><td>${avg.parPct.toFixed(2)}%</td>`; DOM.tableBody.appendChild(avgRow);
        grouped.forEach(row => {
            const tr = document.createElement('tr'); tr.className = level !== 'unit' ? 'clickable-row' : '';
            tr.innerHTML = `<td class="cell-name border-right">${row.name}${level !== 'unit' ? ' <i class="fa-solid fa-chevron-right"></i>' : ''}</td><td class="${cellClass(row.colVsCol, avg.colVsCol, true)}">${row.colVsCol.toFixed(2)}%</td><td class="${cellClass(row.emiVsCol, avg.emiVsCol, true)}">${row.emiVsCol.toFixed(2)}%</td><td class="${cellClass(row.nplPct, avg.nplPct, false)}">${row.nplPct.toFixed(2)}%</td><td class="${cellClass(row.parPct, avg.parPct, false)}">${row.parPct.toFixed(2)}%</td>`;
            if (level !== 'unit') { tr.onclick = () => handleTableRowClick(row.name); } DOM.tableBody.appendChild(tr);
        });
    }
}

function updateBreadcrumb() {
    let parts = []; if (state.filters.zone === 'all') parts.push('Country Level'); else parts.push(state.filters.zone);
    if (state.filters.region !== 'all') parts.push(state.filters.region); if (state.filters.territory !== 'all') parts.push(state.filters.territory);
    if (state.filters.unit !== 'all') parts.push(state.filters.unit); DOM.breadCrumb.textContent = parts.join(' > ');
}

DOM.exportCsvBtn.addEventListener('click', () => {
    let csv = []; const rows = document.querySelectorAll('#dataTable tr');
    for (let i = 0; i < rows.length; i++) { let row = [], cols = rows[i].querySelectorAll('td, th'); for (let j = 0; j < cols.length; j++) row.push('"' + cols[j].innerText.replace(/"/g, '""') + '"'); csv.push(row.join(',')); }
    const csvFile = new Blob([csv.join('\n')], {type: 'text/csv'}); const downloadLink = document.createElement('a'); downloadLink.download = 'Portfolio_Export.csv';
    downloadLink.href = window.URL.createObjectURL(csvFile); downloadLink.style.display = 'none'; document.body.appendChild(downloadLink); downloadLink.click();
});

function updateDashboard() {
    if(!unitData.length) { DOM.uploadStatus.innerHTML = "<span style='color:var(--accent-red)'>Awaiting Excel Upload...</span>"; return; }
    const filteredUnits = getFilteredUnits();
    
    const isAnalysis = state.tab === 'analysis';
    DOM.dashboardView.style.display = isAnalysis ? 'none' : 'block'; 
    DOM.analysisView.style.display = isAnalysis ? 'block' : 'none';
    DOM.ticketSizeFilterSection.style.display = state.tab === 'ticket' ? 'block' : 'none';
    
    if (isAnalysis) {
        if (typeof renderAnalysis === 'function') renderAnalysis(filteredUnits);
        return;
    }
    
    renderKPIs(filteredUnits); 
    updateCharts(filteredUnits); 
    updateTable(filteredUnits);
}

DOM.zoneFilter.addEventListener('change', (e) => { state.filters.zone = e.target.value; if (e.target.value === 'all') { state.filters.region = 'all'; state.filters.territory = 'all'; state.filters.unit = 'all'; } populateDropdowns(); updateBreadcrumb(); updateDashboard(); });
DOM.regionFilter.addEventListener('change', (e) => { state.filters.region = e.target.value; if (e.target.value === 'all') { state.filters.territory = 'all'; state.filters.unit = 'all'; } populateDropdowns(); updateBreadcrumb(); updateDashboard(); });
DOM.territoryFilter.addEventListener('change', (e) => { state.filters.territory = e.target.value; if (e.target.value === 'all') { state.filters.unit = 'all'; } populateDropdowns(); updateBreadcrumb(); updateDashboard(); });
DOM.unitFilter.addEventListener('change', (e) => { state.filters.unit = e.target.value; updateBreadcrumb(); updateDashboard(); });
DOM.ticketSizeFilter.addEventListener('change', (e) => { state.ticketSize = e.target.value; updateDashboard(); });
DOM.drillLevel.addEventListener('change', (e) => { state.drillLevel = e.target.value; updateDashboard(); });
DOM.tabs.forEach(tab => { tab.addEventListener('click', (e) => { DOM.tabs.forEach(t => t.classList.remove('active')); e.currentTarget.classList.add('active'); state.tab = e.currentTarget.dataset.tab; updateDashboard(); }); });
DOM.resetBtn.addEventListener('click', () => { state.filters = { zone: 'all', region: 'all', territory: 'all', unit: 'all' }; state.drillLevel = 'zone'; state.ticketSize = 'both'; DOM.drillLevel.value = 'zone'; DOM.ticketSizeFilter.value = 'both'; populateDropdowns(); updateBreadcrumb(); updateDashboard(); });

initCharts();
if(unitData.length) {
    populateDropdowns(); updateBreadcrumb(); updateDashboard();
    DOM.uploadStatus.innerHTML = `<i class="fa-solid fa-check" style="color:var(--accent-green)"></i> Loaded From Cache!`;
    DOM.downloadJsonBtn.style.display = 'block';
} else { updateDashboard(); }

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
