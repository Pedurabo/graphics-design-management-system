import cv2
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
import json
from .computer_vision import cv_engine

class AdvancedImageProcessor:
    """
    Advanced Image Processor with Photoshop-level features
    Based on Rice MSC Dataset computer vision methodology
    """
    
    def __init__(self):
        self.cv_engine = cv_engine
        self.supported_formats = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']
        
    def smart_selection(self, image: np.ndarray, method: str = 'auto') -> Dict[str, Any]:
        """
        Smart selection using Rice MSC feature analysis
        Methods: 'auto', 'morphological', 'color', 'edge', 'watershed'
        """
        if method == 'auto':
            # Analyze image to determine best selection method
            features = self.cv_engine.extract_all_features(image)
            
            # Choose method based on image characteristics
            if features.get('morph_compactness', 0) > 2.0:
                method = 'morphological'
            elif features.get('rgb_r_std', 0) > 50:
                method = 'color'
            elif features.get('shape_factor_3', 0) > 150:
                method = 'edge'
            else:
                method = 'watershed'
        
        if method == 'morphological':
            return self._morphological_selection(image)
        elif method == 'color':
            return self._color_based_selection(image)
        elif method == 'edge':
            return self._edge_based_selection(image)
        elif method == 'watershed':
            return self._watershed_selection(image)
        else:
            return self._morphological_selection(image)
    
    def _morphological_selection(self, image: np.ndarray) -> Dict[str, Any]:
        """Selection based on morphological features"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        morph = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
        morph = cv2.morphologyEx(morph, cv2.MORPH_OPEN, kernel)
        
        # Find contours
        _, binary = cv2.threshold(morph, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Create mask
        mask = np.zeros(gray.shape, dtype=np.uint8)
        for contour in contours:
            if cv2.contourArea(contour) > 100:
                cv2.fillPoly(mask, [contour], 255)
        
        return {
            'mask': mask,
            'contours': contours,
            'method': 'morphological',
            'confidence': 0.85
        }
    
    def _color_based_selection(self, image: np.ndarray) -> Dict[str, Any]:
        """Selection based on color clustering"""
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        
        # Reshape for clustering
        data = lab.reshape((-1, 3))
        data = np.float32(data)
        
        # K-means clustering
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        _, labels, centers = cv2.kmeans(data, 3, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        
        # Create mask based on dominant color
        dominant_label = np.argmax(np.bincount(labels.flatten()))
        mask = (labels.reshape(image.shape[:2]) == dominant_label).astype(np.uint8) * 255
        
        # Clean up mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        return {
            'mask': mask,
            'method': 'color',
            'confidence': 0.80
        }
    
    def _edge_based_selection(self, image: np.ndarray) -> Dict[str, Any]:
        """Selection based on edge detection"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150)
        
        # Dilate edges to connect them
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        edges = cv2.dilate(edges, kernel, iterations=1)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Create mask
        mask = np.zeros(gray.shape, dtype=np.uint8)
        for contour in contours:
            if cv2.contourArea(contour) > 200:
                cv2.fillPoly(mask, [contour], 255)
        
        return {
            'mask': mask,
            'contours': contours,
            'method': 'edge',
            'confidence': 0.75
        }
    
    def _watershed_selection(self, image: np.ndarray) -> Dict[str, Any]:
        """Selection using watershed algorithm"""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply threshold
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Noise removal
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
        
        # Sure background area
        sure_bg = cv2.dilate(opening, kernel, iterations=3)
        
        # Finding sure foreground area
        dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
        _, sure_fg = cv2.threshold(dist_transform, 0.7 * dist_transform.max(), 255, 0)
        sure_fg = np.uint8(sure_fg)
        
        # Finding unknown region
        unknown = cv2.subtract(sure_bg, sure_fg)
        
        # Marker labelling
        _, markers = cv2.connectedComponents(sure_fg)
        markers = markers + 1
        markers[unknown == 255] = 0
        
        # Apply watershed
        markers = cv2.watershed(image, markers)
        
        # Create mask
        mask = np.zeros(gray.shape, dtype=np.uint8)
        mask[markers > 1] = 255
        
        return {
            'mask': mask,
            'method': 'watershed',
            'confidence': 0.90
        }
    
    def content_aware_fill(self, image: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """Content-aware fill using Rice MSC feature analysis"""
        # Analyze surrounding areas
        features = self.cv_engine.extract_all_features(image)
        
        # Create filled image
        filled_image = image.copy()
        
        # Find contours in mask
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            if cv2.contourArea(contour) < 50:
                continue
                
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Analyze surrounding area
            surrounding_area = image[max(0, y-10):min(image.shape[0], y+h+10), 
                                   max(0, x-10):min(image.shape[1], x+w+10)]
            
            if surrounding_area.size == 0:
                continue
            
            # Calculate average color of surrounding area
            avg_color = np.mean(surrounding_area, axis=(0, 1))
            
            # Fill the area with surrounding color
            cv2.fillPoly(filled_image, [contour], avg_color)
        
        return filled_image
    
    def smart_enhancement(self, image: np.ndarray) -> Dict[str, Any]:
        """Smart enhancement based on Rice MSC analysis"""
        # Analyze image
        features = self.cv_engine.extract_all_features(image)
        quality_analysis = self.cv_engine.analyze_image_quality(image)
        
        enhanced_image = image.copy()
        enhancements = []
        
        # Auto-enhancement based on feature analysis
        if features.get('rgb_r_std', 0) < 25:
            # Low contrast - enhance
            enhanced_image = cv2.convertScaleAbs(enhanced_image, alpha=1.3, beta=15)
            enhancements.append("Contrast enhancement")
        
        if features.get('hsv_s_mean', 0) < 40:
            # Low saturation - enhance
            hsv = cv2.cvtColor(enhanced_image, cv2.COLOR_BGR2HSV)
            hsv[:, :, 1] = cv2.multiply(hsv[:, :, 1], 1.4)
            enhanced_image = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
            enhancements.append("Saturation enhancement")
        
        if features.get('shape_factor_3', 0) < 80:
            # Blurry image - sharpen
            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            enhanced_image = cv2.filter2D(enhanced_image, -1, kernel)
            enhancements.append("Sharpening")
        
        # Noise reduction if needed
        if features.get('rgb_r_std', 0) > 60:
            enhanced_image = cv2.medianBlur(enhanced_image, 3)
            enhancements.append("Noise reduction")
        
        # Analyze enhanced image
        enhanced_quality = self.cv_engine.analyze_image_quality(enhanced_image)
        
        return {
            'enhanced_image': enhanced_image,
            'enhancements': enhancements,
            'original_quality': quality_analysis,
            'enhanced_quality': enhanced_quality,
            'improvement': enhanced_quality['quality_score'] - quality_analysis['quality_score']
        }
    
    def object_detection(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Detect objects using Rice MSC methodology"""
        return self.cv_engine.detect_objects(image)
    
    def color_correction(self, image: np.ndarray, target_color_space: str = 'auto') -> np.ndarray:
        """Color correction based on Rice MSC color analysis"""
        if target_color_space == 'auto':
            # Analyze current color distribution
            features = self.cv_engine.extract_all_features(image)
            
            # Determine optimal color space
            if features.get('lab_l_std', 0) < 20:
                target_color_space = 'lab'
            elif features.get('hsv_h_std', 0) < 30:
                target_color_space = 'hsv'
            else:
                target_color_space = 'rgb'
        
        corrected_image = image.copy()
        
        if target_color_space == 'lab':
            # LAB color correction
            lab = cv2.cvtColor(corrected_image, cv2.COLOR_BGR2LAB)
            lab[:, :, 1] = cv2.normalize(lab[:, :, 1], None, 0, 255, cv2.NORM_MINMAX)
            lab[:, :, 2] = cv2.normalize(lab[:, :, 2], None, 0, 255, cv2.NORM_MINMAX)
            corrected_image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        elif target_color_space == 'hsv':
            # HSV color correction
            hsv = cv2.cvtColor(corrected_image, cv2.COLOR_BGR2HSV)
            hsv[:, :, 1] = cv2.normalize(hsv[:, :, 1], None, 0, 255, cv2.NORM_MINMAX)
            hsv[:, :, 2] = cv2.normalize(hsv[:, :, 2], None, 0, 255, cv2.NORM_MINMAX)
            corrected_image = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        
        return corrected_image
    
    def batch_process(self, images: List[np.ndarray], operations: List[str]) -> List[Dict[str, Any]]:
        """Batch process multiple images"""
        results = []
        
        for i, image in enumerate(images):
            result = {'image_id': i, 'operations': []}
            
            for operation in operations:
                if operation == 'enhance':
                    enhancement = self.smart_enhancement(image)
                    image = enhancement['enhanced_image']
                    result['operations'].append({
                        'type': 'enhancement',
                        'enhancements': enhancement['enhancements'],
                        'improvement': enhancement['improvement']
                    })
                
                elif operation == 'detect_objects':
                    objects = self.object_detection(image)
                    result['operations'].append({
                        'type': 'object_detection',
                        'objects_found': len(objects)
                    })
                
                elif operation == 'color_correct':
                    image = self.color_correction(image)
                    result['operations'].append({
                        'type': 'color_correction'
                    })
            
            result['final_image'] = image
            results.append(result)
        
        return results

# Global instance
advanced_processor = AdvancedImageProcessor() 