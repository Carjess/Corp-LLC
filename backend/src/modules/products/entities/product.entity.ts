import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity.js';
import { Category } from '../../categories/entities/category.entity.js';

@Entity('products')
export class Product extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  sku!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @Column({ type: 'varchar', length: 50, default: 'UNIDAD' })
  unitMeasure!: string;

  @Column({ type: 'int', default: 1 })
  conversionFactor!: number;

  @Column({ type: 'int', default: 50 })
  minStock!: number;

  @Column({ type: 'int', default: 100 })
  securityStock!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
