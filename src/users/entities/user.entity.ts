import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ListingEntity } from '../../listings/entities';
import { DEFAULT_USER_ROLE, USER_ROLES } from '../constants';
import { UserRole } from '../types';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ nullable: true, type: 'text' })
  phone: string | null;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @Column({
    enum: [...USER_ROLES],
    enumName: 'user_role',
    default: DEFAULT_USER_ROLE,
    type: 'enum',
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => ListingEntity, (listing) => listing.user)
  listings: ListingEntity[];
}
