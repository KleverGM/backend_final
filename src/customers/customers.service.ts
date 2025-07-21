import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { getErrorMessage } from '../common/types/error.types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: createCustomerDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(createCustomerDto.password, 12);

      // Create user
      const user = this.userRepository.create({
        email: createCustomerDto.email,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
      });

      const savedUser = await this.userRepository.save(user);

      // Create customer profile
      const customer = this.customerRepository.create({
        ...createCustomerDto,
        userId: savedUser.id,
      });
      // Asignar la relación manualmente si es necesario
      customer.user = savedUser;

      const savedCustomer = await this.customerRepository.save(customer);
      this.logger.log(`Customer created with ID: ${savedCustomer.id}`);
      return savedCustomer;
    } catch (error) {
      this.logger.error(`Failed to create customer: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findAll(): Promise<Customer[]> {
    try {
      return await this.customerRepository.find({
        where: { isDeleted: false },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to fetch customers: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id, isDeleted: false },
        relations: ['user'],
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      return customer;
    } catch (error) {
      this.logger.error(`Failed to fetch customer ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { userId, isDeleted: false },
        relations: ['user'],
      });

      if (!customer) {
        throw new NotFoundException(`Customer for user ID ${userId} not found`);
      }

      return customer;
    } catch (error) {
      this.logger.error(`Failed to fetch customer by user ID ${userId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    try {
      const customer = await this.findOne(id);

      // Check email uniqueness if email is being updated
      if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: updateCustomerDto.email },
        });

        if (existingUser && existingUser.id !== customer.userId) {
          throw new ConflictException('Email already exists');
        }

        // Update user email
        await this.userRepository.update(customer.userId, {
          email: updateCustomerDto.email,
        });
      }

      // Update customer
      Object.assign(customer, updateCustomerDto);
      const updatedCustomer = await this.customerRepository.save(customer);

      this.logger.log(`Customer updated with ID: ${id}`);
      return updatedCustomer;
    } catch (error) {
      this.logger.error(`Failed to update customer ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async updateProfileImage(id: string, imageUrl: string): Promise<Customer> {
    try {
      const customer = await this.findOne(id);
      customer.profileImageUrl = imageUrl;
      const updatedCustomer = await this.customerRepository.save(customer);
      
      this.logger.log(`Customer profile image updated for ID: ${id}`);
      return updatedCustomer;
    } catch (error) {
      this.logger.error(`Failed to update customer profile image ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const customer = await this.findOne(id);

      // Soft delete
      customer.isDeleted = true;
      customer.isActive = false;
      await this.customerRepository.save(customer);

      // Also deactivate the user
      await this.userRepository.update(customer.userId, { isActive: false });

      this.logger.log(`Customer soft deleted with ID: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete customer ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async restore(id: string): Promise<Customer> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }

      if (!customer.isDeleted) {
        throw new ConflictException(`Customer with ID ${id} is not deleted`);
      }

      customer.isDeleted = false;
      customer.isActive = true;
      const restoredCustomer = await this.customerRepository.save(customer);

      // Also reactivate the user
      await this.userRepository.update(customer.userId, { isActive: true });

      this.logger.log(`Customer restored with ID: ${id}`);
      return restoredCustomer;
    } catch (error) {
      this.logger.error(`Failed to restore customer ${id}: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}
