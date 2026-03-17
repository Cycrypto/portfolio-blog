import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: '', unique: true })
  slug: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'text', default: '' })
  longDescription: string;

  @Column({ default: '' })
  category: string;

  @Column({ default: 'planned' })
  status: string;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ type: 'int', default: 0 })
  featuredOrder: number;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column('text', { array: true, default: '{}' })
  techStack: string[];

  @Column('text', { array: true, default: '{}' })
  features: string[];

  @Column({ type: 'text', default: '' })
  role: string;

  @Column({ type: 'text', default: '' })
  problem: string;

  @Column({ type: 'text', default: '' })
  approach: string;

  @Column({ type: 'text', default: '' })
  outcomes: string;

  @Column('text', { array: true, default: '{}' })
  impactMetrics: string[];

  @Column({ default: '' })
  startDate: string;

  @Column({ default: '' })
  endDate: string;

  @Column({ default: '' })
  githubUrl: string;

  @Column({ default: '' })
  liveUrl: string;

  @Column('text', { array: true, default: '{}' })
  images: string[];
}
