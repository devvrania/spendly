import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { isDemoEmail } from '../demo/demo-data';

/** Never expose passwordHash: every user response goes through this. */
export function toPublicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, isDemo: isDemoEmail(user.email), createdAt: user.createdAt };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return toPublicUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({ where: { id: userId }, data: { name: dto.name } });
    return toPublicUser(user);
  }
}
