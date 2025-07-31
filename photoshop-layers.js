// Layers Module - Handles layer management, blending modes, and layer operations
class LayersModule {
    constructor(app) {
        this.app = app;
        this.layers = [];
        this.activeLayerIndex = 0;
        this.nextLayerId = 1;
        
        this.initialize();
    }
    
    initialize() {
        this.createBackgroundLayer();
        this.updateLayersPanel();
    }
    
    createBackgroundLayer() {
        const backgroundLayer = {
            id: 'background',
            name: 'Background',
            type: 'background',
            visible: true,
            locked: false,
            opacity: 100,
            blendMode: 'normal',
            canvas: document.createElement('canvas'),
            ctx: null,
            effects: [],
            mask: null
        };
        
        backgroundLayer.canvas.width = this.app.modules.canvas.width;
        backgroundLayer.canvas.height = this.app.modules.canvas.height;
        backgroundLayer.ctx = backgroundLayer.canvas.getContext('2d');
        
        // Fill with white background
        backgroundLayer.ctx.fillStyle = '#ffffff';
        backgroundLayer.ctx.fillRect(0, 0, backgroundLayer.canvas.width, backgroundLayer.canvas.height);
        
        this.layers.push(backgroundLayer);
    }
    
    createNewLayer(name = null) {
        const layer = {
            id: `layer_${this.nextLayerId++}`,
            name: name || `Layer ${this.layers.length}`,
            type: 'pixel',
            visible: true,
            locked: false,
            opacity: 100,
            blendMode: 'normal',
            canvas: document.createElement('canvas'),
            ctx: null,
            effects: [],
            mask: null
        };
        
        layer.canvas.width = this.app.modules.canvas.width;
        layer.canvas.height = this.app.modules.canvas.height;
        layer.ctx = layer.canvas.getContext('2d');
        
        // Insert above background layer
        this.layers.splice(1, 0, layer);
        this.setActiveLayer(1);
        
        this.updateLayersPanel();
        return layer;
    }
    
    duplicateLayer(layerIndex = null) {
        const sourceIndex = layerIndex !== null ? layerIndex : this.activeLayerIndex;
        const sourceLayer = this.layers[sourceIndex];
        
        if (!sourceLayer || sourceLayer.type === 'background') return null;
        
        const duplicate = {
            id: `layer_${this.nextLayerId++}`,
            name: `${sourceLayer.name} Copy`,
            type: sourceLayer.type,
            visible: sourceLayer.visible,
            locked: sourceLayer.locked,
            opacity: sourceLayer.opacity,
            blendMode: sourceLayer.blendMode,
            canvas: document.createElement('canvas'),
            ctx: null,
            effects: [...sourceLayer.effects],
            mask: sourceLayer.mask ? this.duplicateMask(sourceLayer.mask) : null
        };
        
        duplicate.canvas.width = sourceLayer.canvas.width;
        duplicate.canvas.height = sourceLayer.canvas.height;
        duplicate.ctx = duplicate.canvas.getContext('2d');
        
        // Copy layer content
        duplicate.ctx.drawImage(sourceLayer.canvas, 0, 0);
        
        // Insert above source layer
        this.layers.splice(sourceIndex + 1, 0, duplicate);
        this.setActiveLayer(sourceIndex + 1);
        
        this.updateLayersPanel();
        return duplicate;
    }
    
    deleteLayer(layerIndex = null) {
        const index = layerIndex !== null ? layerIndex : this.activeLayerIndex;
        const layer = this.layers[index];
        
        if (!layer || layer.type === 'background') return false;
        
        this.layers.splice(index, 1);
        
        // Adjust active layer index
        if (this.activeLayerIndex >= index) {
            this.activeLayerIndex = Math.max(0, this.activeLayerIndex - 1);
        }
        
        this.updateLayersPanel();
        return true;
    }
    
    setActiveLayer(index) {
        if (index >= 0 && index < this.layers.length) {
            this.activeLayerIndex = index;
            this.updateLayersPanel();
            this.updatePropertiesPanel();
        }
    }
    
    getActiveLayer() {
        return this.layers[this.activeLayerIndex];
    }
    
    moveLayer(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        
        const layer = this.layers[fromIndex];
        if (layer.type === 'background') return; // Can't move background
        
        this.layers.splice(fromIndex, 1);
        this.layers.splice(toIndex, 0, layer);
        
        // Adjust active layer index
        if (this.activeLayerIndex === fromIndex) {
            this.activeLayerIndex = toIndex;
        } else if (this.activeLayerIndex > fromIndex && this.activeLayerIndex <= toIndex) {
            this.activeLayerIndex--;
        } else if (this.activeLayerIndex < fromIndex && this.activeLayerIndex >= toIndex) {
            this.activeLayerIndex++;
        }
        
        this.updateLayersPanel();
    }
    
    toggleLayerVisibility(index) {
        const layer = this.layers[index];
        if (layer) {
            layer.visible = !layer.visible;
            this.updateLayersPanel();
            this.app.modules.canvas.render();
        }
    }
    
    toggleLayerLock(index) {
        const layer = this.layers[index];
        if (layer) {
            layer.locked = !layer.locked;
            this.updateLayersPanel();
        }
    }
    
