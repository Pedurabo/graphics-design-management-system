import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API endpoints
export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
      })
    );
  }),

  // Projects endpoints
  rest.get('/api/projects', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        projects: [
          {
            id: '1',
            name: 'Test Project 1',
            description: 'A test project',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            thumbnail: 'data:image/png;base64,mock',
          },
          {
            id: '2',
            name: 'Test Project 2',
            description: 'Another test project',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
            thumbnail: 'data:image/png;base64,mock',
          },
        ],
      })
    );
  }),

  rest.get('/api/projects/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id,
        name: `Project ${id}`,
        description: 'A test project',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        thumbnail: 'data:image/png;base64,mock',
        layers: [
          {
            id: 'layer-1',
            name: 'Background',
            visible: true,
            locked: false,
            opacity: 100,
            blendMode: 'normal',
          },
          {
            id: 'layer-2',
            name: 'Layer 1',
            visible: true,
            locked: false,
            opacity: 100,
            blendMode: 'normal',
          },
        ],
      })
    );
  }),

  rest.post('/api/projects', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'new-project-id',
        name: 'New Project',
        description: 'A new project',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        thumbnail: 'data:image/png;base64,mock',
      })
    );
  }),

  rest.put('/api/projects/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id,
        name: 'Updated Project',
        description: 'An updated project',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        thumbnail: 'data:image/png;base64,mock',
      })
    );
  }),

  rest.delete('/api/projects/:id', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // Assets endpoints
  rest.get('/api/assets', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        assets: [
          {
            id: '1',
            name: 'asset1.png',
            type: 'image',
            size: 1024,
            url: 'data:image/png;base64,mock',
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            name: 'asset2.jpg',
            type: 'image',
            size: 2048,
            url: 'data:image/jpeg;base64,mock',
            createdAt: '2024-01-02T00:00:00Z',
          },
        ],
      })
    );
  }),

  rest.post('/api/assets/upload', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'new-asset-id',
        name: 'uploaded-asset.png',
        type: 'image',
        size: 1024,
        url: 'data:image/png;base64,mock',
        createdAt: '2024-01-01T00:00:00Z',
      })
    );
  }),

  // AI Services endpoints
  rest.post('/api/ai/enhance', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        enhancedImage: 'data:image/png;base64,enhanced-mock',
        processingTime: 1.5,
        improvements: ['brightness', 'contrast', 'sharpness'],
      })
    );
  }),

  rest.post('/api/ai/segment', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        segments: [
          {
            id: 'segment-1',
            label: 'person',
            confidence: 0.95,
            bounds: { x: 100, y: 100, width: 200, height: 300 },
            mask: 'data:image/png;base64,mask-mock',
          },
        ],
        processingTime: 2.1,
      })
    );
  }),

  rest.post('/api/ai/style-transfer', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        styledImage: 'data:image/png;base64,styled-mock',
        style: 'van-gogh',
        processingTime: 3.2,
      })
    );
  }),

  // Collaboration endpoints
  rest.get('/api/collaboration/:projectId/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        users: [
          {
            id: 'user-1',
            name: 'User 1',
            email: 'user1@example.com',
            role: 'editor',
            lastActive: '2024-01-01T00:00:00Z',
          },
          {
            id: 'user-2',
            name: 'User 2',
            email: 'user2@example.com',
            role: 'viewer',
            lastActive: '2024-01-01T00:00:00Z',
          },
        ],
      })
    );
  }),

  // Error handlers
  rest.all('*', (req, res, ctx) => {
    console.warn(`Unhandled ${req.method} request to ${req.url}`);
    return res(ctx.status(404), ctx.json({ error: 'Not found' }));
  }),
];

export const server = setupServer(...handlers); 