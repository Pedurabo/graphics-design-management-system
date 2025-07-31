import request from 'supertest';
import { app } from '../../index';
import { ProjectService } from '../../services/ProjectService';
import { AuthService } from '../../services/AuthService';
import { AssetService } from '../../services/AssetService';

// Mock services
jest.mock('../../services/ProjectService');
jest.mock('../../services/AuthService');
jest.mock('../../services/AssetService');

const mockProjectService = ProjectService as jest.Mocked<typeof ProjectService>;
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockAssetService = AssetService as jest.Mocked<typeof AssetService>;

describe('API Controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Auth Controller', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user successfully', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        };

        const mockUser = {
          id: '1',
          email: userData.email,
          name: userData.name,
          role: 'user',
        };

        const mockToken = 'mock-jwt-token';

        mockAuthService.register.mockResolvedValue({
          user: mockUser,
          token: mockToken,
        });

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body).toEqual({
          user: mockUser,
          token: mockToken,
        });

        expect(mockAuthService.register).toHaveBeenCalledWith(userData);
      });

      it('should return 400 for invalid email', async () => {
        const userData = {
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('email');
      });

      it('should return 400 for weak password', async () => {
        const userData = {
          email: 'test@example.com',
          password: '123',
          name: 'Test User',
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('password');
      });

      it('should return 409 for existing email', async () => {
        const userData = {
          email: 'existing@example.com',
          password: 'password123',
          name: 'Test User',
        };

        mockAuthService.register.mockRejectedValue(new Error('User already exists'));

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(409);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login user successfully', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123',
        };

        const mockUser = {
          id: '1',
          email: loginData.email,
          name: 'Test User',
          role: 'user',
        };

        const mockToken = 'mock-jwt-token';

        mockAuthService.login.mockResolvedValue({
          user: mockUser,
          token: mockToken,
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toEqual({
          user: mockUser,
          token: mockToken,
        });

        expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
      });

      it('should return 401 for invalid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout user successfully', async () => {
        const mockToken = 'mock-jwt-token';

        mockAuthService.logout.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(200);

        expect(response.body).toEqual({ message: 'Logged out successfully' });
        expect(mockAuthService.logout).toHaveBeenCalledWith(mockToken);
      });
    });
  });

  describe('Project Controller', () => {
    const mockToken = 'mock-jwt-token';
    const mockUserId = '1';

    describe('GET /api/projects', () => {
      it('should return user projects', async () => {
        const mockProjects = [
          {
            id: '1',
            name: 'Project 1',
            description: 'Test project',
            userId: mockUserId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: 'Project 2',
            description: 'Another test project',
            userId: mockUserId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        mockProjectService.getUserProjects.mockResolvedValue(mockProjects);

        const response = await request(app)
          .get('/api/projects')
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(200);

        expect(response.body).toEqual({ projects: mockProjects });
        expect(mockProjectService.getUserProjects).toHaveBeenCalledWith(mockUserId);
      });

      it('should return 401 without token', async () => {
        const response = await request(app)
          .get('/api/projects')
          .expect(401);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/projects/:id', () => {
      it('should return project by id', async () => {
        const projectId = '1';
        const mockProject = {
          id: projectId,
          name: 'Test Project',
          description: 'Test project description',
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          layers: [],
        };

        mockProjectService.getProjectById.mockResolvedValue(mockProject);

        const response = await request(app)
          .get(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(200);

        expect(response.body).toEqual(mockProject);
        expect(mockProjectService.getProjectById).toHaveBeenCalledWith(projectId, mockUserId);
      });

      it('should return 404 for non-existent project', async () => {
        const projectId = '999';

        mockProjectService.getProjectById.mockResolvedValue(null);

        const response = await request(app)
          .get(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });

      it('should return 403 for unauthorized access', async () => {
        const projectId = '1';

        mockProjectService.getProjectById.mockRejectedValue(new Error('Unauthorized'));

        const response = await request(app)
          .get(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(403);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/projects', () => {
      it('should create new project', async () => {
        const projectData = {
          name: 'New Project',
          description: 'A new test project',
        };

        const mockProject = {
          id: 'new-id',
          ...projectData,
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockProjectService.createProject.mockResolvedValue(mockProject);

        const response = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(projectData)
          .expect(201);

        expect(response.body).toEqual(mockProject);
        expect(mockProjectService.createProject).toHaveBeenCalledWith({
          ...projectData,
          userId: mockUserId,
        });
      });

      it('should return 400 for invalid project data', async () => {
        const projectData = {
          name: '', // Invalid empty name
          description: 'A test project',
        };

        const response = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(projectData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('PUT /api/projects/:id', () => {
      it('should update project', async () => {
        const projectId = '1';
        const updateData = {
          name: 'Updated Project',
          description: 'Updated description',
        };

        const mockProject = {
          id: projectId,
          ...updateData,
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockProjectService.updateProject.mockResolvedValue(mockProject);

        const response = await request(app)
          .put(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${mockToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toEqual(mockProject);
        expect(mockProjectService.updateProject).toHaveBeenCalledWith(
          projectId,
          updateData,
          mockUserId
        );
      });

      it('should return 404 for non-existent project', async () => {
        const projectId = '999';
        const updateData = {
          name: 'Updated Project',
        };

        mockProjectService.updateProject.mockResolvedValue(null);

        const response = await request(app)
          .put(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${mockToken}`)
          .send(updateData)
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('DELETE /api/projects/:id', () => {
      it('should delete project', async () => {
        const projectId = '1';

        mockProjectService.deleteProject.mockResolvedValue(true);

        const response = await request(app)
          .delete(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(204);

        expect(mockProjectService.deleteProject).toHaveBeenCalledWith(projectId, mockUserId);
      });

      it('should return 404 for non-existent project', async () => {
        const projectId = '999';

        mockProjectService.deleteProject.mockResolvedValue(false);

        const response = await request(app)
          .delete(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Asset Controller', () => {
    const mockToken = 'mock-jwt-token';
    const mockUserId = '1';

    describe('GET /api/assets', () => {
      it('should return user assets', async () => {
        const mockAssets = [
          {
            id: '1',
            name: 'asset1.png',
            type: 'image',
            size: 1024,
            url: 'https://example.com/asset1.png',
            userId: mockUserId,
            createdAt: new Date(),
          },
          {
            id: '2',
            name: 'asset2.jpg',
            type: 'image',
            size: 2048,
            url: 'https://example.com/asset2.jpg',
            userId: mockUserId,
            createdAt: new Date(),
          },
        ];

        mockAssetService.getUserAssets.mockResolvedValue(mockAssets);

        const response = await request(app)
          .get('/api/assets')
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(200);

        expect(response.body).toEqual({ assets: mockAssets });
        expect(mockAssetService.getUserAssets).toHaveBeenCalledWith(mockUserId);
      });
    });

    describe('POST /api/assets/upload', () => {
      it('should upload asset successfully', async () => {
        const mockFile = {
          fieldname: 'file',
          originalname: 'test.png',
          encoding: '7bit',
          mimetype: 'image/png',
          size: 1024,
          buffer: Buffer.from('test'),
        };

        const mockAsset = {
          id: 'new-asset-id',
          name: 'test.png',
          type: 'image',
          size: 1024,
          url: 'https://example.com/test.png',
          userId: mockUserId,
          createdAt: new Date(),
        };

        mockAssetService.uploadAsset.mockResolvedValue(mockAsset);

        const response = await request(app)
          .post('/api/assets/upload')
          .set('Authorization', `Bearer ${mockToken}`)
          .attach('file', Buffer.from('test'), 'test.png')
          .expect(201);

        expect(response.body).toEqual(mockAsset);
        expect(mockAssetService.uploadAsset).toHaveBeenCalled();
      });

      it('should return 400 for invalid file type', async () => {
        const response = await request(app)
          .post('/api/assets/upload')
          .set('Authorization', `Bearer ${mockToken}`)
          .attach('file', Buffer.from('test'), 'test.txt')
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('file type');
      });

      it('should return 400 for file too large', async () => {
        // Create a large buffer
        const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

        const response = await request(app)
          .post('/api/assets/upload')
          .set('Authorization', `Bearer ${mockToken}`)
          .attach('file', largeBuffer, 'large.png')
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('file size');
      });
    });

    describe('DELETE /api/assets/:id', () => {
      it('should delete asset', async () => {
        const assetId = '1';

        mockAssetService.deleteAsset.mockResolvedValue(true);

        const response = await request(app)
          .delete(`/api/assets/${assetId}`)
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(204);

        expect(mockAssetService.deleteAsset).toHaveBeenCalledWith(assetId, mockUserId);
      });

      it('should return 404 for non-existent asset', async () => {
        const assetId = '999';

        mockAssetService.deleteAsset.mockResolvedValue(false);

        const response = await request(app)
          .delete(`/api/assets/${assetId}`)
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(404);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('AI Controller', () => {
    const mockToken = 'mock-jwt-token';

    describe('POST /api/ai/enhance', () => {
      it('should enhance image successfully', async () => {
        const enhanceData = {
          imageUrl: 'https://example.com/image.png',
          enhancements: ['brightness', 'contrast'],
        };

        const mockResult = {
          enhancedImage: 'https://example.com/enhanced.png',
          processingTime: 1.5,
          improvements: ['brightness', 'contrast'],
        };

        // Mock AI service call
        const response = await request(app)
          .post('/api/ai/enhance')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(enhanceData)
          .expect(200);

        expect(response.body).toHaveProperty('enhancedImage');
        expect(response.body).toHaveProperty('processingTime');
      });

      it('should return 400 for invalid image URL', async () => {
        const enhanceData = {
          imageUrl: 'invalid-url',
          enhancements: ['brightness'],
        };

        const response = await request(app)
          .post('/api/ai/enhance')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(enhanceData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('POST /api/ai/segment', () => {
      it('should segment image successfully', async () => {
        const segmentData = {
          imageUrl: 'https://example.com/image.png',
        };

        const response = await request(app)
          .post('/api/ai/segment')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(segmentData)
          .expect(200);

        expect(response.body).toHaveProperty('segments');
        expect(response.body).toHaveProperty('processingTime');
      });
    });

    describe('POST /api/ai/style-transfer', () => {
      it('should apply style transfer successfully', async () => {
        const styleData = {
          imageUrl: 'https://example.com/image.png',
          style: 'van-gogh',
        };

        const response = await request(app)
          .post('/api/ai/style-transfer')
          .set('Authorization', `Bearer ${mockToken}`)
          .send(styleData)
          .expect(200);

        expect(response.body).toHaveProperty('styledImage');
        expect(response.body).toHaveProperty('style');
        expect(response.body).toHaveProperty('processingTime');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors', async () => {
      // Mock a service to throw an error
      mockProjectService.getUserProjects.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer mock-token')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('validation');
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests quickly
      const requests = Array(100).fill(null).map(() =>
        request(app)
          .get('/api/projects')
          .set('Authorization', 'Bearer mock-token')
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.status === 429);

      expect(rateLimited).toBe(true);
    });
  });

  describe('Security', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: maliciousInput,
          password: 'password123',
          name: maliciousInput,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should prevent XSS attacks', async () => {
      const xssInput = '<script>alert("xss")</script>';

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer mock-token')
        .send({
          name: xssInput,
          description: xssInput,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate JWT tokens', async () => {
      const invalidToken = 'invalid-jwt-token';

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
}); 