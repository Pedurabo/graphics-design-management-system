// AI Segmentation Module - Human Segmentation using MADS Dataset
class AISegmentationModule {
    constructor(app) {
        this.app = app;
        this.model = null;
        this.isModelLoaded = false;
        this.segmentationResults = [];
        this.currentMask = null;
        
        // MADS Dataset integration
        this.madsDataset = {
            images: [],
            masks: [],
            collages: [],
            metadata: {
                totalImages: 1192,
                categories: ['HipHop', 'Ballet', 'Jazz', 'Contemporary'],
                resolution: 'variable',
                format: 'PNG/JPG'
            }
        };
        
        this.initialize();
    }
    
    initialize() {
        this.loadSegmentationModel();
        this.setupUI();
        this.loadMadsDatasetInfo();
    }
    
    async loadSegmentationModel() {
        try {
            // Load TensorFlow.js and U-Net model for segmentation
            if (typeof tf === 'undefined') {
                await this.loadTensorFlow();
            }
            
            // Initialize U-Net model for human segmentation
            this.model = await this.createUNetModel();
            this.isModelLoaded = true;
            
            console.log('AI Segmentation model loaded successfully');
            this.app.modules.ui.showNotification('AI Segmentation model loaded!', 'success');
        } catch (error) {
            console.error('Failed to load segmentation model:', error);
            this.app.modules.ui.showNotification('AI model loading failed', 'error');
        }
    }
    
    async loadTensorFlow() {
        // Load TensorFlow.js dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js';
        document.head.appendChild(script);
        
        return new Promise((resolve) => {
            script.onload = resolve;
        });
    }
    
