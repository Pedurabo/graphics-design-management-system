import React, { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { fabric } from 'fabric';
import { 
  Brush, 
  Square, 
  Circle, 
  Type, 
  Image, 
  Layers, 
  Settings,
  Wand2,
  Sparkles,
  Palette,
  Undo,
  Redo,
  Save,
  Download
} from 'lucide-react';

// Components
import ToolPanel from '../components/Editor/ToolPanel';
import LayerPanel from '../components/Editor/LayerPanel';
import PropertyPanel from '../components/Editor/PropertyPanel';
import AIPanel from '../components/Editor/AIPanel';
import ColorPicker from '../components/Editor/ColorPicker';

// Hooks
import { useEditor } from '../hooks/useEditor';
import { useAISuggestions } from '../hooks/useAISuggestions';

const EditorContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #1a1a1a;
  color: #ffffff;
`;

const MainCanvas = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #2a2a2a;
`;

const CanvasContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #404040;
  position: relative;
`;

const Canvas = styled.canvas`
  border: 1px solid #555;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const TopToolbar = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: #2a2a2a;
  border-bottom: 1px solid #404040;
  gap: 8px;
`;

const ToolButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: ${props => props.active ? '#007acc' : '#404040'};
  color: #ffffff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? '#005a9e' : '#505050'};
  }
`;

const Separator = styled.div`
  width: 1px;
  height: 24px;
  background: #404040;
  margin: 0 8px;
`;

const Editor: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  const [activeTool, setActiveTool] = useState<string>('select');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [brushColor, setBrushColor] = useState<string>('#000000');
  const [showAIPanel, setShowAIPanel] = useState<boolean>(false);
  
  const { canvas, setCanvas, history, undo, redo, saveProject } = useEditor();
  const { suggestions, generateSuggestions, isLoading } = useAISuggestions();

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true,
      });

      fabricCanvasRef.current = fabricCanvas;
      setCanvas(fabricCanvas);

      // Set up event listeners
      fabricCanvas.on('object:added', handleObjectAdded);
      fabricCanvas.on('object:modified', handleObjectModified);
      fabricCanvas.on('object:removed', handleObjectRemoved);

      // Load project data if projectId exists
      if (projectId) {
        loadProject(projectId);
      }
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [projectId]);

  const handleObjectAdded = (e: any) => {
    console.log('Object added:', e.target);
    // Add to history
  };

  const handleObjectModified = (e: any) => {
    console.log('Object modified:', e.target);
    // Add to history
  };

  const handleObjectRemoved = (e: any) => {
    console.log('Object removed:', e.target);
    // Add to history
  };

  const loadProject = async (id: string) => {
    try {
      // Load project data from API
      console.log('Loading project:', id);
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    
    if (!fabricCanvasRef.current) return;

    switch (tool) {
      case 'brush':
        fabricCanvasRef.current.isDrawingMode = true;
        fabricCanvasRef.current.freeDrawingBrush = new fabric.PencilBrush(fabricCanvasRef.current);
        fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
        fabricCanvasRef.current.freeDrawingBrush.color = brushColor;
        break;
      case 'rectangle':
        fabricCanvasRef.current.isDrawingMode = false;
        const rect = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: brushColor,
          stroke: '#000000',
          strokeWidth: 1,
        });
        fabricCanvasRef.current.add(rect);
        break;
      case 'circle':
        fabricCanvasRef.current.isDrawingMode = false;
        const circle = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: brushColor,
          stroke: '#000000',
          strokeWidth: 1,
        });
        fabricCanvasRef.current.add(circle);
        break;
      case 'text':
        fabricCanvasRef.current.isDrawingMode = false;
        const text = new fabric.IText('Double click to edit', {
          left: 100,
          top: 100,
          fontSize: 20,
          fill: brushColor,
        });
        fabricCanvasRef.current.add(text);
        break;
      default:
        fabricCanvasRef.current.isDrawingMode = false;
        break;
    }
  };

  const handleAISuggestion = async () => {
    if (!fabricCanvasRef.current) return;
    
    const canvasData = fabricCanvasRef.current.toJSON();
    await generateSuggestions(canvasData);
    setShowAIPanel(true);
  };

  const handleSave = async () => {
    if (!fabricCanvasRef.current || !projectId) return;
    
    const canvasData = fabricCanvasRef.current.toJSON();
    await saveProject(projectId, canvasData);
  };

  return (
    <EditorContainer>
      <ToolPanel
        activeTool={activeTool}
        onToolChange={handleToolChange}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        brushColor={brushColor}
        onBrushColorChange={setBrushColor}
      />
      
      <MainCanvas>
        <TopToolbar>
          <ToolButton onClick={undo} disabled={!history.canUndo}>
            <Undo size={16} />
          </ToolButton>
          <ToolButton onClick={redo} disabled={!history.canRedo}>
            <Redo size={16} />
          </ToolButton>
          
          <Separator />
          
          <ToolButton onClick={handleAISuggestion} disabled={isLoading}>
            <Sparkles size={16} />
          </ToolButton>
          <ToolButton onClick={() => setShowAIPanel(!showAIPanel)}>
            <Wand2 size={16} />
          </ToolButton>
          
          <Separator />
          
          <ToolButton onClick={handleSave}>
            <Save size={16} />
          </ToolButton>
          <ToolButton>
            <Download size={16} />
          </ToolButton>
        </TopToolbar>
        
        <CanvasContainer>
          <Canvas ref={canvasRef} />
        </CanvasContainer>
      </MainCanvas>
      
      <LayerPanel canvas={fabricCanvasRef.current} />
      
      {showAIPanel && (
        <AIPanel
          suggestions={suggestions}
          onApplySuggestion={(suggestion) => {
            // Apply AI suggestion to canvas
            console.log('Applying suggestion:', suggestion);
          }}
          onClose={() => setShowAIPanel(false)}
        />
      )}
      
      <PropertyPanel
        canvas={fabricCanvasRef.current}
        activeTool={activeTool}
        brushSize={brushSize}
        brushColor={brushColor}
        onBrushSizeChange={setBrushSize}
        onBrushColorChange={setBrushColor}
      />
    </EditorContainer>
  );
};

export default Editor; 