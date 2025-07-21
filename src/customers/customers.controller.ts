import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { RequestWithUser } from '../common/interfaces/auth.interfaces';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    const customer = await this.customersService.create(createCustomerDto);
    return {
      message: 'Customer created successfully',
      data: customer,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  async findAll() {
    const customers = await this.customersService.findAll();
    return {
      message: 'Customers retrieved successfully',
      data: customers,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: RequestWithUser) {
    const customer = await this.customersService.findByUserId(req.user.id);
    return {
      message: 'Profile retrieved successfully',
      data: customer,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER)
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Solo ADMIN y SELLER pueden consultar cualquier cliente
    // CUSTOMER solo puede consultar su propio registro
    if (req.user.role === UserRole.CUSTOMER && req.user.customerId !== id) {
      return { message: 'No tienes permiso para ver este cliente', data: null };
    }
    const customer = await this.customersService.findOne(id);
    return {
      message: 'Customer retrieved successfully',
      data: customer,
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    const customer = await this.customersService.findByUserId(req.user.id);
    const updatedCustomer = await this.customersService.update(
      customer.id,
      updateCustomerDto,
    );
    return {
      message: 'Profile updated successfully',
      data: updatedCustomer,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER)
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req: RequestWithUser,
  ) {
    // Solo ADMIN y SELLER pueden editar cualquier cliente
    // CUSTOMER solo puede editar su propio registro
    if (req.user.role === UserRole.CUSTOMER && req.user.customerId !== id) {
      return { message: 'No tienes permiso para editar este cliente', data: null };
    }
    const customer = await this.customersService.update(id, updateCustomerDto);
    return {
      message: 'Customer updated successfully',
      data: customer,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.customersService.remove(id);
    return {
      message: 'Customer deleted successfully',
    };
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async restore(@Param('id') id: string) {
    const customer = await this.customersService.restore(id);
    return {
      message: 'Customer restored successfully',
      data: customer,
    };
  }
}
