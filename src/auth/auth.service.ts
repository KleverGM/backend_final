import { ChangePasswordDto } from './dto/change-password.dto';
import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto, LoginDto } from './dto/auth.dto';
import { RegisterCustomerDto, RegisterAdminDto, RegisterSellerDto, LoginCustomerDto, LoginAdminDto, LoginSellerDto, RefreshTokenDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Customer } from '../customers/entities/customer.entity';
import { CartService } from '../cart/cart.service';
import { SalesService } from '../sales/sales.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { 
  JwtPayload, 
  ValidatedUser, 
  AuthTokens, 
  LoginResponse,
  RefreshTokenResponse 
} from '../common/interfaces/auth.interfaces';
import { getErrorMessage } from '../common/types/error.types';

@Injectable()
export class AuthService {
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('La contraseña actual es incorrecta');
    }
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);
    await this.userRepository.update(userId, { password: hashedPassword });
  }
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
    @Inject(forwardRef(() => SalesService))
    private readonly salesService: SalesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async validateUser(email: string, password: string): Promise<ValidatedUser | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['customer'],
      });
      if (!user) {
        return null;
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }
      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        customerId: user.customer?.id,
      };
    } catch (error) {
      this.logger.error(`Error validating user: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getAllUsers(): Promise<{ message: string; data: User[] }> {
    try {
      const users = await this.userRepository.find({
        order: { createdAt: 'DESC' },
      });
      return {
        message: 'Lista de usuarios recuperada correctamente',
        data: users,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getUsersByRole(role: UserRole): Promise<{ message: string; data: User[] }> {
    try {
      const users = await this.userRepository.find({
        where: { role },
        order: { createdAt: 'DESC' },
      });
      return {
        message: `Lista de usuarios con rol ${role} recuperada correctamente`,
        data: users,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch users by role: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private async generateTokens(user: ValidatedUser): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      roles: [user.role],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokens = await this.generateTokens(user);
      
      // Update last login
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
      });

      const userWithDetails = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['customer'],
      });

      if (!userWithDetails) {
        throw new BadRequestException('User details not found');
      }

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: userWithDetails.firstName,
          lastName: userWithDetails.lastName,
          role: user.role,
          roles: [user.role],
          customer: userWithDetails.customer ? {
            id: userWithDetails.customer.id,
            firstName: userWithDetails.customer.firstName,
            lastName: userWithDetails.customer.lastName,
          } : undefined,
        },
      };
    } catch (error) {
      this.logger.error(`Login error: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async register(createUserDto: CreateUserDto): Promise<LoginResponse> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

      const user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);

      const validatedUser: ValidatedUser = {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        isActive: true,
      };

      const tokens = await this.generateTokens(validatedUser);

      return {
        ...tokens,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          roles: [savedUser.role],
        },
      };
    } catch (error) {
      this.logger.error(`Registration error: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async registerAdmin(registerAdminDto: RegisterAdminDto, createdBy?: string | null, file?: Express.Multer.File): Promise<LoginResponse> {
    try {
      // Validar clave secreta para admin
      const adminSecretKey = (registerAdminDto as any).adminSecretKey;
      const expectedKey = this.configService.get<string>('ADMIN_SECRET_KEY');
      if (!adminSecretKey || adminSecretKey !== expectedKey) {
        throw new UnauthorizedException('Invalid admin secret key');
      }

      const existingUser = await this.userRepository.findOne({
        where: { email: registerAdminDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(registerAdminDto.password, 12);

      let profileImageUrl = registerAdminDto.profileImage;
      if (file) {
        profileImageUrl = await this.cloudinaryService.uploadImage(file.buffer, 'users');
      }
      const user = this.userRepository.create({
        email: registerAdminDto.email,
        password: hashedPassword,
        firstName: registerAdminDto.firstName,
        lastName: registerAdminDto.lastName,
        role: UserRole.ADMIN,
        profileImageUrl,
      });

      const savedUser = await this.userRepository.save(user);

      const validatedUser: ValidatedUser = {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        isActive: true,
      };

      const tokens = await this.generateTokens(validatedUser);

      return {
        ...tokens,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          roles: [savedUser.role],
        },
      };
    } catch (error) {
      this.logger.error(`Admin registration error: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async registerSeller(registerSellerDto: RegisterSellerDto, createdBy: string, file?: Express.Multer.File): Promise<LoginResponse> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: registerSellerDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(registerSellerDto.password, 12);

      let profileImageUrl = registerSellerDto.profileImage;
      if (file) {
        profileImageUrl = await this.cloudinaryService.uploadImage(file.buffer, 'users');
      }
      const user = this.userRepository.create({
        email: registerSellerDto.email,
        password: hashedPassword,
        firstName: registerSellerDto.firstName,
        lastName: registerSellerDto.lastName,
        role: UserRole.SELLER,
        profileImageUrl,
      });

      const savedUser = await this.userRepository.save(user);

      const validatedUser: ValidatedUser = {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        isActive: true,
      };

      const tokens = await this.generateTokens(validatedUser);

      return {
        ...tokens,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          roles: [savedUser.role],
        },
      };
    } catch (error) {
      this.logger.error(`Seller registration error: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async registerCustomer(registerCustomerDto: RegisterCustomerDto, file?: Express.Multer.File): Promise<LoginResponse> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: registerCustomerDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(registerCustomerDto.password, 12);

      let profileImageUrl = registerCustomerDto.profileImage;
      if (file) {
        profileImageUrl = await this.cloudinaryService.uploadImage(file.buffer, 'users');
      }
      const user = this.userRepository.create({
        email: registerCustomerDto.email,
        password: hashedPassword,
        firstName: registerCustomerDto.firstName,
        lastName: registerCustomerDto.lastName,
        role: UserRole.CUSTOMER,
        profileImageUrl,
      });

      const savedUser = await this.userRepository.save(user);

      // Create customer profile
      const customer = this.customerRepository.create({
        firstName: registerCustomerDto.firstName,
        lastName: registerCustomerDto.lastName,
        email: registerCustomerDto.email,
        phone: registerCustomerDto.phone,
        address: registerCustomerDto.address,
        city: registerCustomerDto.city,
        state: registerCustomerDto.state,
        zipCode: registerCustomerDto.zipCode,
        profileImageUrl,
        user: savedUser,
      });

      const savedCustomer = await this.customerRepository.save(customer);

      const validatedUser: ValidatedUser = {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        isActive: true,
        customerId: savedCustomer.id,
      };

      const tokens = await this.generateTokens(validatedUser);

      return {
        ...tokens,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          role: savedUser.role,
          roles: [savedUser.role],
          customer: {
            id: savedCustomer.id,
            firstName: savedCustomer.firstName,
            lastName: savedCustomer.lastName,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Customer registration error: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async loginCustomer(loginCustomerDto: LoginCustomerDto): Promise<LoginResponse> {
    try {
      const user = await this.validateUser(loginCustomerDto.email, loginCustomerDto.password);
      
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.role !== UserRole.CUSTOMER) {
        throw new UnauthorizedException('Access denied. Customer account required');
      }

      const tokens = await this.generateTokens(user);
      
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
      });

      const userWithCustomer = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['customer'],
      });

      if (!userWithCustomer) {
        throw new BadRequestException('User details not found');
      }

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: userWithCustomer.firstName,
          lastName: userWithCustomer.lastName,
          role: user.role,
          roles: [user.role],
          customer: userWithCustomer.customer ? {
            id: userWithCustomer.customer.id,
            firstName: userWithCustomer.customer.firstName,
            lastName: userWithCustomer.customer.lastName,
          } : undefined,
        },
      };
    } catch (error) {
      this.logger.error(`Customer login error: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async loginAdmin(loginAdminDto: LoginAdminDto): Promise<LoginResponse> {
    try {
      const user = await this.validateUser(loginAdminDto.email, loginAdminDto.password);
      
      if (!user) {
        throw new UnauthorizedException('Invalid admin credentials');
      }

      if (user.role !== UserRole.ADMIN) {
        throw new UnauthorizedException('Access denied. Admin privileges required');
      }

      const tokens = await this.generateTokens(user);
      
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
      });

      const userWithDetails = await this.userRepository.findOne({
        where: { id: user.id },
      });

      if (!userWithDetails) {
        throw new BadRequestException('User details not found');
      }

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: userWithDetails.firstName,
          lastName: userWithDetails.lastName,
          role: user.role,
          roles: [user.role],
        },
      };
    } catch (error) {
      this.logger.error(`Admin login error: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async loginSeller(loginSellerDto: LoginSellerDto): Promise<LoginResponse> {
    try {
      const user = await this.validateUser(loginSellerDto.email, loginSellerDto.password);
      
      if (!user) {
        throw new UnauthorizedException('Invalid seller credentials');
      }

      if (user.role !== UserRole.SELLER) {
        throw new UnauthorizedException('Access denied. Seller privileges required');
      }

      const tokens = await this.generateTokens(user);
      
      await this.userRepository.update(user.id, {
        lastLoginAt: new Date(),
      });

      const userWithDetails = await this.userRepository.findOne({
        where: { id: user.id },
      });

      if (!userWithDetails) {
        throw new BadRequestException('User details not found');
      }

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: userWithDetails.firstName,
          lastName: userWithDetails.lastName,
          role: user.role,
          roles: [user.role],
        },
      };
    } catch (error) {
      this.logger.error(`Seller login error: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    try {
      const decoded = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        roles: [user.role],
      };

      return {
        accessToken: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, adminId: string, file?: Express.Multer.File): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verificar si el email ya existe
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }


    const isSelfUpdate = id === adminId;
    const updateFields: Partial<User> = {};
    if (typeof updateUserDto.email === 'string') updateFields.email = updateUserDto.email;
    if (!isSelfUpdate && typeof updateUserDto.role === 'string') updateFields.role = updateUserDto.role;
    if (typeof updateUserDto.isActive === 'boolean') updateFields.isActive = updateUserDto.isActive;
    if (typeof updateUserDto.firstName === 'string') updateFields.firstName = updateUserDto.firstName;
    if (typeof updateUserDto.lastName === 'string') updateFields.lastName = updateUserDto.lastName;
    updateFields.updatedAt = new Date();

    // Si se proporciona un archivo, subirlo y actualizar la imagen de perfil
    if (file) {
      const imageUrl = await this.cloudinaryService.uploadImage(file.buffer, 'users');
      updateFields.profileImageUrl = imageUrl;
    }

    await this.userRepository.update(id, updateFields);

    // Obtener y retornar el usuario actualizado
    const updatedUser = await this.userRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!updatedUser) {
      throw new BadRequestException('Error updating user');
    }

    return updatedUser;
  }

  async removeUser(id: string, adminId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // No permitir que un admin se elimine a sí mismo
    if (id === adminId) {
      throw new ForbiddenException('Cannot delete your own admin account');
    }

    // Si el usuario tiene un customer relacionado, eliminar sus cart_items primero
    if (user.customer) {
      await this.cartService.clearCart(user.customer.id);
      // Cancelar todas las ventas donde sea customer
      const customerSales = await this.salesService.findAll({ customerId: user.customer.id });
      for (const sale of customerSales) {
        await this.salesService.remove(sale.id);
      }
    }

    // Cancelar todas las ventas donde sea seller
    const sellerSales = await this.salesService.findAll({ sellerId: user.id });
    for (const sale of sellerSales) {
      await this.salesService.remove(sale.id);
    }

    await this.userRepository.remove(user);
  }
}
