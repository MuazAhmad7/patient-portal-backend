import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { JobData } from '../types';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private redisConnection: Redis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  constructor(private configService: ConfigService) {
    this.redisConnection = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      password: this.configService.get('redis.password'),
    });
  }

  async onModuleInit() {
    // Initialize default queues
    await this.createQueue('patient-processing');
    await this.createQueue('ai-analysis');
    await this.createQueue('notifications');
  }

  async onModuleDestroy() {
    // Clean up connections
    for (const [name, queue] of this.queues) {
      await queue.close();
    }
    for (const [name, worker] of this.workers) {
      await worker.close();
    }
    await this.redisConnection.quit();
  }

  async createQueue(name: string): Promise<Queue> {
    if (this.queues.has(name)) {
      return this.queues.get(name);
    }

    const queue = new Queue(name, {
      connection: this.redisConnection,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.queues.set(name, queue);
    return queue;
  }

  async addJob(queueName: string, jobData: JobData): Promise<Job> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.add(jobData.type, jobData.payload, {
      priority: jobData.priority,
      delay: jobData.delay,
    });
  }

  async createWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>
  ): Promise<Worker> {
    if (this.workers.has(queueName)) {
      return this.workers.get(queueName);
    }

    const worker = new Worker(queueName, processor, {
      connection: this.redisConnection,
      concurrency: 5,
    });

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed in queue ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed in queue ${queueName}:`, err);
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  getWorker(name: string): Worker | undefined {
    return this.workers.get(name);
  }
}