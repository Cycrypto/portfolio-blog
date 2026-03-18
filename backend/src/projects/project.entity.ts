import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from '../posts/entity/post.entity';
import { Experience } from '../experience/experience.entity';

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

  @Column({ type: 'text', default: '' })
  resumeTitle: string;

  @Column({ type: 'text', default: '' })
  resumeSummary: string;

  @Column('text', { array: true, default: '{}' })
  resumeHighlights: string[];

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

  @Column({ type: 'integer', nullable: true })
  experienceId: number | null;

  @ManyToOne(() => Experience, (experience) => experience.projects, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'experienceId' })
  experience?: Experience | null;

  @OneToMany(() => Post, (post) => post.project)
  posts?: Post[];
}
