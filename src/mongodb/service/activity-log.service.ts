import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityLog, ActivityLogDocument } from '../logs/activity-log.schema';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(
    @InjectModel(ActivityLog.name)
    private activityLogModel: Model<ActivityLogDocument>,
  ) {}

  async logActivity(data: {
    userId: string;
    userEmail: string;
    userRole: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
    sessionId?: string;
  }): Promise<ActivityLog> {
    try {
      const logEntry = new this.activityLogModel({
        ...data,
        timestamp: new Date(),
        success: data.success !== undefined ? data.success : true,
      });

      return await logEntry.save();
    } catch (error) {
      this.logger.error(`Failed to log activity: ${error.message}`);
      throw error;
    }
  }

  async getActivityLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: ActivityLog[]; total: number }> {
    try {
      const query: any = {};

      if (filters.userId) {
        query.userId = filters.userId;
      }

      if (filters.action) {
        query.action = filters.action;
      }

      if (filters.resource) {
        query.resource = filters.resource;
      }

      if (filters.fromDate || filters.toDate) {
        query.timestamp = {};
        if (filters.fromDate) {
          query.timestamp.$gte = filters.fromDate;
        }
        if (filters.toDate) {
          query.timestamp.$lte = filters.toDate;
        }
      }

      const total = await this.activityLogModel.countDocuments(query);
      const logs = await this.activityLogModel
        .find(query)
        .sort({ timestamp: -1 })
        .limit(filters.limit || 100)
        .skip(filters.offset || 0)
        .exec();

      return { logs, total };
    } catch (error) {
      this.logger.error(`Failed to get activity logs: ${error.message}`);
      throw error;
    }
  }

  async getUserActivity(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    try {
      return await this.activityLogModel
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get user activity: ${error.message}`);
      throw error;
    }
  }

  async getActivityStats(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any> {
    try {
      const now = new Date();
      let fromDate: Date;

      switch (period) {
        case 'daily':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const pipeline = [
        {
          $match: {
            timestamp: { $gte: fromDate },
          },
        },
        {
          $group: {
            _id: {
              action: '$action',
              resource: '$resource',
            },
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] },
            },
            errorCount: {
              $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] },
            },
          },
        },
        {
          $sort: { count: -1 as 1 | -1 },
        },
      ];

      const stats = await this.activityLogModel.aggregate(pipeline).exec();

      const userActivityPipeline = [
        {
          $match: {
            timestamp: { $gte: fromDate },
          },
        },
        {
          $group: {
            _id: '$userId',
            userEmail: { $first: '$userEmail' },
            userRole: { $first: '$userRole' },
            activityCount: { $sum: 1 },
            lastActivity: { $max: '$timestamp' },
          },
        },
        {
          $sort: { activityCount: -1 as 1 | -1 },
        },
        {
          $limit: 10,
        },
      ];

      const userStats = await this.activityLogModel.aggregate(userActivityPipeline).exec();

      return {
        period,
        activityBreakdown: stats,
        topActiveUsers: userStats,
        totalActivities: stats.reduce((sum, item) => sum + item.count, 0),
      };
    } catch (error) {
      this.logger.error(`Failed to get activity stats: ${error.message}`);
      throw error;
    }
  }

  async cleanOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.activityLogModel.deleteMany({
        timestamp: { $lt: cutoffDate },
      });

      this.logger.log(`Cleaned ${result.deletedCount} old activity logs`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`Failed to clean old logs: ${error.message}`);
      throw error;
    }
  }

  async getActivitySummary(
    period: string = 'daily',
    options: { fromDate?: Date; toDate?: Date } = {},
  ): Promise<any> {
    try {
      const now = new Date();
      let fromDate = options.fromDate;
      
      if (!fromDate) {
        switch (period) {
          case 'daily':
            fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'yearly':
            fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
      }

      const toDate = options.toDate || now;

      // Obtener estadísticas generales
      const totalLogs = await this.activityLogModel.countDocuments({
        timestamp: { $gte: fromDate, $lte: toDate },
      });

      // Actividad por tipo
      const actionPipeline = [
        {
          $match: {
            timestamp: { $gte: fromDate, $lte: toDate },
          },
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            successCount: { $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] } },
            failureCount: { $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] } },
          },
        },
        {
          $sort: { count: -1 as 1 | -1 },
        },
      ] as any[];

      const actionsBreakdown = await this.activityLogModel.aggregate(actionPipeline).exec();

      // Actividad por recurso
      const resourcePipeline = [
        {
          $match: {
            timestamp: { $gte: fromDate, $lte: toDate },
          },
        },
        {
          $group: {
            _id: '$resource',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 as 1 | -1 },
        },
      ] as any[];

      const resourcesBreakdown = await this.activityLogModel.aggregate(resourcePipeline).exec();

      // Actividad por usuario
      const userPipeline = [
        {
          $match: {
            timestamp: { $gte: fromDate, $lte: toDate },
          },
        },
        {
          $group: {
            _id: '$userId',
            userEmail: { $first: '$userEmail' },
            userRole: { $first: '$userRole' },
            count: { $sum: 1 },
            lastActivity: { $max: '$timestamp' },
          },
        },
        {
          $sort: { count: -1 as 1 | -1 },
        },
        {
          $limit: 10,
        },
      ] as any[];

      const usersBreakdown = await this.activityLogModel.aggregate(userPipeline).exec();

      return {
        period,
        timeRange: {
          from: fromDate,
          to: toDate,
        },
        summary: {
          totalLogs,
          successfulOperations: actionsBreakdown.reduce((sum, item) => sum + item.successCount, 0),
          failedOperations: actionsBreakdown.reduce((sum, item) => sum + item.failureCount, 0),
        },
        actionsBreakdown,
        resourcesBreakdown,
        topActiveUsers: usersBreakdown,
      };
    } catch (error) {
      this.logger.error(`Failed to get activity summary: ${error.message}`);
      throw error;
    }
  }

  async updateActivityLog(id: string, updateDto: any): Promise<any> {
    // Implementación básica: actualizar por id
    return await this.activityLogModel.findByIdAndUpdate(id, updateDto, { new: true });
  }

  async deleteActivityLog(id: string): Promise<void> {
    await this.activityLogModel.findByIdAndDelete(id);
  }
}
