import React, { useState, useEffect } from 'react';
import { suppliersService } from '../../services/suppliers/suppliers.service.js';
import { productsService } from '../../services/products/products.service.js';
import { purchaseOrdersService } from '../../services/purchase-orders/purchase-orders.service.js';
import type { Supplier } from '../../services/suppliers/suppliers.types.js';
import type { Product } from '../../services/products/products.types.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

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
        calculateDefaultDate(supList[0].leadTimeDays);
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
      setError('Error al cargar proveedores o catálogo.');
    }
  };

  const calculateDefaultDate = (leadDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + (leadDays || 3));
    setExpectedDate(d.toISOString().split('T')[0]);
  };

  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
    const sup = suppliers.find((s) => s.id === supId);
    if (sup) {
      calculateDefaultDate(sup.leadTimeDays);
    }
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: products.length > 0 ? products[0].id : '',
        quantityOrdered: '',
      },
    ]);
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
      setError('Debe seleccionar un proveedor fabricante.');
      return;
    }

    const validItems = items.filter(
      (item) => item.productId && Number(item.quantityOrdered) > 0,
    );

    if (validItems.length === 0) {
      setError('Debe incluir al menos un producto con cantidad a pedir mayor a 0.');
      return;
    }

    setLoading(true);

    try {
      await purchaseOrdersService.createOrder({
        supplierId: selectedSupplierId,
        poNumber: poNumber.trim() || undefined,
        expectedDate: expectedDate || undefined,
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
        setError('Error al emitir la orden de compra a proveedor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Orden de Compra a Fabricante"
      subtitle="Genera mercancía en tránsito para abastecimiento sin alterar existencias físicas."
      maxWidth={780}
    >
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 16 }}>
          <div>
            <label className="form-label" htmlFor="po-supplier">
              Proveedor Fabricante *
            </label>
            <select
              id="po-supplier"
              className="in"
              value={selectedSupplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              required
              disabled={loading}
              style={{ cursor: 'pointer' }}
            >
              <option value="" disabled>
                Seleccione un proveedor...
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} • Plazo: {s.leadTimeDays}d
                </option>
              ))}
            </select>
            {selectedSupplier && (
              <small className="help-text">
                Contacto: {selectedSupplier.contactName || 'N/A'} • Tel: {selectedSupplier.phone || 'N/A'}
              </small>
            )}
          </div>

          <div>
            <label className="form-label" htmlFor="po-number">N° Orden (Opcional)</label>
            <input
              id="po-number"
              className="in"
              type="text"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="Autogenerado ej. COM-003"
              disabled={loading}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="po-expected-date">Fecha Entrega Estimada</label>
            <input
              id="po-expected-date"
              className="in"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              disabled={loading}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>

        <div style={{ background: 'var(--bg-app)', padding: 18, borderRadius: 20, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
              Líneas de Suministros a Pedir
            </h4>
            <button
              type="button"
              className="btn btn2 sm"
              onClick={handleAddItem}
              disabled={loading}
            >
              + Agregar Línea
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 130px 36px',
                  gap: 12,
                  alignItems: 'center',
                  background: '#ffffff',
                  padding: '12px 14px',
                  borderRadius: 16,
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Producto</label>
                  <select
                    className="in"
                    style={{ padding: '8px 12px', minHeight: 38, fontSize: 13, cursor: 'pointer' }}
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

                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Cantidad</label>
                  <input
                    className="in"
                    style={{ padding: '8px 12px', minHeight: 38, fontSize: 13 }}
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

                <div style={{ paddingTop: 18 }}>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={loading}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 20,
                        lineHeight: 1,
                      }}
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

        <div
          style={{
            padding: '12px 16px',
            borderRadius: 14,
            backgroundColor: 'var(--status-info-bg)',
            color: 'var(--status-info-text)',
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <strong>Regla de Abastecimiento:</strong> Esta orden se registrará como <em>Mercancía en Tránsito</em>. El inventario físico en estanterías no se alterará hasta la recepción en muelle.
        </div>

        <div>
          <label className="form-label" htmlFor="po-notes">Notas u Observaciones para el Proveedor</label>
          <textarea
            id="po-notes"
            className="in"
            style={{ minHeight: 65, resize: 'vertical' }}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Condiciones de pago, transporte, especificaciones de embalaje..."
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            Confirmar Orden de Compra
          </Button>
        </div>
      </form>
    </Modal>
  );
};
