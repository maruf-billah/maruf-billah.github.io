import pandas as pd
import json
import math

def safe_float(val):
    try:
        f = float(val)
        return 0 if math.isnan(f) else f
    except:
        return 0

def pct(val):
    v = safe_float(val)
    if 0 < v <= 2.5:
        return round(v * 100, 2)
    return round(v, 2)

def amt(val):
    return round(safe_float(val), 2)

xl = pd.ExcelFile('Monitoring Dashboard.xlsx')
df1 = xl.parse(xl.sheet_names[0], header=None)
df2 = xl.parse(xl.sheet_names[1], header=None)
df3 = xl.parse(xl.sheet_names[2], header=None)

row0 = df3.iloc[0].tolist()
parsed_months = []
for c in range(1, len(row0), 13):
    mName = str(row0[c]).strip()
    if mName and mName != "nan":
        parsed_months.append({"name": mName, "colIdx": c})

s3_lookup = {}
s3_avg = None

for i in range(2, len(df3)):
    row = df3.iloc[i].tolist()
    name = str(row[0]).strip()
    if not name or name == "nan":
        continue
    
    m_dict = {}
    for pm in parsed_months:
        c = pm["colIdx"]
        if c + 12 < len(row):
            m_dict[pm["name"]] = {
                "portfolio": amt(row[c]),
                "emi": amt(row[c+1]),
                "collection": amt(row[c+2]),
                "collectable": amt(row[c+3]),
                "collectableCollection": amt(row[c+4]),
                "emiVsCol": pct(row[c+5]),
                "collectablePct": pct(row[c+6]),
                "collectionPct": 0,
                "colVsOut": pct(row[c+7]),
                "colVsCol": pct(row[c+8]),
                "par": amt(row[c+9]),
                "parPct": pct(row[c+10]),
                "npl": amt(row[c+11]),
                "nplPct": pct(row[c+12])
            }
            
    # Add overall fallback
    overall_data = m_dict.get('TOTAL', m_dict.get(parsed_months[-1]["name"] if parsed_months else None, {}))
    m_dict['overall'] = overall_data
    
    s3_lookup[name] = m_dict
    
    lowerName = name.lower()
    if "country average" in lowerName:
        s3_avg = m_dict
    elif not s3_avg and (i == len(df3)-1 or "total" in lowerName or "avg" in lowerName):
        s3_avg = m_dict

subtotals = {}
for name, val in s3_lookup.items():
    subtotals[name] = val

flat_units = []
# Dummy extract for df1 just to get hierarchy (we rely on overall metrics now)
unassigned_regions = []
unassigned_territories = []
unassigned_units = []

for i in range(2, len(df1)):
    name = str(df1.iloc[i, 0]).strip()
    if pd.isna(name) or name == "nan" or name == "":
        continue

    metrics = {
        "overall": s3_lookup.get(name, {})
    }
    # attach the month metrics directly inside unit.metrics
    for pm in parsed_months:
        if pm["name"] in s3_lookup.get(name, {}):
            metrics[pm["name"]] = s3_lookup[name][pm["name"]]

    obj = {"name": name, "metrics": metrics}

    if "Zone" in name:
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
        obj["territories"] = unassigned_territories
        unassigned_regions.append(obj)
        unassigned_territories = []
    elif "Territory" in name:
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
    "countryAvg": s3_avg,
    "subtotals": subtotals,
    "availableMonths": [pm["name"] for pm in parsed_months]
}

with open("realData.js", "w", encoding="utf-8") as f:
    f.write("const dashboardData = " + json.dumps(output, indent=2) + ";\n")
print("Successfully generated new realData.js")
