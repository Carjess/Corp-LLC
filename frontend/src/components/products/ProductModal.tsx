import React, { useState, useEffect } from 'react';
import { categoriesService } from '../../services/categories/categories.service.js';
import { productsService } from '../../services/products/products.service.js';
import type { Category } from '../../services/categories/categories.types.js';
import type { Product, CreateProductInput } from '../../services/products/products.types.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitMeasure, setUnitMeasure] = useState('Paquete');
  const [conversionFactor, setConversionFactor] = useState<number>(1);
  const [minStock, setMinStock] = useState<number>(50);
  const [securityStock, setSecurityStock] = useState<number>(100);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      categoriesService
        .getCategories()
        .then((cats) => {
          setCategories(cats);
          setLoadingCategories(false);
          if (!productToEdit && cats.length > 0 && !categoryId) {
            setCategoryId(cats[0].id);
          }
        })
        .catch((err: Error) => {
          setError(`Error al cargar categorías: ${err.message}`);
          setLoadingCategories(false);
        });

      if (productToEdit) {
        setSku(productToEdit.sku);
        setName(productToEdit.name);
        setDescription(productToEdit.description || '');
        setCategoryId(productToEdit.categoryId);
        setUnitMeasure(productToEdit.unitMeasure);
        setConversionFactor(productToEdit.conversionFactor);
        setMinStock(productToEdit.minStock);
        setSecurityStock(productToEdit.securityStock);
      } else {
        setSku('');
        setName('');
        setDescription('');
        setUnitMeasure('Paquete');
        setConversionFactor(1);
        setMinStock(50);
        setSecurityStock(100);
      }
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sku.trim()) {
      setError('El SKU es obligatorio.');
      return;
    }
    if (!name.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }
    if (!categoryId) {
      setError('Debe seleccionar una categoría.');
      return;
    }

    setSubmitting(true);

    try {
      if (productToEdit) {
        await productsService.updateProduct(productToEdit.id, {
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          categoryId,
          unitMeasure,
          conversionFactor: Number(conversionFactor),
          minStock: Number(minStock),
          securityStock: Number(securityStock),
        });
      } else {
        const payload: CreateProductInput = {
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          categoryId,
          unitMeasure,
          conversionFactor: Number(conversionFactor),
          minStock: Number(minStock),
          securityStock: Number(securityStock),
        };
        await productsService.createProduct(payload);
      }

      setSubmitting(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setSubmitting(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al guardar el producto.');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Editar Producto Comercial' : 'Registrar Nuevo Producto'}
      subtitle="Estandarización de SKU, categoría y umbrales de seguridad en almacén."
      maxWidth={620}
    >
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="form-label" htmlFor="sku">SKU Comercial *</label>
            <input
              id="sku"
              className="in"
              type="text"
              placeholder="Ej. VAS-003, ENV-002"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              required
              disabled={submitting}
            />
            <small className="help-text">Código estándar inalterable.</small>
          </div>

          <div>
            <label className="form-label" htmlFor="category">Categoría *</label>
            <select
              id="category"
              className="in"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={submitting || loadingCategories}
              style={{ cursor: 'pointer' }}
            >
              {loadingCategories && <option>Cargando categorías...</option>}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="name">Nombre del Producto *</label>
          <input
            id="name"
            className="in"
            type="text"
            placeholder="Ej. Vaso Plástico Transparente 16 oz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label className="form-label" htmlFor="description">Descripción / Presentación</label>
          <textarea
            id="description"
            className="in"
            style={{ minHeight: 70, resize: 'vertical' }}
            rows={2}
            placeholder="Detalles técnicos, capacidad, presentación..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="form-label" htmlFor="unitMeasure">Unidad de Medida *</label>
            <select
              id="unitMeasure"
              className="in"
              value={unitMeasure}
              onChange={(e) => setUnitMeasure(e.target.value)}
              required
              disabled={submitting}
              style={{ cursor: 'pointer' }}
            >
              <option value="Paquete">Paquete</option>
              <option value="Fardo">Fardo</option>
              <option value="Caja">Caja</option>
              <option value="Millar">Millar</option>
              <option value="Bulto">Bulto</option>
              <option value="Unidad">Unidad</option>
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="conversionFactor">Factor Conversión</label>
            <input
              id="conversionFactor"
              className="in"
              type="number"
              min="1"
              value={conversionFactor}
              onChange={(e) => setConversionFactor(Number(e.target.value))}
              disabled={submitting}
            />
            <small className="help-text">Unidades por presentación.</small>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="form-label" htmlFor="minStock">Stock Mínimo (Alerta) *</label>
            <input
              id="minStock"
              className="in"
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="securityStock">Stock de Seguridad *</label>
            <input
              id="securityStock"
              className="in"
              type="number"
              min="0"
              value={securityStock}
              onChange={(e) => setSecurityStock(Number(e.target.value))}
              required
              disabled={submitting}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <Button variant="secondary" onClick={onClose} disabled={submitting} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" isLoading={submitting}>
            {productToEdit ? 'Actualizar Producto' : 'Guardar Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
