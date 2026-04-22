// mockData.js

const zones = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6"];

function generateMockData() {
    const data = [];
    let idCounter = 1;
    
    // Country averages for our pseudo-random generation anchoring
    const countryAverages = {
        below10: { colVsCol: 68.1, emiVsCol: 97.6, npl: 2.6, par: 4.5 },
        btn10to20: { colVsCol: 72.4, emiVsCol: 97.2, npl: 1.7, par: 3.0 },
        l12m: { colVsCol: 74.3, emiVsCol: 96.5, npl: 1.6, par: 3.0 }
    };

    zones.forEach((zone, zIndex) => {
        // Generating 3 regions per zone
        for (let r = 1; r <= 3; r++) {
            const region = `${zone} - Region ${r}`;
            // 4 territories per region
            for (let t = 1; t <= 4; t++) {
                const territory = `${region} - Terr ${t}`;
                // 5 units per territory
                for (let u = 1; u <= 5; u++) {
                    const unit = `${territory} - Unit ${u}`;
                    
                    // Generate random variations around the country average
                    const vary = (val, variance) => {
                        const randomFactor = (Math.random() - 0.4) * 2; // slightly biased to be under average sometimes
                        return parseFloat((val + randomFactor * variance).toFixed(1));
                    };

                    data.push({
                        id: idCounter++,
                        zone: zone,
                        region: region,
                        territory: territory,
                        unit: unit,
                        metrics: {
                            below10: {
                                colVsCol: vary(countryAverages.below10.colVsCol, 15),
                                emiVsCol: vary(countryAverages.below10.emiVsCol, 10),
                                npl: vary(countryAverages.below10.npl, 2),
                                par: vary(countryAverages.below10.par, 3)
                            },
                            btn10to20: {
                                colVsCol: vary(countryAverages.btn10to20.colVsCol, 12),
                                emiVsCol: vary(countryAverages.btn10to20.emiVsCol, 8),
                                npl: vary(countryAverages.btn10to20.npl, 1.5),
                                par: vary(countryAverages.btn10to20.par, 2.5)
                            },
                            l12m: {
                                colVsCol: vary(countryAverages.l12m.colVsCol, 10),
                                emiVsCol: vary(countryAverages.l12m.emiVsCol, 5),
                                npl: Math.max(0, vary(countryAverages.l12m.npl, 1.5)),
                                par: vary(countryAverages.l12m.par, 2.5)
                            }
                        }
                    });
                }
            }
        }
    });
    
    return {
        unitData: data,
        countryAverages: countryAverages
    };
}

const dashboardData = generateMockData();
