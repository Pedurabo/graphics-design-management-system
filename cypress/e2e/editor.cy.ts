describe('Graphics Editor E2E Tests', () => {
  beforeEach(() => {
    // Visit the editor page
    cy.visit('/editor');
    
    // Wait for the editor to load
    cy.get('[data-testid="editor-canvas"]', { timeout: 10000 }).should('be.visible');
  });

  describe('Editor Interface', () => {
    it('should load the editor interface correctly', () => {
      // Check main interface elements
      cy.get('[data-testid="editor-canvas"]').should('be.visible');
      cy.get('[data-testid="toolbar"]').should('be.visible');
      cy.get('[data-testid="layers-panel"]').should('be.visible');
      cy.get('[data-testid="properties-panel"]').should('be.visible');
      
      // Check default tool selection
      cy.get('[data-testid="current-tool"]').should('contain', 'Select');
    });

    it('should display all available tools', () => {
      const expectedTools = ['Select', 'Brush', 'Eraser', 'Text', 'Shape', 'Eyedropper'];
      
      expectedTools.forEach(tool => {
        cy.get('[data-testid="toolbar"]').should('contain', tool);
      });
    });

    it('should show color picker and size controls', () => {
      cy.get('[data-testid="color-picker"]').should('be.visible');
      cy.get('[data-testid="size-slider"]').should('be.visible');
      cy.get('[data-testid="opacity-slider"]').should('be.visible');
    });
  });

  describe('Tool Selection', () => {
    it('should switch between tools correctly', () => {
      // Test brush tool
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      cy.get('[data-testid="current-tool"]').should('contain', 'Brush');
      
      // Test eraser tool
      cy.get('[data-testid="toolbar"]').contains('Eraser').click();
      cy.get('[data-testid="current-tool"]').should('contain', 'Eraser');
      
      // Test text tool
      cy.get('[data-testid="toolbar"]').contains('Text').click();
      cy.get('[data-testid="current-tool"]').should('contain', 'Text');
      
      // Test shape tool
      cy.get('[data-testid="toolbar"]').contains('Shape').click();
      cy.get('[data-testid="current-tool"]').should('contain', 'Shape');
    });

    it('should highlight active tool', () => {
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      cy.get('[data-testid="toolbar"]').contains('Brush').should('have.class', 'active');
      
      cy.get('[data-testid="toolbar"]').contains('Eraser').click();
      cy.get('[data-testid="toolbar"]').contains('Eraser').should('have.class', 'active');
      cy.get('[data-testid="toolbar"]').contains('Brush').should('not.have.class', 'active');
    });
  });

  describe('Drawing Functionality', () => {
    it('should draw with brush tool', () => {
      // Select brush tool
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      
      // Set brush size
      cy.get('[data-testid="size-slider"]').invoke('val', 10).trigger('change');
      
      // Draw on canvas
      cy.get('[data-testid="editor-canvas"]')
        .trigger('mousedown', { clientX: 100, clientY: 100 })
        .trigger('mousemove', { clientX: 150, clientY: 150 })
        .trigger('mouseup');
      
      // Verify drawing occurred (check if canvas has been modified)
      cy.get('[data-testid="editor-canvas"]').should('not.have.attr', 'data-clean', 'true');
    });

    it('should erase with eraser tool', () => {
      // First draw something
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      cy.get('[data-testid="editor-canvas"]')
        .trigger('mousedown', { clientX: 100, clientY: 100 })
        .trigger('mousemove', { clientX: 150, clientY: 150 })
        .trigger('mouseup');
      
      // Switch to eraser
      cy.get('[data-testid="toolbar"]').contains('Eraser').click();
      
      // Erase
      cy.get('[data-testid="editor-canvas"]')
        .trigger('mousedown', { clientX: 125, clientY: 125 })
        .trigger('mousemove', { clientX: 175, clientY: 175 })
        .trigger('mouseup');
    });

    it('should change brush color', () => {
      // Select brush tool
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      
      // Change color to red
      cy.get('[data-testid="color-picker"]').invoke('val', '#ff0000').trigger('change');
      
      // Draw to verify color change
      cy.get('[data-testid="editor-canvas"]')
        .trigger('mousedown', { clientX: 100, clientY: 100 })
        .trigger('mousemove', { clientX: 150, clientY: 150 })
        .trigger('mouseup');
    });

    it('should change brush size', () => {
      // Select brush tool
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      
      // Change size
      cy.get('[data-testid="size-slider"]').invoke('val', 20).trigger('change');
      cy.get('[data-testid="size-value"]').should('contain', '20');
      
      // Draw to verify size change
      cy.get('[data-testid="editor-canvas"]')
        .trigger('mousedown', { clientX: 100, clientY: 100 })
        .trigger('mousemove', { clientX: 150, clientY: 150 })
        .trigger('mouseup');
    });
  });

  describe('Text Tool', () => {
    it('should add text to canvas', () => {
      // Select text tool
      cy.get('[data-testid="toolbar"]').contains('Text').click();
      
      // Click on canvas to add text
      cy.get('[data-testid="editor-canvas"]').click({ clientX: 100, clientY: 100 });
      
      // Mock prompt for text input
      cy.window().then((win) => {
        cy.stub(win, 'prompt').returns('Test Text');
      });
      
      // Verify text was added (this would depend on your implementation)
      cy.get('[data-testid="editor-canvas"]').should('contain', 'Test Text');
    });
  });

  describe('Layer Management', () => {
    it('should create new layer', () => {
      cy.get('[data-testid="layers-panel"]').contains('New Layer').click();
      cy.get('[data-testid="layers-panel"]').should('contain', 'Layer 1');
    });

    it('should delete layer', () => {
      // Create a layer first
      cy.get('[data-testid="layers-panel"]').contains('New Layer').click();
      
      // Select the layer
      cy.get('[data-testid="layers-panel"]').contains('Layer 1').click();
      
      // Delete the layer
      cy.get('[data-testid="layers-panel"]').contains('Delete Layer').click();
      
      // Verify layer was deleted
      cy.get('[data-testid="layers-panel"]').should('not.contain', 'Layer 1');
    });

    it('should toggle layer visibility', () => {
      // Create a layer
      cy.get('[data-testid="layers-panel"]').contains('New Layer').click();
      
      // Toggle visibility
      cy.get('[data-testid="layer-visibility-1"]').click();
      cy.get('[data-testid="layer-visibility-1"]').should('have.attr', 'data-visible', 'false');
      
      // Toggle back
      cy.get('[data-testid="layer-visibility-1"]').click();
      cy.get('[data-testid="layer-visibility-1"]').should('have.attr', 'data-visible', 'true');
    });
  });

  describe('Undo/Redo', () => {
    it('should undo last action', () => {
      // Draw something first
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      cy.get('[data-testid="editor-canvas"]')
        .trigger('mousedown', { clientX: 100, clientY: 100 })
        .trigger('mousemove', { clientX: 150, clientY: 150 })
        .trigger('mouseup');
      
      // Undo the action
      cy.get('[data-testid="toolbar"]').contains('Undo').click();
      
      // Verify undo occurred
      cy.get('[data-testid="history-count"]').should('contain', '0');
    });

    it('should redo action', () => {
      // Draw something
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      cy.get('[data-testid="editor-canvas"]')
        .trigger('mousedown', { clientX: 100, clientY: 100 })
        .trigger('mousemove', { clientX: 150, clientY: 150 })
        .trigger('mouseup');
      
      // Undo
      cy.get('[data-testid="toolbar"]').contains('Undo').click();
      
      // Redo
      cy.get('[data-testid="toolbar"]').contains('Redo').click();
      
      // Verify redo occurred
      cy.get('[data-testid="history-count"]').should('contain', '1');
    });
  });

  describe('File Operations', () => {
    it('should save project', () => {
      // Draw something
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      cy.get('[data-testid="editor-canvas"]')
        .trigger('mousedown', { clientX: 100, clientY: 100 })
        .trigger('mousemove', { clientX: 150, clientY: 150 })
        .trigger('mouseup');
      
      // Save project
      cy.get('[data-testid="toolbar"]').contains('Save').click();
      
      // Verify save dialog or notification
      cy.get('[data-testid="notification"]').should('contain', 'saved');
    });

    it('should open project', () => {
      // Mock file input
      cy.fixture('test-project.json').then((projectData) => {
        cy.get('[data-testid="toolbar"]').contains('Open').click();
        
        // Mock file selection
        cy.get('input[type="file"]').attachFile({
          fileContent: JSON.stringify(projectData),
          fileName: 'test-project.json',
          mimeType: 'application/json'
        });
        
        // Verify project loaded
        cy.get('[data-testid="notification"]').should('contain', 'opened');
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle Ctrl+Z for undo', () => {
      // Draw something
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      cy.get('[data-testid="editor-canvas"]')
        .trigger('mousedown', { clientX: 100, clientY: 100 })
        .trigger('mousemove', { clientX: 150, clientY: 150 })
        .trigger('mouseup');
      
      // Press Ctrl+Z
      cy.get('body').type('{ctrl}z');
      
      // Verify undo occurred
      cy.get('[data-testid="history-count"]').should('contain', '0');
    });

    it('should handle Ctrl+Y for redo', () => {
      // Draw something
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      cy.get('[data-testid="editor-canvas"]')
        .trigger('mousedown', { clientX: 100, clientY: 100 })
        .trigger('mousemove', { clientX: 150, clientY: 150 })
        .trigger('mouseup');
      
      // Undo
      cy.get('body').type('{ctrl}z');
      
      // Redo
      cy.get('body').type('{ctrl}y');
      
      // Verify redo occurred
      cy.get('[data-testid="history-count"]').should('contain', '1');
    });

    it('should handle tool shortcuts', () => {
      // Test B key for brush
      cy.get('body').type('b');
      cy.get('[data-testid="current-tool"]').should('contain', 'Brush');
      
      // Test E key for eraser
      cy.get('body').type('e');
      cy.get('[data-testid="current-tool"]').should('contain', 'Eraser');
      
      // Test T key for text
      cy.get('body').type('t');
      cy.get('[data-testid="current-tool"]').should('contain', 'Text');
    });
  });

  describe('Performance', () => {
    it('should handle rapid drawing without lag', () => {
      // Select brush tool
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      
      // Rapid mouse movements
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="editor-canvas"]')
          .trigger('mousedown', { clientX: i * 10, clientY: i * 10 })
          .trigger('mousemove', { clientX: (i + 1) * 10, clientY: (i + 1) * 10 })
          .trigger('mouseup');
      }
      
      // Should not show performance warnings
      cy.get('[data-testid="performance-warning"]').should('not.exist');
    });

    it('should handle large canvas efficiently', () => {
      // Test with large canvas (this would depend on your implementation)
      cy.get('[data-testid="editor-canvas"]').should('be.visible');
      
      // Perform operations on large canvas
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      cy.get('[data-testid="editor-canvas"]')
        .trigger('mousedown', { clientX: 0, clientY: 0 })
        .trigger('mousemove', { clientX: 1000, clientY: 1000 })
        .trigger('mouseup');
      
      // Should not crash or show errors
      cy.get('[data-testid="error-message"]').should('not.exist');
    });
  });

  describe('Error Handling', () => {
    it('should handle canvas errors gracefully', () => {
      // Mock canvas error
      cy.window().then((win) => {
        cy.stub(win.HTMLCanvasElement.prototype, 'getContext').throws(new Error('Canvas error'));
      });
      
      // Reload page
      cy.reload();
      
      // Should show error message but not crash
      cy.get('[data-testid="error-message"]').should('contain', 'Canvas error');
    });

    it('should handle file upload errors', () => {
      // Try to upload invalid file
      cy.get('[data-testid="toolbar"]').contains('Open').click();
      
      cy.get('input[type="file"]').attachFile({
        fileContent: 'invalid content',
        fileName: 'invalid.txt',
        mimeType: 'text/plain'
      });
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain', 'Invalid file type');
    });
  });

  describe('Accessibility', () => {
    it('should support keyboard navigation', () => {
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'toolbar');
      
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'editor-canvas');
    });

    it('should have proper ARIA labels', () => {
      cy.get('[data-testid="color-picker"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="size-slider"]').should('have.attr', 'aria-label');
      cy.get('[data-testid="editor-canvas"]').should('have.attr', 'aria-label');
    });

    it('should support screen readers', () => {
      // Test screen reader announcements
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      cy.get('[data-testid="current-tool"]').should('have.attr', 'aria-live', 'polite');
    });
  });

  describe('Cross-browser Compatibility', () => {
    it('should work in different browsers', () => {
      // This test would be run in different browsers via CI
      cy.get('[data-testid="editor-canvas"]').should('be.visible');
      cy.get('[data-testid="toolbar"]').should('be.visible');
      
      // Basic functionality test
      cy.get('[data-testid="toolbar"]').contains('Brush').click();
      cy.get('[data-testid="current-tool"]').should('contain', 'Brush');
    });
  });
}); 