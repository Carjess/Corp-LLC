import React, { useState, useEffect } from 'react';
import { purchaseOrdersService } from '../../services/purchase-orders/purchase-orders.service.js';
import { receiptsService } from '../../services/receipts/receipts.service.js';
import type { PurchaseOrder } from '../../services/purchase-orders/purchase-orders.types.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Pill } from '../ui/Pill.js';

interface CreateReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedPoId?: string;
}

interface ReceiptItemRow {
  productId: string;
  sku: string;
  productName: string;
  unitMeasure: string;
  ordered: number;
  alreadyReceived: number;
  pending: number;
  quantityAccepted: number | '';
  quantityRejected: number | '';
}

export const CreateReceiptModal: React.FC<CreateReceiptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedPoId,
}) => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [receiverName, setReceiverName] = useState<string>('juliam@admin.com');
  const [notes, setNotes] = useState<string>('');
  const [rows, setRows] = useState<ReceiptItemRow[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadOpenOrders();
    }
  }, [isOpen]);

  const loadOpenOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const allOrders = await purchaseOrdersService.getOrders();
      // Filtrar órdenes que tengan unidades pendientes de recibir
      const openOrders = allOrders.filter(
        (o) => o.status === 'PENDING' || o.status === 'PARTIAL',
      );
      setOrders(openOrders);

      const targetId =
        preselectedPoId && openOrders.some((o) => o.id === preselectedPoId)
          ? preselectedPoId
          : openOrders.length > 0
            ? openOrders[0].id
            : '';

      setSelectedPoId(targetId);
      if (targetId) {
        populateRowsForOrder(targetId, openOrders);
      } else {
        setRows([]);
      }
      setReceiptNumber('');
      setReceiverName('juliam@admin.com');
      setNotes('');
    } catch (err: unknown) {
      console.error('Error al cargar órdenes de compra abiertas:', err);
      setError('Error al consultar las órdenes de compra pendientes.');
    } finally {
      setLoading(false);
    }
  };

  const populateRowsForOrder = (poId: string, orderList: PurchaseOrder[]) => {
    const po = orderList.find((o) => o.id === poId);
    if (!po) {
      setRows([]);
      return;
    }

    const itemRows: ReceiptItemRow[] = po.items.map((item) => {
      const pending = Math.max(0, item.quantityOrdered - item.quantityReceived);
      return {
        productId: item.productId,
        sku: item.product?.sku || 'N/A',
        productName: item.product?.name || 'Suministro',
        unitMeasure: item.product?.unitMeasure || 'Unidad',
        ordered: item.quantityOrdered,
        alreadyReceived: item.quantityReceived,
        pending,
        quantityAccepted: pending, // Por defecto ofrece recibir el saldo pendiente
        quantityRejected: 0,
      };
    });

    setRows(itemRows);
  };

  const handleOrderChange = (poId: string) => {
    setSelectedPoId(poId);
    populateRowsForOrder(poId, orders);
  };

  const handleRowChange = (
    productId: string,
    field: 'quantityAccepted' | 'quantityRejected',
    value: number | '',
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.productId !== productId) return row;
        if (value === '') return { ...row, [field]: '' };

        const num = Math.floor(Number(value));
        if (field === 'quantityAccepted') {
          // No permitir que supere el saldo pendiente
          const clamped = Math.max(0, Math.min(num, row.pending));
          return { ...row, quantityAccepted: clamped };
        } else {
          const clamped = Math.max(0, num);
          return { ...row, quantityRejected: clamped };
        }
      }),
    );
  };

  const handleAcceptAll = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        quantityAccepted: r.pending,
        quantityRejected: 0,
      })),
    );
  };

  const totalAccepted = rows.reduce(
    (sum, r) => sum + (r.quantityAccepted === '' ? 0 : Number(r.quantityAccepted)),
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPoId) {
      setError('Debe seleccionar una orden de compra pendiente de descarga.');
      return;
    }

    if (totalAccepted <= 0) {
      setError('Debe indicar al menos una unidad aceptada para dar entrada en el Kardex físico.');
      return;
    }

    for (const r of rows) {
      if (r.quantityAccepted !== '' && Number(r.quantityAccepted) > r.pending) {
        setError(
          `La cantidad aceptada para [${r.sku}] excede el saldo pendiente (${r.pending}).`,
        );
        return;
      }
    }

    setLoading(true);

    try {
      await receiptsService.createReceipt({
        purchaseOrderId: selectedPoId,
        receiptNumber: receiptNumber.trim() || undefined,
        receiverName: receiverName.trim() || 'juliam@admin.com',
        notes: notes.trim() || undefined,
        items: rows.map((r) => ({
          productId: r.productId,
          quantityAccepted: r.quantityAccepted === '' ? 0 : Number(r.quantityAccepted),
          quantityRejected: r.quantityRejected === '' ? 0 : Number(r.quantityRejected),
        })),
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al registrar la recepción de mercancía.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedPo = orders.find((o) => o.id === selectedPoId);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Recepción de Mercancía en Muelle"
      subtitle="Verificación física y entrada inmediata al inventario en Kardex."
      maxWidth={820}
    >
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 16 }}>
          <div>
            <label className="form-label" htmlFor="receipt-po">
              Orden de Compra Pendiente *
            </label>
            <select
              id="receipt-po"
              className="in"
              value={selectedPoId}
              onChange={(e) => handleOrderChange(e.target.value)}
              required
              disabled={loading || orders.length === 0}
              style={{ cursor: 'pointer' }}
            >
              {orders.length === 0 && (
                <option value="">No hay órdenes de compra pendientes</option>
              )}
              {orders.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} — {po.supplier?.name} ({po.status})
                </option>
              ))}
            </select>
            {selectedPo && (
              <small className="help-text">
                Proveedor: <strong>{selectedPo.supplier?.name}</strong> • Entrega esperada:{' '}
                {selectedPo.expectedDate ? new Date(selectedPo.expectedDate).toLocaleDateString() : 'N/A'}
              </small>
            )}
          </div>

          <div>
            <label className="form-label" htmlFor="receipt-number">N° Recepción (Opcional)</label>
            <input
              id="receipt-number"
              className="in"
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="Autogenerado ej. REC-003"
              disabled={loading}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="receiver-name">Receptor / Responsable</label>
            <input
              id="receiver-name"
              className="in"
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Banner de acción rápida */}
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
            <span className="text-muted" style={{ fontSize: 13 }}>Estado de OC:</span>
            <Pill variant={selectedPo?.status === 'PARTIAL' ? 'info' : 'warning'}>
              {selectedPo?.status || 'PENDING'}
            </Pill>
          </div>
          <button
            type="button"
            className="btn btn2 sm"
            onClick={handleAcceptAll}
            disabled={loading || rows.length === 0}
          >
            Aceptar Todo el Saldo Pendiente
          </button>
        </div>

        {/* Tabla de verificación física en muelle */}
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Suministro</th>
                <th style={{ textAlign: 'center' }}>Pedido</th>
                <th style={{ textAlign: 'center' }}>Ya Recibido</th>
                <th style={{ textAlign: 'center' }}>Pendiente</th>
                <th style={{ textAlign: 'center' }}>Aceptado (Físico)</th>
                <th style={{ textAlign: 'center' }}>Rechazado (Dañado)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                    Seleccione una orden de compra para cargar los suministros.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.productId}>
                    <td>
                      <span className="sku-badge">{row.sku}</span>
                    </td>
                    <td>
                      <strong>{row.productName}</strong>
                      <span className="product-subtext">{row.unitMeasure}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{row.ordered}</td>
                    <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 600 }}>
                      {row.alreadyReceived}
                    </td>
                    <td style={{ textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>
                      {row.pending}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        className="in"
                        type="number"
                        min="0"
                        max={row.pending}
                        step="1"
                        value={row.quantityAccepted}
                        onChange={(e) =>
                          handleRowChange(
                            row.productId,
                            'quantityAccepted',
                            e.target.value === '' ? '' : Number(e.target.value),
                          )
                        }
                        style={{ width: '90px', textAlign: 'center', padding: '6px 8px', minHeight: 38 }}
                        disabled={loading || row.pending === 0}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        className="in"
                        type="number"
                        min="0"
                        step="1"
                        value={row.quantityRejected}
                        onChange={(e) =>
                          handleRowChange(
                            row.productId,
                            'quantityRejected',
                            e.target.value === '' ? '' : Number(e.target.value),
                          )
                        }
                        style={{ width: '80px', textAlign: 'center', padding: '6px 8px', minHeight: 38 }}
                        disabled={loading || row.pending === 0}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div>
          <label className="form-label" htmlFor="receipt-notes">Notas u Observaciones del Muelle</label>
          <textarea
            id="receipt-notes"
            className="in"
            style={{ minHeight: 65, resize: 'vertical' }}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Número de guía del transportista, estado del embalaje o condiciones de descarga..."
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
            disabled={loading || totalAccepted <= 0}
          >
            {loading ? 'Ingresando a Kardex...' : `Confirmar Recepción (${totalAccepted} uds)`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
