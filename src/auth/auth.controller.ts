import { ChangePasswordDto } from './dto/change-password.dto';
import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  Request,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from './dto/auth.dto';
import { RegisterCustomerDto, RegisterAdminDto, RegisterSellerDto, LoginCustomerDto, LoginAdminDto, LoginSellerDto, RefreshTokenDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { RequestWithUser } from '../common/interfaces/auth.interfaces';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar mi contraseña (solo usuario autenticado)' })
  @ApiResponse({ status: 200, description: 'Contraseña cambiada correctamente' })
  async changePassword(
    @Request() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(req.user.id, changePasswordDto);
    return { message: 'Contraseña cambiada correctamente' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar mi perfil (cualquier usuario autenticado)' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado correctamente' })
  async updateOwnProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: RequestWithUser,
  ) {
    const updatedUser = await this.authService.updateUser(req.user.id, updateUserDto, req.user.id);
    return {
      message: 'Perfil actualizado correctamente',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      }
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user (general)' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('register/customer')
  @ApiOperation({ summary: 'Register a new customer with profile' })
  @ApiResponse({ status: 201, description: 'Customer registered successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async registerCustomer(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerCustomerDto: RegisterCustomerDto
  ) {
    return this.authService.registerCustomer(registerCustomerDto, file);
  }

  @Post('register/admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new admin (admin only)' })
  @ApiResponse({ status: 201, description: 'Admin registered successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async registerAdmin(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerAdminDto: RegisterAdminDto,
    @Request() req: RequestWithUser,
  ) {
    // Permitir creación del primer admin sin autenticación
    return this.authService.registerAdmin(registerAdminDto, null, file);
  }

  @Post('register/seller')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new seller (admin only)' })
  @ApiResponse({ status: 201, description: 'Seller registered successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async registerSeller(
    @UploadedFile() file: Express.Multer.File,
    @Body() registerSellerDto: RegisterSellerDto,
    @Request() req: RequestWithUser,
  ) {
    return this.authService.registerSeller(registerSellerDto, req.user.id, file);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login for all user types' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('login/customer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login específico para clientes' })
  @ApiResponse({ status: 200, description: 'Customer login successful' })
  async loginCustomer(@Body() loginCustomerDto: LoginCustomerDto) {
    return this.authService.loginCustomer(loginCustomerDto);
  }

  @Post('login/admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login específico para administradores' })
  @ApiResponse({ status: 200, description: 'Admin login successful' })
  async loginAdmin(@Body() loginAdminDto: LoginAdminDto) {
    return this.authService.loginAdmin(loginAdminDto);
  }

  @Post('login/seller')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login específico para vendedores' })
  @ApiResponse({ status: 200, description: 'Seller login successful' })
  async loginSeller(@Body() loginSellerDto: LoginSellerDto) {
    return this.authService.loginSeller(loginSellerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req: RequestWithUser) {
    const user = await this.authService.getUserById(req.user.id);
    return {
      id: user?.id,
      email: user?.email,
      firstName: user?.firstName,
      lastName: user?.lastName,
      role: user?.role,
      roles: user?.role ? [user.role] : [],
      isActive: user?.isActive,
      customer: user?.customer ? {
        id: user.customer.id,
        firstName: user.customer.firstName,
        lastName: user.customer.lastName,
        fullName: user.customer.fullName,
      } : null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout() {
    // JWT tokens are stateless, so logout is handled client-side
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ 
    status: 200, 
    description: 'New tokens generated successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar usuario (solo admin)' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado correctamente' })
  @ApiResponse({ status: 400, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  @ApiResponse({ status: 409, description: 'Correo electrónico ya está en uso' })
  @UseInterceptors(FileInterceptor('file'))
  async updateUser(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: RequestWithUser,
  ) {
    const updatedUser = await this.authService.updateUser(id, updateUserDto, req.user.id, file);
    return {
      message: 'Usuario actualizado correctamente',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      }
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar usuario (solo admin)' })
  @ApiResponse({ status: 204, description: 'Usuario eliminado correctamente' })
  @ApiResponse({ status: 400, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 403, description: 'Acceso prohibido' })
  async removeUser(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    await this.authService.removeUser(id, req.user.id);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los usuarios (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Get('admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los admins (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista de admins' })
  async getAdmins() {
    return this.authService.getUsersByRole(UserRole.ADMIN);
  }

  @Get('sellers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los sellers (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista de sellers' })
  async getSellers() {
    return this.authService.getUsersByRole(UserRole.SELLER);
  }

  @Get('customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los customers (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista de customers' })
  async getCustomers() {
    return this.authService.getUsersByRole(UserRole.CUSTOMER);
  }
}
