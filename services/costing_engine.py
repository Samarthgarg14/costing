from pydantic import BaseModel, Field, model_validator
from typing import Literal, Optional
from enum import Enum

class ProductCategory(str, Enum):
    MULTICORE_COPPER = "multicore_copper_cable"
    MULTISTRAND_COPPER = "multistrand_copper_wire"
    MULTISTRAND_ALU = "multistrand_aluminium_wire"
    MULTICORE_ALU = "multicore_aluminium_cable"

class CostingInput(BaseModel):
    category: ProductCategory
    
    # Design Inputs
    gauge: float = Field(..., gt=0, description="Wire gauge")
    strands: Optional[int] = Field(None, gt=0, description="Number of strands")
    cores: Optional[int] = Field(None, gt=0, description="Number of cores")
    
    length_gaj: float = Field(..., gt=0)
    coil_weight_kg: float = Field(..., gt=0)
    
    # Market Inputs (Metal Type is now derived from Category, but rate is passed)
    # We allow user to pass specific 'metal_rate' and 'pvc_rate' naming is generic
    metal_rate_per_kg: float = Field(..., gt=0)
    pvc_rate_per_kg: float = Field(..., gt=0)
    
    # Labour Inputs
    labour_type: Literal['percentage', 'per_kg']
    labour_value: float = Field(..., ge=0)

    @model_validator(mode='after')
    def enforce_category_rules(self):
        cat = self.category
        
        # 1. Enforce Strands for Aluminium
        if cat in [ProductCategory.MULTISTRAND_ALU, ProductCategory.MULTICORE_ALU]:
            self.strands = 7
        elif self.strands is None:
            raise ValueError("Strands must be provided for Copper products")

        # 2. Enforce Cores
        if cat in [ProductCategory.MULTISTRAND_COPPER, ProductCategory.MULTISTRAND_ALU]:
            self.cores = 1
        elif self.cores is None:
            raise ValueError("Number of Cores must be provided for Multicore products")
            
        return self

class CostingOutput(BaseModel):
    category: str
    metal_weight_kg: float
    pvc_weight_kg: float
    metal_cost: float
    pvc_cost: float
    material_cost: float
    labour_cost: float
    manufacturing_cost: float
    is_valid: bool
    error: Optional[str] = None

FACTOR_COPPER = 412
FACTOR_ALUMINIUM = 300

def calculate_manufacturing_cost(data: CostingInput) -> CostingOutput:
    try:
        # Determine Metal Factor
        if 'copper' in data.category.value:
            factor = FACTOR_COPPER
        else:
            factor = FACTOR_ALUMINIUM
            
        # 1. Calculate Metal Weight
        # Formula: (gauge² * FACTOR * strands * length_gaj * cores) / 1e8
        # Note: strands and cores are guaranteed by validator
        metal_weight_raw = (
            data.gauge**2 * 
            factor * 
            data.strands * 
            data.length_gaj * 
            data.cores
        ) / 100000000.0
        
        metal_weight_kg = round(metal_weight_raw, 4)

        # 2. Weight Balancing
        pvc_weight_kg = round(data.coil_weight_kg - metal_weight_kg, 4)

        if pvc_weight_kg < 0:
            return CostingOutput(
                category=data.category.value,
                metal_weight_kg=metal_weight_kg,
                pvc_weight_kg=pvc_weight_kg,
                metal_cost=0, pvc_cost=0, material_cost=0, labour_cost=0, manufacturing_cost=0,
                is_valid=False,
                error=f"Impossible Spec: Metal Weight ({metal_weight_kg}kg) > Coil Weight ({data.coil_weight_kg}kg)"
            )

        # 3. Costs
        metal_cost = round(metal_weight_kg * data.metal_rate_per_kg, 2)
        pvc_cost = round(pvc_weight_kg * data.pvc_rate_per_kg, 2)
        material_cost = round(metal_cost + pvc_cost, 2)
        
        labour_cost = 0.0
        if data.labour_type == 'percentage':
            labour_cost = round(material_cost * (data.labour_value / 100.0), 2)
        else:
            # per_kg usually on Metal Weight or Coil Weight? 
            # Previous prompt said "metal_weight * labour_rate" for per_kg
            labour_cost = round(metal_weight_kg * data.labour_value, 2)
            
        manufacturing_cost = round(material_cost + labour_cost, 2)
        
        return CostingOutput(
            category=data.category.value,
            metal_weight_kg=metal_weight_kg,
            pvc_weight_kg=pvc_weight_kg,
            metal_cost=metal_cost,
            pvc_cost=pvc_cost,
            material_cost=material_cost,
            labour_cost=labour_cost,
            manufacturing_cost=manufacturing_cost,
            is_valid=True
        )

    except Exception as e:
        return CostingOutput(
            category=data.category.value if data.category else "unknown",
            metal_weight_kg=0, pvc_weight_kg=0, metal_cost=0, pvc_cost=0, 
            material_cost=0, labour_cost=0, manufacturing_cost=0,
            is_valid=False,
            error=str(e)
        )
