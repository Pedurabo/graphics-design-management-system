import cv2
import numpy as np
from sklearn.feature_selection import SelectKBest, f_classif, chi2
from sklearn.preprocessing import StandardScaler
import colorsys
from typing import Dict, List, Tuple, Any
import json

class ComputerVisionEngine:
    """
    Advanced Computer Vision Engine based on Rice MSC Dataset methodology
    Implements 106 feature extraction: 12 morphological + 4 shape + 90 color features
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_selector = SelectKBest(score_func=f_classif, k=5)
        self.most_effective_features = [
            'roundness', 'compactness', 'shape_factor_3', 
            'aspect_ratio', 'eccentricity'
        ]
        
    def extract_all_features(self, image: np.ndarray) -> Dict[str, float]:
        """
        Extract all 106 features from image
        Returns: Dictionary with all extracted features
        """
        features = {}
        
        # Convert to grayscale for morphological features
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # 1. Morphological Features (12 features)
        features.update(self._extract_morphological_features(gray))
        
        # 2. Shape Features (4 features)
        features.update(self._extract_shape_features(gray))
        
        # 3. Color Features (90 features) - 5 color spaces
        features.update(self._extract_color_features(image))
        
        return features
    
    def _extract_morphological_features(self, gray_image: np.ndarray) -> Dict[str, float]:
        """Extract 12 morphological features"""
        features = {}
        
        # Find contours
        _, binary = cv2.threshold(gray_image, 127, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return {f'morph_{i}': 0.0 for i in range(12)}
        
        # Use largest contour
        largest_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)
        perimeter = cv2.arcLength(largest_contour, True)
        
        # 1. Area
        features['morph_area'] = float(area)
        
        # 2. Perimeter
        features['morph_perimeter'] = float(perimeter)
        
        # 3. Compactness (Perimeter²/Area)
        features['morph_compactness'] = (perimeter ** 2) / (4 * np.pi * area) if area > 0 else 0
        
        # 4. Roundness (4π*Area/Perimeter²)
        features['morph_roundness'] = (4 * np.pi * area) / (perimeter ** 2) if perimeter > 0 else 0
        
        # 5. Aspect Ratio
        x, y, w, h = cv2.boundingRect(largest_contour)
        features['morph_aspect_ratio'] = float(w) / h if h > 0 else 0
        
        # 6. Eccentricity
        if len(largest_contour) >= 5:
            ellipse = cv2.fitEllipse(largest_contour)
            major_axis = max(ellipse[1])
            minor_axis = min(ellipse[1])
            features['morph_eccentricity'] = np.sqrt(1 - (minor_axis ** 2) / (major_axis ** 2)) if major_axis > 0 else 0
        else:
            features['morph_eccentricity'] = 0.0
        
        # 7. Solidity (Area/Convex Hull Area)
        hull = cv2.convexHull(largest_contour)
        hull_area = cv2.contourArea(hull)
        features['morph_solidity'] = area / hull_area if hull_area > 0 else 0
        
        # 8. Extent (Area/Bounding Rectangle Area)
        rect_area = w * h
        features['morph_extent'] = area / rect_area if rect_area > 0 else 0
        
        # 9. EquivDiameter
        features['morph_equiv_diameter'] = np.sqrt(4 * area / np.pi)
        
        # 10. Major Axis Length
        if len(largest_contour) >= 5:
            features['morph_major_axis'] = max(ellipse[1])
        else:
            features['morph_major_axis'] = 0.0
        
        # 11. Minor Axis Length
        if len(largest_contour) >= 5:
            features['morph_minor_axis'] = min(ellipse[1])
        else:
            features['morph_minor_axis'] = 0.0
        
        # 12. Orientation
        if len(largest_contour) >= 5:
            features['morph_orientation'] = ellipse[2]
        else:
            features['morph_orientation'] = 0.0
        
        return features
    
    def _extract_shape_features(self, gray_image: np.ndarray) -> Dict[str, float]:
        """Extract 4 shape features based on morphological features"""
        features = {}
        
        # Find contours
        _, binary = cv2.threshold(gray_image, 127, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return {f'shape_{i}': 0.0 for i in range(4)}
        
        largest_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)
        perimeter = cv2.arcLength(largest_contour, True)
        
        # 1. Shape Factor 1 (Perimeter/√Area)
        features['shape_factor_1'] = perimeter / np.sqrt(area) if area > 0 else 0
        
        # 2. Shape Factor 2 (Perimeter/Area)
        features['shape_factor_2'] = perimeter / area if area > 0 else 0
        
        # 3. Shape Factor 3 (Perimeter²/Area)
        features['shape_factor_3'] = (perimeter ** 2) / area if area > 0 else 0
        
        # 4. Shape Factor 4 (Area/Perimeter²)
        features['shape_factor_4'] = area / (perimeter ** 2) if perimeter > 0 else 0
        
        return features
    
    def _extract_color_features(self, image: np.ndarray) -> Dict[str, float]:
        """Extract 90 color features from 5 color spaces"""
        features = {}
        
        # Ensure image is in BGR format
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        
        # 1. RGB Color Space (18 features)
        rgb_features = self._extract_rgb_features(image)
        features.update(rgb_features)
        
        # 2. HSV Color Space (18 features)
        hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        hsv_features = self._extract_hsv_features(hsv_image)
        features.update(hsv_features)
        
        # 3. Lab* Color Space (18 features)
        lab_image = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        lab_features = self._extract_lab_features(lab_image)
        features.update(lab_features)
        
        # 4. YCbCr Color Space (18 features)
        ycbcr_image = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
        ycbcr_features = self._extract_ycbcr_features(ycbcr_image)
        features.update(ycbcr_features)
        
        # 5. XYZ Color Space (18 features)
        xyz_image = cv2.cvtColor(image, cv2.COLOR_BGR2XYZ)
        xyz_features = self._extract_xyz_features(xyz_image)
        features.update(xyz_features)
        
        return features
    
    def _extract_rgb_features(self, image: np.ndarray) -> Dict[str, float]:
        """Extract 18 RGB features (mean, std, min, max, median, range for each channel)"""
        features = {}
        channels = ['r', 'g', 'b']
        
        for i, channel in enumerate(channels):
            channel_data = image[:, :, i].flatten()
            features[f'rgb_{channel}_mean'] = float(np.mean(channel_data))
            features[f'rgb_{channel}_std'] = float(np.std(channel_data))
            features[f'rgb_{channel}_min'] = float(np.min(channel_data))
            features[f'rgb_{channel}_max'] = float(np.max(channel_data))
            features[f'rgb_{channel}_median'] = float(np.median(channel_data))
            features[f'rgb_{channel}_range'] = float(np.max(channel_data) - np.min(channel_data))
        
        return features
    
    def _extract_hsv_features(self, image: np.ndarray) -> Dict[str, float]:
        """Extract 18 HSV features"""
        features = {}
        channels = ['h', 's', 'v']
        
        for i, channel in enumerate(channels):
            channel_data = image[:, :, i].flatten()
            features[f'hsv_{channel}_mean'] = float(np.mean(channel_data))
            features[f'hsv_{channel}_std'] = float(np.std(channel_data))
            features[f'hsv_{channel}_min'] = float(np.min(channel_data))
            features[f'hsv_{channel}_max'] = float(np.max(channel_data))
            features[f'hsv_{channel}_median'] = float(np.median(channel_data))
            features[f'hsv_{channel}_range'] = float(np.max(channel_data) - np.min(channel_data))
        
        return features
    
    def _extract_lab_features(self, image: np.ndarray) -> Dict[str, float]:
        """Extract 18 Lab* features"""
        features = {}
        channels = ['l', 'a', 'b']
        
        for i, channel in enumerate(channels):
            channel_data = image[:, :, i].flatten()
            features[f'lab_{channel}_mean'] = float(np.mean(channel_data))
            features[f'lab_{channel}_std'] = float(np.std(channel_data))
            features[f'lab_{channel}_min'] = float(np.min(channel_data))
            features[f'lab_{channel}_max'] = float(np.max(channel_data))
            features[f'lab_{channel}_median'] = float(np.median(channel_data))
            features[f'lab_{channel}_range'] = float(np.max(channel_data) - np.min(channel_data))
        
        return features
    
    def _extract_ycbcr_features(self, image: np.ndarray) -> Dict[str, float]:
        """Extract 18 YCbCr features"""
        features = {}
        channels = ['y', 'cb', 'cr']
        
        for i, channel in enumerate(channels):
            channel_data = image[:, :, i].flatten()
            features[f'ycbcr_{channel}_mean'] = float(np.mean(channel_data))
            features[f'ycbcr_{channel}_std'] = float(np.std(channel_data))
            features[f'ycbcr_{channel}_min'] = float(np.min(channel_data))
            features[f'ycbcr_{channel}_max'] = float(np.max(channel_data))
            features[f'ycbcr_{channel}_median'] = float(np.median(channel_data))
            features[f'ycbcr_{channel}_range'] = float(np.max(channel_data) - np.min(channel_data))
        
        return features
    
    def _extract_xyz_features(self, image: np.ndarray) -> Dict[str, float]:
        """Extract 18 XYZ features"""
        features = {}
        channels = ['x', 'y', 'z']
        
        for i, channel in enumerate(channels):
            channel_data = image[:, :, i].flatten()
            features[f'xyz_{channel}_mean'] = float(np.mean(channel_data))
            features[f'xyz_{channel}_std'] = float(np.std(channel_data))
            features[f'xyz_{channel}_min'] = float(np.min(channel_data))
            features[f'xyz_{channel}_max'] = float(np.max(channel_data))
            features[f'xyz_{channel}_median'] = float(np.median(channel_data))
            features[f'xyz_{channel}_range'] = float(np.max(channel_data) - np.min(channel_data))
        
        return features
    
    def get_most_effective_features(self, features: Dict[str, float]) -> Dict[str, float]:
        """Get the 5 most effective features based on Rice MSC Dataset analysis"""
        effective_features = {}
        
        # Map the most effective features
        feature_mapping = {
            'roundness': 'morph_roundness',
            'compactness': 'morph_compactness', 
            'shape_factor_3': 'shape_factor_3',
            'aspect_ratio': 'morph_aspect_ratio',
            'eccentricity': 'morph_eccentricity'
        }
        
        for effective_name, actual_name in feature_mapping.items():
            if actual_name in features:
                effective_features[effective_name] = features[actual_name]
        
        return effective_features
    
    def analyze_image_quality(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyze image quality using Rice MSC methodology"""
        features = self.extract_all_features(image)
        effective_features = self.get_most_effective_features(features)
        
        # Quality assessment based on effective features
        quality_score = 0
        quality_factors = []
        
        # Roundness assessment (higher is better for rice-like objects)
        if 'roundness' in effective_features:
            roundness = effective_features['roundness']
            if roundness > 0.7:
                quality_score += 20
                quality_factors.append("Excellent roundness")
            elif roundness > 0.5:
                quality_score += 15
                quality_factors.append("Good roundness")
            elif roundness > 0.3:
                quality_score += 10
                quality_factors.append("Fair roundness")
        
        # Compactness assessment
        if 'compactness' in effective_features:
            compactness = effective_features['compactness']
            if compactness < 1.5:
                quality_score += 20
                quality_factors.append("Excellent compactness")
            elif compactness < 2.0:
                quality_score += 15
                quality_factors.append("Good compactness")
            elif compactness < 3.0:
                quality_score += 10
                quality_factors.append("Fair compactness")
        
        # Aspect ratio assessment
        if 'aspect_ratio' in effective_features:
            aspect_ratio = effective_features['aspect_ratio']
            if 1.5 < aspect_ratio < 3.0:
                quality_score += 20
                quality_factors.append("Optimal aspect ratio")
            elif 1.0 < aspect_ratio < 4.0:
                quality_score += 15
                quality_factors.append("Good aspect ratio")
        
        # Eccentricity assessment
        if 'eccentricity' in effective_features:
            eccentricity = effective_features['eccentricity']
            if eccentricity < 0.8:
                quality_score += 20
                quality_factors.append("Good shape consistency")
            elif eccentricity < 0.9:
                quality_score += 15
                quality_factors.append("Fair shape consistency")
        
        # Overall quality grade
        if quality_score >= 80:
            quality_grade = "Excellent"
        elif quality_score >= 60:
            quality_grade = "Good"
        elif quality_score >= 40:
            quality_grade = "Fair"
        else:
            quality_grade = "Poor"
        
        return {
            'quality_score': quality_score,
            'quality_grade': quality_grade,
            'quality_factors': quality_factors,
            'effective_features': effective_features,
            'all_features': features
        }
    
    def detect_objects(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Detect objects in image using Rice MSC methodology"""
        objects = []
        
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Apply preprocessing
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for i, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            
            # Filter small objects
            if area < 100:
                continue
            
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Extract features for this object
            object_image = image[y:y+h, x:x+w]
            if object_image.size == 0:
                continue
                
            features = self.extract_all_features(object_image)
            effective_features = self.get_most_effective_features(features)
            quality_analysis = self.analyze_image_quality(object_image)
            
            objects.append({
                'id': i,
                'bbox': [x, y, w, h],
                'area': area,
                'features': effective_features,
                'quality_score': quality_analysis['quality_score'],
                'quality_grade': quality_analysis['quality_grade']
            })
        
        return objects
    
    def enhance_image(self, image: np.ndarray, enhancement_type: str = 'auto') -> Dict[str, Any]:
        """Enhance image based on Rice MSC feature analysis"""
        features = self.extract_all_features(image)
        effective_features = self.get_most_effective_features(features)
        
        enhanced_image = image.copy()
        enhancements = []
        
        # Auto-enhancement based on feature analysis
        if enhancement_type == 'auto':
            # Enhance contrast if standard deviation is low
            if features.get('rgb_r_std', 0) < 30:
                enhanced_image = cv2.convertScaleAbs(enhanced_image, alpha=1.2, beta=10)
                enhancements.append("Contrast enhancement applied")
            
            # Enhance saturation if HSV saturation is low
            if features.get('hsv_s_mean', 0) < 50:
                hsv = cv2.cvtColor(enhanced_image, cv2.COLOR_BGR2HSV)
                hsv[:, :, 1] = cv2.multiply(hsv[:, :, 1], 1.3)
                enhanced_image = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
                enhancements.append("Saturation enhancement applied")
            
            # Sharpen if shape factor indicates blur
            if features.get('shape_factor_3', 0) < 100:
                kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
                enhanced_image = cv2.filter2D(enhanced_image, -1, kernel)
                enhancements.append("Sharpening applied")
        
        # Analyze enhanced image
        enhanced_features = self.extract_all_features(enhanced_image)
        enhanced_quality = self.analyze_image_quality(enhanced_image)
        
        return {
            'enhanced_image': enhanced_image,
            'enhancements_applied': enhancements,
            'original_quality': self.analyze_image_quality(image),
            'enhanced_quality': enhanced_quality,
            'improvement_score': enhanced_quality['quality_score'] - self.analyze_image_quality(image)['quality_score']
        }

# Global instance
cv_engine = ComputerVisionEngine() 