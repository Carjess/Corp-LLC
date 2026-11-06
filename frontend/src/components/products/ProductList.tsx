import React, { useState, useEffect, useCallback } from 'react';
import { productsService } from '../../services/products/products.service.js';
import { categoriesService } from '../../services/categories/categories.service.js';
import type { Product } from '../../services/products/products.types.js';
import type { Category } from '../../services/categories/categories.types.js';
import { ProductModal } from './ProductModal.js';
import { Pill } from '../ui/Pill.js';

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchCategories = async () => {
    try {
      const cats = await categoriesService.getCategories();
      setCategories(cats);
    } catch (err: unknown) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsService.getProducts({
        search: searchTerm.trim() || undefined,
        categoryId: selectedCategory || undefined,
      });
      setProducts(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al consultar el catálogo de productos');
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(handler);
  }, [fetchProducts]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await productsService.toggleProductStatus(product.id);
      fetchProducts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  return (
    <div className="product-module-container">
      <div className="module-header">
        <div>
          <h2>Catálogo Maestro de Productos</h2>
          <p className="section-description">
            Base unificada de suministros para restaurantes. Estandarización oficial de SKUs, unidades y umbrales de seguridad.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-with-icon"
          onClick={handleOpenCreateModal}
        >
          <span>+</span> Registrar Nuevo Producto
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por SKU (ej. VAS-001) o nombre del producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas las Categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Descripción del Producto</th>
              <th>Categoría</th>
              <th>Unidad Base</th>
              <th>Factor Conv.</th>
              <th>Stock Mínimo</th>
              <th>Stock Seguridad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-4">
                  Cargando catálogo oficial...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4 text-muted">
                  No se encontraron productos con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className={!p.isActive ? 'row-inactive' : ''}>
                  <td>
                    <span className="sku-badge">{p.sku}</span>
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.description && (
                      <span className="product-subtext">{p.description}</span>
                    )}
                  </td>
                  <td>
                    <span className="category-tag">
                      {p.category?.name || 'General'}
                    </span>
                  </td>
                  <td>{p.unitMeasure}</td>
                  <td>x {p.conversionFactor}</td>
                  <td>
                    <span className="stock-threshold min-threshold">{p.minStock}</span>
                  </td>
                  <td>
                    <span className="stock-threshold sec-threshold">{p.securityStock}</span>
                  </td>
                  <td>
                    <Pill variant={p.isActive ? 'success' : 'danger'}>
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </Pill>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn2 sm"
                        title="Editar parámetros"
                        onClick={() => handleOpenEditModal(p)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={`btn sm ${p.isActive ? 'btn-danger' : 'btn2'}`}
                        title={p.isActive ? 'Desactivar SKU' : 'Activar SKU'}
                        onClick={() => handleToggleStatus(p)}
                      >
                        {p.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProducts}
        productToEdit={editingProduct}
      />
    </div>
  );
};

