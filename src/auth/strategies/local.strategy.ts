import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { ValidatedUser } from '../../common/interfaces/auth.interfaces';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<ValidatedUser> {
    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    return user;
  }
}
