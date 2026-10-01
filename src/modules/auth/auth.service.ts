import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException(
        `User with email : ${registerDto.email} already registered.`,
      );
    }

    const passwordHash = await argon2.hash(registerDto.password);

    const user = await this.usersService.create({
      ...registerDto,
      password: passwordHash,
    });

    return user;
  }
}
