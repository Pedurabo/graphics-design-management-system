// Tools Module - Handles all Photoshop tools and their functionality
class ToolsModule {
    constructor(app) {
        this.app = app;
        this.currentTool = 'select';
        this.currentSelection = null;
        this.toolSettings = this.initializeToolSettings();
        this.tools = this.initializeTools();
        
        this.initialize();
    }
    
    initialize() {
        this.setupToolShortcuts();
        this.updateToolDisplay();
    }
    
    initializeToolSettings() {
        return {
            brush: {
                size: 5,
                opacity: 100,
                flow: 100,
                hardness: 50,
                spacing: 25,
                shape: 'round'
            },
            eraser: {
                size: 5,
                opacity: 100,
                hardness: 50
            },
            selection: {
                feather: 0,
                antiAlias: true
            },
            clone: {
                size: 5,
                opacity: 100,
                alignment: true,
                sample: 'current'
            },
            healing: {
                size: 5,
                type: 'spot',
                contentAware: true
            }
        };
    }
    
    initializeTools() {
        return {
            select: new SelectionTool(this),
            move: new MoveTool(this),
            crop: new CropTool(this),
            brush: new BrushTool(this),
            eraser: new EraserTool(this),
            clone: new CloneStampTool(this),
            healing: new HealingTool(this),
            gradient: new GradientTool(this),
            shape: new ShapeTool(this),
            pen: new PenTool(this),
            text: new TextTool(this),
            eyedropper: new EyedropperTool(this),
            hand: new HandTool(this),
            zoom: new ZoomTool(this)
        };
    }
    
    setupToolShortcuts() {
        const shortcuts = {
            'v': 'select',
            'm': 'move',
            'c': 'crop',
            'b': 'brush',
            'e': 'eraser',
            's': 'clone',
            'j': 'healing',
            'g': 'gradient',
            'u': 'shape',
            'p': 'pen',
            't': 'text',
            'i': 'eyedropper',
            'h': 'hand',
            'z': 'zoom'
        };
        
        document.addEventListener('keydown', (e) => {
            if (!e.ctrlKey && !e.metaKey && shortcuts[e.key.toLowerCase()]) {
                e.preventDefault();
                this.selectTool(shortcuts[e.key.toLowerCase()]);
            }
        });
    }
    
    selectTool(toolName) {
        this.currentTool = toolName;
        this.app.state.currentTool = toolName;
        this.updateToolDisplay();
        this.updateToolSettings();
    }
    
    updateToolDisplay() {
        // Update toolbar buttons
        document.querySelectorAll('.tool-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const toolButton = document.getElementById(toolName + 'Tool');
        if (toolButton) {
            toolButton.classList.add('active');
        }
        
        // Update status bar
        const toolElement = document.getElementById('currentTool');
        if (toolElement) {
            toolElement.textContent = this.currentTool.charAt(0).toUpperCase() + this.currentTool.slice(1);
        }
    }
    
    updateToolSettings() {
        const settings = this.toolSettings[this.currentTool];
        if (settings) {
            // Update UI controls with current tool settings
            this.updateSizeSlider(settings.size);
            this.updateOpacitySlider(settings.opacity);
            if (settings.flow) {
                this.updateFlowSlider(settings.flow);
            }
        }
    }
    
    executeTool(action, x, y) {
        const tool = this.tools[this.currentTool];
        if (tool && tool[action]) {
            tool[action](x, y);
        }
    }
    
    // Tool setting updates
    updateSize(value) {
        const settings = this.toolSettings[this.currentTool];
        if (settings) {
            settings.size = parseInt(value);
            this.updateSizeDisplay(value);
        }
    }
    
    updateOpacity(value) {
        const settings = this.toolSettings[this.currentTool];
        if (settings) {
            settings.opacity = parseInt(value);
            this.updateOpacityDisplay(value);
        }
    }
    
    updateFlow(value) {
        const settings = this.toolSettings[this.currentTool];
        if (settings && settings.flow) {
            settings.flow = parseInt(value);
            this.updateFlowDisplay(value);
        }
    }
    
    updateSizeDisplay(value) {
        const sizeElement = document.getElementById('sizeValue');
        if (sizeElement) {
            sizeElement.textContent = value;
        }
        
        const toolSizeElement = document.getElementById('toolSize');
        if (toolSizeElement) {
            toolSizeElement.textContent = value + 'px';
        }
    }
    
    updateOpacityDisplay(value) {
        const opacityElement = document.getElementById('opacityValue');
        if (opacityElement) {
            opacityElement.textContent = value + '%';
        }
    }
    
    updateFlowDisplay(value) {
        const flowElement = document.getElementById('flowValue');
        if (flowElement) {
            flowElement.textContent = value + '%';
        }
    }
}

// Base Tool Class
class BaseTool {
    constructor(toolsModule) {
        this.tools = toolsModule;
        this.app = toolsModule.app;
        this.canvas = toolsModule.app.modules.canvas;
        this.layers = toolsModule.app.modules.layers;
    }
    
