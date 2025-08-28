import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AIAgentRequest, AIAgentResponse } from '../types';

@Injectable()
export class AIAgentService {
  private httpClient: AxiosInstance;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('ai.baseUrl');
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(`AI Agent Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('AI Agent Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`AI Agent Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('AI Agent Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async analyzePatientData(request: AIAgentRequest): Promise<AIAgentResponse> {
    try {
      const response = await this.httpClient.post('/analyze', request);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `AI analysis failed: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getRecommendations(request: AIAgentRequest): Promise<AIAgentResponse> {
    try {
      const response = await this.httpClient.post('/recommendations', request);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `AI recommendations failed: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async classifyMedicalData(request: AIAgentRequest): Promise<AIAgentResponse> {
    try {
      const response = await this.httpClient.post('/classify', request);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `AI classification failed: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async processGenericRequest(endpoint: string, request: AIAgentRequest): Promise<AIAgentResponse> {
    try {
      const response = await this.httpClient.post(endpoint, request);
      return response.data;
    } catch (error) {
      throw new HttpException(
        `AI service request failed: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('AI Agent health check failed:', error.message);
      return false;
    }
  }
}