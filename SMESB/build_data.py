import pandas as pd
import json
import math

def parse_excel():
    xl = pd.ExcelFile('Monitoring Dashboard.xlsx')
    df1 = xl.parse(xl.sheet_names[0], header=None)  # Sheet 1: Ticket Size
    df2 = xl.parse(xl.sheet_names[1], header=None)  # Sheet 2: Last 12 months
    df3 = xl.parse(xl.sheet_names[2], header=None) if len(xl.sheet_names) > 2 else pd.DataFrame()  # Sheet 3: Overall Portfolio

    def safe_float(val):
        try:
            f = float(val)
            return 0 if math.isnan(f) else f
        except:
            return 0

    def pct(val):
        v = safe_float(val)
        if 0 < v <= 1.0:
            return round(v * 100, 2)
        return round(v, 2)

    def amt(val):
        return round(safe_float(val), 2)

    def extract_b10(df, row):
        return {
            "collectable": amt(df.iloc[row, 1]),
            "collection": amt(df.iloc[row, 2]),
            "colVsCol": pct(df.iloc[row, 3]),
            "emi": amt(df.iloc[row, 4]),
            "emiVsCol": pct(df.iloc[row, 5]),
            "portfolio": amt(df.iloc[row, 6]),
            "npl": amt(df.iloc[row, 7]),
            "nplPct": pct(df.iloc[row, 8]),
            "par": amt(df.iloc[row, 9]),
            "parPct": pct(df.iloc[row, 10])
        }

    def extract_1020(df, row):
        # Handle cases where PAR% col is missing (e.g. only 20 cols) 
        n_cols = len(df.columns)
        par_amt = amt(df.iloc[row, 19]) if n_cols > 19 else 0
        portfolio = amt(df.iloc[row, 16]) if n_cols > 16 else 0
        par_pct = pct(df.iloc[row, 20]) if n_cols > 20 else (round((par_amt / portfolio) * 100, 2) if portfolio > 0 else 0)

        return {
            "collectable": amt(df.iloc[row, 11]) if n_cols > 11 else 0,
            "collection": amt(df.iloc[row, 12]) if n_cols > 12 else 0,
            "colVsCol": pct(df.iloc[row, 13]) if n_cols > 13 else 0,
            "emi": amt(df.iloc[row, 14]) if n_cols > 14 else 0,
            "emiVsCol": pct(df.iloc[row, 15]) if n_cols > 15 else 0,
            "portfolio": portfolio,
            "npl": amt(df.iloc[row, 17]) if n_cols > 17 else 0,
            "nplPct": pct(df.iloc[row, 18]) if n_cols > 18 else 0,
            "par": par_amt,
            "parPct": par_pct
        }

    def extract_l12m(df, row):
        n_cols = len(df.columns)
        return {
            "collectable": amt(df.iloc[row, 1]) if n_cols > 1 else 0,
            "collection": amt(df.iloc[row, 2]) if n_cols > 2 else 0,
            "colVsCol": pct(df.iloc[row, 3]) if n_cols > 3 else 0,
            "emi": amt(df.iloc[row, 4]) if n_cols > 4 else 0,
            "emiVsCol": pct(df.iloc[row, 5]) if n_cols > 5 else 0,
            "portfolio": amt(df.iloc[row, 6]) if n_cols > 6 else 0,
            "npl": amt(df.iloc[row, 7]) if n_cols > 7 else 0,
            "nplPct": pct(df.iloc[row, 8]) if n_cols > 8 else 0,
            "par": amt(df.iloc[row, 9]) if n_cols > 9 else 0,
            "parPct": pct(df.iloc[row, 10]) if n_cols > 10 else 0
        }

    # Start checking data from row 2 on both sheets
    s2_lookup = {}
    for i in range(2, len(df2)):
        name = str(df2.iloc[i, 0]).strip()
        if pd.isna(name) or name == "nan" or name == "":
            continue
        s2_lookup[name] = extract_l12m(df2, i)

    # Sheet 3: Overall Portfolio (same column layout as Sheet 2)
    s3_lookup = {}
    if not df3.empty:
        for i in range(2, len(df3)):
            name = str(df3.iloc[i, 0]).strip()
            if pd.isna(name) or name == "nan" or name == "":
                continue
            s3_lookup[name] = extract_l12m(df3, i)

    flat_units = []
    zones_data = {}
    regions_data = {}
    territories_data = {}
    country_avg = None

    unassigned_regions = []
    unassigned_territories = []
    unassigned_units = []
    
    for i in range(2, len(df1)):
        name = str(df1.iloc[i, 0]).strip()
        if pd.isna(name) or name == "nan" or name == "":
            continue

        empty_metrics = {
            "collectable": 0, "collection": 0, "colVsCol": 0, "emi": 0,
            "emiVsCol": 0, "portfolio": 0, "npl": 0, "nplPct": 0, "par": 0, "parPct": 0
        }
        metrics = {
            "below10": extract_b10(df1, i),
            "ten20": extract_1020(df1, i),
            "l12m": s2_lookup.get(name, dict(empty_metrics)),
            "overall": s3_lookup.get(name, dict(empty_metrics))
        }

        # If l12m wasn't found in lookup, maybe there's a row in sheet2 with "Country Avg"
        # However, for total we check names
        if "Total Small Business" in name or "Country Average" in name:
            country_avg = metrics
            continue

        obj = {"name": name, "metrics": metrics}

        if "Zone" in name:
            zones_data[name] = metrics
            for r in unassigned_regions:
                r["zone"] = name
                for t in r["territories"]:
                    t["zone"] = name
                    for u in t["units"]:
                        u["zone"] = name
                        u["region"] = r["name"]
                        u["territory"] = t["name"]
                        flat_units.append(u)
            unassigned_regions = []
        elif "Region" in name:
            regions_data[name] = metrics
            obj["territories"] = unassigned_territories
            unassigned_regions.append(obj)
            unassigned_territories = []
        elif "Territory" in name:
            territories_data[name] = metrics
            obj["units"] = unassigned_units
            unassigned_territories.append(obj)
            unassigned_units = []
        else:
            obj["type"] = "Unit"
            unassigned_units.append(obj)

    for r in unassigned_regions:
        for t in r["territories"]:
            for u in t["units"]:
                if "zone" not in u: u["zone"] = "Unassigned"
                u["region"] = r["name"]
                u["territory"] = t["name"]
                flat_units.append(u)
    for t in unassigned_territories:
        for u in t["units"]:
            if "zone" not in u: u["zone"] = "Unassigned"
            if "region" not in u: u["region"] = "Unassigned"
            u["territory"] = t["name"]
            flat_units.append(u)
    for u in unassigned_units:
        if "zone" not in u: u["zone"] = "Unassigned"
        if "region" not in u: u["region"] = "Unassigned"
        if "territory" not in u: u["territory"] = "Unassigned"
        flat_units.append(u)

    # Some rows in sheet2 might be missing, calculate fallback l12m totals for country_avg if not matching properly
    # Check if l12m in country_avg is zeros
    if country_avg and country_avg["l12m"]["colVsCol"] == 0:
        for name, m in s2_lookup.items():
            if "Total Small Business" in name or "Country Average" in name:
                country_avg["l12m"] = m
                break

    # Patch overall portfolio country avg from Sheet3 total row
    if country_avg and ("overall" not in country_avg or country_avg["overall"]["colVsCol"] == 0):
        for name, m in s3_lookup.items():
            if "Total Small Business" in name or "Country Average" in name:
                country_avg["overall"] = m
                break

    output = {
        "unitData": [
            {
                "unit": u["name"],
                "territory": u.get("territory", ""),
                "region": u.get("region", ""),
                "zone": u.get("zone", ""),
                "metrics": u["metrics"]
            } for u in flat_units
        ],
        "countryAvg": country_avg
    }

    js_content = "const dashboardData = " + json.dumps(output, indent=2) + ";\n"
    with open("realData.js", "w", encoding="utf-8") as f:
        f.write(js_content)

    print("Success")

parse_excel()
