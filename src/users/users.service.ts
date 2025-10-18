import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '../auth/entities/user.entity';
import { ROLES } from '../config/roles.config';

@Injectable()
export class UsersService implements OnModuleInit {
  // Simulación de una base de datos en memoria
  private readonly users: User[] = [];

  async onModuleInit() {
    await this.createInitialSuperAdmin();
  }

  private async createInitialSuperAdmin() {
    const existingSuperAdmin = this.users.find(
      (user) => user.role === ROLES.SUPER_ADMIN,
    );
    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash('superadminpassword', 10);
      const superAdmin: User = {
        id: Date.now(),
        username: 'superadmin@vorak.com',
        password: hashedPassword,
        role: ROLES.SUPER_ADMIN,
      };
      this.users.push(superAdmin);
      console.log('Super Admin inicial creado:', {
        username: superAdmin.username,
        role: superAdmin.role,
      });
    }
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const newUser = {
      id: Date.now(),
      ...user,
    };
    this.users.push(newUser);
    const { password, ...result } = newUser;
    return result as User;
  }

  async findOneByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }
}