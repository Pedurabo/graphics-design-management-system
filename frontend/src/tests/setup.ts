import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './mocks/server';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock canvas and WebGL
const mockCanvas = {
  getContext: jest.fn(() => ({
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
  })),
  width: 800,
  height: 600,
  style: {},
  toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
  toBlob: jest.fn(() => Promise.resolve(new Blob())),
};

// Mock WebGL context
const mockWebGLContext = {
  createBuffer: jest.fn(() => ({})),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  createShader: jest.fn(() => ({})),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  createProgram: jest.fn(() => ({})),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  useProgram: jest.fn(),
  getAttribLocation: jest.fn(() => 0),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  drawArrays: jest.fn(),
  clear: jest.fn(),
  clearColor: jest.fn(),
  viewport: jest.fn(),
  createTexture: jest.fn(() => ({})),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  getUniformLocation: jest.fn(() => ({})),
  uniform1f: jest.fn(),
  uniform2f: jest.fn(),
  uniform3f: jest.fn(),
  uniform4f: jest.fn(),
  uniform1i: jest.fn(),
  uniform2i: jest.fn(),
  uniform3i: jest.fn(),
  uniform4i: jest.fn(),
  uniformMatrix2fv: jest.fn(),
  uniformMatrix3fv: jest.fn(),
  uniformMatrix4fv: jest.fn(),
  canvas: mockCanvas,
  drawingBufferWidth: 800,
  drawingBufferHeight: 600,
};

// Mock HTMLCanvasElement
Object.defineProperty(window, 'HTMLCanvasElement', {
  value: class {
    getContext(contextId: string) {
      if (contextId === '2d') {
        return mockCanvas.getContext();
      }
      if (contextId === 'webgl' || contextId === 'webgl2') {
        return mockWebGLContext;
      }
      return null;
    }
  },
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-url'),
});

// Mock window.URL.revokeObjectURL
Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: jest.fn(),
});

// Mock FileReader
global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  result: null,
  onload: null,
  onerror: null,
}));

// Mock Image
global.Image = jest.fn().mockImplementation(() => ({
  src: '',
  onload: null,
  onerror: null,
  width: 100,
  height: 100,
}));

// Mock fetch
global.fetch = jest.fn();

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Custom matchers for testing
expect.extend({
  toHaveBeenCalledWithMatch(received: jest.Mock, expected: any) {
    const pass = received.mock.calls.some(call =>
      expect(call[0]).toMatchObject(expected)
    );
    return {
      pass,
      message: () =>
        `expected ${received.getMockName()} to have been called with an object matching ${JSON.stringify(
          expected
        )}`,
    };
  },
});

// Global test utilities
global.testUtils = {
  waitForElementToBeRemoved: (element: Element) =>
    new Promise(resolve => {
      const observer = new MutationObserver(() => {
        if (!document.contains(element)) {
          observer.disconnect();
          resolve(true);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }),
  
  createMockFile: (name: string, type: string, size: number) =>
    new File(['mock content'], name, { type }),
  
  createMockImageData: (width: number, height: number) => ({
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
  }),
  
  simulateMouseEvent: (element: Element, eventType: string, options = {}) => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
      ...options,
    });
    element.dispatchEvent(event);
  },
  
  simulateKeyboardEvent: (element: Element, eventType: string, options = {}) => {
    const event = new KeyboardEvent(eventType, {
      bubbles: true,
      cancelable: true,
      key: options.key || '',
      code: options.code || '',
      ctrlKey: options.ctrlKey || false,
      shiftKey: options.shiftKey || false,
      altKey: options.altKey || false,
      metaKey: options.metaKey || false,
      ...options,
    });
    element.dispatchEvent(event);
  },
};

// Type declarations for global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledWithMatch(expected: any): R;
    }
  }
  
  var testUtils: {
    waitForElementToBeRemoved: (element: Element) => Promise<boolean>;
    createMockFile: (name: string, type: string, size: number) => File;
    createMockImageData: (width: number, height: number) => ImageData;
    simulateMouseEvent: (element: Element, eventType: string, options?: any) => void;
    simulateKeyboardEvent: (element: Element, eventType: string, options?: any) => void;
  };
} 