import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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

  //login user

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // password validation and varification
    const passwordValid = await argon2.verify(user.password, loginDto.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    // generate accessstoken

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ) as JwtSignOptions['expiresIn'],
    });

    //hash the refresh token
    const refreshTokenHash = await argon2.hash(refreshToken);

    //updating generated refresh token hash in db for persistance
    await this.usersService.updateRefreshTokenHash(
      user._id.toString(),
      refreshTokenHash,
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
