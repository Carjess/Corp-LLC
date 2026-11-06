import React, { useState, useEffect, useCallback } from 'react';
import { purchaseOrdersService } from '../../services/purchase-orders/purchase-orders.service.js';
import type {
  PurchaseOrder,
} from '../../services/purchase-orders/purchase-orders.types.js';
import type { OrderStatus } from '../../services/customer-orders/customer-orders.types.js';
import { CreatePurchaseOrderModal } from './CreatePurchaseOrderModal.js';
import { Pill } from '../ui/Pill.js';

export const PurchaseOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await purchaseOrdersService.getOrders({
        search: searchTerm.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : (statusFilter as OrderStatus),
      });
      setOrders(data);
    } catch (err: unknown) {
      console.error('Error al cargar órdenes de compra:', err);
      setError(err instanceof Error ? err.message : 'Error al consultar órdenes');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchOrders();
    }, 250);

    return () => clearTimeout(handler);
  }, [fetchOrders]);

  const handleCancelOrder = async (order: PurchaseOrder) => {
    const confirmCancel = window.confirm(
      `¿Está seguro de que desea cancelar la orden de compra ${order.poNumber}?`,
    );
    if (!confirmCancel) return;

    try {
      await purchaseOrdersService.cancelOrder(order.id, 'Cancelada por el área de compras');
      fetchOrders();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cancelar la orden');
    }
  };

  // KPIs
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PARTIAL',
  ).length;

  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED').length;

  const totalTransitUnits = orders.reduce((total, order) => {
    if (order.status === 'CANCELLED' || order.status === 'COMPLETED') return total;
    const orderTransit = order.items.reduce(
      (sub, item) => sub + Math.max(0, item.quantityOrdered - item.quantityReceived),
      0,
    );
    return total + orderTransit;
  }, 0);

  const uniqueSuppliersCount = new Set(orders.map((o) => o.supplierId)).size;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No especificada';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Pill variant="warning">EN TRÁNSITO</Pill>;
      case 'PARTIAL':
        return <Pill variant="info">RECIBIDO PARCIAL</Pill>;
      case 'COMPLETED':
        return <Pill variant="success">COMPLETADO</Pill>;
      case 'CANCELLED':
        return <Pill variant="danger">CANCELADO</Pill>;
    }
  };

  return (
    <div className="orders-module-container">
      {/* Header del módulo */}
      <div className="module-header">
        <div>
          <h2>Compras a Proveedores (Abastecimiento y Tránsito)</h2>
          <p className="section-description">
            Monitoreo de solicitudes de compra a fabricantes. Las unidades se controlan como tránsito y no ingresan al físico hasta su recepción en muelle.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-with-icon"
          onClick={() => setIsCreateOpen(true)}
        >
          <span>+</span> Registrar Orden de Compra
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Órdenes en Curso</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {activeOrdersCount}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Órdenes de compra abiertas a fabricantes</p>
        </div>

        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Mercancía en Tránsito</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {totalTransitUnits.toLocaleString()}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Unidades en camino hacia el muelle central</p>
        </div>

        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Órdenes Recibidas</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {completedOrdersCount}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Entregas totales ingresadas a estantería</p>
        </div>

        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Proveedores Activos</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {uniqueSuppliersCount}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Fabricantes asociados con órdenes emitidas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por N° de orden (ej. COM-001) o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="PENDING">En Tránsito (Pendientes)</option>
            <option value="PARTIAL">Parcialmente Recibidas</option>
            <option value="COMPLETED">Completadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Tabla de órdenes de compra */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Orden</th>
              <th>Fabricante / Proveedor</th>
              <th>Fecha Emisión</th>
              <th>Entrega Estimada</th>
              <th>Líneas y Unidades</th>
              <th style={{ textAlign: 'center' }}>En Tránsito</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  Cargando órdenes de compra...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  No se encontraron órdenes de compra con los filtros aplicados.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const totalOrdered = order.items.reduce(
                  (sum, i) => sum + i.quantityOrdered,
                  0,
                );
                const totalReceived = order.items.reduce(
                  (sum, i) => sum + i.quantityReceived,
                  0,
                );
                const transitUnits = Math.max(0, totalOrdered - totalReceived);
                const canCancel =
                  order.status === 'PENDING' || order.status === 'PARTIAL';

                return (
                  <tr key={order.id}>
                    <td className="sku-cell">{order.poNumber}</td>
                    <td className="product-name-cell">
                      <strong>{order.supplier?.name}</strong>
                      {order.supplier?.leadTimeDays && (
                        <span className="text-muted text-xs block">
                          Plazo entrega: {order.supplier.leadTimeDays} días
                        </span>
                      )}
                    </td>
                    <td className="text-sm">{formatDate(order.issueDate)}</td>
                    <td className="text-sm">
                      <strong>{formatDate(order.expectedDate)}</strong>
                    </td>
                    <td>
                      <div className="order-items-compact">
                        {order.items.map((item) => (
                          <div key={item.id} className="item-compact-badge">
                            <span className="item-sku">{item.product?.sku}</span>: {item.quantityOrdered} {item.product?.unitMeasure}s
                            {item.quantityReceived > 0 && (
                              <span className="text-success text-xs">
                                {' '}({item.quantityReceived} recibidos)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {transitUnits > 0 ? (
                        <span className="stock-number reserved">
                          {transitUnits.toLocaleString()} en camino
                        </span>
                      ) : (
                        <span className="stock-number available">0 (Entregado)</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{renderStatusBadge(order.status)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {canCancel && (
                        <button
                          type="button"
                          className="btn btn2 sm"
                          onClick={() => handleCancelOrder(order)}
                          title="Cancelar orden de compra"
                        >
                          Cancelar
                        </button>
                      )}
                      {order.status === 'COMPLETED' && (
                        <span className="text-muted" style={{ fontSize: 13 }}>Recibido 100%</span>
                      )}
                      {order.status === 'CANCELLED' && (
                        <span className="text-muted" style={{ fontSize: 13 }}>Anulada</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Orden */}
      <CreatePurchaseOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchOrders}
      />
    </div>
  );
};

