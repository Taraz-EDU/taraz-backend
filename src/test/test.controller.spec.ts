import { Test, TestingModule } from '@nestjs/testing';
import { TestController } from './test.controller';

describe('TestController', () => {
  let controller: TestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    controller = module.get<TestController>(TestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTest', () => {
    it('should return test message without name', () => {
      const result = controller.getTest();
      expect(result.message).toBe('Hello World! This is a test endpoint.');
      expect(result.timestamp).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should return test message with name', () => {
      const result = controller.getTest('John');
      expect(result.message).toBe('Hello John! This is a test endpoint.');
      expect(result.timestamp).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe('getTestById', () => {
    it('should return test data for given ID', () => {
      const result = controller.getTestById('123');
      expect(result.message).toBe('Test data for ID: 123');
      expect(result.timestamp).toBeDefined();
      expect(result.data.id).toBe('123');
      expect(result.data.status).toBe('active');
    });
  });

  describe('createTest', () => {
    it('should create test data', () => {
      const testData = { name: 'John', email: 'john@example.com' };
      const result = controller.createTest(testData);
      expect(result.message).toBe('Test data created successfully');
      expect(result.timestamp).toBeDefined();
      expect(result.data.name).toBe('John');
      expect(result.data.email).toBe('john@example.com');
      expect(result.data.status).toBe('created');
      expect(result.data.id).toBeDefined();
    });
  });
});
