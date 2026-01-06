import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'text', default: '' })
  longDescription: string;

  @Column({ default: '' })
  category: string;

  @Column({ default: 'planned' })
  status: string;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column('text', { array: true, default: '{}' })
  techStack: string[];

  @Column('text', { array: true, default: '{}' })
  features: string[];

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