    getActiveLayer() {
        return this.layers.getActiveLayer();
    }
    
    getSettings() {
        return this.tools.toolSettings[this.tools.currentTool];
    }
}

// Individual Tool Implementations
class SelectionTool extends BaseTool {
    start(x, y) {
        this.startX = x;
        this.startY = y;
    }
    
    move(x, y) {
        this.tools.currentSelection = {
            x: Math.min(this.startX, x),
            y: Math.min(this.startY, y),
            width: Math.abs(x - this.startX),
            height: Math.abs(y - this.startY)
        };
        this.canvas.render();
    }
    
    end() {
        // Selection complete
    }
}

class BrushTool extends BaseTool {
    start(x, y) {
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        const settings = this.getSettings();
        const ctx = layer.ctx;
        
        ctx.globalAlpha = settings.opacity / 100;
        ctx.lineWidth = settings.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = this.app.modules.ui.getForegroundColor();
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        this.lastX = x;
        this.lastY = y;
    }
    
    move(x, y) {
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        const ctx = layer.ctx;
        const settings = this.getSettings();
        
        // Smooth brush strokes with interpolation
        const dx = x - this.lastX;
        const dy = y - this.lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, Math.floor(distance / (settings.size / 4)));
        
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const interpX = this.lastX + dx * t;
            const interpY = this.lastY + dy * t;
            ctx.lineTo(interpX, interpY);
        }
        ctx.stroke();
        
        this.lastX = x;
        this.lastY = y;
        this.canvas.render();
    }
    
    end() {
        // Brush stroke complete
    }
}

class EraserTool extends BaseTool {
    start(x, y) {
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        const settings = this.getSettings();
        const ctx = layer.ctx;
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = settings.opacity / 100;
        ctx.lineWidth = settings.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        this.lastX = x;
        this.lastY = y;
    }
    
    move(x, y) {
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        const ctx = layer.ctx;
        ctx.lineTo(x, y);
        ctx.stroke();
        
        this.lastX = x;
        this.lastY = y;
        this.canvas.render();
    }
    
    end() {
        const layer = this.getActiveLayer();
        if (layer) {
            layer.ctx.globalCompositeOperation = 'source-over';
        }
    }
}

// Additional tool classes would be implemented similarly...
class MoveTool extends BaseTool {
    start(x, y) { this.startX = x; this.startY = y; }
    move(x, y) { /* Move logic */ }
    end() { /* Move complete */ }
}

class CropTool extends BaseTool {
    start(x, y) { this.startX = x; this.startY = y; }
    move(x, y) { /* Crop preview */ }
    end() { /* Apply crop */ }
}

class CloneStampTool extends BaseTool {
    start(x, y) { this.sampleX = x; this.sampleY = y; }
    move(x, y) { /* Clone logic */ }
    end() { /* Clone complete */ }
}

class HealingTool extends BaseTool {
    start(x, y) { /* Healing logic */ }
    move(x, y) { /* Healing preview */ }
    end() { /* Apply healing */ }
}

class GradientTool extends BaseTool {
    start(x, y) { this.startX = x; this.startY = y; }
    move(x, y) { /* Gradient preview */ }
    end() { /* Apply gradient */ }
}

class ShapeTool extends BaseTool {
    start(x, y) { this.startX = x; this.startY = y; }
    move(x, y) { /* Shape preview */ }
    end() { /* Draw shape */ }
}

class PenTool extends BaseTool {
    start(x, y) { /* Add anchor point */ }
    move(x, y) { /* Preview path */ }
    end() { /* Complete path */ }
}

class TextTool extends BaseTool {
    start(x, y) { /* Start text input */ }
    move(x, y) { /* Text preview */ }
    end() { /* Apply text */ }
}

class EyedropperTool extends BaseTool {
    start(x, y) { /* Sample color */ }
    move(x, y) { /* Color preview */ }
    end() { /* Apply color */ }
}

class HandTool extends BaseTool {
    start(x, y) { this.startX = x; this.startY = y; }
    move(x, y) { /* Pan canvas */ }
    end() { /* Pan complete */ }
}

class ZoomTool extends BaseTool {
    start(x, y) { /* Zoom in */ }
    move(x, y) { /* Zoom preview */ }
    end() { /* Apply zoom */ }
}

// Export for use in other modules
window.ToolsModule = ToolsModule; 