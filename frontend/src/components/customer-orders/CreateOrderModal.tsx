import React, { useState, useEffect } from 'react';
import { customersService } from '../../services/customers/customers.service.js';
import { inventoryService } from '../../services/inventory/inventory.service.js';
import { customerOrdersService } from '../../services/customer-orders/customer-orders.service.js';
import type { Customer } from '../../services/customers/customers.types.js';
import type { ProductStockSummary } from '../../services/inventory/inventory.types.js';

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
      // Primer producto con stock disponible como sugerencia inicial
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
      setError('Debe seleccionar un cliente distribuidor.');
      return;
    }

    // Validar ítems
    const validItems = items.filter(
      (item) => item.productId && Number(item.quantityDemanded) > 0,
    );

    if (validItems.length === 0) {
      setError('Debe incluir al menos un producto con cantidad válida.');
      return;
    }

    // Validar que no haya sobreventa
    for (const item of validItems) {
      const stock = getProductStock(item.productId);
      if (stock && Number(item.quantityDemanded) > stock.availableStock) {
        setError(
          `Stock disponible insuficiente para [${stock.sku}] ${stock.name}. Solicitado: ${item.quantityDemanded}, Disponible: ${stock.availableStock}.`,
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
        setError('Error al registrar el pedido de cliente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card modal-large">
        <div className="modal-header">
          <div>
            <h3>Registrar Pedido de Cliente</h3>
            <p className="modal-subtitle">
              Reserva inmediata de inventario. No es posible prometer mercancía si el stock disponible es insuficiente.
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
              <label htmlFor="order-customer">
                Cliente Distribuidor <span className="required">*</span>
              </label>
              <select
                id="order-customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                disabled={loading}
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

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="order-number">N° de Orden (Opcional)</label>
              <input
                id="order-number"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Autogenerado ej. PED-003"
                disabled={loading}
              />
            </div>
          </div>

          <div className="order-items-section">
            <div className="section-title-bar">
              <h4>Líneas de Productos y Disponibilidad en Almacén</h4>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItem}
                disabled={loading}
              >
                + Agregar Producto
              </button>
            </div>

            <div className="order-items-list">
              {items.map((item, idx) => {
                const stock = getProductStock(item.productId);
                const isOverStock =
                  stock &&
                  item.quantityDemanded !== '' &&
                  Number(item.quantityDemanded) > stock.availableStock;

                return (
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
                        {stockItems.map((p) => (
                          <option key={p.productId} value={p.productId}>
                            [{p.sku}] {p.name} — Disp: {p.availableStock} {p.unitMeasure}s
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group flex-1">
                      <label className="text-xs">Disponible</label>
                      <div className="stock-info-box">
                        <span
                          className={`badge ${stock && stock.availableStock > 0 ? 'badge-success' : 'badge-danger'}`}
                        >
                          {stock ? `${stock.availableStock} ${stock.unitMeasure}s` : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="form-group flex-1">
                      <label className="text-xs">Cantidad Requerida</label>
                      <input
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
                        className={isOverStock ? 'input-error' : ''}
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
                );
              })}
            </div>

            {hasInsufficientStock && (
              <div className="alert-warning-box">
                <strong>Advertencia:</strong> Una o más líneas solicitan una cantidad superior al Stock Disponible. Ajuste las cantidades antes de confirmar.
              </div>
            )}
          </div>

          <div className="form-group mt-3">
            <label htmlFor="order-notes">Notas u Observaciones</label>
            <textarea
              id="order-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles de entrega, horario o condiciones comerciales..."
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
              disabled={loading || hasInsufficientStock}
            >
              {loading ? 'Creando y Reservando...' : 'Confirmar Pedido y Reservar Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