    setLayerOpacity(index, opacity) {
        const layer = this.layers[index];
        if (layer) {
            layer.opacity = Math.max(0, Math.min(100, opacity));
            this.updateLayersPanel();
            this.app.modules.canvas.render();
        }
    }
    
    setLayerBlendMode(index, blendMode) {
        const layer = this.layers[index];
        if (layer) {
            layer.blendMode = blendMode;
            this.updateLayersPanel();
            this.app.modules.canvas.render();
        }
    }
    
    renderAll(ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Render all visible layers from bottom to top
        this.layers.forEach(layer => {
            if (layer.visible) {
                this.renderLayer(ctx, layer);
            }
        });
    }
    
    renderLayer(ctx, layer) {
        // Apply layer opacity
        ctx.globalAlpha = layer.opacity / 100;
        
        // Apply blend mode
        ctx.globalCompositeOperation = this.getBlendMode(layer.blendMode);
        
        // Render layer content
        ctx.drawImage(layer.canvas, 0, 0);
        
        // Apply layer effects
        this.applyLayerEffects(ctx, layer);
        
        // Apply layer mask
        if (layer.mask) {
            this.applyLayerMask(ctx, layer);
        }
        
        // Reset global settings
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
    }
    
    getBlendMode(blendMode) {
        const blendModes = {
            'normal': 'source-over',
            'multiply': 'multiply',
            'screen': 'screen',
            'overlay': 'overlay',
            'soft-light': 'soft-light',
            'hard-light': 'hard-light',
            'color-dodge': 'color-dodge',
            'color-burn': 'color-burn',
            'darken': 'darken',
            'lighten': 'lighten',
            'difference': 'difference',
            'exclusion': 'exclusion',
            'hue': 'hue',
            'saturation': 'saturation',
            'color': 'color',
            'luminosity': 'luminosity'
        };
        
        return blendModes[blendMode] || 'source-over';
    }
    
    applyLayerEffects(ctx, layer) {
        layer.effects.forEach(effect => {
            switch (effect.type) {
                case 'drop-shadow':
                    this.applyDropShadow(ctx, layer, effect);
                    break;
                case 'inner-shadow':
                    this.applyInnerShadow(ctx, layer, effect);
                    break;
                case 'outer-glow':
                    this.applyOuterGlow(ctx, layer, effect);
                    break;
                case 'inner-glow':
                    this.applyInnerGlow(ctx, layer, effect);
                    break;
                case 'stroke':
                    this.applyStroke(ctx, layer, effect);
                    break;
            }
        });
    }
    
    applyDropShadow(ctx, layer, effect) {
        // Drop shadow implementation
        ctx.shadowColor = effect.color;
        ctx.shadowBlur = effect.blur;
        ctx.shadowOffsetX = effect.offsetX;
        ctx.shadowOffsetY = effect.offsetY;
        ctx.drawImage(layer.canvas, 0, 0);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    applyInnerShadow(ctx, layer, effect) {
        // Inner shadow implementation
    }
    
    applyOuterGlow(ctx, layer, effect) {
        // Outer glow implementation
    }
    
    applyInnerGlow(ctx, layer, effect) {
        // Inner glow implementation
    }
    
    applyStroke(ctx, layer, effect) {
        // Stroke implementation
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = effect.width;
        ctx.strokeRect(0, 0, layer.canvas.width, layer.canvas.height);
    }
    
    applyLayerMask(ctx, layer) {
        // Layer mask implementation
    }
    
    duplicateMask(mask) {
        // Mask duplication implementation
        return mask;
    }
    
    updateLayersPanel() {
        const layersContent = document.getElementById('layers-content');
        if (!layersContent) return;
        
        layersContent.innerHTML = '';
        
        this.layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'sidebar-item';
            if (index === this.activeLayerIndex) {
                layerItem.classList.add('active');
            }
            
            layerItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 10px; cursor: pointer;" onclick="app.modules.layers.toggleLayerVisibility(${index})">
                        ${layer.visible ? '👁️' : '❌'}
                    </span>
                    <span style="font-size: 10px; cursor: pointer;" onclick="app.modules.layers.toggleLayerLock(${index})">
                        ${layer.locked ? '🔒' : '🔓'}
                    </span>
                    <span style="flex: 1; cursor: pointer;" onclick="app.modules.layers.setActiveLayer(${index})">
                        ${layer.name}
                    </span>
                </div>
            `;
            
            layersContent.appendChild(layerItem);
        });
    }
    
    updatePropertiesPanel() {
        const layer = this.getActiveLayer();
        if (!layer) return;
        
        // Update opacity slider
        const opacitySlider = document.querySelector('input[onchange*="updateLayerOpacity"]');
        if (opacitySlider) {
            opacitySlider.value = layer.opacity;
        }
        
        // Update opacity display
        const opacityDisplay = document.getElementById('opacityValue');
        if (opacityDisplay) {
            opacityDisplay.textContent = layer.opacity + '%';
        }
        
        // Update blend mode selector
        const blendModeSelect = document.querySelector('select[onchange*="updateBlendMode"]');
        if (blendModeSelect) {
            blendModeSelect.value = layer.blendMode;
        }
    }
    
    reset() {
        this.layers = [];
        this.activeLayerIndex = 0;
        this.nextLayerId = 1;
        this.createBackgroundLayer();
        this.updateLayersPanel();
    }
}

// Export for use in other modules
window.LayersModule = LayersModule; 