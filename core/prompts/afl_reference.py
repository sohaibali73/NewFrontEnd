"""
AFL Reference Data
Comprehensive reference for AFL functions, syntax, and best practices.
"""

from typing import Dict, List, Set

# =============================================================================
# FUNCTION SIGNATURES
# =============================================================================

SINGLE_ARG_FUNCTIONS: Dict[str, dict] = {
    "RSI": {
        "signature": "RSI(periods)",
        "description": "Relative Strength Index",
        "example": "RSI_Val = RSI(14);",
        "returns": "Array (0-100)",
        "common_periods": [7, 14, 21]
    },
    "ATR": {
        "signature": "ATR(periods)",
        "description": "Average True Range",
        "example": "ATR_Val = ATR(14);",
        "returns": "Array (price units)",
        "common_periods": [10, 14, 20]
    },
    "ADX": {
        "signature": "ADX(periods)",
        "description": "Average Directional Index",
        "example": "ADX_Val = ADX(14);",
        "returns": "Array (0-100)",
        "common_periods": [14, 20]
    },
    "CCI": {
        "signature": "CCI(periods)",
        "description": "Commodity Channel Index",
        "example": "CCI_Val = CCI(20);",
        "returns": "Array (unbounded, typically -200 to +200)",
        "common_periods": [14, 20]
    },
    "MFI": {
        "signature": "MFI(periods)",
        "description": "Money Flow Index",
        "example": "MFI_Val = MFI(14);",
        "returns": "Array (0-100)",
        "common_periods": [14]
    },
    "PDI": {
        "signature": "PDI(periods)",
        "description": "Plus Directional Indicator",
        "example": "PDI_Val = PDI(14);",
        "returns": "Array (0-100)",
        "common_periods": [14]
    },
    "MDI": {
        "signature": "MDI(periods)",
        "description": "Minus Directional Indicator",
        "example": "MDI_Val = MDI(14);",
        "returns": "Array (0-100)",
        "common_periods": [14]
    },
    "OBV": {
        "signature": "OBV()",
        "description": "On Balance Volume",
        "example": "OBV_Val = OBV();",
        "returns": "Array (cumulative volume)",
        "common_periods": []
    },
    "StochK": {
        "signature": "StochK(periods)",
        "description": "Stochastic %K",
        "example": "StochK_Val = StochK(14);",
        "returns": "Array (0-100)",
        "common_periods": [5, 14]
    },
    "StochD": {
        "signature": "StochD(periods)",
        "description": "Stochastic %D",
        "example": "StochD_Val = StochD(14);",
        "returns": "Array (0-100)",
        "common_periods": [3, 5]
    },
}

