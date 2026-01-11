from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class NegotiationInput(BaseModel):
    manufacturing_cost: float = Field(..., gt=0)
    # User provides ONE of these usually, but UI might send both for validation
    target_margin_percent: Optional[float] = None 
    target_selling_price: Optional[float] = None

class NegotiationOutput(BaseModel):
    manufacturing_cost: float
    selling_price: float
    margin_percent: float
    status: Literal['SAFE', 'RISKY', 'LOSS']
    warnings: List[str]

    
def calculate_negotiation(data: NegotiationInput) -> NegotiationOutput:
    cost = data.manufacturing_cost
    price = 0.0
    margin = 0.0
    
    # Mode 1: Margin provided, calc Price
    if data.target_margin_percent is not None:
        margin = data.target_margin_percent
        # selling_price = manufacturing_cost × (1 + margin/100)
        price = round(cost * (1 + margin / 100.0), 2)
        
        # If both provided (e.g. from slider drag), we prioritize the one that 'changed' 
        # (The caller service usually handles 'which one changed', but here we can just verify consistency if needed. 
        # For simplicity, if margin is given, we derive price).

    # Mode 2: Price provided, calc Margin (Overrides Mode 1 if conflict? usually caller decides)
    # In this strict engine, if price is explicitly passed and margin is None, we calc margin.
    elif data.target_selling_price is not None:
        price = data.target_selling_price
        # margin = ((selling_price - manufacturing_cost) / manufacturing_cost) × 100
        if cost > 0:
            margin = round(((price - cost) / cost) * 100.0, 2)
        else:
            margin = 0.0

    # Safety Checks
    status = 'SAFE'
    warnings = []
    
    if price < cost:
        status = 'LOSS'
        warnings.append("Selling Price is below Manufacturing Cost!")
    elif margin < 3.0:
        status = 'RISKY'
        warnings.append("Low Margin: Less than 3%")
    elif margin > 15.0:
        status = 'SAFE' # Still safe financially, but maybe overpriced
        warnings.append("High Margin: > 15% (Check competitive pricing)")
    
    return NegotiationOutput(
        manufacturing_cost=cost,
        selling_price=price,
        margin_percent=margin,
        status=status,
        warnings=warnings
    )
