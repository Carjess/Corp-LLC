import React, { useState, useEffect, useCallback } from 'react';
import { customerOrdersService } from '../../services/customer-orders/customer-orders.service.js';
import type {
  CustomerOrder,
  OrderStatus,
} from '../../services/customer-orders/customer-orders.types.js';
import { CreateOrderModal } from './CreateOrderModal.js';
import { DispatchModal } from './DispatchModal.js';
import { Pill } from '../ui/Pill.js';

export const CustomerOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [dispatchOrder, setDispatchOrder] = useState<CustomerOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerOrdersService.getOrders({
        search: searchTerm.trim() || undefined,
        status: statusFilter === 'ALL' ? undefined : (statusFilter as OrderStatus),
      });
      setOrders(data);
    } catch (err: unknown) {
      console.error('Error al cargar órdenes de clientes:', err);
      setError(err instanceof Error ? err.message : 'Error al consultar pedidos');
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

  const handleCancelOrder = async (order: CustomerOrder) => {
    const confirmCancel = window.confirm(
      `¿Está seguro de que desea cancelar el pedido ${order.orderNumber}? Esto liberará inmediatamente todas las unidades reservadas.`,
    );
    if (!confirmCancel) return;

    try {
      await customerOrdersService.cancelOrder(order.id, 'Cancelado por el operador');
      fetchOrders();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cancelar el pedido');
    }
  };

  // KPIs
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PARTIAL',
  ).length;

  const completedOrdersCount = orders.filter((o) => o.status === 'COMPLETED').length;

  const totalReservedUnits = orders.reduce((total, order) => {
    const orderReserved = order.items.reduce(
      (sub, item) => sub + item.quantityReserved,
      0,
    );
    return total + orderReserved;
  }, 0);

  const uniqueCustomersCount = new Set(orders.map((o) => o.customerId)).size;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Pill variant="warning">PENDIENTE</Pill>;
      case 'PARTIAL':
        return <Pill variant="info">PARCIAL</Pill>;
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
          <h2>Pedidos de Clientes (Demanda y Reservas)</h2>
          <p className="section-description">
            Control estricto de solicitudes de distribuidores, bloqueo automático de sobreventa y despacho con salida de Kardex.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-with-icon"
          onClick={() => setIsCreateOpen(true)}
        >
          <span>+</span> Registrar Nuevo Pedido
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Pedidos Activos</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {activeOrdersCount}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Órdenes pendientes o en despacho parcial</p>
        </div>

        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Unidades Comprometidas</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {totalReservedUnits.toLocaleString()}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Stock reservado físicamente en almacén</p>
        </div>

        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Pedidos Completados</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {completedOrdersCount}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Despachos entregados a satisfacción</p>
        </div>

        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Distribuidores Atendidos</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {uniqueCustomersCount}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Clientes con órdenes registradas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por N° de orden (ej. PED-001) o cliente..."
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
            <option value="PENDING">Pendientes</option>
            <option value="PARTIAL">Parciales</option>
            <option value="COMPLETED">Completados</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Tabla de órdenes */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Orden</th>
              <th>Cliente / Distribuidor</th>
              <th>Fecha</th>
              <th>Líneas del Pedido</th>
              <th style={{ textAlign: 'center' }}>Demanda / Despacho / Reserva</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  Cargando pedidos de clientes...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  No se encontraron pedidos con los filtros aplicados.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const totalDemanded = order.items.reduce(
                  (sum, i) => sum + i.quantityDemanded,
                  0,
                );
                const totalDispatched = order.items.reduce(
                  (sum, i) => sum + i.quantityDispatched,
                  0,
                );
                const totalReserved = order.items.reduce(
                  (sum, i) => sum + i.quantityReserved,
                  0,
                );
                const canDispatch =
                  (order.status === 'PENDING' || order.status === 'PARTIAL') &&
                  totalReserved > 0;

                return (
                  <tr key={order.id}>
                    <td className="sku-cell">{order.orderNumber}</td>
                    <td className="product-name-cell">
                      <strong>{order.customer?.name}</strong>
                      {order.customer?.contactName && (
                        <span className="text-muted text-xs block">
                          Contacto: {order.customer.contactName}
                        </span>
                      )}
                    </td>
                    <td className="text-sm">{formatDate(order.orderDate)}</td>
                    <td>
                      <div className="order-items-compact">
                        {order.items.map((item) => (
                          <div key={item.id} className="item-compact-badge">
                            <span className="item-sku">{item.product?.sku}</span>: {item.quantityDemanded} {item.product?.unitMeasure}s
                            {item.quantityDispatched > 0 && (
                              <span className="text-success text-xs">
                                {' '}({item.quantityDispatched} despachados)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="text-sm">
                        <strong>{totalDemanded}</strong> pedidas &bull;{' '}
                        <span className="text-success">{totalDispatched} desp.</span> &bull;{' '}
                        <strong className="text-warning">{totalReserved} res.</strong>
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{renderStatusBadge(order.status)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                        {canDispatch && (
                          <button
                            type="button"
                            className="btn sm"
                            onClick={() => setDispatchOrder(order)}
                            title="Registrar despacho físico"
                          >
                            Despachar
                          </button>
                        )}
                        {(order.status === 'PENDING' || order.status === 'PARTIAL') && (
                          <button
                            type="button"
                            className="btn btn2 sm"
                            onClick={() => handleCancelOrder(order)}
                            title="Cancelar orden y liberar reserva"
                          >
                            Cancelar
                          </button>
                        )}
                        {order.status === 'COMPLETED' && (
                          <span className="text-muted" style={{ fontSize: 13 }}>Completado</span>
                        )}
                        {order.status === 'CANCELLED' && (
                          <span className="text-muted" style={{ fontSize: 13 }}>Anulado</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Pedido */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchOrders}
      />

      {/* Modal Despachar Pedido */}
      <DispatchModal
        isOpen={Boolean(dispatchOrder)}
        order={dispatchOrder}
        onClose={() => setDispatchOrder(null)}
        onSuccess={fetchOrders}
      />
    </div>
  );
};

