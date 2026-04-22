import pandas as pd
import json
import math

def is_nan(x):
    if isinstance(x, float) and math.isnan(x):
        return True
    return pd.isna(x)

def extract_sheet(filename, sheet_index):
    xl = pd.ExcelFile(filename)
    df = xl.parse(xl.sheet_names[sheet_index], header=None)
    
    # Typically row 1 or 2 contains the headers. Let's find the row that has 'Area/Territory/Region/Zone' or similar
    header_row_idx = -1
    for i in range(min(10, len(df))):
        val = str(df.iloc[i, 0]).lower()
        if 'area' in val or 'territory' in val or 'region' in val or 'zone' in val:
            header_row_idx = i
            break
            
    if header_row_idx == -1:
        return []
        
    # The columns: Look for 'Col', 'EMI', 'NPL', 'PAR' percentages
    # Let's map column indices by inspecting row `header_row_idx` or `header_row_idx - 1`
    
    # But an easier way is to just find the columns that contain percentage values or look at the headers.
    headers = []
    for c in range(len(df.columns)):
        # Join the first few rows to get a full column name
        col_name = " ".join([str(df.iloc[r, c]) for r in range(max(0, header_row_idx-1), header_row_idx+1) if not is_nan(df.iloc[r, c])])
        headers.append(col_name.lower())
        
    # Find indices
    col_idx = -1
    emi_idx = -1
    npl_idx = -1
    par_idx = -1
    
    for i, h in enumerate(headers):
        if 'collectable vs collection' in h and ('%' in h or i == 3): # Assuming index 3 based on preview
            col_idx = i
        if 'emi vs collection' in h and ('%' in h or i == 6):
            emi_idx = i
        if 'npl %' in h or ('npl' in h and '%' in h):
            npl_idx = i
        if 'par %' in h or ('par' in h and '%' in h):
            par_idx = i
            
    # Fallbacks based on typical structure if headers are weird
    if col_idx == -1: col_idx = 3 # typically percentage is after Collectable, Collection
    if emi_idx == -1: emi_idx = 6 # EMI, Collection, EMI vs Col%
    if npl_idx == -1: npl_idx = 8
    if par_idx == -1: par_idx = 10
    
    data = []
    
    current_zone = "Unknown"
    current_region = "Unknown"
    current_territory = "Unknown"
    
    # Process rows going down
    # We might need to detect if a row is a Zone, Region, Territory, or Unit by the text or indentation or name
    # "Zone" usually contains "Zone"
    # "Region" usually contains "Region"
    # "Territory" usually contains "Territory"
    # Otherwise it's a Unit
    
    for i in range(header_row_idx + 1, len(df)):
        name = str(df.iloc[i, 0]).strip()
        if is_nan(name) or name == "nan" or name == "":
            continue
            
        if "Country Average" in name or "Average" in name:
            row_type = "Average"
        elif "Zone" in name:
            row_type = "Zone"
            current_zone = name
        elif "Region" in name:
            row_type = "Region"
            current_region = name
        elif "Territory" in name:
            row_type = "Territory"
            current_territory = name
        else:
            row_type = "Unit"
            
        try:
            col_val = float(df.iloc[i, col_idx]) if not is_nan(df.iloc[i, col_idx]) else 0
            if col_val < 1: col_val *= 100 # convert decimal to percentage
        except: col_val = 0
            
        try:
            emi_val = float(df.iloc[i, emi_idx]) if not is_nan(df.iloc[i, emi_idx]) else 0
            if emi_val < 1: emi_val *= 100
        except: emi_val = 0
            
        try:
            npl_val = float(df.iloc[i, npl_idx]) if not is_nan(df.iloc[i, npl_idx]) else 0
            if npl_val < 1: npl_val *= 100
        except: npl_val = 0
            
        try:
            par_val = float(df.iloc[i, par_idx]) if not is_nan(df.iloc[i, par_idx]) else 0
            if par_val < 1: par_val *= 100
        except: par_val = 0
        
        data.append({
            "name": name,
            "type": row_type,
            "zone": current_zone if row_type != "Zone" and row_type != "Average" else name if row_type == "Zone" else None,
            "region": current_region if row_type in ["Territory", "Unit"] else None,
            "territory": current_territory if row_type == "Unit" else None,
            "colVsCol": round(col_val, 1),
            "emiVsCol": round(emi_val, 1),
            "npl": round(npl_val, 1),
            "par": round(par_val, 1)
        })
        
    return data

sheet1_data = extract_sheet('Monitoring Dashboard.xlsx', 0)
sheet2_data = extract_sheet('Monitoring Dashboard.xlsx', 1)

output = {
    "sheet1": sheet1_data,
    "sheet2": sheet2_data
}

with open('debug_output.json', 'w') as f:
    json.dump(output, f, indent=2)

print("Extraction complete. Found", len(sheet1_data), "rows in Sheet 1 and", len(sheet2_data), "rows in Sheet 2")
