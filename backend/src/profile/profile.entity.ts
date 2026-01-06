import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  title: string;

  @Column({ type: 'text', default: '' })
  subtitle: string;

  @Column({ default: '' })
  email: string;

  @Column({ default: '' })
  location: string;

  @Column({ default: '' })
  status: string;

  @Column({ type: 'text', default: '' })
  statusMessage: string;

  @Column({ default: '' })
  github: string;

  @Column({ default: '' })
  linkedin: string;

  @Column({ type: 'text', default: '' })
  about: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column('jsonb', { default: [] })
  skills: Array<{ name: string; level: number }>;

  @Column({ default: '' })
  profileImage: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: true })
  showStatus: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
