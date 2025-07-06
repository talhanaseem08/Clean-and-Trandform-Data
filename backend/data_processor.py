import pandas as pd
from fastapi import UploadFile
from sklearn.preprocessing import StandardScaler
import io

def process_csv_file(file: UploadFile, options: dict):
   
    
    # Read the file content into memory to allow multiple reads
    content = file.file.read()
    file_stream = io.StringIO(content.decode('utf-8'))
    
    try:
        df = pd.read_csv(file_stream)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        # Return a specific error structure if CSV is invalid
        return {"error": f"Could not parse CSV file. Error: {e}"}

    

    summary = {
        "operations_performed": [],
        "original_rows": len(df),
        "original_cols": len(df.columns),
    }

    # --- Conditionally Apply Cleaning Steps ---

    if options.get("removeDuplicates"):
        initial_rows = len(df)
        df.drop_duplicates(inplace=True)
        summary["duplicates_removed"] = initial_rows - len(df)
        summary["operations_performed"].append("Removed Duplicates")
       

    if options.get("handleMissing"):
        initial_rows = len(df)
        df.dropna(inplace=True)
        summary["missing_value_rows_removed"] = initial_rows - len(df)
        summary["operations_performed"].append("Handled Missing Values")
    

    if options.get("detectOutliers"):
        initial_rows = len(df)
        numeric_cols = df.select_dtypes(include=['number']).columns
        if not numeric_cols.empty:
            Q1 = df[numeric_cols].quantile(0.25)
            Q3 = df[numeric_cols].quantile(0.75)
            IQR = Q3 - Q1
            # Keep rows that are within the 1.5*IQR range
            df = df[~((df[numeric_cols] < (Q1 - 1.5 * IQR)) | (df[numeric_cols] > (Q3 + 1.5 * IQR))).any(axis=1)]
        summary["outliers_removed"] = initial_rows - len(df)
        summary["operations_performed"].append("Removed Outliers")
       

    if options.get("standardizeData"):
        numeric_cols = df.select_dtypes(include=['number']).columns
        if not numeric_cols.empty:
            scaler = StandardScaler()
            df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
            summary["standardized_columns"] = list(numeric_cols)
            summary["operations_performed"].append("Standardized Data")
            

    # --- Gather Final Statistics & Preview ---

    summary["cleaned_rows"] = len(df)
    
    # Get a preview of the first 10 rows of the cleaned data
    summary["data_preview"] = df.head(10).to_dict(orient='records')
    
    # Get numerical and categorical statistics
    numeric_df = df.select_dtypes(include=['number'])
    categorical_df = df.select_dtypes(include=['object', 'category'])
    
    summary["statistics"] = {
        "numerical": numeric_df.describe().to_dict() if not numeric_df.empty else {},
        "categorical": categorical_df.describe().to_dict() if not categorical_df.empty else {}
    }
    
   
    return summary,df