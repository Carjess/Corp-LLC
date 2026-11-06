import React, { useState, useEffect } from 'react';
import { customersService } from '../../services/customers/customers.service.js';
import { inventoryService } from '../../services/inventory/inventory.service.js';
import { customerOrdersService } from '../../services/customer-orders/customer-orders.service.js';
import type { Customer } from '../../services/customers/customers.types.js';
import type { ProductStockSummary } from '../../services/inventory/inventory.types.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Pill } from '../ui/Pill.js';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderRowItem {
  productId: string;
  quantityDemanded: number | '';
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stockItems, setStockItems] = useState<ProductStockSummary[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<OrderRowItem[]>([
    { productId: '', quantityDemanded: '' },
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
      const [custList, stockList] = await Promise.all([
        customersService.getCustomers(),
        inventoryService.getStockSummary(),
      ]);
      setCustomers(custList);
      setStockItems(stockList);

      if (custList.length > 0) {
        setSelectedCustomerId(custList[0].id);
      }
      setOrderNumber('');
      setNotes('');
      const firstAvailable = stockList.find((p) => p.availableStock > 0);
      setItems([
        {
          productId: firstAvailable ? firstAvailable.productId : '',
          quantityDemanded: '',
        },
      ]);
      setError(null);
    } catch (err: unknown) {
      console.error('Error al cargar datos iniciales del pedido:', err);
      setError('Error al cargar clientes y productos.');
    }
  };

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantityDemanded: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderRowItem,
    value: string | number,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const getProductStock = (productId: string): ProductStockSummary | undefined => {
    return stockItems.find((s) => s.productId === productId);
  };

  const hasInsufficientStock = items.some((item) => {
    if (!item.productId || !item.quantityDemanded) return false;
    const stock = getProductStock(item.productId);
    if (!stock) return false;
    return Number(item.quantityDemanded) > stock.availableStock;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Debe seleccionar un cliente.');
      return;
    }

    const validItems = items.filter(
      (item) => item.productId && Number(item.quantityDemanded) > 0,
    );

    if (validItems.length === 0) {
      setError('Debe incluir al menos un producto con cantidad válida.');
      return;
    }

    for (const item of validItems) {
      const stock = getProductStock(item.productId);
      if (!stock) {
        setError(`Producto con ID ${item.productId} no encontrado en almacén.`);
        return;
      }
      if (Number(item.quantityDemanded) > stock.availableStock) {
        setError(
          `Stock insuficiente para "${stock.name}". Disponible: ${stock.availableStock}, Solicitado: ${item.quantityDemanded}. Bloqueo preventivo de sobreventa activado.`,
        );
        return;
      }
    }

    setLoading(true);

    try {
      await customerOrdersService.createOrder({
        customerId: selectedCustomerId,
        orderNumber: orderNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        items: validItems.map((item) => ({
          productId: item.productId,
          quantityDemanded: Math.floor(Number(item.quantityDemanded)),
        })),
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al crear el pedido de cliente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Pedido de Distribuidor"
      subtitle="Bloqueo automático de sobreventa y reserva inmediata de stock en almacén."
      maxWidth={780}
    >
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 16 }}>
          <div>
            <label className="form-label" htmlFor="order-customer">
              Cliente Distribuidor *
            </label>
            <select
              id="order-customer"
              className="in"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
              disabled={loading}
              style={{ cursor: 'pointer' }}
            >
              <option value="" disabled>
                Seleccione un distribuidor...
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.contactName ? `(${c.contactName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" htmlFor="order-number">N° de Orden (Opcional)</label>
            <input
              id="order-number"
              className="in"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Autogenerado ej. PED-003"
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ background: 'var(--bg-app)', padding: 18, borderRadius: 20, border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
              Líneas de Productos y Disponibilidad en Almacén
            </h4>
            <button
              type="button"
              className="btn btn2 sm"
              onClick={handleAddItem}
              disabled={loading}
            >
              + Agregar Producto
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item, idx) => {
              const stock = getProductStock(item.productId);
              const isOverStock =
                stock &&
                item.quantityDemanded !== '' &&
                Number(item.quantityDemanded) > stock.availableStock;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 110px 140px 36px',
                    gap: 12,
                    alignItems: 'center',
                    background: '#ffffff',
                    padding: '12px 14px',
                    borderRadius: 16,
                    border: isOverStock ? '1px solid #f87171' : '1px solid var(--border-color)',
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
                        Seleccione producto...
                      </option>
                      {stockItems.map((p) => (
                        <option key={p.productId} value={p.productId}>
                          [{p.sku}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Disponible</label>
                    <div style={{ minHeight: 38, display: 'flex', alignItems: 'center' }}>
                      <Pill variant={stock && stock.availableStock > 0 ? 'success' : 'danger'}>
                        {stock ? `${stock.availableStock}` : '—'}
                      </Pill>
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Cantidad</label>
                    <input
                      className="in"
                      style={{ padding: '8px 12px', minHeight: 38, fontSize: 13 }}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantityDemanded}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          'quantityDemanded',
                          e.target.value === '' ? '' : Number(e.target.value),
                        )
                      }
                      placeholder="Ej. 50"
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
              );
            })}
          </div>

          {hasInsufficientStock && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                borderRadius: 12,
                backgroundColor: 'var(--status-warning-bg)',
                color: 'var(--status-warning-text)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <strong>Advertencia:</strong> Una o más líneas solicitan una cantidad superior al Stock Disponible. Ajuste las cantidades antes de confirmar.
            </div>
          )}
        </div>

        <div>
          <label className="form-label" htmlFor="order-notes">Notas u Observaciones</label>
          <textarea
            id="order-notes"
            className="in"
            style={{ minHeight: 65, resize: 'vertical' }}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalles de entrega, horario o condiciones comerciales..."
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={loading}
            disabled={loading || hasInsufficientStock}
          >
            Confirmar Pedido y Reservar Stock
          </Button>
        </div>
      </form>
    </Modal>
  );
};
