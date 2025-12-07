"""
Delay Risk Prediction Model
Real XGBoost-based delay risk prediction with training and inference pipeline.
"""

import os
import logging
import joblib
import pandas as pd
import numpy as np
from typing import Literal, Tuple, Optional
from pathlib import Path
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
TRAINING_DATA_PATH = DATA_DIR / "delay_training_data.csv"
MODEL_PATH = MODEL_DIR / "delay_risk_xgboost.joblib"
SCALER_PATH = MODEL_DIR / "delay_risk_scaler.joblib"

# Alternative: if models directory doesn't exist at base, use src/models
if not MODEL_DIR.exists():
    MODEL_DIR = BASE_DIR / "src" / "models"
    MODEL_PATH = MODEL_DIR / "delay_risk_xgboost.joblib"
    SCALER_PATH = MODEL_DIR / "delay_risk_scaler.joblib"

# Ensure directories exist
MODEL_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)


class DelayRiskModel:
    """XGBoost-based delay risk prediction model."""
    
    def __init__(self):
        self.model: Optional[XGBClassifier] = None
        self.scaler: Optional[StandardScaler] = None
        self.feature_names = [
            'sched_dep_time_minutes',
            'prev_delay_minutes',
            'aircraft_type_B737-800',
            'aircraft_type_B737-MAX',
            'aircraft_type_A320-200',
            'aircraft_type_A321neo',
            'weather_CLEAR',
            'weather_RAIN',
            'weather_SNOW',
            'weather_STORM',
            'weather_FOG'
        ]
        self._load_or_train()
    
    def _load_or_train(self):
        """Load existing model or train a new one."""
        if MODEL_PATH.exists() and SCALER_PATH.exists():
            try:
                logger.info("Loading existing model from disk...")
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                logger.info("Model loaded successfully")
                return
            except Exception as e:
                logger.warning(f"Failed to load model: {e}. Training new model...")
        
        # Train new model
        self._train()
    
    def _train(self):
        """Train the XGBoost model on training data."""
        if not TRAINING_DATA_PATH.exists():
            logger.error(f"Training data not found at {TRAINING_DATA_PATH}")
            raise FileNotFoundError(f"Training data not found at {TRAINING_DATA_PATH}")
        
        logger.info("Loading training data...")
        df = pd.read_csv(TRAINING_DATA_PATH)
        
        # Separate features and target
        X = df[self.feature_names]
        y = df['delay_occurred']
        
        logger.info(f"Training data shape: {X.shape}, Target distribution: {y.value_counts().to_dict()}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        logger.info("Scaling features...")
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train XGBoost model
        logger.info("Training XGBoost classifier...")
        self.model = XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
            eval_metric='logloss'
        )
        
        self.model.fit(
            X_train_scaled,
            y_train,
            eval_set=[(X_test_scaled, y_test)],
            verbose=False
        )
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        logger.info(f"Model trained - Train accuracy: {train_score:.4f}, Test accuracy: {test_score:.4f}")
        
        # Save model and scaler
        logger.info(f"Saving model to {MODEL_PATH}...")
        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.scaler, SCALER_PATH)
        logger.info("Model saved successfully")
    
    def _prepare_features(
        self,
        sched_dep_time: str,
        prev_delay_minutes: int,
        aircraft_type: str,
        weather_condition: Literal["CLEAR", "RAIN", "SNOW", "STORM", "FOG"]
    ) -> np.ndarray:
        """Convert input parameters to feature vector."""
        try:
            # Parse time to minutes since midnight
            time_parts = sched_dep_time.split(":")
            sched_dep_time_minutes = int(time_parts[0]) * 60 + int(time_parts[1])
        except (ValueError, IndexError):
            logger.warning(f"Invalid time format: {sched_dep_time}, defaulting to 480 (8:00)")
            sched_dep_time_minutes = 480
        
        # Create feature vector
        features = {
            'sched_dep_time_minutes': sched_dep_time_minutes,
            'prev_delay_minutes': prev_delay_minutes,
            'aircraft_type_B737-800': 1 if aircraft_type == 'B737-800' else 0,
            'aircraft_type_B737-MAX': 1 if aircraft_type == 'B737-MAX' else 0,
            'aircraft_type_A320-200': 1 if aircraft_type == 'A320-200' else 0,
            'aircraft_type_A321neo': 1 if aircraft_type == 'A321neo' else 0,
            'weather_CLEAR': 1 if weather_condition == 'CLEAR' else 0,
            'weather_RAIN': 1 if weather_condition == 'RAIN' else 0,
            'weather_SNOW': 1 if weather_condition == 'SNOW' else 0,
            'weather_STORM': 1 if weather_condition == 'STORM' else 0,
            'weather_FOG': 1 if weather_condition == 'FOG' else 0,
        }
        
        # Convert to array in correct order
        feature_vector = np.array([features[name] for name in self.feature_names]).reshape(1, -1)
        
        return feature_vector
    
    def predict(
        self,
        sched_dep_time: str,
        prev_delay_minutes: int,
        aircraft_type: str,
        weather_condition: Literal["CLEAR", "RAIN", "SNOW", "STORM", "FOG"]
    ) -> Tuple[float, str]:
        """
        Predict delay risk probability and level.
        
        Args:
            sched_dep_time: Scheduled departure time in HH:mm format
            prev_delay_minutes: Previous delay in minutes
            aircraft_type: Aircraft type
            weather_condition: Weather condition
            
        Returns:
            Tuple of (risk_score, risk_level)
            risk_score: Probability between 0 and 1
            risk_level: "low", "medium", or "high"
        """
        if self.model is None or self.scaler is None:
            raise RuntimeError("Model not loaded. Cannot make predictions.")
        
        try:
            # Prepare features
            feature_vector = self._prepare_features(
                sched_dep_time, prev_delay_minutes, aircraft_type, weather_condition
            )
            
            # Scale features
            feature_vector_scaled = self.scaler.transform(feature_vector)
            
            # Predict probability
            proba = self.model.predict_proba(feature_vector_scaled)[0]
            risk_score = float(proba[1])  # Probability of delay (class 1)
            
            # Determine risk level based on specified thresholds
            if risk_score < 0.25:
                risk_level = "low"
            elif risk_score <= 0.6:
                risk_level = "medium"
            else:
                risk_level = "high"
            
            logger.info(
                f"Prediction - Time: {sched_dep_time}, Prev Delay: {prev_delay_minutes}min, "
                f"Aircraft: {aircraft_type}, Weather: {weather_condition}, "
                f"Risk: {risk_score:.4f} ({risk_level})"
            )
            
            return risk_score, risk_level
            
        except Exception as e:
            logger.error(f"Error during prediction: {e}", exc_info=True)
            raise


# Global model instance (loaded on module import)
_model_instance: Optional[DelayRiskModel] = None


def get_model() -> DelayRiskModel:
    """Get or create the global model instance."""
    global _model_instance
    if _model_instance is None:
        _model_instance = DelayRiskModel()
    return _model_instance


def calculate_delay_risk(
    sched_dep_time: str,
    prev_delay_minutes: int,
    aircraft_type: str,
    weather_condition: Literal["CLEAR", "RAIN", "SNOW", "STORM", "FOG"]
) -> Tuple[float, str]:
    """
    Calculate delay risk score and level using XGBoost model.
    
    Args:
        sched_dep_time: Scheduled departure time in HH:mm format
        prev_delay_minutes: Previous delay in minutes
        aircraft_type: Aircraft type (e.g., "B737-800")
        weather_condition: Weather condition
        
    Returns:
        Tuple of (risk_score, risk_level)
    """
    model = get_model()
    return model.predict(sched_dep_time, prev_delay_minutes, aircraft_type, weather_condition)