DOUBLE_ARG_FUNCTIONS: Dict[str, dict] = {
    "MA": {
        "signature": "MA(array, periods)",
        "description": "Simple Moving Average",
        "example": "MA_Val = MA(Close, 200);",
        "returns": "Array",
        "common_periods": [10, 20, 50, 100, 200]
    },
    "EMA": {
        "signature": "EMA(array, periods)",
        "description": "Exponential Moving Average",
        "example": "EMA_Val = EMA(Close, 20);",
        "returns": "Array",
        "common_periods": [8, 12, 20, 26, 50]
    },
    "SMA": {
        "signature": "SMA(array, periods)",
        "description": "Simple Moving Average (alias for MA)",
        "example": "SMA_Val = SMA(Close, 50);",
        "returns": "Array",
        "common_periods": [10, 20, 50, 100, 200]
    },
    "WMA": {
        "signature": "WMA(array, periods)",
        "description": "Weighted Moving Average",
        "example": "WMA_Val = WMA(Close, 20);",
        "returns": "Array",
        "common_periods": [10, 20, 50]
    },
    "DEMA": {
        "signature": "DEMA(array, periods)",
        "description": "Double Exponential Moving Average",
        "example": "DEMA_Val = DEMA(Close, 20);",
        "returns": "Array",
        "common_periods": [10, 20]
    },
    "TEMA": {
        "signature": "TEMA(array, periods)",
        "description": "Triple Exponential Moving Average",
        "example": "TEMA_Val = TEMA(Close, 20);",
        "returns": "Array",
        "common_periods": [10, 20]
    },
    "ROC": {
        "signature": "ROC(array, periods)",
        "description": "Rate of Change",
        "example": "ROC_Val = ROC(Close, 10);",
        "returns": "Array (percentage)",
        "common_periods": [10, 14, 20]
    },
    "HHV": {
        "signature": "HHV(array, periods)",
        "description": "Highest High Value",
        "example": "HHV_Val = HHV(High, 20);",
        "returns": "Array",
        "common_periods": [10, 20, 52]
    },
    "LLV": {
        "signature": "LLV(array, periods)",
        "description": "Lowest Low Value",
        "example": "LLV_Val = LLV(Low, 20);",
        "returns": "Array",
        "common_periods": [10, 20, 52]
    },
    "StDev": {
        "signature": "StDev(array, periods)",
        "description": "Standard Deviation",
        "example": "StDev_Val = StDev(Close, 20);",
        "returns": "Array",
        "common_periods": [10, 20]
    },
    "Sum": {
        "signature": "Sum(array, periods)",
        "description": "Sum over periods",
        "example": "Sum_Val = Sum(Volume, 20);",
        "returns": "Array",
        "common_periods": [5, 10, 20]
    },
    "Ref": {
        "signature": "Ref(array, offset)",
        "description": "Reference past/future values",
        "example": "PrevClose = Ref(Close, -1);",
        "returns": "Array",
        "common_periods": [-1, -5, -10]
    },
    "LinearReg": {
        "signature": "LinearReg(array, periods)",
        "description": "Linear Regression",
        "example": "LinReg_Val = LinearReg(Close, 20);",
        "returns": "Array",
        "common_periods": [10, 14, 20]
    },
}

MULTI_ARG_FUNCTIONS: Dict[str, dict] = {
    "BBandTop": {
        "signature": "BBandTop(array, periods, width)",
        "description": "Bollinger Band Top",
        "example": "BB_Top = BBandTop(Close, 20, 2);",
        "returns": "Array"
    },
    "BBandBot": {
        "signature": "BBandBot(array, periods, width)",
        "description": "Bollinger Band Bottom",
        "example": "BB_Bot = BBandBot(Close, 20, 2);",
        "returns": "Array"
    },
    "MACD": {
        "signature": "MACD(fast, slow)",
        "description": "MACD Line",
        "example": "MACD_Line = MACD(12, 26);",
        "returns": "Array"
    },
    "Signal": {
        "signature": "Signal(fast, slow, signal_period)",
        "description": "MACD Signal Line",
        "example": "Signal_Line = Signal(12, 26, 9);",
        "returns": "Array"
    },
    "SAR": {
        "signature": "SAR(acceleration, maximum)",
        "description": "Parabolic SAR",
        "example": "SAR_Val = SAR(0.02, 0.2);",
        "returns": "Array"
    },
    "ApplyStop": {
        "signature": "ApplyStop(type, mode, value, exitAtStop, volatile, ReEntryDelay)",
        "description": "Apply stop loss/profit target",
        "example": "ApplyStop(stopTypeTrailing, stopModePercent, 5, True);",
        "returns": "None (modifies backtest)"
    },
}

# =============================================================================
# COLORS
# =============================================================================

AFL_COLORS: Dict[str, str] = {
    "colorBlack": "RGB(0,0,0)",
    "colorBlue": "RGB(0,0,255)",
    "colorRed": "RGB(255,0,0)",
    "colorGreen": "RGB(0,255,0)",
    "colorYellow": "RGB(255,255,0)",
    "colorWhite": "RGB(255,255,255)",
    "colorBrown": "RGB(128,64,0)",
    "colorOrange": "RGB(255,128,0)",
    "colorPink": "RGB(255,128,192)",
    "colorGold": "RGB(255,192,0)",
    "colorAqua": "RGB(0,255,255)",
    "colorGrey40": "RGB(102,102,102)",
    "colorGrey50": "RGB(128,128,128)",
    "colorLightBlue": "RGB(128,192,255)",
    "colorLightGrey": "RGB(192,192,192)",
    "colorLightOrange": "RGB(255,192,128)",
    "colorPaleGreen": "RGB(192,255,192)",
    "colorDefault": "Default color from settings",
}

