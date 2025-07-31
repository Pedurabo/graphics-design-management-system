// Photoshop Core Application Module
class PhotoshopCore {
    constructor() {
        this.version = '1.0.0';
        this.name = 'Professional Photoshop Application';
        this.modules = {};
        this.state = {
            currentTool: 'select',
            isDrawing: false,
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            theme: 'dark',
            workspace: 'photography'
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log(`Initializing ${this.name} v${this.version}`);
        this.loadModules();
        this.setupEventListeners();
    }
    
    loadModules() {
        // Load core modules
        this.modules.canvas = new CanvasModule(this);
        this.modules.tools = new ToolsModule(this);
        this.modules.layers = new LayersModule(this);
        this.modules.history = new HistoryModule(this);
        this.modules.ui = new UIModule(this);
    }
    
    setupEventListeners() {
        // Global event listeners
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleKeyboard(e) {
        // Global keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'n': e.preventDefault(); this.newDocument(); break;
                case 'o': e.preventDefault(); this.openDocument(); break;
                case 's': e.preventDefault(); this.saveDocument(); break;
                case 'z': e.preventDefault(); this.undo(); break;
                case 'y': e.preventDefault(); this.redo(); break;
            }
        }
    }
    
    handleResize() {
        this.modules.ui.updateLayout();
    }
    
    // Core document operations
    newDocument() {
        this.modules.canvas.createNew();
        this.modules.layers.reset();
        this.modules.history.clear();
    }
    
    openDocument() {
        // File opening logic
        console.log('Opening document...');
    }
    
    saveDocument() {
        // File saving logic
        console.log('Saving document...');
    }
    
    undo() {
        this.modules.history.undo();
    }
    
    redo() {
        this.modules.history.redo();
    }
    
    // Module access
    getModule(name) {
        return this.modules[name];
    }
}

// Export for use in other modules
window.PhotoshopCore = PhotoshopCore; 