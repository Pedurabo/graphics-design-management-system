// History Module - Handles undo/redo functionality with state management
class HistoryModule {
    constructor(app) {
        this.app = app;
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;
        this.isRecording = true;
        
        this.initialize();
    }
    
    initialize() {
        // Save initial state
        this.saveState();
    }
    
    saveState() {
        if (!this.isRecording) return;
        
        // Remove any states after current index
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        // Create state snapshot
        const state = this.createStateSnapshot();
        
        // Add to history
        this.history.push(state);
        this.currentIndex++;
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }
        
        this.updateHistoryPanel();
        this.updateUndoRedoButtons();
    }
    
    createStateSnapshot() {
        const state = {
            timestamp: Date.now(),
            description: 'Document State',
            layers: [],
            canvas: {
                width: this.app.modules.canvas.width,
                height: this.app.modules.canvas.height
            }
        };
        
        // Save each layer's state
        this.app.modules.layers.layers.forEach(layer => {
            const layerState = {
                id: layer.id,
                name: layer.name,
                type: layer.type,
                visible: layer.visible,
                locked: layer.locked,
                opacity: layer.opacity,
                blendMode: layer.blendMode,
                canvasData: layer.canvas.toDataURL(),
                effects: [...layer.effects]
            };
            state.layers.push(layerState);
        });
        
        return state;
    }
    
    restoreState(state) {
        if (!state) return;
        
        // Temporarily disable recording
        this.isRecording = false;
        
        // Restore canvas size
        this.app.modules.canvas.createNew(state.canvas.width, state.canvas.height);
        
        // Clear current layers
        this.app.modules.layers.layers = [];
        this.app.modules.layers.activeLayerIndex = 0;
        this.app.modules.layers.nextLayerId = 1;
        
        // Restore layers
        state.layers.forEach((layerState, index) => {
            const layer = {
                id: layerState.id,
                name: layerState.name,
                type: layerState.type,
                visible: layerState.visible,
                locked: layerState.locked,
                opacity: layerState.opacity,
                blendMode: layerState.blendMode,
                canvas: document.createElement('canvas'),
                ctx: null,
                effects: layerState.effects,
                mask: null
            };
            
            layer.canvas.width = state.canvas.width;
            layer.canvas.height = state.canvas.height;
            layer.ctx = layer.canvas.getContext('2d');
            
            // Restore layer content
            const img = new Image();
            img.onload = () => {
                layer.ctx.drawImage(img, 0, 0);
            };
            img.src = layerState.canvasData;
            
            this.app.modules.layers.layers.push(layer);
        });
        
        // Re-enable recording
        this.isRecording = true;
        
        // Update UI
        this.app.modules.layers.updateLayersPanel();
        this.app.modules.canvas.render();
    }
    
    undo() {
        if (this.canUndo()) {
            this.currentIndex--;
            const state = this.history[this.currentIndex];
            this.restoreState(state);
            this.updateUndoRedoButtons();
            this.updateHistoryPanel();
        }
    }
    
    redo() {
        if (this.canRedo()) {
            this.currentIndex++;
            const state = this.history[this.currentIndex];
            this.restoreState(state);
            this.updateUndoRedoButtons();
            this.updateHistoryPanel();
        }
    }
    
    canUndo() {
        return this.currentIndex > 0;
    }
    
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }
    
    updateUndoRedoButtons() {
        // Update undo button
        const undoButton = document.querySelector('button[onclick*="undo"]');
        if (undoButton) {
            undoButton.disabled = !this.canUndo();
        }
        
        // Update redo button
        const redoButton = document.querySelector('button[onclick*="redo"]');
        if (redoButton) {
            redoButton.disabled = !this.canRedo();
        }
    }
    
    updateHistoryPanel() {
        const historyContent = document.getElementById('history-content');
        if (!historyContent) return;
        
        historyContent.innerHTML = '';
        
        this.history.forEach((state, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'sidebar-item';
            if (index === this.currentIndex) {
                historyItem.classList.add('active');
            }
            
            const time = new Date(state.timestamp).toLocaleTimeString();
            historyItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${state.description}</span>
                    <span style="font-size: 10px; color: #666;">${time}</span>
                </div>
            `;
            
            historyItem.onclick = () => {
                this.goToState(index);
            };
            
            historyContent.appendChild(historyItem);
        });
    }
    
    goToState(index) {
        if (index >= 0 && index < this.history.length) {
            this.currentIndex = index;
            const state = this.history[index];
            this.restoreState(state);
            this.updateUndoRedoButtons();
            this.updateHistoryPanel();
        }
    }
    
    clear() {
        this.history = [];
        this.currentIndex = -1;
        this.updateHistoryPanel();
        this.updateUndoRedoButtons();
    }
    
    // History management methods
    setMaxHistorySize(size) {
        this.maxHistorySize = Math.max(10, Math.min(100, size));
        
        // Trim history if needed
        if (this.history.length > this.maxHistorySize) {
            const excess = this.history.length - this.maxHistorySize;
            this.history.splice(0, excess);
            this.currentIndex = Math.max(0, this.currentIndex - excess);
            this.updateHistoryPanel();
        }
    }
    
    getHistoryInfo() {
        return {
            totalStates: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            maxSize: this.maxHistorySize
        };
    }
    
    // Batch operations for better performance
    startBatch() {
        this.isRecording = false;
    }
    
    endBatch() {
        this.isRecording = true;
        this.saveState();
    }
    
    // Custom state descriptions
    saveStateWithDescription(description) {
        const currentState = this.history[this.currentIndex];
        if (currentState) {
            currentState.description = description;
            this.updateHistoryPanel();
        }
    }
}

// Export for use in other modules
window.HistoryModule = HistoryModule; 