# =============================================================================
# RESERVED WORDS
# =============================================================================

AFL_RESERVED_TRADING: Set[str] = {
    "Buy", "Sell", "Short", "Cover",
    "BuyPrice", "SellPrice", "ShortPrice", "CoverPrice",
}

AFL_RESERVED_PRICE: Set[str] = {
    "Open", "High", "Low", "Close", "Volume", "OpenInt",
    "O", "H", "L", "C", "V", "OI", "Average", "A",
}

AFL_RESERVED_FUNCTIONS: Set[str] = {
    "RSI", "MACD", "MA", "EMA", "SMA", "WMA", "ATR", "ADX", "CCI", "MFI",
    "OBV", "PDI", "MDI", "ROC", "HHV", "LLV", "Ref", "Sum", "Cum",
    "IIf", "Cross", "ExRem", "Flip", "BarsSince", "ValueWhen",
    "HighestSince", "LowestSince", "Peak", "Trough",
    "Foreign", "SetForeign", "RestorePriceArrays",
    "Plot", "PlotShapes", "PlotGrid", "PlotOHLC",
    "Param", "ParamToggle", "ParamList", "ParamColor", "ParamStr",
    "Optimize", "SetOption", "SetTradeDelays", "ApplyStop",
    "AddColumn", "AddTextColumn", "AddMultiTextColumn",
}

AFL_RESERVED_SYSTEM: Set[str] = {
    "Filter", "PositionSize", "PositionScore",
    "NumColumns", "MaxGraph", "title",
    "graph0", "graph1", "graph2", "graph3", "graph4",
    "True", "False", "Null",
}

AFL_RESERVED_WORDS: Set[str] = (
    AFL_RESERVED_TRADING |
    AFL_RESERVED_PRICE |
    AFL_RESERVED_FUNCTIONS |
    AFL_RESERVED_SYSTEM
)

# =============================================================================
# PLOT STYLES
# =============================================================================

AFL_PLOT_STYLES: Dict[str, str] = {
    "styleLine": "Simple line",
    "styleHistogram": "Histogram bars",
    "styleCandle": "Candlestick chart",
    "styleBar": "OHLC bars",
    "styleArea": "Filled area",
    "styleDots": "Dots only",
    "styleThick": "Thick line modifier",
    "styleDashed": "Dashed line modifier",
    "styleNoLine": "No line (shapes only)",
    "styleOwnScale": "Use own Y-axis scale",
    "styleNoLabel": "Hide label",
    "styleNoRescale": "Don't rescale pane",
    "styleLeftAxisScale": "Use left Y-axis",
}

AFL_SHAPES: Dict[str, str] = {
    "shapeUpArrow": "Up arrow (for Buy signals)",
    "shapeDownArrow": "Down arrow (for Sell signals)",
    "shapeUpTriangle": "Up triangle",
    "shapeDownTriangle": "Down triangle",
    "shapeCircle": "Circle",
    "shapeSquare": "Square",
    "shapeStar": "Star",
    "shapeNone": "No shape (hide)",
    "shapeHollowUpArrow": "Hollow up arrow",
    "shapeHollowDownArrow": "Hollow down arrow",
    "shapeSmallCircle": "Small circle",
    "shapeSmallUpTriangle": "Small up triangle",
    "shapeSmallDownTriangle": "Small down triangle",
}


# =============================================================================
# REFERENCE CLASS
# =============================================================================

