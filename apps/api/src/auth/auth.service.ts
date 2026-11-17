import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { isUniqueViolation } from '../common/utils/prisma-errors';
import { toPublicUser } from '../users/users.service';
import { DemoService } from '../demo/demo.service';
import { DEFAULT_CATEGORIES, DEFAULT_WALLET_NAME } from './defaults';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// OWASP-recommended Argon2id parameters (19 MiB memory, 2 iterations).
const ARGON2_OPTIONS = { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 };

@Injectable()
export class AuthService {
  // Hash verified when the email does not exist, so a login attempt takes
  // roughly the same time whether or not the account exists.
  private readonly dummyHash = argon2.hash('spendly-timing-equalizer', ARGON2_OPTIONS);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly demo: DemoService,
  ) {}

  /**
   * Creates the user, their default wallet, and default categories in ONE
   * database transaction: either all of it exists afterwards, or none of it.
   */
  async register(dto: RegisterDto) {
    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: { name: dto.name, email: dto.email, passwordHash },
        });
        await tx.wallet.create({ data: { userId: created.id, name: DEFAULT_WALLET_NAME } });
        await tx.category.createMany({
          data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: created.id })),
        });
        return created;
      });
      return { user: toPublicUser(user), token: await this.sign(user.id) };
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('An account with this email already exists');
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const valid = user
      ? await argon2.verify(user.passwordHash, dto.password)
      : (await argon2.verify(await this.dummyHash, dto.password), false);
    if (!user || !valid) throw new UnauthorizedException('Invalid email or password');
    return { user: toPublicUser(user), token: await this.sign(user.id) };
  }

  /** Creates a private, pre-filled demo account and signs the visitor into it. */
  async startDemo() {
    const user = await this.demo.createDemoUser();
    return { user: toPublicUser(user), token: await this.sign(user.id) };
  }

  private sign(userId: string) {
    return this.jwt.signAsync({ sub: userId });
  }
}
