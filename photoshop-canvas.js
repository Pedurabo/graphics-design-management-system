// Canvas Module - Handles main drawing canvas and rendering
class CanvasModule {
    constructor(app) {
        this.app = app;
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.initialize();
    }
    
    initialize() {
        this.createCanvas();
        this.setupEventListeners();
        this.createNew();
    }
    
    createCanvas() {
        this.canvas = document.getElementById('canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'canvas';
            this.canvas.className = 'canvas';
            document.querySelector('.canvas-container').appendChild(this.canvas);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.setCanvasSize();
    }
    
    setCanvasSize() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    }
    
    handleMouseDown(e) {
        const coords = this.getCanvasCoordinates(e);
        this.app.state.isDrawing = true;
        this.app.modules.tools.executeTool('start', coords.x, coords.y);
    }
    
    handleMouseMove(e) {
        const coords = this.getCanvasCoordinates(e);
        this.updateStatusBar(coords);
        
        if (this.app.state.isDrawing) {
            this.app.modules.tools.executeTool('move', coords.x, coords.y);
        }
    }
    
    handleMouseUp(e) {
        this.app.state.isDrawing = false;
        this.app.modules.tools.executeTool('end');
        this.app.modules.history.saveState();
    }
    
    handleContextMenu(e) {
        e.preventDefault();
        this.app.modules.ui.showContextMenu(e.clientX, e.clientY);
    }
    
    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.zoom,
            y: (e.clientY - rect.top) / this.zoom
        };
    }
    
    updateStatusBar(coords) {
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            const positionElement = statusBar.querySelector('#mousePosition');
            if (positionElement) {
                positionElement.textContent = `${Math.round(coords.x)}, ${Math.round(coords.y)}`;
            }
        }
    }
    
    createNew(width = 800, height = 600, bgColor = '#ffffff') {
        this.width = width;
        this.height = height;
        this.setCanvasSize();
        
        // Clear canvas with background color
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Reset zoom and offset
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.updateTransform();
    }
    
    updateTransform() {
        this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoom})`;
    }
    
    zoomIn() {
        this.zoom *= 1.2;
        this.updateTransform();
        this.updateZoomDisplay();
    }
    
    zoomOut() {
        this.zoom /= 1.2;
        this.updateTransform();
        this.updateZoomDisplay();
    }
    
    zoomFit() {
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.updateTransform();
        this.updateZoomDisplay();
    }
    
    updateZoomDisplay() {
        const zoomElement = document.getElementById('zoomLevel');
        if (zoomElement) {
            zoomElement.textContent = Math.round(this.zoom * 100) + '%';
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Render all layers
        this.app.modules.layers.renderAll(this.ctx);
        
        // Render any overlays (selections, guides, etc.)
        this.renderOverlays();
    }
    
    renderOverlays() {
        // Render selection rectangles, guides, etc.
        if (this.app.modules.tools.currentSelection) {
            this.renderSelection();
        }
    }
    
    renderSelection() {
        const selection = this.app.modules.tools.currentSelection;
        this.ctx.strokeStyle = '#007bff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
        this.ctx.setLineDash([]);
    }
    
    getImageData() {
        return this.ctx.getImageData(0, 0, this.width, this.height);
    }
    
    putImageData(imageData) {
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    toDataURL(format = 'image/png', quality = 1.0) {
        return this.canvas.toDataURL(format, quality);
    }
}

// Export for use in other modules
window.CanvasModule = CanvasModule; 