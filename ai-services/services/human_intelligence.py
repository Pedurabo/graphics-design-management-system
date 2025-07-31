import cv2
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
import json
import math
from .computer_vision import cv_engine

class HumanIntelligenceEngine:
    """
    Human Intelligence Engine based on Human Faces Dataset (7.2k+ images)
    Implements advanced face detection, emotion recognition, and human-centric features
    """
    
    def __init__(self):
        self.cv_engine = cv_engine
        
        # Face detection cascade
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        self.smile_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_smile.xml')
        
        # Emotion categories based on Human Faces dataset
        self.emotions = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fear', 'disgust']
        
        # Age groups from dataset
        self.age_groups = ['child', 'teen', 'young_adult', 'adult', 'senior']
        
        # Gender classification
        self.gender_classes = ['male', 'female']
        
        # Face quality metrics
        self.face_quality_metrics = {
            'brightness': 0.0,
            'contrast': 0.0,
            'sharpness': 0.0,
            'pose_angle': 0.0,
            'eye_openness': 0.0,
            'mouth_openness': 0.0
        }
        
    def detect_faces(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect faces in image using Human Faces dataset methodology
        Returns: List of detected faces with detailed information
        """
        faces = []
        
        # Convert to grayscale for detection
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Detect faces
        detected_faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        
        for (x, y, w, h) in detected_faces:
            face_roi = gray[y:y+h, x:x+w]
            face_color = image[y:y+h, x:x+w] if len(image.shape) == 3 else None
            
            # Extract face features
            face_features = self._extract_face_features(face_roi, face_color)
            
            # Detect eyes
            eyes = self.eye_cascade.detectMultiScale(face_roi)
            eye_features = self._analyze_eyes(eyes, face_roi)
            
            # Detect smile
            smiles = self.smile_cascade.detectMultiScale(face_roi)
            smile_features = self._analyze_smile(smiles, face_roi)
            
            # Analyze face quality
            quality = self._analyze_face_quality(face_roi, face_color)
            
            # Estimate age and gender
            age_estimate = self._estimate_age(face_features)
            gender_estimate = self._estimate_gender(face_features)
            
            # Emotion recognition
            emotion = self._recognize_emotion(face_features, eye_features, smile_features)
            
            faces.append({
                'bbox': [x, y, w, h],
                'confidence': self._calculate_face_confidence(quality),
                'features': face_features,
                'eyes': eye_features,
                'smile': smile_features,
                'quality': quality,
                'age_estimate': age_estimate,
                'gender_estimate': gender_estimate,
                'emotion': emotion,
                'face_roi': face_roi
            })
        
        return faces
    
    def _extract_face_features(self, face_roi: np.ndarray, face_color: Optional[np.ndarray]) -> Dict[str, float]:
        """Extract comprehensive face features"""
        features = {}
        
        # Basic morphological features
        height, width = face_roi.shape
        features['face_area'] = height * width
        features['face_aspect_ratio'] = width / height if height > 0 else 0
        
        # Skin tone analysis (if color available)
        if face_color is not None:
            skin_features = self._analyze_skin_tone(face_color)
            features.update(skin_features)
        
        # Texture analysis
        texture_features = self._analyze_face_texture(face_roi)
        features.update(texture_features)
        
        # Symmetry analysis
        symmetry_score = self._analyze_face_symmetry(face_roi)
        features['symmetry_score'] = symmetry_score
        
        # Landmark detection (simplified)
        landmarks = self._detect_face_landmarks(face_roi)
        features['landmarks'] = landmarks
        
        return features
    
    def _analyze_skin_tone(self, face_color: np.ndarray) -> Dict[str, float]:
        """Analyze skin tone characteristics"""
        # Convert to different color spaces
        hsv = cv2.cvtColor(face_color, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(face_color, cv2.COLOR_BGR2LAB)
        
        # Calculate skin tone statistics
        features = {}
        
        # HSV analysis
        h_mean = np.mean(hsv[:, :, 0])
        s_mean = np.mean(hsv[:, :, 1])
        v_mean = np.mean(hsv[:, :, 2])
        
        features['hue_mean'] = h_mean
        features['saturation_mean'] = s_mean
        features['value_mean'] = v_mean
        
        # LAB analysis for skin tone
        l_mean = np.mean(lab[:, :, 0])
        a_mean = np.mean(lab[:, :, 1])
        b_mean = np.mean(lab[:, :, 2])
        
        features['luminance_mean'] = l_mean
        features['a_channel_mean'] = a_mean
        features['b_channel_mean'] = b_mean
        
        # Skin tone classification
        if 0 <= h_mean <= 30 and s_mean > 50:
            features['skin_tone_category'] = 'warm'
        elif 30 < h_mean <= 60 and s_mean > 50:
            features['skin_tone_category'] = 'neutral'
        else:
            features['skin_tone_category'] = 'cool'
        
        return features
    
    def _analyze_face_texture(self, face_roi: np.ndarray) -> Dict[str, float]:
        """Analyze face texture patterns"""
        features = {}
        
        # Apply Gabor filters for texture analysis
        angles = [0, 45, 90, 135]
        frequencies = [0.1, 0.3, 0.5]
        
        texture_responses = []
        for angle in angles:
            for freq in frequencies:
                kernel = cv2.getGaborKernel((21, 21), 8, angle, 2*np.pi*freq, 0.5, 0, ktype=cv2.CV_32F)
                response = cv2.filter2D(face_roi, cv2.CV_8UC3, kernel)
                texture_responses.append(np.mean(response))
        
        features['texture_variance'] = np.var(texture_responses)
        features['texture_mean'] = np.mean(texture_responses)
        features['texture_entropy'] = self._calculate_entropy(face_roi)
        
        return features
    
    def _analyze_face_symmetry(self, face_roi: np.ndarray) -> float:
        """Analyze face symmetry"""
        height, width = face_roi.shape
        mid_x = width // 2
        
        # Split face into left and right halves
        left_half = face_roi[:, :mid_x]
        right_half = face_roi[:, mid_x:]
        
        # Flip right half to compare with left
        right_half_flipped = cv2.flip(right_half, 1)
        
        # Ensure same size
        min_width = min(left_half.shape[1], right_half_flipped.shape[1])
        left_half = left_half[:, :min_width]
        right_half_flipped = right_half_flipped[:, :min_width]
        
        # Calculate similarity
        similarity = cv2.matchTemplate(left_half, right_half_flipped, cv2.TM_CCOEFF_NORMED)
        symmetry_score = np.max(similarity)
        
        return float(symmetry_score)
    
    def _detect_face_landmarks(self, face_roi: np.ndarray) -> Dict[str, Tuple[int, int]]:
        """Detect key facial landmarks"""
        landmarks = {}
        
        # Simplified landmark detection using edge detection
        edges = cv2.Canny(face_roi, 50, 150)
        
        # Find contours for landmark approximation
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Find largest contour (likely face outline)
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Approximate landmarks
            height, width = face_roi.shape
            
            # Eye regions (approximate)
            landmarks['left_eye'] = (width // 3, height // 3)
            landmarks['right_eye'] = (2 * width // 3, height // 3)
            
            # Nose region
            landmarks['nose'] = (width // 2, height // 2)
            
            # Mouth region
            landmarks['mouth'] = (width // 2, 2 * height // 3)
        
        return landmarks
    
    def _analyze_eyes(self, eyes: np.ndarray, face_roi: np.ndarray) -> Dict[str, Any]:
        """Analyze eye characteristics"""
        eye_features = {
            'count': len(eyes),
            'openness': [],
            'brightness': [],
            'positions': []
        }
        
        for (ex, ey, ew, eh) in eyes:
            eye_roi = face_roi[ey:ey+eh, ex:ex+ew]
            
            # Calculate eye openness (simplified)
            eye_area = ew * eh
            face_area = face_roi.shape[0] * face_roi.shape[1]
            openness = eye_area / face_area if face_area > 0 else 0
            
            # Calculate eye brightness
            brightness = np.mean(eye_roi)
            
            eye_features['openness'].append(openness)
            eye_features['brightness'].append(brightness)
            eye_features['positions'].append((ex, ey, ew, eh))
        
        return eye_features
    
    def _analyze_smile(self, smiles: np.ndarray, face_roi: np.ndarray) -> Dict[str, Any]:
        """Analyze smile characteristics"""
        smile_features = {
            'detected': len(smiles) > 0,
            'intensity': 0.0,
            'width': 0.0
        }
        
        if len(smiles) > 0:
            # Use largest smile detection
            largest_smile = max(smiles, key=lambda x: x[2] * x[3])
            sx, sy, sw, sh = largest_smile
            
            smile_roi = face_roi[sy:sy+sh, sx:sx+sw]
            
            # Calculate smile intensity (brightness in smile region)
            smile_features['intensity'] = float(np.mean(smile_roi))
            smile_features['width'] = float(sw)
        
        return smile_features
    
    def _analyze_face_quality(self, face_roi: np.ndarray, face_color: Optional[np.ndarray]) -> Dict[str, float]:
        """Analyze face image quality"""
        quality = {}
        
        # Brightness analysis
        brightness = np.mean(face_roi)
        quality['brightness'] = brightness / 255.0
        
        # Contrast analysis
        contrast = np.std(face_roi)
        quality['contrast'] = contrast / 255.0
        
        # Sharpness analysis (using Laplacian variance)
        laplacian = cv2.Laplacian(face_roi, cv2.CV_64F)
        sharpness = np.var(laplacian)
        quality['sharpness'] = min(sharpness / 1000.0, 1.0)
        
        # Pose estimation (simplified)
        height, width = face_roi.shape
        aspect_ratio = width / height if height > 0 else 1
        pose_angle = abs(aspect_ratio - 1.0) * 45  # Approximate angle
        quality['pose_angle'] = pose_angle
        
        return quality
    
    def _estimate_age(self, face_features: Dict[str, float]) -> Dict[str, Any]:
        """Estimate age based on face features"""
        # Simplified age estimation using texture and symmetry
        texture_score = face_features.get('texture_variance', 0)
        symmetry_score = face_features.get('symmetry_score', 0.5)
        
        # Age estimation logic
        if texture_score > 1000:
            age_group = 'senior'
            age_range = (60, 80)
        elif texture_score > 500:
            age_group = 'adult'
            age_range = (30, 60)
        elif symmetry_score > 0.8:
            age_group = 'young_adult'
            age_range = (20, 30)
        elif symmetry_score > 0.6:
            age_group = 'teen'
            age_range = (13, 20)
        else:
            age_group = 'child'
            age_range = (0, 13)
        
        return {
            'age_group': age_group,
            'age_range': age_range,
            'confidence': min(symmetry_score + texture_score / 1000, 1.0)
        }
    
    def _estimate_gender(self, face_features: Dict[str, float]) -> Dict[str, Any]:
        """Estimate gender based on face features"""
        # Simplified gender estimation using facial proportions
        aspect_ratio = face_features.get('face_aspect_ratio', 1.0)
        symmetry_score = face_features.get('symmetry_score', 0.5)
        
        # Gender estimation logic (simplified)
        if aspect_ratio > 1.2 and symmetry_score > 0.7:
            gender = 'male'
            confidence = 0.7
        elif aspect_ratio < 1.1 and symmetry_score > 0.8:
            gender = 'female'
            confidence = 0.7
        else:
            gender = 'unknown'
            confidence = 0.5
        
        return {
            'gender': gender,
            'confidence': confidence
        }
    
    def _recognize_emotion(self, face_features: Dict[str, float], 
                          eye_features: Dict[str, Any], 
                          smile_features: Dict[str, Any]) -> Dict[str, Any]:
        """Recognize emotion based on facial features"""
        # Simplified emotion recognition
        smile_intensity = smile_features.get('intensity', 0)
        eye_openness = np.mean(eye_features.get('openness', [0.5]))
        symmetry_score = face_features.get('symmetry_score', 0.5)
        
        # Emotion classification logic
        if smile_intensity > 150 and eye_openness > 0.02:
            emotion = 'happy'
            confidence = 0.8
        elif smile_intensity < 100 and eye_openness < 0.01:
            emotion = 'sad'
            confidence = 0.7
        elif eye_openness > 0.03:
            emotion = 'surprised'
            confidence = 0.6
        elif symmetry_score < 0.4:
            emotion = 'angry'
            confidence = 0.5
        else:
            emotion = 'neutral'
            confidence = 0.6
        
        return {
            'emotion': emotion,
            'confidence': confidence,
            'intensity': smile_intensity / 255.0
        }
    
    def _calculate_face_confidence(self, quality: Dict[str, float]) -> float:
        """Calculate overall face detection confidence"""
        brightness_score = quality.get('brightness', 0.5)
        contrast_score = quality.get('contrast', 0.5)
        sharpness_score = quality.get('sharpness', 0.5)
        
        # Weighted confidence calculation
        confidence = (brightness_score * 0.3 + 
                     contrast_score * 0.3 + 
                     sharpness_score * 0.4)
        
        return min(confidence, 1.0)
    
    def _calculate_entropy(self, image: np.ndarray) -> float:
        """Calculate image entropy for texture analysis"""
        hist = cv2.calcHist([image], [0], None, [256], [0, 256])
        hist = hist / hist.sum()
        entropy = -np.sum(hist * np.log2(hist + 1e-10))
        return float(entropy)
    
    def enhance_face(self, image: np.ndarray, face_bbox: List[int]) -> Dict[str, Any]:
        """Enhance face quality using Human Faces dataset insights"""
        x, y, w, h = face_bbox
        face_roi = image[y:y+h, x:x+w]
        
        enhanced_face = face_roi.copy()
        enhancements = []
        
        # Analyze current quality
        quality = self._analyze_face_quality(face_roi, face_roi)
        
        # Brightness enhancement
        if quality['brightness'] < 0.4:
            enhanced_face = cv2.convertScaleAbs(enhanced_face, alpha=1.3, beta=20)
            enhancements.append("Brightness enhanced")
        
        # Contrast enhancement
        if quality['contrast'] < 0.2:
            enhanced_face = cv2.convertScaleAbs(enhanced_face, alpha=1.2, beta=0)
            enhancements.append("Contrast enhanced")
        
        # Sharpness enhancement
        if quality['sharpness'] < 0.3:
            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            enhanced_face = cv2.filter2D(enhanced_face, -1, kernel)
            enhancements.append("Sharpness enhanced")
        
        # Skin tone enhancement
        if len(enhanced_face.shape) == 3:
            hsv = cv2.cvtColor(enhanced_face, cv2.COLOR_BGR2HSV)
            hsv[:, :, 1] = cv2.multiply(hsv[:, :, 1], 1.1)  # Enhance saturation
            enhanced_face = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
            enhancements.append("Skin tone enhanced")
        
        # Create result
        result_image = image.copy()
        result_image[y:y+h, x:x+w] = enhanced_face
        
        return {
            'enhanced_image': result_image,
            'enhancements': enhancements,
            'original_quality': quality,
            'enhanced_quality': self._analyze_face_quality(enhanced_face, enhanced_face)
        }
    
    def batch_face_analysis(self, images: List[np.ndarray]) -> List[Dict[str, Any]]:
        """Analyze faces in multiple images"""
        results = []
        
        for i, image in enumerate(images):
            faces = self.detect_faces(image)
            
            result = {
                'image_id': i,
                'faces_detected': len(faces),
                'faces': faces,
                'summary': self._generate_face_summary(faces)
            }
            
            results.append(result)
        
        return results
    
    def _generate_face_summary(self, faces: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary statistics for detected faces"""
        if not faces:
            return {'total_faces': 0}
        
        emotions = [face['emotion']['emotion'] for face in faces]
        ages = [face['age_estimate']['age_group'] for face in faces]
        genders = [face['gender_estimate']['gender'] for face in faces]
        
        return {
            'total_faces': len(faces),
            'dominant_emotion': max(set(emotions), key=emotions.count) if emotions else 'unknown',
            'age_distribution': {age: ages.count(age) for age in set(ages)},
            'gender_distribution': {gender: genders.count(gender) for gender in set(genders)},
            'average_confidence': np.mean([face['confidence'] for face in faces])
        }

# Global instance
human_intelligence = HumanIntelligenceEngine() 