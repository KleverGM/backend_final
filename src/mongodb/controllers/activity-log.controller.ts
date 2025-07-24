import { Controller, Get, Post, Body, Query, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { ActivityLogService } from '../service/activity-log.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { RequestWithUser } from '../../common/interfaces/auth.interfaces';
import { Request } from '@nestjs/common';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Post()
  async logActivity(@Body() data: any, @Request() req: RequestWithUser) {
    // Añadir información del usuario que realiza la acción desde el token JWT
    const logData = {
      ...data,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const result = await this.activityLogService.logActivity(logData);
    return {
      message: 'Activity logged successfully',
      data: result,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updateActivityLog(@Param('id') id: string, @Body() updateDto: any) {
    const result = await this.activityLogService.updateActivityLog(id, updateDto);
    return {
      message: 'Activity log updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteActivityLog(@Param('id') id: string) {
    await this.activityLogService.deleteActivityLog(id);
    return { message: 'Activity log deleted successfully' };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async getActivityLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('fromDate') fromDate?: Date,
    @Query('toDate') toDate?: Date,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const filters = {
      userId,
      action,
      resource,
      fromDate,
      toDate,
      limit: limit ? Number(String(limit).replace(/\D/g, '')) : 50,
      offset: offset ? Number(String(offset).replace(/\D/g, '')) : 0,
    };

    const result = await this.activityLogService.getActivityLogs(filters);
    return {
      message: 'Activity logs retrieved successfully',
      data: result,
    };
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  async getUserActivityLogs(
    @Param('userId') userId: string,
    @Query('fromDate') fromDate?: Date,
    @Query('toDate') toDate?: Date,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const filters = {
      userId,
      fromDate,
      toDate,
      limit: limit ? Number(String(limit).replace(/\D/g, '')) : 50,
      offset: offset ? Number(String(offset).replace(/\D/g, '')) : 0,
    };

    const result = await this.activityLogService.getActivityLogs(filters);
    return {
      message: `Activity logs for user ${userId} retrieved successfully`,
      data: result,
    };
  }

  @Get('my-activity')
  async getMyActivityLogs(
    @Request() req: RequestWithUser,
    @Query('fromDate') fromDate?: Date,
    @Query('toDate') toDate?: Date,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const filters = {
      userId: req.user.id,
      fromDate,
      toDate,
      limit: limit ? Number(String(limit).replace(/\D/g, '')) : 50,
      offset: offset ? Number(String(offset).replace(/\D/g, '')) : 0,
    };

    const result = await this.activityLogService.getActivityLogs(filters);
    return {
      message: 'Your activity logs retrieved successfully',
      data: result,
    };
  }

  @Get('actions/:action')
  @Roles(UserRole.ADMIN)
  async getActionActivityLogs(
    @Param('action') action: string,
    @Query('fromDate') fromDate?: Date,
    @Query('toDate') toDate?: Date,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const filters = {
      action,
      fromDate,
      toDate,
      limit: limit ? Number(String(limit).replace(/\D/g, '')) : 50,
      offset: offset ? Number(String(offset).replace(/\D/g, '')) : 0,
    };

    const result = await this.activityLogService.getActivityLogs(filters);
    return {
      message: `Activity logs for action "${action}" retrieved successfully`,
      data: result,
    };
  }

  @Get('resources/:resource')
  @Roles(UserRole.ADMIN)
  async getResourceActivityLogs(
    @Param('resource') resource: string,
    @Query('resourceId') resourceId?: string,
    @Query('fromDate') fromDate?: Date,
    @Query('toDate') toDate?: Date,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const filters = {
      resource,
      resourceId,
      fromDate,
      toDate,
      limit: limit ? Number(String(limit).replace(/\D/g, '')) : 50,
      offset: offset ? Number(String(offset).replace(/\D/g, '')) : 0,
    };

    const result = await this.activityLogService.getActivityLogs(filters);
    return {
      message: `Activity logs for resource "${resource}" retrieved successfully`,
      data: result,
    };
  }

  @Get('summary')
  @Roles(UserRole.ADMIN)
  async getActivitySummary(
    @Query('period') period: string = 'daily',
    @Query('fromDate') fromDate?: Date,
    @Query('toDate') toDate?: Date,
  ) {
    // Asumiendo que existe este método en el servicio
    const result = await this.activityLogService.getActivitySummary(period, { fromDate, toDate });
    return {
      message: 'Activity summary retrieved successfully',
      data: result,
    };
  }

  // Endpoint para que el seller consulte sus logs
  @Get('seller/:sellerId')
  @Roles(UserRole.SELLER)
  async getSellerActivityLogs(@Param('sellerId') sellerId: string) {
    const logs = await this.activityLogService.getActivityLogs({ userId: sellerId });
    return { message: 'Activity logs for seller', data: logs };
  }

  // Endpoint para que el customer consulte sus logs
  @Get('customer/:customerId')
  @Roles(UserRole.CUSTOMER)
  async getCustomerActivityLogs(@Param('customerId') customerId: string) {
    const logs = await this.activityLogService.getActivityLogs({ userId: customerId });
    return { message: 'Activity logs for customer', data: logs };
  }
}