    async createUNetModel() {
        // Create a simplified U-Net model for human segmentation
        const model = tf.sequential();
        
        // Encoder path
        model.add(tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same',
            inputShape: [256, 256, 3]
        }));
        model.add(tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
        
        // Middle layers
        model.add(tf.layers.conv2d({
            filters: 128,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
        }));
        model.add(tf.layers.conv2d({
            filters: 128,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
        }));
        
        // Decoder path
        model.add(tf.layers.upSampling2d({ size: 2 }));
        model.add(tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
        }));
        model.add(tf.layers.conv2d({
            filters: 1,
            kernelSize: 1,
            activation: 'sigmoid'
        }));
        
        model.compile({
            optimizer: 'adam',
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });
        
        return model;
    }
    
    setupUI() {
        // Add AI segmentation tools to the toolbar
        this.addSegmentationTools();
        
        // Add AI panel to sidebar
        this.addAIPanel();
    }
    
    addSegmentationTools() {
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;
        
        // Add AI segmentation tool group
        const aiToolGroup = document.createElement('div');
        aiToolGroup.className = 'tool-group';
        aiToolGroup.innerHTML = `
            <button class="tool-button" id="aiSegmentTool" onclick="photoshopApp.modules.ai.selectTool('segment')" title="AI Human Segmentation">
                🤖 AI Segment
            </button>
            <button class="tool-button" id="aiRefineTool" onclick="photoshopApp.modules.ai.selectTool('refine')" title="Refine Segmentation">
                ✨ Refine
            </button>
            <button class="tool-button" id="aiBackgroundTool" onclick="photoshopApp.modules.ai.selectTool('background')" title="Background Removal">
                🎭 Background
            </button>
        `;
        
        toolbar.appendChild(aiToolGroup);
    }
    
    addAIPanel() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;
        
        const aiSection = document.createElement('div');
        aiSection.className = 'sidebar-section';
        aiSection.innerHTML = `
            <div class="sidebar-header" onclick="photoshopApp.modules.ai.togglePanel('ai')">
                AI Segmentation
                <span id="ai-toggle">▼</span>
            </div>
            <div class="sidebar-content" id="ai-content">
                <div class="form-group">
                    <label class="form-label">Confidence Threshold</label>
                    <input type="range" class="slider" min="0" max="100" value="80" onchange="photoshopApp.modules.ai.updateConfidence(this.value)">
                    <span id="confidenceValue">80%</span>
                </div>
                <div class="form-group">
                    <label class="form-label">Refinement Level</label>
                    <select class="form-control" onchange="photoshopApp.modules.ai.updateRefinementLevel(this.value)">
                        <option value="low">Low (Fast)</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High (Slow)</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="photoshopApp.modules.ai.performSegmentation()" style="width: 100%; margin-bottom: 8px;">
                    🎯 Segment Human
                </button>
                <button class="btn" onclick="photoshopApp.modules.ai.removeBackground()" style="width: 100%; margin-bottom: 8px;">
                    🎭 Remove Background
                </button>
                <button class="btn" onclick="photoshopApp.modules.ai.refineMask()" style="width: 100%;">
                    ✨ Refine Mask
                </button>
            </div>
        `;
        
        sidebar.appendChild(aiSection);
    }
    
    selectTool(toolName) {
        this.currentTool = toolName;
        this.app.modules.tools.selectTool(toolName);
        
        // Update tool buttons
        document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(toolName + 'Tool').classList.add('active');
        
        this.app.modules.ui.showNotification(`AI ${toolName} tool selected`);
    }
    
    async performSegmentation() {
        if (!this.isModelLoaded) {
            this.app.modules.ui.showNotification('AI model not loaded yet', 'error');
            return;
        }
        
        try {
            this.app.modules.ui.showNotification('Performing AI segmentation...', 'info');
            
            // Get current canvas image
            const imageData = this.app.modules.canvas.getImageData();
            const tensor = this.preprocessImage(imageData);
            
            // Perform segmentation
            const prediction = await this.model.predict(tensor);
            const mask = this.postprocessMask(prediction);
            
            // Create segmentation layer
            this.createSegmentationLayer(mask);
            
            this.app.modules.ui.showNotification('AI segmentation completed!', 'success');
        } catch (error) {
            console.error('Segmentation failed:', error);
            this.app.modules.ui.showNotification('Segmentation failed', 'error');
        }
    }
    
    preprocessImage(imageData) {
        // Convert image data to tensor and preprocess
        const tensor = tf.browser.fromPixels(imageData, 3);
        const resized = tf.image.resizeBilinear(tensor, [256, 256]);
        const normalized = resized.div(255.0);
        const batched = normalized.expandDims(0);
        
        return batched;
    }
    
    postprocessMask(prediction) {
        // Convert prediction tensor to mask
        const mask = prediction.squeeze();
        const thresholded = mask.greater(0.5);
        const maskData = thresholded.dataSync();
        
        // Create canvas mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = 256;
        maskCanvas.height = 256;
        const maskCtx = maskCanvas.getContext('2d');
        
        const imageData = maskCtx.createImageData(256, 256);
        for (let i = 0; i < maskData.length; i++) {
            const value = maskData[i] ? 255 : 0;
            imageData.data[i * 4] = value;     // Red
            imageData.data[i * 4 + 1] = value; // Green
            imageData.data[i * 4 + 2] = value; // Blue
            imageData.data[i * 4 + 3] = value; // Alpha
        }
        
        maskCtx.putImageData(imageData, 0, 0);
        return maskCanvas;
    }
    
    createSegmentationLayer(mask) {
        // Create a new layer with the segmentation mask
        const layer = this.app.modules.layers.createNewLayer('AI Segmentation');
        
        // Apply mask to layer
        const ctx = layer.ctx;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(mask, 0, 0, this.app.modules.canvas.width, this.app.modules.canvas.height);
        
        // Set layer properties
        layer.blendMode = 'multiply';
        layer.opacity = 80;
        
        this.app.modules.canvas.render();
        this.currentMask = mask;
    }
    
    async removeBackground() {
        if (!this.currentMask) {
            this.app.modules.ui.showNotification('No segmentation mask available', 'error');
            return;
        }
        
        try {
            // Create background removal effect
            const backgroundLayer = this.app.modules.layers.layers[0]; // Background layer
            const maskCanvas = this.currentMask;
            
            // Apply mask to background layer
            const ctx = backgroundLayer.ctx;
            ctx.globalCompositeOperation = 'destination-out';
            ctx.drawImage(maskCanvas, 0, 0, this.app.modules.canvas.width, this.app.modules.canvas.height);
            ctx.globalCompositeOperation = 'source-over';
            
            this.app.modules.canvas.render();
            this.app.modules.ui.showNotification('Background removed!', 'success');
        } catch (error) {
            console.error('Background removal failed:', error);
            this.app.modules.ui.showNotification('Background removal failed', 'error');
        }
    }
    
    async refineMask() {
        if (!this.currentMask) {
            this.app.modules.ui.showNotification('No mask to refine', 'error');
            return;
        }
        
        try {
            // Apply morphological operations to refine mask
            const refinedMask = this.applyMorphologicalOperations(this.currentMask);
            this.currentMask = refinedMask;
            
            // Update segmentation layer
            const layer = this.app.modules.layers.getActiveLayer();
            if (layer && layer.name === 'AI Segmentation') {
                layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
                layer.ctx.drawImage(refinedMask, 0, 0, layer.canvas.width, layer.canvas.height);
                this.app.modules.canvas.render();
            }
            
            this.app.modules.ui.showNotification('Mask refined!', 'success');
        } catch (error) {
            console.error('Mask refinement failed:', error);
            this.app.modules.ui.showNotification('Mask refinement failed', 'error');
        }
    }
    
    applyMorphologicalOperations(mask) {
        // Simple morphological operations for mask refinement
        const canvas = document.createElement('canvas');
        canvas.width = mask.width;
        canvas.height = mask.height;
        const ctx = canvas.getContext('2d');
        
        // Draw original mask
        ctx.drawImage(mask, 0, 0);
        
        // Apply erosion and dilation for noise removal
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple smoothing filter
        for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
                const idx = (y * canvas.width + x) * 4;
                let sum = 0;
                
                // 3x3 smoothing
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nIdx = ((y + dy) * canvas.width + (x + dx)) * 4;
                        sum += data[nIdx];
                    }
                }
                
                const average = sum / 9;
                data[idx] = average > 127 ? 255 : 0;
                data[idx + 1] = data[idx];
                data[idx + 2] = data[idx];
                data[idx + 3] = data[idx];
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
    
    updateConfidence(value) {
        this.confidenceThreshold = parseInt(value) / 100;
        document.getElementById('confidenceValue').textContent = value + '%';
    }
    
    updateRefinementLevel(level) {
        this.refinementLevel = level;
    }
    
    togglePanel(panelName) {
        const content = document.getElementById(panelName + '-content');
        const toggle = document.getElementById(panelName + '-toggle');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '▼';
        } else {
            content.style.display = 'none';
            toggle.textContent = '▶';
        }
    }
    
    loadMadsDatasetInfo() {
        // Load information about the MADS dataset
        console.log('MADS Dataset Info:', this.madsDataset.metadata);
        
        // This would typically load the actual dataset files
        // For now, we'll simulate the dataset structure
        this.simulateMadsDataset();
    }
    
    simulateMadsDataset() {
        // Simulate MADS dataset structure for demonstration
        this.madsDataset.images = [
            'HipHop_HipHop1_C0_00180.png',
            'HipHop_HipHop1_C0_00225.png',
            'Ballet_Ballet1_C0_00180.png',
            'Jazz_Jazz1_C0_00180.png'
        ];
        
        this.madsDataset.masks = [
            'HipHop_HipHop1_C0_00180_mask.png',
            'HipHop_HipHop1_C0_00225_mask.png',
            'Ballet_Ballet1_C0_00180_mask.png',
            'Jazz_Jazz1_C0_00180_mask.png'
        ];
        
        console.log('MADS Dataset simulation loaded');
    }
    
    // Dataset utilities
    getDatasetStats() {
        return {
            totalImages: this.madsDataset.metadata.totalImages,
            categories: this.madsDataset.metadata.categories,
            loadedImages: this.madsDataset.images.length
        };
    }
    
    exportSegmentationData() {
        // Export segmentation results for training
        const data = {
            timestamp: Date.now(),
            results: this.segmentationResults,
            modelVersion: '1.0',
            dataset: 'MADS'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'segmentation_results.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// Export for use in other modules
window.AISegmentationModule = AISegmentationModule; 