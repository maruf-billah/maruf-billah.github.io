// ============================================
//  ANALYSIS TAB - analysis.js
//  Interactive Quadrant, Gap, Stress & Heatmap
// ============================================

let analysisCharts = {};
let analysisInitialized = false;

// ============================================
// HELPERS
// ============================================
function analysisGetMetricKey() {
    // Analysis tab now strictly uses the 'Overall Portfolio' dataset
    return 'overall';
}

function analysisAggregate(units, metricKey) {
    if (!units.length) return { colVsCol: 0, emiVsCol: 0, nplPct: 0, parPct: 0, collectable: 0, collection: 0, emi: 0, portfolio: 0, npl: 0, par: 0 };
    let t = { collectable: 0, collection: 0, emi: 0, portfolio: 0, npl: 0, par: 0 };
    units.forEach(u => {
        const m = u.metrics || u;
        const val = m[metricKey];
        if (!val) return;
        t.collectable += val.collectable || 0;
        t.collection += val.collection || 0;
        t.emi += val.emi || 0;
        t.portfolio += val.portfolio || 0;
        t.npl += val.npl || 0;
        t.par += val.par || 0;
    });
    return {
        collectable: t.collectable, collection: t.collection, emi: t.emi,
        portfolio: t.portfolio, npl: t.npl, par: t.par,
        colVsCol: t.collectable > 0 ? +(t.collection / t.collectable * 100).toFixed(2) : 0,
        emiVsCol: t.emi > 0 ? +(t.collection / t.emi * 100).toFixed(2) : 0,
        nplPct: t.portfolio > 0 ? +(t.npl / t.portfolio * 100).toFixed(2) : 0,
        parPct: t.portfolio > 0 ? +(t.par / t.portfolio * 100).toFixed(2) : 0,
        stressIndex: t.emi > 0 ? +(1 - (t.collection / t.emi)).toFixed(4) : 0,
        gap: t.collectable - t.collection
    };
}

function analysisGrouped(units, groupKey, metricKey) {
    const groups = {};
    units.forEach(u => {
        const key = u[groupKey];
        if (!groups[key]) groups[key] = [];
        groups[key].push(u);
    });
    return Object.keys(groups).sort().map(name => ({
        name,
        ...analysisAggregate(groups[name], metricKey),
        unitCount: groups[name].length
    }));
}

function formatCrore(val) {
    if (Math.abs(val) >= 10000000) return (val / 10000000).toFixed(2) + ' Cr';
    if (Math.abs(val) >= 100000) return (val / 100000).toFixed(2) + ' L';
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + ' K';
    return val.toFixed(0);
}

// Section 1 logic removed.


