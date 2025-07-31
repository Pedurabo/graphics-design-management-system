import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
import colorsys
from dataclasses import dataclass
from enum import Enum
import logging
from sklearn.cluster import KMeans
from sklearn.metrics import pairwise_distances
import matplotlib.pyplot as plt
from PIL import Image, ImageEnhance, ImageOps
import json

logger = logging.getLogger(__name__)

class ColorSpace(Enum):
    RGB = "rgb"
    HSV = "hsv"
    LAB = "lab"
    YUV = "yuv"
    CMYK = "cmyk"

class GradingStyle(Enum):
    CINEMATIC = "cinematic"
    VINTAGE = "vintage"
    MODERN = "modern"
    WARM = "warm"
    COOL = "cool"
    HIGH_CONTRAST = "high_contrast"
    LOW_CONTRAST = "low_contrast"
    BLACK_AND_WHITE = "black_and_white"
    SEPIA = "sepia"
    TECHNICOLOR = "technicolor"

@dataclass
class ColorGradingPreset:
    name: str
    description: str
    parameters: Dict
    style: GradingStyle
    confidence: float

@dataclass
class ColorAnalysis:
    dominant_colors: List[Tuple[int, int, int]]
    color_distribution: Dict[str, float]
    brightness: float
    contrast: float
    saturation: float
    temperature: float
    mood: str
    professional_score: float

