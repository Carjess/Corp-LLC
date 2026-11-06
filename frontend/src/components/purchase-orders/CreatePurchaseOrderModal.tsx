import React, { useState, useEffect } from 'react';
import { suppliersService } from '../../services/suppliers/suppliers.service.js';
import { productsService } from '../../services/products/products.service.js';
import { purchaseOrdersService } from '../../services/purchase-orders/purchase-orders.service.js';
import type { Supplier } from '../../services/suppliers/suppliers.types.js';
import type { Product } from '../../services/products/products.types.js';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PurchaseRowItem {
  productId: string;
  quantityOrdered: number | '';
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<PurchaseRowItem[]>([
    { productId: '', quantityOrdered: '' },
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [supList, prodList] = await Promise.all([
        suppliersService.getSuppliers(),
        productsService.getProducts({ isActive: 'true' }),
      ]);
      setSuppliers(supList);
      setProducts(prodList);

      if (supList.length > 0) {
        setSelectedSupplierId(supList[0].id);
        calculateDefaultExpectedDate(supList[0].leadTimeDays);
      }
      setPoNumber('');
      setNotes('');
      setItems([
        {
          productId: prodList.length > 0 ? prodList[0].id : '',
          quantityOrdered: '',
        },
      ]);
      setError(null);
    } catch (err: unknown) {
      console.error('Error al cargar datos para orden de compra:', err);
      setError('Error al consultar proveedores o catálogo.');
    }
  };

  const calculateDefaultExpectedDate = (leadTimeDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + (leadTimeDays || 5));
    setExpectedDate(target.toISOString().slice(0, 10));
  };

  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
    const sup = suppliers.find((s) => s.id === supId);
    if (sup) {
      calculateDefaultExpectedDate(sup.leadTimeDays);
    }
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantityOrdered: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseRowItem,
    value: string | number,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSupplierId) {
      setError('Debe seleccionar un proveedor.');
      return;
    }

    const validItems = items.filter(
      (item) => item.productId && Number(item.quantityOrdered) > 0,
    );

    if (validItems.length === 0) {
      setError('Debe incluir al menos un producto con cantidad mayor a 0.');
      return;
    }

    setLoading(true);

    try {
      await purchaseOrdersService.createOrder({
        supplierId: selectedSupplierId,
        poNumber: poNumber.trim() || undefined,
        expectedDate: expectedDate ? new Date(expectedDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
        items: validItems.map((item) => ({
          productId: item.productId,
          quantityOrdered: Math.floor(Number(item.quantityOrdered)),
        })),
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al emitir la orden de compra.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  return (
    <div className="modal-backdrop">
      <div className="modal-card modal-large">
        <div className="modal-header">
          <div>
            <h3>Emitir Orden de Compra a Fabricante</h3>
            <p className="modal-subtitle">
              Genera una orden de abastecimiento. Las unidades quedan como mercancía en tránsito y no alteran el stock físico hasta su recepción.
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} disabled={loading}>
            &times;
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="po-supplier">
                Proveedor / Fabricante <span className="required">*</span>
              </label>
              <select
                id="po-supplier"
                value={selectedSupplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                required
                disabled={loading}
              >
                <option value="" disabled>
                  Seleccione un proveedor...
                </option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} &bull; Plazo: {s.leadTimeDays} días
                  </option>
                ))}
              </select>
              {selectedSupplier && (
                <span className="help-text">
                  Contacto: {selectedSupplier.contactName || 'No indicado'} &bull; Tel: {selectedSupplier.phone || 'N/A'}
                </span>
              )}
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="po-number">N° Orden (Opcional)</label>
              <input
                id="po-number"
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Autogenerado ej. COM-003"
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="po-expected-date">Fecha Estimada de Entrega</label>
              <input
                id="po-expected-date"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="order-items-section">
            <div className="section-title-bar">
              <h4>Líneas de Suministros a Pedir</h4>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItem}
                disabled={loading}
              >
                + Agregar Línea
              </button>
            </div>

            <div className="order-items-list">
              {items.map((item, idx) => (
                <div key={idx} className="order-item-row">
                  <div className="form-group flex-2">
                    <label className="text-xs">Producto (SKU & Nombre)</label>
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        handleItemChange(idx, 'productId', e.target.value)
                      }
                      required
                      disabled={loading}
                    >
                      <option value="" disabled>
                        Seleccione un producto...
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.sku}] {p.name} ({p.unitMeasure})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="text-xs">Cantidad a Comprar</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantityOrdered}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          'quantityOrdered',
                          e.target.value === '' ? '' : Number(e.target.value),
                        )
                      }
                      placeholder="Ej. 500"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="row-action-box">
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="btn-delete-row"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={loading}
                        title="Eliminar línea"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="info-banner-transit mt-3">
            <strong>Regla de Abastecimiento:</strong> Esta orden se registrará como <em>Mercancía en Tránsito</em>. El inventario físico en estanterías no se modificará hasta que las unidades sean contadas e inspeccionadas en el muelle de descarga.
          </div>

          <div className="form-group mt-3">
            <label htmlFor="po-notes">Notas u Observaciones para el Proveedor</label>
            <textarea
              id="po-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condiciones de pago, transporte, especificaciones de embalaje..."
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Emitiendo Orden...' : 'Confirmar Orden de Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