// ============================================
// 2. COLLECTION GAP ANALYSIS
// ============================================
function renderGapAnalysis(filteredUnits) {
    try {
    const level = document.getElementById('gapLevel').value;
    const metricKey = analysisGetMetricKey();
    const grouped = analysisGrouped(filteredUnits, level, metricKey);

    // Calculate total gap
    const totalGap = grouped.reduce((s, g) => s + g.gap, 0);
    const totalCollectable = grouped.reduce((s, g) => s + g.collectable, 0);
    const totalCollection = grouped.reduce((s, g) => s + g.collection, 0);
    const overallEfficiency = totalCollectable > 0 ? (totalCollection / totalCollectable * 100) : 0;

    // KPI Row
    const kpiRow = document.getElementById('gapKpiRow');
    kpiRow.innerHTML = `
        <div class="gap-kpi"><div class="gap-kpi-label">Total Gap</div><div class="gap-kpi-value" style="color:var(--accent-red)">${formatCrore(totalGap)}</div></div>
        <div class="gap-kpi"><div class="gap-kpi-label">Total Collectable</div><div class="gap-kpi-value" style="color:var(--accent-blue)">${formatCrore(totalCollectable)}</div></div>
        <div class="gap-kpi"><div class="gap-kpi-label">Total Collected</div><div class="gap-kpi-value" style="color:var(--accent-green)">${formatCrore(totalCollection)}</div></div>
        <div class="gap-kpi"><div class="gap-kpi-label">Overall Efficiency</div><div class="gap-kpi-value" style="color:${overallEfficiency >= 80 ? 'var(--accent-green)' : 'var(--accent-amber)'}">${overallEfficiency.toFixed(1)}%</div></div>
    `;

    // Top 15 by gap
    const top15 = grouped.sort((a, b) => b.gap - a.gap).slice(0, 15);

    const chartOpts = {
        series: [{
            name: 'Gap Amount',
            data: top15.map(g => +g.gap.toFixed(0))
        }],
        chart: {
            type: 'bar', height: 360, background: state.theme === 'dark' ? '#1a1f2e' : '#ffffff',
            toolbar: { show: true, tools: { download: true } }
        },
        theme: { mode: state.theme },
        plotOptions: {
            bar: {
                horizontal: true, borderRadius: 4, barHeight: '65%',
                dataLabels: { position: 'right' }
            }
        },
        colors: ['#ef4444'],
        dataLabels: {
            enabled: true,
            formatter: function(val, opts) {
                const pct = totalGap > 0 ? ((val / totalGap) * 100).toFixed(1) : '0.0';
                return formatCrore(val) + ' (' + pct + '%)';
            },
            style: { fontSize: '10px', colors: [state.theme === 'dark' ? '#fff' : '#1e293b'] },
            offsetX: 10
        },
        xaxis: {
            labels: { style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#475569', fontSize: '10px' }, formatter: v => formatCrore(v) }
        },
        yaxis: {
            labels: { style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#475569', fontSize: '10px' } }
        },
        grid: { borderColor: state.theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#e2e8f0', strokeDashArray: 4 },
        tooltip: {
            theme: state.theme,
            y: { formatter: function(val) { return formatCrore(val); } }
        },
        legend: { show: false }
    };

    // Categories via yaxis for horizontal
    chartOpts.xaxis.categories = top15.map(g => g.name);

    if (analysisCharts.gap) analysisCharts.gap.destroy();
    analysisCharts.gap = new ApexCharts(document.querySelector('#gapChart'), chartOpts);
    analysisCharts.gap.render();
    } catch(e) { console.error('Gap Analysis render error:', e); }
}

// ============================================
// 3. EMI STRESS INDICATOR
// ============================================
function renderStressIndicator(filteredUnits) {
    try {
        const level = document.getElementById('stressLevel').value;
        const metricKey = analysisGetMetricKey();
        const grouped = analysisGrouped(filteredUnits, level, metricKey);

        // Sort by stress index (highest stress first)
        grouped.sort((a, b) => b.stressIndex - a.stressIndex);

        const header = document.getElementById('stressTableHeader');
        const body = document.getElementById('stressTableBody');
        if (!header || !body) return;

        const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);
        header.innerHTML = `
            <th>${levelLabel}</th>
            <th>Collection vs EMI %</th>
            <th>Coverage Ratio</th>
            <th>Stress Index</th>
            <th>Diagnostic Meaning</th>
        `;

        body.innerHTML = '';
        grouped.forEach(g => {
            const colVsEmiPct = g.emi > 0 ? (g.collection / g.emi * 100).toFixed(1) : '0.0';
            const coverage = g.emi > 0 ? (g.collection / g.emi).toFixed(3) : '0.000';
            const index = g.stressIndex;
            
            let status, badgeClass;
            if (index <= 0) { status = 'No stress / Over-performing'; badgeClass = 'seg-green'; }
            else if (index <= 0.1) { status = 'Mild Shortfall'; badgeClass = 'seg-cyan'; } // Use cyan for mild if defined, or amber
            else if (index <= 0.2) { status = 'Moderate Stress'; badgeClass = 'seg-amber'; }
            else { status = 'High stress'; badgeClass = 'seg-red'; }

            // Ensure seg-cyan exists in CSS or fallback to seg-amber
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight:600; color:var(--text-primary);">${g.name}</td>
                <td>${colVsEmiPct}%</td>
                <td style="font-family:'Courier New', monospace;">${coverage}</td>
                <td style="font-weight:700; color:${index > 0 ? 'var(--accent-red)' : 'var(--accent-green)'};">${index.toFixed(3)}</td>
                <td><span class="segment-badge ${badgeClass === 'seg-cyan' ? 'seg-amber' : badgeClass}">${status}</span></td>
            `;
            body.appendChild(row);
        });

    } catch(e) { console.error('Stress Table render error:', e); }
}

// ============================================
// 4. GEO-PERFORMANCE HEATMAP (TreeMap)
// ============================================
function renderGeoHeatmap(filteredUnits) {
    try {
    const level = document.getElementById('heatmapLevel').value;
    const metric = document.getElementById('heatmapMetric').value;
    const metricKey = analysisGetMetricKey();
    const grouped = analysisGrouped(filteredUnits, level, metricKey);

    const metricLabels = {
        colVsCol: 'Collection %',
        parPct: 'PAR %',
        nplPct: 'NPL %',
        stressRatio: 'Stress Ratio %'
    };

    const higherBetter = (metric === 'colVsCol' || metric === 'stressRatio');

    const getColor = (val) => {
        if (higherBetter) {
            if (val >= 95) return '#10b981';
            if (val >= 80) return '#06b6d4';
            if (val >= 60) return '#f59e0b';
            return '#ef4444';
        } else {
            if (val <= 1) return '#10b981';
            if (val <= 3) return '#06b6d4';
            if (val <= 6) return '#f59e0b';
            return '#ef4444';
        }
    };

    // Build heatmap-style data using ApexCharts heatmap type instead of treemap
    // Group by zone for rows, items for columns
    const sortedData = [...grouped].sort((a, b) => higherBetter ? a[metric] - b[metric] : b[metric] - a[metric]);

    const chartOpts = {
        series: [{
            name: metricLabels[metric],
            data: sortedData.map(g => ({
                x: g.name,
                y: +(g[metric]).toFixed(2)
            }))
        }],
        chart: {
            type: 'bar', 
            height: Math.max(380, sortedData.length * 28),
            background: state.theme === 'dark' ? '#1a1f2e' : '#ffffff',
            toolbar: { show: true }
        },
        theme: { mode: state.theme },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                barHeight: '70%',
                distributed: true,
                dataLabels: { position: 'right' }
            }
        },
        colors: sortedData.map(g => getColor(g[metric])),
        dataLabels: {
            enabled: true,
            formatter: function(val) { return val.toFixed(1) + '%'; },
            style: { fontSize: '10px', colors: [state.theme === 'dark' ? '#fff' : '#1e293b'] },
            offsetX: 5
        },
        xaxis: {
            labels: { style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#475569', fontSize: '10px' }, formatter: v => v.toFixed(1) + '%' },
            title: { text: metricLabels[metric], style: { color: state.theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '11px' } }
        },
        yaxis: {
            labels: { style: { colors: state.theme === 'dark' ? 'rgba(255,255,255,0.7)' : '#475569', fontSize: '10px' } }
        },
        grid: { borderColor: state.theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#e2e8f0', strokeDashArray: 4 },
        tooltip: {
            theme: state.theme,
            custom: function({ seriesIndex, dataPointIndex, w }) {
                const name = sortedData[dataPointIndex].name;
                const val = sortedData[dataPointIndex][metric];
                const g = sortedData[dataPointIndex];
                const color = getColor(val);
                return '<div style="padding:10px;font-size:12px;background:#1e293b;border:1px solid rgba(99,102,241,0.3);border-radius:8px;">' +
                    '<strong style="color:#f1f5f9;font-size:13px;">' + name + '</strong><br/>' +
                    '<span style="color:#94a3b8;">' + metricLabels[metric] + ': </span><span style="color:' + color + ';font-weight:700;">' + val.toFixed(2) + '%</span><br/>' +
                    '<span style="color:#94a3b8;">Collection: </span><span style="color:#34d399;">' + formatCrore(g.collection || 0) + '</span><br/>' +
                    '<span style="color:#94a3b8;">Portfolio: </span><span style="color:#818cf8;">' + formatCrore(g.portfolio || 0) + '</span>' +
                    '</div>';
            }
        },
        legend: { show: false }
    };

    if (analysisCharts.heatmap) analysisCharts.heatmap.destroy();
    analysisCharts.heatmap = new ApexCharts(document.querySelector('#heatmapChart'), chartOpts);
    analysisCharts.heatmap.render();
    } catch(e) { console.error('Geo Heatmap render error:', e); }
}

// ============================================
// MASTER RENDER FUNCTION (called from app.js)
// ============================================
function renderAnalysis(filteredUnits) {
    if (!unitData.length) return;

    // Bind event listeners once
    if (!analysisInitialized) {
        ['gapLevel', 'stressLevel', 'heatmapMetric', 'heatmapLevel'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => renderAnalysis(getFilteredUnits()));
        });
        analysisInitialized = true;
    }

    try { renderGapAnalysis(filteredUnits); } catch(e) { console.error('Gap error:', e); }
    try { renderStressIndicator(filteredUnits); } catch(e) { console.error('Stress error:', e); }
    try { renderGeoHeatmap(filteredUnits); } catch(e) { console.error('Heatmap error:', e); }
}
