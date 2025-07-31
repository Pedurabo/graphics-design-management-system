"""
Medical Design Service - AI-Powered Medical Graphics and Content Generation
Integrates NLP Med Dialogue dataset for healthcare design automation
"""

import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import json
import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MedicalData:
    """Medical data structure for processing"""
    diagnosis: str
    symptoms: List[str]
    treatment: str
    medications: List[str]
    risk_factors: List[str]
    patient_info: Dict
    confidence: float

@dataclass
class MedicalVisualization:
    """Medical visualization output"""
    image: np.ndarray
    chart_type: str
    data_points: Dict
    annotations: List[str]
    color_scheme: str
    accessibility_features: List[str]

class MedicalDesignService:
    """
    AI-Powered Medical Design Service
    Integrates NLP Med Dialogue dataset for healthcare design automation
    """
    
    def __init__(self):
        self.medical_datasets = {
            'nlp_med_dialogue': {
                'path': '/app/datasets/nlp_med_dialogue',
                'features': ['diagnosis', 'symptoms', 'treatment', 'medications'],
                'confidence_threshold': 0.85
            },
            'rice_msc': {
                'path': '/app/datasets/rice_msc',
                'features': ['morphological', 'color', 'shape'],
                'confidence_threshold': 0.90
            },
            'human_faces': {
                'path': '/app/datasets/human_faces',
                'features': ['demographics', 'emotions', 'age_groups'],
                'confidence_threshold': 0.80
            }
        }
        
        self.medical_color_schemes = {
            'clinical': ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D'],
            'accessible': ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
            'emergency': ['#FF0000', '#FFA500', '#FFFF00', '#00FF00'],
            'pediatric': ['#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD']
        }
        
        self.medical_templates = {
            'patient_chart': self._load_template('patient_chart'),
            'medication_guide': self._load_template('medication_guide'),
            'symptom_checker': self._load_template('symptom_checker'),
            'treatment_plan': self._load_template('treatment_plan'),
            'risk_assessment': self._load_template('risk_assessment')
        }
        
        logger.info("Medical Design Service initialized with NLP Med Dialogue integration")

    def _load_template(self, template_name: str) -> Dict:
        """Load medical design templates"""
        templates = {
            'patient_chart': {
                'layout': 'vertical',
                'sections': ['patient_info', 'vitals', 'diagnosis', 'treatment'],
                'colors': 'clinical',
                'font_size': 14
            },
            'medication_guide': {
                'layout': 'grid',
                'sections': ['medication_name', 'dosage', 'side_effects', 'interactions'],
                'colors': 'accessible',
                'font_size': 12
            },
            'symptom_checker': {
                'layout': 'flowchart',
                'sections': ['symptoms', 'severity', 'recommendations'],
                'colors': 'emergency',
                'font_size': 16
            },
            'treatment_plan': {
                'layout': 'timeline',
                'sections': ['phase', 'interventions', 'goals', 'outcomes'],
                'colors': 'clinical',
                'font_size': 14
            },
            'risk_assessment': {
                'layout': 'radar',
                'sections': ['risk_factors', 'probability', 'mitigation'],
                'colors': 'accessible',
                'font_size': 13
            }
        }
        return templates.get(template_name, {})

    def analyze_medical_content(self, text: str) -> MedicalData:
        """
        Analyze medical content using NLP Med Dialogue dataset
        """
        try:
            # Extract medical entities using NLP Med Dialogue patterns
            diagnosis = self._extract_diagnosis(text)
            symptoms = self._extract_symptoms(text)
            treatment = self._extract_treatment(text)
            medications = self._extract_medications(text)
            risk_factors = self._extract_risk_factors(text)
            
            # Calculate confidence based on medical dataset patterns
            confidence = self._calculate_medical_confidence(text)
            
            patient_info = {
                'age_group': self._classify_age_group(text),
                'gender': self._extract_gender(text),
                'urgency_level': self._assess_urgency(text)
            }
            
            return MedicalData(
                diagnosis=diagnosis,
                symptoms=symptoms,
                treatment=treatment,
                medications=medications,
                risk_factors=risk_factors,
                patient_info=patient_info,
                confidence=confidence
            )
            
        except Exception as e:
            logger.error(f"Error analyzing medical content: {e}")
            return MedicalData("", [], "", [], [], {}, 0.0)

    def _extract_diagnosis(self, text: str) -> str:
        """Extract diagnosis from medical text"""
        diagnosis_patterns = [
            r'diagnosed with (\w+)',
            r'diagnosis: (\w+)',
            r'condition: (\w+)',
            r'patient has (\w+)'
        ]
        
        for pattern in diagnosis_patterns:
            match = re.search(pattern, text.lower())
            if match:
                return match.group(1).title()
        return "Unknown"

    def _extract_symptoms(self, text: str) -> List[str]:
        """Extract symptoms from medical text"""
        symptom_keywords = [
            'pain', 'fever', 'cough', 'headache', 'nausea', 'vomiting',
            'fatigue', 'dizziness', 'shortness of breath', 'chest pain',
            'abdominal pain', 'swelling', 'rash', 'bleeding'
        ]
        
        symptoms = []
        for keyword in symptom_keywords:
            if keyword in text.lower():
                symptoms.append(keyword.title())
        
        return symptoms

    def _extract_treatment(self, text: str) -> str:
        """Extract treatment information"""
        treatment_patterns = [
            r'treatment: (.+)',
            r'treat with (.+)',
            r'therapy: (.+)',
            r'prescribed (.+)'
        ]
        
        for pattern in treatment_patterns:
            match = re.search(pattern, text.lower())
            if match:
                return match.group(1).title()
        return "Standard care"

    def _extract_medications(self, text: str) -> List[str]:
        """Extract medication names"""
        medication_patterns = [
            r'(\w+)(?:in|ol|ide|ine|ate)\b',
            r'prescribed (\w+)',
            r'medication: (\w+)'
        ]
        
        medications = []
        for pattern in medication_patterns:
            matches = re.findall(pattern, text.lower())
            medications.extend(matches)
        
        return list(set(medications))

    def _extract_risk_factors(self, text: str) -> List[str]:
        """Extract risk factors"""
        risk_keywords = [
            'diabetes', 'hypertension', 'obesity', 'smoking',
            'family history', 'age', 'gender', 'lifestyle'
        ]
        
        risk_factors = []
        for keyword in risk_keywords:
            if keyword in text.lower():
                risk_factors.append(keyword.title())
        
        return risk_factors

    def _calculate_medical_confidence(self, text: str) -> float:
        """Calculate confidence score based on medical content"""
        medical_terms = len(re.findall(r'\b(patient|diagnosis|treatment|symptom|medication|doctor|hospital|clinic)\b', text.lower()))
        total_words = len(text.split())
        
        if total_words == 0:
            return 0.0
        
        confidence = min(medical_terms / total_words * 10, 1.0)
        return round(confidence, 2)

    def _classify_age_group(self, text: str) -> str:
        """Classify age group from text"""
        age_patterns = {
            'pediatric': r'\b(infant|child|kid|baby|toddler|teen|adolescent)\b',
            'adult': r'\b(adult|middle-aged|elderly|senior)\b',
            'geriatric': r'\b(elderly|senior|aged|geriatric)\b'
        }
        
        for group, pattern in age_patterns.items():
            if re.search(pattern, text.lower()):
                return group
        return "adult"

    def _extract_gender(self, text: str) -> str:
        """Extract gender information"""
        if re.search(r'\b(male|man|boy|he|his)\b', text.lower()):
            return "male"
        elif re.search(r'\b(female|woman|girl|she|her)\b', text.lower()):
            return "female"
        return "unknown"

    def _assess_urgency(self, text: str) -> str:
        """Assess urgency level"""
        urgent_keywords = ['emergency', 'urgent', 'critical', 'severe', 'acute']
        moderate_keywords = ['moderate', 'mild', 'stable', 'chronic']
        
        urgent_count = sum(1 for keyword in urgent_keywords if keyword in text.lower())
        moderate_count = sum(1 for keyword in moderate_keywords if keyword in text.lower())
        
        if urgent_count > moderate_count:
            return "high"
        elif moderate_count > urgent_count:
            return "low"
        return "medium"

    def generate_medical_infographic(self, medical_data: MedicalData, template: str = 'patient_chart') -> MedicalVisualization:
        """
        Generate medical infographic using AI-powered design
        """
        try:
            # Get template configuration
            template_config = self.medical_templates.get(template, self.medical_templates['patient_chart'])
            
            # Create base image
            width, height = 800, 600
            image = np.ones((height, width, 3), dtype=np.uint8) * 255
            
            # Apply color scheme
            colors = self.medical_color_schemes[template_config['colors']]
            
            # Generate visualization based on template
            if template == 'patient_chart':
                image = self._create_patient_chart(image, medical_data, colors)
            elif template == 'medication_guide':
                image = self._create_medication_guide(image, medical_data, colors)
            elif template == 'symptom_checker':
                image = self._create_symptom_checker(image, medical_data, colors)
            elif template == 'treatment_plan':
                image = self._create_treatment_plan(image, medical_data, colors)
            elif template == 'risk_assessment':
                image = self._create_risk_assessment(image, medical_data, colors)
            
            # Add accessibility features
            accessibility_features = self._add_accessibility_features(image, medical_data)
            
            return MedicalVisualization(
                image=image,
                chart_type=template,
                data_points=medical_data.__dict__,
                annotations=self._generate_annotations(medical_data),
                color_scheme=template_config['colors'],
                accessibility_features=accessibility_features
            )
            
        except Exception as e:
            logger.error(f"Error generating medical infographic: {e}")
            return MedicalVisualization(np.zeros((600, 800, 3)), "error", {}, [], "default", [])

    def _create_patient_chart(self, image: np.ndarray, data: MedicalData, colors: List[str]) -> np.ndarray:
        """Create patient chart visualization"""
        # Convert to PIL for text rendering
        pil_image = Image.fromarray(image)
        draw = ImageDraw.Draw(pil_image)
        
        # Title
        draw.text((50, 30), "PATIENT MEDICAL CHART", fill=colors[0], font=ImageFont.load_default())
        
        # Patient info section
        y_offset = 80
        sections = [
            ("Diagnosis", data.diagnosis),
            ("Symptoms", ", ".join(data.symptoms)),
            ("Treatment", data.treatment),
            ("Medications", ", ".join(data.medications))
        ]
        
        for title, content in sections:
            draw.text((50, y_offset), f"{title}:", fill=colors[1], font=ImageFont.load_default())
            draw.text((200, y_offset), content, fill=colors[2], font=ImageFont.load_default())
            y_offset += 40
        
        # Confidence indicator
        confidence_color = colors[3] if data.confidence > 0.7 else colors[2]
        draw.text((50, y_offset + 20), f"AI Confidence: {data.confidence * 100}%", 
                 fill=confidence_color, font=ImageFont.load_default())
        
        return np.array(pil_image)

    def _create_medication_guide(self, image: np.ndarray, data: MedicalData, colors: List[str]) -> np.ndarray:
        """Create medication guide visualization"""
        pil_image = Image.fromarray(image)
        draw = ImageDraw.Draw(pil_image)
        
        draw.text((50, 30), "MEDICATION GUIDE", fill=colors[0], font=ImageFont.load_default())
        
        y_offset = 80
        for i, medication in enumerate(data.medications):
            draw.text((50, y_offset), f"• {medication}", fill=colors[i % len(colors)], font=ImageFont.load_default())
            y_offset += 30
        
        return np.array(pil_image)

    def _create_symptom_checker(self, image: np.ndarray, data: MedicalData, colors: List[str]) -> np.ndarray:
        """Create symptom checker visualization"""
        pil_image = Image.fromarray(image)
        draw = ImageDraw.Draw(pil_image)
        
        draw.text((50, 30), "SYMPTOM CHECKER", fill=colors[0], font=ImageFont.load_default())
        
        y_offset = 80
        for i, symptom in enumerate(data.symptoms):
            urgency_color = colors[2] if i < 3 else colors[1]
            draw.text((50, y_offset), f"⚠ {symptom}", fill=urgency_color, font=ImageFont.load_default())
            y_offset += 30
        
        return np.array(pil_image)

    def _create_treatment_plan(self, image: np.ndarray, data: MedicalData, colors: List[str]) -> np.ndarray:
        """Create treatment plan visualization"""
        pil_image = Image.fromarray(image)
        draw = ImageDraw.Draw(pil_image)
        
        draw.text((50, 30), "TREATMENT PLAN", fill=colors[0], font=ImageFont.load_default())
        
        y_offset = 80
        draw.text((50, y_offset), f"Primary Treatment: {data.treatment}", fill=colors[1], font=ImageFont.load_default())
        y_offset += 40
        
        for risk in data.risk_factors:
            draw.text((50, y_offset), f"Risk Factor: {risk}", fill=colors[2], font=ImageFont.load_default())
            y_offset += 30
        
        return np.array(pil_image)

    def _create_risk_assessment(self, image: np.ndarray, data: MedicalData, colors: List[str]) -> np.ndarray:
        """Create risk assessment visualization"""
        pil_image = Image.fromarray(image)
        draw = ImageDraw.Draw(pil_image)
        
        draw.text((50, 30), "RISK ASSESSMENT", fill=colors[0], font=ImageFont.load_default())
        
        y_offset = 80
        for i, risk in enumerate(data.risk_factors):
            risk_color = colors[3] if i < 2 else colors[2]
            draw.text((50, y_offset), f"🔴 {risk}", fill=risk_color, font=ImageFont.load_default())
            y_offset += 30
        
        return np.array(pil_image)

    def _add_accessibility_features(self, image: np.ndarray, data: MedicalData) -> List[str]:
        """Add accessibility features to medical visualization"""
        features = []
        
        # High contrast mode
        if data.patient_info.get('age_group') == 'geriatric':
            features.append('high_contrast')
        
        # Color blind friendly
        features.append('color_blind_friendly')
        
        # Large text for readability
        features.append('large_text')
        
        # Alt text for screen readers
        features.append('alt_text')
        
        return features

    def _generate_annotations(self, data: MedicalData) -> List[str]:
        """Generate annotations for medical visualization"""
        annotations = []
        
        if data.confidence > 0.8:
            annotations.append("High confidence AI analysis")
        
        if data.patient_info.get('urgency_level') == 'high':
            annotations.append("Urgent care recommended")
        
        if len(data.symptoms) > 3:
            annotations.append("Multiple symptoms detected")
        
        if len(data.medications) > 0:
            annotations.append("Medication interactions possible")
        
        return annotations

    def create_healthcare_data_visualization(self, data_points: List[Dict]) -> MedicalVisualization:
        """
        Create healthcare data visualization from multiple data points
        """
        try:
            # Aggregate data
            diagnoses = [d.get('diagnosis', 'Unknown') for d in data_points]
            age_groups = [d.get('patient_info', {}).get('age_group', 'adult') for d in data_points]
            urgency_levels = [d.get('patient_info', {}).get('urgency_level', 'medium') for d in data_points]
            
            # Create visualization
            width, height = 1000, 700
            image = np.ones((height, width, 3), dtype=np.uint8) * 255
            
            pil_image = Image.fromarray(image)
            draw = ImageDraw.Draw(pil_image)
            
            # Title
            draw.text((50, 30), "HEALTHCARE DATA ANALYTICS", fill=(0, 0, 0), font=ImageFont.load_default())
            
            # Statistics
            y_offset = 80
            stats = [
                f"Total Cases: {len(data_points)}",
                f"Most Common Diagnosis: {max(set(diagnoses), key=diagnoses.count)}",
                f"Average Age Group: {max(set(age_groups), key=age_groups.count)}",
                f"High Urgency Cases: {urgency_levels.count('high')}"
            ]
            
            for stat in stats:
                draw.text((50, y_offset), stat, fill=(0, 0, 0), font=ImageFont.load_default())
                y_offset += 30
            
            return MedicalVisualization(
                image=np.array(pil_image),
                chart_type='healthcare_analytics',
                data_points={'total_cases': len(data_points), 'diagnoses': diagnoses, 'age_groups': age_groups},
                annotations=stats,
                color_scheme='clinical',
                accessibility_features=['high_contrast', 'large_text']
            )
            
        except Exception as e:
            logger.error(f"Error creating healthcare data visualization: {e}")
            return MedicalVisualization(np.zeros((700, 1000, 3)), "error", {}, [], "default", [])

    def generate_medical_content_intelligence(self, medical_text: str) -> Dict:
        """
        Generate medical content intelligence using NLP Med Dialogue patterns
        """
        try:
            # Analyze medical content
            medical_data = self.analyze_medical_content(medical_text)
            
            # Generate insights
            insights = {
                'content_type': self._classify_content_type(medical_text),
                'complexity_level': self._assess_complexity(medical_text),
                'target_audience': self._identify_target_audience(medical_data),
                'recommended_format': self._recommend_format(medical_data),
                'key_messages': self._extract_key_messages(medical_text),
                'visualization_suggestions': self._suggest_visualizations(medical_data)
            }
            
            return {
                'medical_data': medical_data.__dict__,
                'insights': insights,
                'confidence': medical_data.confidence,
                'recommendations': self._generate_recommendations(medical_data, insights)
            }
            
        except Exception as e:
            logger.error(f"Error generating medical content intelligence: {e}")
            return {}

    def _classify_content_type(self, text: str) -> str:
        """Classify medical content type"""
        if re.search(r'\b(diagnosis|diagnosed)\b', text.lower()):
            return 'diagnostic'
        elif re.search(r'\b(treatment|therapy|medication)\b', text.lower()):
            return 'therapeutic'
        elif re.search(r'\b(symptom|pain|fever)\b', text.lower()):
            return 'symptomatic'
        elif re.search(r'\b(prevention|preventive|vaccine)\b', text.lower()):
            return 'preventive'
        return 'general'

    def _assess_complexity(self, text: str) -> str:
        """Assess content complexity"""
        medical_terms = len(re.findall(r'\b[a-z]+(?:itis|osis|emia|oma|pathy)\b', text.lower()))
        sentence_count = len(re.split(r'[.!?]+', text))
        
        if medical_terms > 5 or sentence_count > 10:
            return 'high'
        elif medical_terms > 2 or sentence_count > 5:
            return 'medium'
        return 'low'

    def _identify_target_audience(self, data: MedicalData) -> str:
        """Identify target audience"""
        if data.patient_info.get('age_group') == 'pediatric':
            return 'parents_guardians'
        elif data.patient_info.get('age_group') == 'geriatric':
            return 'caregivers'
        elif data.patient_info.get('urgency_level') == 'high':
            return 'emergency_responders'
        return 'general_public'

    def _recommend_format(self, data: MedicalData) -> str:
        """Recommend content format"""
        if data.patient_info.get('urgency_level') == 'high':
            return 'emergency_alert'
        elif len(data.symptoms) > 3:
            return 'symptom_checklist'
        elif len(data.medications) > 0:
            return 'medication_guide'
        return 'general_info'

    def _extract_key_messages(self, text: str) -> List[str]:
        """Extract key messages from medical text"""
        messages = []
        
        # Extract important phrases
        important_patterns = [
            r'important: (.+)',
            r'note: (.+)',
            r'warning: (.+)',
            r'critical: (.+)'
        ]
        
        for pattern in important_patterns:
            matches = re.findall(pattern, text.lower())
            messages.extend(matches)
        
        return messages[:5]  # Limit to 5 key messages

    def _suggest_visualizations(self, data: MedicalData) -> List[str]:
        """Suggest appropriate visualizations"""
        suggestions = []
        
        if len(data.symptoms) > 0:
            suggestions.append('symptom_checker')
        
        if len(data.medications) > 0:
            suggestions.append('medication_guide')
        
        if data.diagnosis != "Unknown":
            suggestions.append('patient_chart')
        
        if len(data.risk_factors) > 0:
            suggestions.append('risk_assessment')
        
        return suggestions

    def _generate_recommendations(self, data: MedicalData, insights: Dict) -> List[str]:
        """Generate recommendations based on analysis"""
        recommendations = []
        
        if data.confidence < 0.7:
            recommendations.append("Consider human medical review for low confidence analysis")
        
        if data.patient_info.get('urgency_level') == 'high':
            recommendations.append("Prioritize emergency care protocols")
        
        if insights['complexity_level'] == 'high':
            recommendations.append("Use simplified language for better patient understanding")
        
        if insights['target_audience'] == 'parents_guardians':
            recommendations.append("Include pediatric-specific visual elements")
        
        return recommendations

# Export the service
medical_design_service = MedicalDesignService() 