import pandas as pd
import os

class ExcelMasterService:
    def __init__(self, file_path='assets/product_cost_master.xlsx'):
        self.file_path = file_path
        
    def _verify_file(self):
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"Master Excel file not found at: {self.file_path}")

    def get_categories(self):
        """Returns list of Sheet Names (Categories)"""
        self._verify_file()
        try:
            # Using openpyxl engine via pandas to just read sheet names efficiently? 
            # pd.ExcelFile is better for metadata without loading all data
            xls = pd.ExcelFile(self.file_path)
            return xls.sheet_names
        except Exception as e:
            print(f"Error reading Excel categories: {e}")
            return []

    def get_products_by_category(self, category_name):
        """Returns list of products (dicts) from a specific sheet"""
        self._verify_file()
        try:
            df = pd.read_excel(self.file_path, sheet_name=category_name)
            
            # Clean Data:
            # 1. Drop completely empty rows
            df = df.dropna(how='all')
            
            # 2. Fill NaN with logical defaults or handling
            # For JSON serialization, NaN is invalid. We replace with None or 0.
            # However, some fields like 'cores' might be NaN for single core wires.
            df = df.where(pd.notnull(df), None)
            
            # Convert to list of dicts
            return df.to_dict(orient='records')
            
        except ValueError:
            # Sheet not found
            return []
        except Exception as e:
            print(f"Error reading products for {category_name}: {e}")
            return []
