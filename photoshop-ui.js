// UI Module - Handles all user interface elements, panels, and interactions
class UIModule {
    constructor(app) {
        this.app = app;
        this.foregroundColor = '#000000';
        this.backgroundColor = '#ffffff';
        this.theme = 'dark';
        this.workspace = 'photography';
        this.panels = {};
        
        this.initialize();
    }
    
    initialize() {
        this.setupPanels();
        this.setupColorPickers();
        this.setupSliders();
        this.setupModals();
        this.setupContextMenu();
        this.applyTheme();
    }
    
    setupPanels() {
        this.panels = {
            layers: document.getElementById('layers-content'),
            properties: document.getElementById('properties-content'),
            adjustments: document.getElementById('adjustments-content'),
            filters: document.getElementById('filters-content'),
            history: document.getElementById('history-content')
        };
    }
    
    setupColorPickers() {
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.value = this.foregroundColor;
            colorPicker.addEventListener('change', (e) => {
                this.setForegroundColor(e.target.value);
            });
        }
    }
    
    setupSliders() {
        // Size slider
        const sizeSlider = document.getElementById('sizeSlider');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                this.app.modules.tools.updateSize(e.target.value);
            });
        }
        
        // Opacity slider
        const opacitySlider = document.getElementById('opacitySlider');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                this.app.modules.tools.updateOpacity(e.target.value);
            });
        }
        
        // Flow slider
        const flowSlider = document.getElementById('flowSlider');
        if (flowSlider) {
            flowSlider.addEventListener('input', (e) => {
                this.app.modules.tools.updateFlow(e.target.value);
            });
        }
    }
    
    setupModals() {
        // Setup modal close functionality
        window.addEventListener('click', (e) => {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }
    
    setupContextMenu() {
        this.contextMenu = document.getElementById('contextMenu');
        if (this.contextMenu) {
            document.addEventListener('click', () => {
                this.hideContextMenu();
            });
        }
    }
    
    // Color management
    setForegroundColor(color) {
        this.foregroundColor = color;
        this.updateColorDisplay();
    }
    
    setBackgroundColor(color) {
        this.backgroundColor = color;
        this.updateColorDisplay();
    }
    
    getForegroundColor() {
        return this.foregroundColor;
    }
    
    getBackgroundColor() {
        return this.backgroundColor;
    }
    
    updateColorDisplay() {
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.value = this.foregroundColor;
        }
    }
    
    // Panel management
    togglePanel(panelName) {
        const content = this.panels[panelName];
        const toggle = document.getElementById(panelName + '-toggle');
        
        if (content && toggle) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggle.textContent = '▼';
            } else {
                content.style.display = 'none';
                toggle.textContent = '▶';
            }
        }
    }
    
    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // Context menu
    showContextMenu(x, y) {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'block';
            this.contextMenu.style.left = x + 'px';
            this.contextMenu.style.top = y + 'px';
        }
    }
    
    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
    }
    
    // Theme management
    applyTheme() {
        document.body.className = `theme-${this.theme}`;
        this.updateThemeColors();
    }
    
    setTheme(theme) {
        this.theme = theme;
        this.applyTheme();
    }
    
    updateThemeColors() {
        const root = document.documentElement;
        
        if (this.theme === 'dark') {
            root.style.setProperty('--bg-primary', '#2d2d2d');
            root.style.setProperty('--bg-secondary', '#3c3c3c');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#cccccc');
            root.style.setProperty('--border-color', '#555555');
        } else {
            root.style.setProperty('--bg-primary', '#ffffff');
            root.style.setProperty('--bg-secondary', '#f8f9fa');
            root.style.setProperty('--text-primary', '#333333');
            root.style.setProperty('--text-secondary', '#666666');
            root.style.setProperty('--border-color', '#dee2e6');
        }
    }
    
    // Workspace management
    setWorkspace(workspace) {
        this.workspace = workspace;
        this.applyWorkspace();
    }
    
    applyWorkspace() {
        // Apply workspace-specific panel layouts
        const workspaces = {
            photography: ['layers', 'properties', 'adjustments', 'history'],
            painting: ['layers', 'brushes', 'properties', 'history'],
            web: ['layers', 'properties', 'filters', 'history'],
            motion: ['layers', 'timeline', 'properties', 'history']
        };
        
        const workspacePanels = workspaces[this.workspace] || workspaces.photography;
        this.showWorkspacePanels(workspacePanels);
    }
    
    showWorkspacePanels(panelNames) {
        // Show/hide panels based on workspace
        Object.keys(this.panels).forEach(panelName => {
            const panel = this.panels[panelName];
            if (panel) {
                panel.style.display = panelNames.includes(panelName) ? 'block' : 'none';
            }
        });
    }
    
    // Layout management
    updateLayout() {
        // Handle window resize
        this.updatePanelSizes();
        this.updateCanvasSize();
    }
    
    updatePanelSizes() {
        // Adjust panel sizes based on window size
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            const windowWidth = window.innerWidth;
            if (windowWidth < 1200) {
                sidebar.style.width = '200px';
            } else {
                sidebar.style.width = '250px';
            }
        }
    }
    
    updateCanvasSize() {
        // Update canvas container size
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            const toolbar = document.querySelector('.toolbar');
            const statusBar = document.querySelector('.status-bar');
            const sidebar = document.querySelector('.sidebar');
            
            const availableHeight = window.innerHeight - 
                (toolbar ? toolbar.offsetHeight : 0) - 
                (statusBar ? statusBar.offsetHeight : 0);
            
            const availableWidth = window.innerWidth - 
                (sidebar ? sidebar.offsetWidth : 0);
            
            canvasContainer.style.height = availableHeight + 'px';
            canvasContainer.style.width = availableWidth + 'px';
        }
    }
    
    // Notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification notification-${type}`;
            notification.style.display = 'block';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, duration);
        }
    }
    
    // Keyboard shortcuts display
    showKeyboardShortcuts() {
        this.showModal('shortcutsModal');
    }
    
    // Help system
    showHelp() {
        this.showNotification('Help documentation coming soon!', 'info');
    }
    
    showAbout() {
        const aboutText = `${this.app.name} v${this.app.version}\n\nA professional graphics application with Photoshop-level features.`;
        alert(aboutText);
    }
    
    // File operations UI
    showNewDocumentDialog() {
        this.showModal('newFileModal');
    }
    
    showOpenDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.app.openDocument(file);
            }
        };
        input.click();
    }
    
    showSaveDialog() {
        const link = document.createElement('a');
        link.download = 'photoshop-document.png';
        link.href = this.app.modules.canvas.toDataURL();
        link.click();
        this.showNotification('Document saved successfully!', 'success');
    }
    
    // Export options
    showExportDialog() {
        this.showModal('exportModal');
    }
    
    // Preferences
    showPreferences() {
        this.showModal('preferencesModal');
    }
    
    // Status bar updates
    updateStatusBar(message) {
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            const statusElement = statusBar.querySelector('.status-item span');
            if (statusElement) {
                statusElement.textContent = message;
            }
        }
    }
    
    // Tool information display
    updateToolInfo(toolName, info) {
        const toolInfoElement = document.getElementById('toolInfo');
        if (toolInfoElement) {
            toolInfoElement.innerHTML = `
                <strong>${toolName}</strong><br>
                ${info}
            `;
        }
    }
}

// Export for use in other modules
window.UIModule = UIModule; 