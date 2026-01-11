from flask import Flask, render_template, jsonify, request
from pydantic import ValidationError
from services.costing_engine import CostingInput, calculate_manufacturing_cost
from services.negotiation_engine import NegotiationInput, calculate_negotiation

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/health')
def health():
    return jsonify({"status": "ok", "message": "Costing Engine is Running"})

@app.route('/api/calculate-cost', methods=['POST'])
def api_calculate_cost():
    try:
        data = request.json
        # Pydantic Validation
        input_data = CostingInput(**data)
        result = calculate_manufacturing_cost(input_data)
        
        if not result.is_valid:
             return jsonify({"error": result.error}), 400
             
        return jsonify(result.model_dump())
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/negotiate', methods=['POST'])
def api_negotiate():
    try:
        data = request.json
        input_data = NegotiationInput(**data)
        result = calculate_negotiation(input_data)
        return jsonify(result.model_dump())
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- MASTER DATA API ---
from services.excel_service import ExcelMasterService
excel_service = ExcelMasterService()

@app.route('/api/master/categories', methods=['GET'])
def api_master_categories():
    try:
        cats = excel_service.get_categories()
        return jsonify(cats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/master/products', methods=['GET'])
def api_master_products():
    category = request.args.get('category')
    if not category:
        return jsonify({"error": "Category is required"}), 400
    try:
        products = excel_service.get_products_by_category(category)
        return jsonify(products)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
