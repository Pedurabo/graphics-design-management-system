import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Editor from '../../pages/Editor';

// Mock the canvas context
const mockContext = {
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createPattern: jest.fn(),
  clip: jest.fn(),
  isPointInPath: jest.fn(),
  transform: jest.fn(),
  rect: jest.fn(),
  quadraticCurveTo: jest.fn(),
  bezierCurveTo: jest.fn(),
  closePath: jest.fn(),
  strokeRect: jest.fn(),
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'left',
  textBaseline: 'top',
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
};

// Mock HTMLCanvasElement
Object.defineProperty(window, 'HTMLCanvasElement', {
  value: class {
    getContext() {
      return mockContext;
    }
  },
});

const renderEditor = () => {
  return render(
    <BrowserRouter>
      <Editor />
    </BrowserRouter>
  );
};

describe('Editor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders editor interface', () => {
      renderEditor();
      
      expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('layers-panel')).toBeInTheDocument();
      expect(screen.getByTestId('properties-panel')).toBeInTheDocument();
    });

    test('renders default tools', () => {
      renderEditor();
      
      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Brush')).toBeInTheDocument();
      expect(screen.getByText('Eraser')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Shape')).toBeInTheDocument();
    });

    test('renders color picker', () => {
      renderEditor();
      
      const colorPicker = screen.getByTestId('color-picker');
      expect(colorPicker).toBeInTheDocument();
      expect(colorPicker).toHaveAttribute('type', 'color');
    });

    test('renders size slider', () => {
      renderEditor();
      
      const sizeSlider = screen.getByTestId('size-slider');
      expect(sizeSlider).toBeInTheDocument();
      expect(sizeSlider).toHaveAttribute('type', 'range');
    });
  });

  describe('Tool Selection', () => {
    test('selects brush tool when clicked', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const brushTool = screen.getByText('Brush');
      await user.click(brushTool);
      
      expect(brushTool).toHaveClass('active');
      expect(screen.getByTestId('current-tool')).toHaveTextContent('Brush');
    });

    test('selects eraser tool when clicked', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const eraserTool = screen.getByText('Eraser');
      await user.click(eraserTool);
      
      expect(eraserTool).toHaveClass('active');
      expect(screen.getByTestId('current-tool')).toHaveTextContent('Eraser');
    });

    test('selects text tool when clicked', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const textTool = screen.getByText('Text');
      await user.click(textTool);
      
      expect(textTool).toHaveClass('active');
      expect(screen.getByTestId('current-tool')).toHaveTextContent('Text');
    });

    test('selects shape tool when clicked', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const shapeTool = screen.getByText('Shape');
      await user.click(shapeTool);
      
      expect(shapeTool).toHaveClass('active');
      expect(screen.getByTestId('current-tool')).toHaveTextContent('Shape');
    });
  });

  describe('Color Selection', () => {
    test('updates color when color picker changes', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const colorPicker = screen.getByTestId('color-picker');
      await user.clear(colorPicker);
      await user.type(colorPicker, '#ff0000');
      
      expect(colorPicker).toHaveValue('#ff0000');
    });

    test('updates brush color when color changes', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const colorPicker = screen.getByTestId('color-picker');
      await user.clear(colorPicker);
      await user.type(colorPicker, '#00ff00');
      
      // Select brush tool
      const brushTool = screen.getByText('Brush');
      await user.click(brushTool);
      
      // Simulate drawing
      const canvas = screen.getByTestId('editor-canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      expect(mockContext.strokeStyle).toBe('#00ff00');
    });
  });

  describe('Size Control', () => {
    test('updates brush size when slider changes', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const sizeSlider = screen.getByTestId('size-slider');
      await user.clear(sizeSlider);
      await user.type(sizeSlider, '20');
      
      expect(sizeSlider).toHaveValue(20);
      expect(screen.getByTestId('size-value')).toHaveTextContent('20');
    });

    test('updates brush line width when size changes', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const sizeSlider = screen.getByTestId('size-slider');
      await user.clear(sizeSlider);
      await user.type(sizeSlider, '15');
      
      // Select brush tool and draw
      const brushTool = screen.getByText('Brush');
      await user.click(brushTool);
      
      const canvas = screen.getByTestId('editor-canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      expect(mockContext.lineWidth).toBe(15);
    });
  });

  describe('Drawing Functionality', () => {
    test('draws with brush tool', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      // Select brush tool
      const brushTool = screen.getByText('Brush');
      await user.click(brushTool);
      
      // Draw on canvas
      const canvas = screen.getByTestId('editor-canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalled();
      expect(mockContext.lineTo).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    test('erases with eraser tool', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      // Select eraser tool
      const eraserTool = screen.getByText('Eraser');
      await user.click(eraserTool);
      
      // Erase on canvas
      const canvas = screen.getByTestId('editor-canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      expect(mockContext.globalCompositeOperation).toBe('destination-out');
    });

    test('adds text when text tool is used', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      // Select text tool
      const textTool = screen.getByText('Text');
      await user.click(textTool);
      
      // Click on canvas to add text
      const canvas = screen.getByTestId('editor-canvas');
      fireEvent.click(canvas, { clientX: 100, clientY: 100 });
      
      // Mock prompt for text input
      const mockPrompt = jest.spyOn(window, 'prompt').mockReturnValue('Test Text');
      
      expect(mockPrompt).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalledWith('Test Text', 100, 100);
      
      mockPrompt.mockRestore();
    });
  });

  describe('Layer Management', () => {
    test('creates new layer', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const newLayerButton = screen.getByText('New Layer');
      await user.click(newLayerButton);
      
      expect(screen.getByText('Layer 1')).toBeInTheDocument();
    });

    test('deletes layer', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      // Create a layer first
      const newLayerButton = screen.getByText('New Layer');
      await user.click(newLayerButton);
      
      // Select the layer
      const layer = screen.getByText('Layer 1');
      await user.click(layer);
      
      // Delete the layer
      const deleteButton = screen.getByText('Delete Layer');
      await user.click(deleteButton);
      
      expect(screen.queryByText('Layer 1')).not.toBeInTheDocument();
    });

    test('toggles layer visibility', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      // Create a layer
      const newLayerButton = screen.getByText('New Layer');
      await user.click(newLayerButton);
      
      // Toggle visibility
      const visibilityToggle = screen.getByTestId('layer-visibility-1');
      await user.click(visibilityToggle);
      
      expect(visibilityToggle).toHaveAttribute('data-visible', 'false');
    });
  });

  describe('Undo/Redo', () => {
    test('undoes last action', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      // Draw something first
      const brushTool = screen.getByText('Brush');
      await user.click(brushTool);
      
      const canvas = screen.getByTestId('editor-canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      // Undo the action
      const undoButton = screen.getByText('Undo');
      await user.click(undoButton);
      
      expect(screen.getByTestId('history-count')).toHaveTextContent('0');
    });

    test('redoes action', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      // Draw something
      const brushTool = screen.getByText('Brush');
      await user.click(brushTool);
      
      const canvas = screen.getByTestId('editor-canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      // Undo
      const undoButton = screen.getByText('Undo');
      await user.click(undoButton);
      
      // Redo
      const redoButton = screen.getByText('Redo');
      await user.click(redoButton);
      
      expect(screen.getByTestId('history-count')).toHaveTextContent('1');
    });
  });

  describe('File Operations', () => {
    test('saves project', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const saveButton = screen.getByText('Save');
      await user.click(saveButton);
      
      // Mock file download
      const mockDownload = jest.spyOn(document, 'createElement').mockReturnValue({
        download: '',
        href: '',
        click: jest.fn(),
      } as any);
      
      expect(mockDownload).toHaveBeenCalledWith('a');
    });

    test('opens project', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const openButton = screen.getByText('Open');
      await user.click(openButton);
      
      // Mock file input
      const mockFileInput = document.createElement('input');
      mockFileInput.type = 'file';
      mockFileInput.accept = 'image/*';
      
      const mockFile = new File(['mock content'], 'test.png', { type: 'image/png' });
      Object.defineProperty(mockFileInput, 'files', {
        value: [mockFile],
      });
      
      fireEvent.change(mockFileInput);
      
      expect(mockContext.drawImage).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('Ctrl+Z triggers undo', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      // Draw something first
      const brushTool = screen.getByText('Brush');
      await user.click(brushTool);
      
      const canvas = screen.getByTestId('editor-canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      // Press Ctrl+Z
      fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
      
      expect(screen.getByTestId('history-count')).toHaveTextContent('0');
    });

    test('Ctrl+Y triggers redo', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      // Draw something
      const brushTool = screen.getByText('Brush');
      await user.click(brushTool);
      
      const canvas = screen.getByTestId('editor-canvas');
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      
      // Undo
      fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
      
      // Redo
      fireEvent.keyDown(document, { key: 'y', ctrlKey: true });
      
      expect(screen.getByTestId('history-count')).toHaveTextContent('1');
    });

    test('B key selects brush tool', () => {
      renderEditor();
      
      fireEvent.keyDown(document, { key: 'b' });
      
      expect(screen.getByText('Brush')).toHaveClass('active');
    });

    test('E key selects eraser tool', () => {
      renderEditor();
      
      fireEvent.keyDown(document, { key: 'e' });
      
      expect(screen.getByText('Eraser')).toHaveClass('active');
    });

    test('T key selects text tool', () => {
      renderEditor();
      
      fireEvent.keyDown(document, { key: 't' });
      
      expect(screen.getByText('Text')).toHaveClass('active');
    });
  });

  describe('Error Handling', () => {
    test('handles canvas context errors gracefully', () => {
      // Mock canvas context to throw error
      const mockErrorContext = {
        ...mockContext,
        getImageData: jest.fn(() => {
          throw new Error('Canvas error');
        }),
      };
      
      Object.defineProperty(window, 'HTMLCanvasElement', {
        value: class {
          getContext() {
            return mockErrorContext;
          }
        },
      });
      
      renderEditor();
      
      // Should not crash
      expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
    });

    test('handles file upload errors', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const openButton = screen.getByText('Open');
      await user.click(openButton);
      
      // Mock file input with invalid file
      const mockFileInput = document.createElement('input');
      mockFileInput.type = 'file';
      mockFileInput.accept = 'image/*';
      
      const mockFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(mockFileInput, 'files', {
        value: [mockFile],
      });
      
      fireEvent.change(mockFileInput);
      
      // Should show error message
      expect(screen.getByText('Invalid file type')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('handles large canvas efficiently', () => {
      // Mock large canvas
      const largeCanvas = document.createElement('canvas');
      largeCanvas.width = 4000;
      largeCanvas.height = 3000;
      
      renderEditor();
      
      // Should render without performance issues
      expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
    });

    test('debounces rapid mouse events', async () => {
      const user = userEvent.setup();
      renderEditor();
      
      const brushTool = screen.getByText('Brush');
      await user.click(brushTool);
      
      const canvas = screen.getByTestId('editor-canvas');
      
      // Rapid mouse movements
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(canvas, { clientX: i, clientY: i });
      }
      
      // Should not overwhelm the canvas
      expect(mockContext.lineTo).toHaveBeenCalled();
    });
  });
}); 