class AdvancedColorGrading:
    """
    Advanced Color Grading Service with Human Intelligence
    Implements professional color grading techniques used in film and photography
    """
    
    def __init__(self):
        self.color_theory_rules = self._load_color_theory_rules()
        self.professional_presets = self._load_professional_presets()
        self.human_intelligence_weights = {
            'color_harmony': 0.25,
            'emotional_impact': 0.20,
            'professional_standards': 0.25,
            'artistic_creativity': 0.15,
            'technical_perfection': 0.15
        }
        
    def _load_color_theory_rules(self) -> Dict:
        """Load color theory rules and human intelligence guidelines"""
        return {
            'complementary_colors': {
                'red': 'cyan', 'green': 'magenta', 'blue': 'yellow',
                'orange': 'blue', 'purple': 'yellow', 'teal': 'red'
            },
            'analogous_colors': {
                'warm': ['red', 'orange', 'yellow'],
                'cool': ['blue', 'green', 'purple'],
                'neutral': ['gray', 'brown', 'beige']
            },
            'emotional_associations': {
                'red': ['passion', 'energy', 'danger'],
                'blue': ['calm', 'trust', 'professional'],
                'green': ['nature', 'growth', 'harmony'],
                'yellow': ['happiness', 'optimism', 'creativity'],
                'purple': ['luxury', 'mystery', 'creativity'],
                'orange': ['enthusiasm', 'adventure', 'confidence']
            },
            'professional_standards': {
                'skin_tone_range': [(200, 150, 120), (255, 220, 180)],
                'neutral_gray': (128, 128, 128),
                'broadcast_safe': True,
                'print_optimized': True
            }
        }
    
    def _load_professional_presets(self) -> Dict[str, ColorGradingPreset]:
        """Load professional color grading presets with human intelligence"""
        return {
            'hollywood_cinematic': ColorGradingPreset(
                name="Hollywood Cinematic",
                description="Professional cinematic look with warm highlights and cool shadows",
                parameters={
                    'shadows_tint': (0.1, 0.2, 0.3),  # Cool shadows
                    'highlights_tint': (1.1, 1.0, 0.9),  # Warm highlights
                    'contrast': 1.3,
                    'saturation': 0.9,
                    'gamma': 0.85,
                    'lift': (0.05, 0.05, 0.05),
                    'gain': (1.1, 1.05, 1.0)
                },
                style=GradingStyle.CINEMATIC,
                confidence=0.95
            ),
            'vintage_film': ColorGradingPreset(
                name="Vintage Film",
                description="Classic film look with faded colors and grain",
                parameters={
                    'shadows_tint': (0.8, 0.7, 0.6),
                    'highlights_tint': (1.2, 1.1, 1.0),
                    'contrast': 1.2,
                    'saturation': 0.7,
                    'gamma': 0.9,
                    'grain_intensity': 0.3,
                    'fade_amount': 0.2
                },
                style=GradingStyle.VINTAGE,
                confidence=0.92
            ),
            'modern_commercial': ColorGradingPreset(
                name="Modern Commercial",
                description="Clean, vibrant look for commercial applications",
                parameters={
                    'shadows_tint': (1.0, 1.0, 1.0),
                    'highlights_tint': (1.0, 1.0, 1.0),
                    'contrast': 1.4,
                    'saturation': 1.1,
                    'gamma': 1.0,
                    'clarity': 0.2,
                    'vibrance': 0.3
                },
                style=GradingStyle.MODERN,
                confidence=0.88
            ),
            'warm_portrait': ColorGradingPreset(
                name="Warm Portrait",
                description="Flattering warm tones for portrait photography",
                parameters={
                    'shadows_tint': (1.1, 1.0, 0.9),
                    'highlights_tint': (1.05, 1.0, 0.95),
                    'contrast': 1.1,
                    'saturation': 0.95,
                    'gamma': 0.95,
                    'skin_tone_enhancement': 0.3
                },
                style=GradingStyle.WARM,
                confidence=0.90
            )
        }
    
    def analyze_image_intelligence(self, image: np.ndarray) -> ColorAnalysis:
        """
        Advanced image analysis using human intelligence principles
        """
        # Convert to different color spaces for analysis
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        
        # Extract dominant colors using K-means clustering
        pixels = image.reshape(-1, 3)
        kmeans = KMeans(n_clusters=8, random_state=42)
        kmeans.fit(pixels)
        dominant_colors = kmeans.cluster_centers_.astype(int)
        
        # Calculate color distribution
        color_distribution = self._calculate_color_distribution(image)
        
        # Analyze brightness and contrast
        brightness = np.mean(image)
        contrast = np.std(image)
        
        # Analyze saturation
        saturation = np.mean(hsv[:, :, 1])
        
        # Calculate color temperature
        temperature = self._calculate_color_temperature(image)
        
        # Determine mood based on color analysis
        mood = self._determine_mood(dominant_colors, brightness, saturation)
        
        # Calculate professional score
        professional_score = self._calculate_professional_score(
            image, dominant_colors, brightness, contrast, saturation
        )
        
        return ColorAnalysis(
            dominant_colors=dominant_colors.tolist(),
            color_distribution=color_distribution,
            brightness=brightness,
            contrast=contrast,
            saturation=saturation,
            temperature=temperature,
            mood=mood,
            professional_score=professional_score
        )
    
    def _calculate_color_distribution(self, image: np.ndarray) -> Dict[str, float]:
        """Calculate distribution of colors in the image"""
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        
        # Define color ranges
        color_ranges = {
            'red': [(0, 50, 50), (10, 255, 255)],
            'orange': [(10, 50, 50), (25, 255, 255)],
            'yellow': [(25, 50, 50), (35, 255, 255)],
            'green': [(35, 50, 50), (85, 255, 255)],
            'blue': [(85, 50, 50), (130, 255, 255)],
            'purple': [(130, 50, 50), (170, 255, 255)],
            'pink': [(170, 50, 50), (180, 255, 255)]
        }
        
        distribution = {}
        total_pixels = image.shape[0] * image.shape[1]
        
        for color_name, (lower, upper) in color_ranges.items():
            mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
            pixel_count = np.sum(mask > 0)
            distribution[color_name] = pixel_count / total_pixels
        
        return distribution
    
    def _calculate_color_temperature(self, image: np.ndarray) -> float:
        """Calculate color temperature in Kelvin"""
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        
        # Extract a and b channels
        a_channel = lab[:, :, 1]
        b_channel = lab[:, :, 2]
        
        # Calculate average a and b values
        avg_a = np.mean(a_channel)
        avg_b = np.mean(b_channel)
        
        # Convert to color temperature (approximate)
        # This is a simplified calculation
        if avg_b > 0:
            temperature = 6500 + (avg_b * 100)  # Warmer
        else:
            temperature = 6500 + (avg_b * 50)   # Cooler
            
        return max(2000, min(12000, temperature))
    
    def _determine_mood(self, dominant_colors: np.ndarray, brightness: float, saturation: float) -> str:
        """Determine the mood of the image using human intelligence"""
        # Analyze dominant colors for emotional impact
        warm_colors = 0
        cool_colors = 0
        
        for color in dominant_colors:
            r, g, b = color
            if r > g and r > b:  # Red dominant
                warm_colors += 1
            elif b > r and b > g:  # Blue dominant
                cool_colors += 1
            elif g > r and g > b:  # Green dominant
                cool_colors += 0.5
                warm_colors += 0.5
        
        # Determine mood based on color balance and brightness
        if warm_colors > cool_colors:
            if brightness > 150:
                return "energetic"
            else:
                return "intimate"
        elif cool_colors > warm_colors:
            if brightness > 150:
                return "calm"
            else:
                return "mysterious"
        else:
            if saturation > 100:
                return "vibrant"
            else:
                return "neutral"
    
    def _calculate_professional_score(self, image: np.ndarray, dominant_colors: np.ndarray, 
                                    brightness: float, contrast: float, saturation: float) -> float:
        """Calculate professional quality score using human intelligence"""
        score = 0.0
        
        # Color balance score (0-25 points)
        color_balance = self._assess_color_balance(dominant_colors)
        score += color_balance * 25
        
        # Exposure score (0-25 points)
        exposure_score = self._assess_exposure(brightness, contrast)
        score += exposure_score * 25
        
        # Saturation score (0-25 points)
        saturation_score = self._assess_saturation(saturation)
        score += saturation_score * 25
        
        # Technical quality score (0-25 points)
        technical_score = self._assess_technical_quality(image)
        score += technical_score * 25
        
        return score / 100.0
    
    def _assess_color_balance(self, dominant_colors: np.ndarray) -> float:
        """Assess color balance using human intelligence"""
        # Check for neutral grays and balanced colors
        neutral_count = 0
        for color in dominant_colors:
            r, g, b = color
            if abs(r - g) < 20 and abs(g - b) < 20 and abs(r - b) < 20:
                neutral_count += 1
        
        return min(1.0, neutral_count / len(dominant_colors))
    
    def _assess_exposure(self, brightness: float, contrast: float) -> float:
        """Assess exposure quality"""
        # Ideal brightness range: 100-200
        if 100 <= brightness <= 200:
            brightness_score = 1.0
        else:
            brightness_score = 1.0 - abs(brightness - 150) / 150
        
        # Ideal contrast range: 30-80
        if 30 <= contrast <= 80:
            contrast_score = 1.0
        else:
            contrast_score = 1.0 - abs(contrast - 55) / 55
        
        return (brightness_score + contrast_score) / 2
    
    def _assess_saturation(self, saturation: float) -> float:
        """Assess saturation quality"""
        # Ideal saturation range: 80-150
        if 80 <= saturation <= 150:
            return 1.0
        else:
            return 1.0 - abs(saturation - 115) / 115
    
    def _assess_technical_quality(self, image: np.ndarray) -> float:
        """Assess technical image quality"""
        # Check for noise, blur, and artifacts
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Calculate Laplacian variance (sharpness measure)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Higher variance = sharper image
        sharpness_score = min(1.0, laplacian_var / 500)
        
        return sharpness_score
    
    def apply_intelligent_grading(self, image: np.ndarray, 
                                target_style: Optional[GradingStyle] = None,
                                custom_parameters: Optional[Dict] = None) -> Tuple[np.ndarray, Dict]:
        """
        Apply intelligent color grading with human intelligence
        """
        # Analyze the image first
        analysis = self.analyze_image_intelligence(image)
        
        # Select appropriate preset based on analysis
        if target_style:
            preset = self._select_preset_by_style(target_style)
        else:
            preset = self._select_preset_intelligently(analysis)
        
        # Apply the grading
        graded_image = self._apply_grading_preset(image, preset, custom_parameters)
        
        # Generate detailed report
        report = {
            'original_analysis': analysis.__dict__,
            'applied_preset': preset.name,
            'confidence_score': preset.confidence,
            'human_intelligence_score': self._calculate_human_intelligence_score(analysis, preset),
            'improvements': self._calculate_improvements(analysis, graded_image),
            'recommendations': self._generate_recommendations(analysis, preset)
        }
        
        return graded_image, report
    
    def _select_preset_intelligently(self, analysis: ColorAnalysis) -> ColorGradingPreset:
        """Select the best preset using human intelligence"""
        scores = {}
        
        for preset_name, preset in self.professional_presets.items():
            score = 0.0
            
            # Match mood with preset style
            if analysis.mood == "energetic" and preset.style in [GradingStyle.MODERN, GradingStyle.WARM]:
                score += 0.3
            elif analysis.mood == "calm" and preset.style in [GradingStyle.COOL, GradingStyle.CINEMATIC]:
                score += 0.3
            elif analysis.mood == "intimate" and preset.style in [GradingStyle.WARM, GradingStyle.VINTAGE]:
                score += 0.3
            
            # Consider color temperature
            if analysis.temperature < 4000 and preset.style == GradingStyle.WARM:
                score += 0.2
            elif analysis.temperature > 7000 and preset.style == GradingStyle.COOL:
                score += 0.2
            
            # Consider professional score
            if analysis.professional_score > 0.7:
                score += 0.2
            
            scores[preset_name] = score
        
        # Return preset with highest score
        best_preset = max(scores.items(), key=lambda x: x[1])[0]
        return self.professional_presets[best_preset]
    
    def _select_preset_by_style(self, style: GradingStyle) -> ColorGradingPreset:
        """Select preset by specific style"""
        for preset in self.professional_presets.values():
            if preset.style == style:
                return preset
        
        # Fallback to cinematic
        return self.professional_presets['hollywood_cinematic']
    
    def _apply_grading_preset(self, image: np.ndarray, preset: ColorGradingPreset, 
                            custom_parameters: Optional[Dict] = None) -> np.ndarray:
        """Apply color grading preset to image"""
        params = custom_parameters or preset.parameters
        
        # Convert to float for processing
        image_float = image.astype(np.float32) / 255.0
        
        # Apply shadows tint
        if 'shadows_tint' in params:
            shadows_mask = image_float < 0.5
            image_float[shadows_mask] *= np.array(params['shadows_tint'])
        
        # Apply highlights tint
        if 'highlights_tint' in params:
            highlights_mask = image_float > 0.5
            image_float[highlights_mask] *= np.array(params['highlights_tint'])
        
        # Apply contrast
        if 'contrast' in params:
            image_float = (image_float - 0.5) * params['contrast'] + 0.5
        
        # Apply saturation
        if 'saturation' in params:
            hsv = cv2.cvtColor(image_float, cv2.COLOR_RGB2HSV)
            hsv[:, :, 1] *= params['saturation']
            image_float = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
        
        # Apply gamma correction
        if 'gamma' in params:
            image_float = np.power(image_float, params['gamma'])
        
        # Apply lift and gain
        if 'lift' in params:
            image_float += np.array(params['lift'])
        if 'gain' in params:
            image_float *= np.array(params['gain'])
        
        # Clamp values
        image_float = np.clip(image_float, 0, 1)
        
        # Convert back to uint8
        return (image_float * 255).astype(np.uint8)
    
    def _calculate_human_intelligence_score(self, analysis: ColorAnalysis, preset: ColorGradingPreset) -> float:
        """Calculate human intelligence score for the grading decision"""
        score = 0.0
        
        # Color harmony assessment
        harmony_score = self._assess_color_harmony(analysis.dominant_colors)
        score += harmony_score * self.human_intelligence_weights['color_harmony']
        
        # Emotional impact assessment
        emotional_score = self._assess_emotional_impact(analysis.mood, preset.style)
        score += emotional_score * self.human_intelligence_weights['emotional_impact']
        
        # Professional standards assessment
        professional_score = analysis.professional_score
        score += professional_score * self.human_intelligence_weights['professional_standards']
        
        # Artistic creativity assessment
        creativity_score = self._assess_artistic_creativity(analysis, preset)
        score += creativity_score * self.human_intelligence_weights['artistic_creativity']
        
        # Technical perfection assessment
        technical_score = self._assess_technical_perfection(analysis)
        score += technical_score * self.human_intelligence_weights['technical_perfection']
        
        return score
    
    def _assess_color_harmony(self, dominant_colors: List[Tuple[int, int, int]]) -> float:
        """Assess color harmony using color theory"""
        harmony_score = 0.0
        
        for i, color1 in enumerate(dominant_colors):
            for j, color2 in enumerate(dominant_colors[i+1:], i+1):
                # Calculate color distance
                distance = np.sqrt(sum((c1 - c2) ** 2 for c1, c2 in zip(color1, color2)))
                
                # Check if colors are complementary
                if self._are_complementary_colors(color1, color2):
                    harmony_score += 0.3
                # Check if colors are analogous
                elif self._are_analogous_colors(color1, color2):
                    harmony_score += 0.2
                # Check if colors are well-separated
                elif distance > 100:
                    harmony_score += 0.1
        
        return min(1.0, harmony_score / len(dominant_colors))
    
    def _assess_emotional_impact(self, mood: str, style: GradingStyle) -> float:
        """Assess emotional impact of the grading choice"""
        emotional_matches = {
            'energetic': [GradingStyle.MODERN, GradingStyle.WARM],
            'calm': [GradingStyle.COOL, GradingStyle.CINEMATIC],
            'intimate': [GradingStyle.WARM, GradingStyle.VINTAGE],
            'mysterious': [GradingStyle.COOL, GradingStyle.CINEMATIC],
            'vibrant': [GradingStyle.MODERN, GradingStyle.TECHNICOLOR]
        }
        
        if mood in emotional_matches and style in emotional_matches[mood]:
            return 1.0
        else:
            return 0.5
    
    def _assess_artistic_creativity(self, analysis: ColorAnalysis, preset: ColorGradingPreset) -> float:
        """Assess artistic creativity of the grading choice"""
        # Higher creativity for unexpected but effective combinations
        creativity_score = 0.5
        
        # Bonus for creative combinations
        if analysis.mood == "mysterious" and preset.style == GradingStyle.WARM:
            creativity_score += 0.3
        elif analysis.mood == "energetic" and preset.style == GradingStyle.COOL:
            creativity_score += 0.3
        
        return min(1.0, creativity_score)
    
    def _assess_technical_perfection(self, analysis: ColorAnalysis) -> float:
        """Assess technical perfection"""
        return analysis.professional_score
    
    def _are_complementary_colors(self, color1: Tuple[int, int, int], color2: Tuple[int, int, int]) -> bool:
        """Check if two colors are complementary"""
        # Convert to HSV for easier comparison
        hsv1 = colorsys.rgb_to_hsv(color1[0]/255, color1[1]/255, color1[2]/255)
        hsv2 = colorsys.rgb_to_hsv(color2[0]/255, color2[1]/255, color2[2]/255)
        
        # Check if hues are opposite (complementary)
        hue_diff = abs(hsv1[0] - hsv2[0])
        return hue_diff > 0.4 and hue_diff < 0.6
    
    def _are_analogous_colors(self, color1: Tuple[int, int, int], color2: Tuple[int, int, int]) -> bool:
        """Check if two colors are analogous"""
        hsv1 = colorsys.rgb_to_hsv(color1[0]/255, color1[1]/255, color1[2]/255)
        hsv2 = colorsys.rgb_to_hsv(color2[0]/255, color2[1]/255, color2[2]/255)
        
        # Check if hues are close (analogous)
        hue_diff = abs(hsv1[0] - hsv2[0])
        return hue_diff < 0.1
    
    def _calculate_improvements(self, original_analysis: ColorAnalysis, graded_image: np.ndarray) -> Dict:
        """Calculate improvements made by the grading"""
        graded_analysis = self.analyze_image_intelligence(graded_image)
        
        return {
            'professional_score_improvement': graded_analysis.professional_score - original_analysis.professional_score,
            'color_harmony_improvement': self._assess_color_harmony(graded_analysis.dominant_colors) - 
                                       self._assess_color_harmony(original_analysis.dominant_colors),
            'mood_enhancement': graded_analysis.mood != original_analysis.mood,
            'overall_quality_improvement': graded_analysis.professional_score / original_analysis.professional_score
        }
    
    def _generate_recommendations(self, analysis: ColorAnalysis, preset: ColorGradingPreset) -> List[str]:
        """Generate human intelligence recommendations"""
        recommendations = []
        
        if analysis.professional_score < 0.6:
            recommendations.append("Consider adjusting exposure for better technical quality")
        
        if analysis.saturation < 80:
            recommendations.append("Image appears desaturated - consider increasing vibrance")
        elif analysis.saturation > 150:
            recommendations.append("Image may be oversaturated - consider reducing saturation")
        
        if analysis.contrast < 30:
            recommendations.append("Low contrast detected - consider increasing contrast for more impact")
        elif analysis.contrast > 80:
            recommendations.append("High contrast detected - consider reducing for softer look")
        
        if preset.style == GradingStyle.CINEMATIC:
            recommendations.append("Cinematic grading applied - consider adding film grain for authenticity")
        
        if analysis.mood == "neutral":
            recommendations.append("Image mood is neutral - consider adding color grading for emotional impact")
        
        return recommendations 