class AFLReference:
    """Centralized AFL reference data access."""

    SINGLE_ARG_FUNCTIONS = SINGLE_ARG_FUNCTIONS
    DOUBLE_ARG_FUNCTIONS = DOUBLE_ARG_FUNCTIONS
    MULTI_ARG_FUNCTIONS = MULTI_ARG_FUNCTIONS
    COLORS = AFL_COLORS
    RESERVED = AFL_RESERVED_WORDS
    PLOT_STYLES = AFL_PLOT_STYLES
    SHAPES = AFL_SHAPES

    @classmethod
    def get_all_functions(cls) -> Dict[str, dict]:
        """Get all function definitions."""
        return {
            **cls.SINGLE_ARG_FUNCTIONS,
            **cls.DOUBLE_ARG_FUNCTIONS,
            **cls.MULTI_ARG_FUNCTIONS
        }

    @classmethod
    def get_function_signature(cls, func_name: str) -> str:
        """Get the correct signature for a function."""
        all_funcs = cls.get_all_functions()
        if func_name in all_funcs:
            return all_funcs[func_name].get("signature", "Unknown")
        return "Function not found"

    @classmethod
    def is_single_arg_function(cls, func_name: str) -> bool:
        """Check if function takes single argument (no array)."""
        return func_name in cls.SINGLE_ARG_FUNCTIONS

    @classmethod
    def is_double_arg_function(cls, func_name: str) -> bool:
        """Check if function takes array and period."""
        return func_name in cls.DOUBLE_ARG_FUNCTIONS

    @classmethod
    def is_reserved_word(cls, word: str) -> bool:
        """Check if word is reserved in AFL."""
        return word in cls.RESERVED

    @classmethod
    def get_safe_variable_name(cls, base_name: str) -> str:
        """Get a safe variable name that doesn't conflict with reserved words."""
        if base_name in cls.RESERVED:
            return f"{base_name}_Val"
        return base_name

    @classmethod
    def validate_function_call(cls, func_name: str, num_args: int) -> tuple:
        """
        Validate a function call has correct number of arguments.
        Returns (is_valid, expected_args, message)
        """
        if func_name in cls.SINGLE_ARG_FUNCTIONS:
            if num_args == 1:
                return (True, 1, "Correct")
            return (False, 1, f"{func_name} takes 1 argument (period only), not {num_args}")

        if func_name in cls.DOUBLE_ARG_FUNCTIONS:
            if num_args == 2:
                return (True, 2, "Correct")
            return (False, 2, f"{func_name} takes 2 arguments (array, period), not {num_args}")

        if func_name in cls.MULTI_ARG_FUNCTIONS:
            return (True, -1, "Multi-argument function - check documentation")

        return (True, -1, "Unknown function - cannot validate")

    @classmethod
    def get_common_mistakes(cls) -> List[str]:
        """Get list of common AFL mistakes."""
        return [
            "RSI(Close, 14) should be RSI(14)",
            "ATR(Close, 14) should be ATR(14)",
            "ADX(Close, 14) should be ADX(14)",
            "CCI(Close, 20) should be CCI(20)",
            "MFI(Close, 14) should be MFI(14)",
            "MA(14) should be MA(Close, 14)",
            "EMA(20) should be EMA(Close, 20)",
            "RSI = RSI(14) shadows built-in - use RSI_Val = RSI(14)",
            "Missing ExRem() causes duplicate signals",
            "TimeFrameExpand() required after TimeFrameSet()",
        ]


def get_function_reference_text() -> str:
    """Generate formatted function reference text."""
    text = "## AFL FUNCTION REFERENCE\n\n"

    text += "### Single Argument Functions (NO array parameter)\n"
    for name, info in SINGLE_ARG_FUNCTIONS.items():
        text += f"- {info['signature']} - {info['description']}\n"
        text += f"  Example: {info['example']}\n"

    text += "\n### Double Argument Functions (array, period)\n"
    for name, info in DOUBLE_ARG_FUNCTIONS.items():
        text += f"- {info['signature']} - {info['description']}\n"
        text += f"  Example: {info['example']}\n"

    text += "\n### Multi-Argument Functions\n"
    for name, info in MULTI_ARG_FUNCTIONS.items():
        text += f"- {info['signature']} - {info['description']}\n"
        text += f"  Example: {info['example']}\n"

    return text