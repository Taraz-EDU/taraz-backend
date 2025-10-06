import { IntersectionType } from '@nestjs/swagger';

import { CreateUserDto } from './create-user.dto';
import { LoginDto } from './login.dto';

export class RegisterDto extends IntersectionType(CreateUserDto, LoginDto) {}
