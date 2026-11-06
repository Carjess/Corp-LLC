import React, { useState, useEffect, useCallback } from 'react';
import { receiptsService } from '../../services/receipts/receipts.service.js';
import { purchaseOrdersService } from '../../services/purchase-orders/purchase-orders.service.js';
import type { GoodsReceipt } from '../../services/receipts/receipts.types.js';
import { CreateReceiptModal } from './CreateReceiptModal.js';
import { Pill } from '../ui/Pill.js';

export const ReceiptsView: React.FC = () => {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [openPoCount, setOpenPoCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [receiptList, poList] = await Promise.all([
        receiptsService.getReceipts(),
        purchaseOrdersService.getOrders(),
      ]);
      setReceipts(receiptList);
      const pendingPos = poList.filter(
        (po) => po.status === 'PENDING' || po.status === 'PARTIAL',
      );
      setOpenPoCount(pendingPos.length);
    } catch (err: unknown) {
      console.error('Error al cargar recepciones de mercancía:', err);
      setError(err instanceof Error ? err.message : 'Error al consultar recepciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cálculos de KPI
  const totalReceiptsCount = receipts.length;
  const totalUnitsAccepted = receipts.reduce((total, r) => {
    const sumItems = r.items.reduce((s, item) => s + item.quantityAccepted, 0);
    return total + sumItems;
  }, 0);

  // Filtrado en vivo
  const filteredReceipts = receipts.filter((r) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const matchNumber = r.receiptNumber.toLowerCase().includes(q);
    const matchPo = r.purchaseOrder?.poNumber.toLowerCase().includes(q) || false;
    const matchSupplier = r.purchaseOrder?.supplier?.name.toLowerCase().includes(q) || false;
    const matchReceiver = r.receiverName.toLowerCase().includes(q);
    return matchNumber || matchPo || matchSupplier || matchReceiver;
  });

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="orders-module-container">
      {/* Header del módulo */}
      <div className="module-header">
        <div>
          <h2>Recepción de Mercancía en Muelle</h2>
          <p className="section-description">
            Descarga, verificación de calidad e ingreso físico directo al Kardex desde órdenes de compra a proveedores.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-with-icon"
          onClick={() => setIsCreateOpen(true)}
        >
          <span>+</span> Registrar Recepción en Muelle
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Recepciones Realizadas</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {totalReceiptsCount}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Comprobantes REC emitidos en muelle</p>
        </div>

        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Unidades Físicas Ingresadas</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {totalUnitsAccepted.toLocaleString()}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Suministros sumados al Kardex e inventario físico</p>
        </div>

        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Órdenes Pendientes de Descarga</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {openPoCount}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Órdenes de compra abiertas a fabricantes</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por N° REC, orden COM o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de recepciones */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Comprobante</th>
              <th>Orden de Compra & Proveedor</th>
              <th>Fecha y Hora</th>
              <th>Suministros Aceptados / Rechazados</th>
              <th style={{ textAlign: 'center' }}>Total Ingresado</th>
              <th>Responsable</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  Cargando historial de recepciones en muelle...
                </td>
              </tr>
            ) : filteredReceipts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  {searchTerm
                    ? 'No se encontraron recepciones con los criterios de búsqueda.'
                    : 'No hay recepciones registradas todavía.'}
                </td>
              </tr>
            ) : (
              filteredReceipts.map((receipt) => {
                const totalAcceptedInReceipt = receipt.items.reduce(
                  (sum, i) => sum + i.quantityAccepted,
                  0,
                );

                return (
                  <tr key={receipt.id}>
                    <td>
                      <span className="sku-badge" style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-primary-text)' }}>
                        {receipt.receiptNumber}
                      </span>
                    </td>
                    <td>
                      <b style={{ color: 'var(--text-main)', display: 'block' }}>
                        {receipt.purchaseOrder?.poNumber || 'N/A'}
                      </b>
                      <span className="text-muted text-xs">
                        {receipt.purchaseOrder?.supplier?.name || 'Proveedor'}
                      </span>
                    </td>
                    <td className="text-sm">{formatDateTime(receipt.receiptDate || receipt.createdAt)}</td>
                    <td>
                      <div className="order-items-compact">
                        {receipt.items.map((item) => (
                          <div key={item.id} className="item-compact-badge">
                            <span className="item-sku">{item.product?.sku || 'SKU'}</span>:{' '}
                            <strong style={{ color: 'var(--status-success-text)' }}>
                              +{item.quantityAccepted} {item.product?.unitMeasure || 'uds'}
                            </strong>
                            {item.quantityRejected > 0 && (
                              <span style={{ color: '#ef4444', marginLeft: 6, fontSize: 11 }}>
                                ({item.quantityRejected} rech.)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Pill variant="success">
                        +{totalAcceptedInReceipt.toLocaleString()} uds
                      </Pill>
                    </td>
                    <td className="text-sm">
                      <strong>{receipt.receiverName}</strong>
                    </td>
                    <td className="text-sm">
                      <span className="text-muted">{receipt.notes || '—'}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Recepción */}
      <CreateReceiptModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

