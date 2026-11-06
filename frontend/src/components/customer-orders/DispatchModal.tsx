import React, { useState, useEffect } from 'react';
import { customerOrdersService } from '../../services/customer-orders/customer-orders.service.js';
import type { CustomerOrder } from '../../services/customer-orders/customer-orders.types.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Pill } from '../ui/Pill.js';

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
        toDispatch: item.quantityReserved,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Despacho de Pedido — ${order.orderNumber}`}
      subtitle={`Cliente: ${order.customer?.name} • Genera salida física inmutable en el Kardex.`}
      maxWidth={760}
    >
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-app)',
            padding: '12px 18px',
            borderRadius: 16,
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="text-muted" style={{ fontSize: 13 }}>Estado Actual:</span>
            <Pill variant={order.status === 'COMPLETED' ? 'success' : 'warning'}>
              {order.status}
            </Pill>
          </div>
          <button
            type="button"
            className="btn btn2 sm"
            onClick={handleDispatchAll}
            disabled={loading}
          >
            Despachar Todo el Saldo Reservado
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th style={{ textAlign: 'center' }}>Solicitado</th>
                <th style={{ textAlign: 'center' }}>Ya Despachado</th>
                <th style={{ textAlign: 'center' }}>Reservado</th>
                <th style={{ textAlign: 'right' }}>A Despachar</th>
              </tr>
            </thead>
            <tbody>
              {dispatchRows.map((row) => (
                <tr key={row.itemId}>
                  <td>
                    <span className="sku-badge">{row.sku}</span>
                  </td>
                  <td><strong>{row.productName}</strong></td>
                  <td style={{ textAlign: 'center' }}>{row.demanded}</td>
                  <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 600 }}>
                    {row.alreadyDispatched}
                  </td>
                  <td style={{ textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>
                    {row.reserved}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <input
                      className="in"
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
                      style={{ width: '100px', textAlign: 'right', padding: '6px 10px', minHeight: 38 }}
                      disabled={loading || row.reserved === 0}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <label className="form-label" htmlFor="dispatch-notes">Observaciones del Despacho</label>
          <textarea
            id="dispatch-notes"
            className="in"
            style={{ minHeight: 65, resize: 'vertical' }}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Guía de transporte, chofer, placa del camión o nota de entrega..."
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
            disabled={loading || totalToDispatch <= 0}
          >
            {loading ? 'Generando Salida...' : `Confirmar Despacho (${totalToDispatch} uds)`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
