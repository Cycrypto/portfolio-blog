import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('resume_settings')
export class ResumeSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  title: string;

  @Column({ type: 'text', default: '' })
  headline: string;

  @Column({ default: '' })
  email: string;

  @Column({ default: '' })
  location: string;

  @Column({ default: '' })
  github: string;

  @Column({ default: '' })
  linkedin: string;

  @Column({ default: '' })
  photoUrl: string;

  @Column({ default: true })
  showPhoto: boolean;

  @Column('int', { array: true, default: '{}' })
  selectedProjectIds: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
