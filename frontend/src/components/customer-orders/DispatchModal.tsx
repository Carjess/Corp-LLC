import React, { useState, useEffect } from 'react';
import { customerOrdersService } from '../../services/customer-orders/customer-orders.service.js';
import type { CustomerOrder } from '../../services/customer-orders/customer-orders.types.js';

interface DispatchModalProps {
  isOpen: boolean;
  order: CustomerOrder | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface DispatchRow {
  itemId: string;
  sku: string;
  productName: string;
  demanded: number;
  alreadyDispatched: number;
  reserved: number;
  toDispatch: number | '';
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  order,
  onClose,
  onSuccess,
}) => {
  const [dispatchRows, setDispatchRows] = useState<DispatchRow[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      const rows: DispatchRow[] = order.items.map((item) => ({
        itemId: item.id,
        sku: item.product?.sku || 'N/A',
        productName: item.product?.name || 'Producto',
        demanded: item.quantityDemanded,
        alreadyDispatched: item.quantityDispatched,
        reserved: item.quantityReserved,
        toDispatch: item.quantityReserved, // Por defecto despacha el saldo reservado
      }));
      setDispatchRows(rows);
      setNotes('');
      setError(null);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handleQuantityChange = (itemId: string, value: number | '') => {
    setDispatchRows((prev) =>
      prev.map((row) => {
        if (row.itemId !== itemId) return row;
        if (value === '') return { ...row, toDispatch: '' };
        const num = Math.floor(Number(value));
        const clamped = Math.max(0, Math.min(num, row.reserved));
        return { ...row, toDispatch: clamped };
      }),
    );
  };

  const handleDispatchAll = () => {
    setDispatchRows((prev) =>
      prev.map((row) => ({
        ...row,
        toDispatch: row.reserved,
      })),
    );
  };

  const totalToDispatch = dispatchRows.reduce(
    (sum, r) => sum + (r.toDispatch === '' ? 0 : Number(r.toDispatch)),
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (totalToDispatch <= 0) {
      setError('Debe indicar al menos una unidad para despachar.');
      return;
    }

    setLoading(true);

    try {
      await customerOrdersService.dispatchOrder(order.id, {
        notes: notes.trim() || undefined,
        items: dispatchRows.map((r) => ({
          itemId: r.itemId,
          quantity: r.toDispatch === '' ? 0 : Number(r.toDispatch),
        })),
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al registrar el despacho.');
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
            <h3>Registrar Despacho de Pedido — {order.orderNumber}</h3>
            <p className="modal-subtitle">
              Cliente: <strong>{order.customer?.name}</strong> &bull; Salida automática de inventario físico en Kardex.
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} disabled={loading}>
            &times;
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="dispatch-summary-banner">
            <div>
              <span className="text-muted text-xs">Estado Actual:</span>{' '}
              <span className="badge badge-warning">{order.status}</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDispatchAll}
              disabled={loading}
            >
              Despachar Todo el Saldo Reservado
            </button>
          </div>

          <div className="table-wrapper mt-3">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center' }}>Solicitado</th>
                  <th style={{ textAlign: 'center' }}>Ya Despachado</th>
                  <th style={{ textAlign: 'center' }}>Reservado</th>
                  <th style={{ textAlign: 'right' }}>Cantidad a Despachar</th>
                </tr>
              </thead>
              <tbody>
                {dispatchRows.map((row) => (
                  <tr key={row.itemId}>
                    <td className="sku-cell">{row.sku}</td>
                    <td className="product-name-cell">{row.productName}</td>
                    <td style={{ textAlign: 'center' }}>{row.demanded}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="text-success">{row.alreadyDispatched}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <strong className="text-warning">{row.reserved}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        min="0"
                        max={row.reserved}
                        step="1"
                        value={row.toDispatch}
                        onChange={(e) =>
                          handleQuantityChange(
                            row.itemId,
                            e.target.value === '' ? '' : Number(e.target.value),
                          )
                        }
                        style={{ width: '100px', textAlign: 'right' }}
                        disabled={loading || row.reserved === 0}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-group mt-3">
            <label htmlFor="dispatch-notes">Observaciones del Despacho</label>
            <textarea
              id="dispatch-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Número de guía de transporte, chofer, placa del camión o nota de entrega..."
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
              disabled={loading || totalToDispatch <= 0}
            >
              {loading
                ? 'Generando Salida de Kardex...'
                : `Confirmar Despacho (${totalToDispatch} unidades)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

