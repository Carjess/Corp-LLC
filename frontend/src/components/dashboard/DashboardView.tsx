import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../../services/dashboard/dashboard.service.js';
import type { DashboardStats } from '../../services/dashboard/dashboard.types.js';
import type { TabKey } from '../layout/Sidebar.js';
import { Pill, type PillVariant } from '../ui/Pill.js';
import { RefreshCw } from 'lucide-react';

// ==========================================
// Paleta Oficial The Empire
// ==========================================
const STATUS_COLORS = {
  safe: '#4edea3',
  warning: '#f5c542',
  danger: '#ff8f80',
  info: '#2dd4bf',
  muted: '#9fb3a8',
};

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

// ==========================================
// Componente de Dona SVG de Alta Fidelidad
// ==========================================
const SvgDonut: React.FC<{
  data: DonutSlice[];
  total: number;
  size?: number;
}> = ({ data, total, size = 140 }) => {
  const radius = 50;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  const validData = data.filter((d) => d.value > 0);

  let accumulatedLength = 0;

  return (
    <div style={{ width: size, height: size, position: 'relative', flex: 'none' }}>
      <svg
        viewBox="0 0 140 140"
        style={{
          width: '100%',
          height: '100%',
          transform: 'rotate(-90deg)',
        }}
      >
        {validData.length === 0 ? (
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
          />
        ) : (
          validData.map((slice, index) => {
            const length = (slice.value / Math.max(1, total)) * circumference;
            const strokeDasharray = `${length} ${circumference - length}`;
            const strokeDashoffset = -accumulatedLength;
            accumulatedLength += length;

            return (
              <circle
                key={`slice-${index}`}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
              />
            );
          })
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <b className="font-display" style={{ fontSize: 26, color: 'var(--text-main)', fontWeight: 700 }}>
          {total}
        </b>
      </div>
    </div>
  );
};

interface DashboardViewProps {
  onNavigate?: (tab: TabKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Carga de métricas del dashboard
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err: unknown) {
      console.error('Error al cargar datos del dashboard:', err);
      setError(err instanceof Error ? err.message : 'Error al consultar métricas del dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !stats) {
    return (
      <div style={{ padding: '60px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-muted" style={{ fontSize: 16 }}>Cargando resumen de hoy...</p>
      </div>
    );
  }

  const kpis = stats?.kpis || {
    totalActiveSkus: 0,
    criticalReorderSkus: 0,
    safeStockSkus: 0,
    pendingCustomerOrders: 0,
    inTransitPurchaseOrders: 0,
    totalInTransitUnits: 0,
    recentAuditsCount: 0,
  };

  const criticalAlerts = stats?.criticalAlerts || [];
  const recentMovements = stats?.recentMovements || [];

  // 2. Datos para Donas Estadísticas
  const inventoryChartData: DonutSlice[] = [
    { name: 'Nivel Seguro (OK)', value: kpis.safeStockSkus, color: STATUS_COLORS.safe },
    { name: 'Alerta Reorden', value: kpis.criticalReorderSkus, color: STATUS_COLORS.danger },
  ];

  const pendingOrders = stats?.ordersSummary.pendingCount ?? 0;
  const completedOrders = stats?.ordersSummary.completedCount ?? 0;
  const cancelledOrders = stats?.ordersSummary.cancelledCount ?? 0;
  const totalOrders = pendingOrders + completedOrders + cancelledOrders;

  const ordersChartData: DonutSlice[] = [
    { name: 'Despachados', value: completedOrders, color: STATUS_COLORS.safe },
    { name: 'Pendientes', value: pendingOrders, color: STATUS_COLORS.warning },
    { name: 'Cancelados', value: cancelledOrders, color: STATUS_COLORS.danger },
  ];

  const inTransitPurchases = stats?.purchasesSummary.inTransitCount ?? 0;
  const completedPurchases = stats?.purchasesSummary.completedCount ?? 0;
  const totalPurchases = inTransitPurchases + completedPurchases;

  const purchasesChartData: DonutSlice[] = [
    { name: 'Recibidas', value: completedPurchases, color: STATUS_COLORS.safe },
    { name: 'En Tránsito', value: inTransitPurchases, color: STATUS_COLORS.info },
  ];

  const formatDateTime = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return String(dateStr);
    }
  };

  const getMovementPill = (type: string): { label: string; pill: PillVariant } => {
    switch (type) {
      case 'ENTRADA':
        return { label: 'Entrada', pill: 'success' };
      case 'SALIDA':
        return { label: 'Salida', pill: 'danger' };
      case 'AJUSTE_POSITIVO':
        return { label: 'Ajuste (+)', pill: 'info' };
      case 'AJUSTE_NEGATIVO':
        return { label: 'Ajuste (-)', pill: 'warning' };
      default:
        return { label: type, pill: 'tag' };
    }
  };

  return (
    <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 24, boxSizing: 'border-box' }}>
      {/* 1. Cabecera del Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 36, color: 'var(--text-main)', letterSpacing: '-0.02em', fontWeight: 700 }}>
            Resumen de hoy
          </h1>
          <p className="text-muted" style={{ marginTop: 6, fontSize: 15 }}>
            Así va Juliam Corp en este momento.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadData}
          disabled={loading}
          style={{ borderRadius: 999, padding: '8px 20px', fontSize: 13, gap: 8 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* 2. Fila 1: 4 Tarjetas de Métricas Estadísticas (En verde menta insignia) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {/* Tarjeta 1: SKUs Catálogo */}
        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>SKUs en Catálogo</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {kpis.totalActiveSkus}
          </p>
        </div>

        {/* Tarjeta 2: Alertas de Reorden */}
        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Alertas de Reorden</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {kpis.criticalReorderSkus}
          </p>
        </div>

        {/* Tarjeta 3: Pedidos por Despachar */}
        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Pedidos por Despachar</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {kpis.pendingCustomerOrders}
          </p>
        </div>

        {/* Tarjeta 4: Compras en Tránsito */}
        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Compras en Tránsito</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {kpis.inTransitPurchaseOrders}
          </p>
        </div>
      </div>

      {/* 3. Fila 2: 3 Tarjetas con Gráficos de Dona y Desgloses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {/* Dona 1: Estado del Inventario (SKUs) */}
        <div className="card" style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'center' }}>
          <SvgDonut data={inventoryChartData} total={kpis.totalActiveSkus} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, flex: 1 }}>
            <b className="font-display" style={{ fontSize: 16, marginBottom: 4, color: 'var(--text-main)' }}>
              Inventario (SKUs)
            </b>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS.safe, display: 'inline-block' }} />
              <span className="text-muted">Nivel Seguro (OK)</span>
              <b style={{ marginLeft: 'auto', color: 'var(--text-main)' }}>{kpis.safeStockSkus}</b>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS.danger, display: 'inline-block' }} />
              <span className="text-muted">Alerta Reorden</span>
              <b style={{ marginLeft: 'auto', color: 'var(--text-main)' }}>{kpis.criticalReorderSkus}</b>
            </span>
          </div>
        </div>

        {/* Dona 2: Pedidos de Clientes */}
        <div className="card" style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'center' }}>
          <SvgDonut data={ordersChartData} total={totalOrders} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13, flex: 1 }}>
            <b className="font-display" style={{ fontSize: 16, marginBottom: 2, color: 'var(--text-main)' }}>
              Pedidos Clientes
            </b>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS.safe, display: 'inline-block' }} />
              <span className="text-muted">Despachados</span>
              <b style={{ marginLeft: 'auto', color: 'var(--text-main)' }}>{completedOrders}</b>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS.warning, display: 'inline-block' }} />
              <span className="text-muted">Pendientes</span>
              <b style={{ marginLeft: 'auto', color: 'var(--text-main)' }}>{pendingOrders}</b>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS.danger, display: 'inline-block' }} />
              <span className="text-muted">Cancelados</span>
              <b style={{ marginLeft: 'auto', color: 'var(--text-main)' }}>{cancelledOrders}</b>
            </span>
          </div>
        </div>

        {/* Dona 3: Compras a Fabricantes */}
        <div className="card" style={{ padding: 24, display: 'flex', gap: 24, alignItems: 'center' }}>
          <SvgDonut data={purchasesChartData} total={totalPurchases} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, flex: 1 }}>
            <b className="font-display" style={{ fontSize: 16, marginBottom: 4, color: 'var(--text-main)' }}>
              Abastecimiento
            </b>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS.safe, display: 'inline-block' }} />
              <span className="text-muted">Recibidas</span>
              <b style={{ marginLeft: 'auto', color: 'var(--text-main)' }}>{completedPurchases}</b>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS.info, display: 'inline-block' }} />
              <span className="text-muted">En Tránsito</span>
              <b style={{ marginLeft: 'auto', color: 'var(--text-main)' }}>{inTransitPurchases}</b>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Fila 3: Las Dos Tablas de Resumen Operativo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24 }}>
        {/* Tabla Izquierda: Actividad Reciente en Kardex */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '22px 28px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 20, color: 'var(--text-main)', fontWeight: 600 }}>
              Últimos movimientos de inventario
            </h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate?.('inventory')}
              style={{ borderRadius: 999, fontSize: 13, padding: '6px 14px' }}
            >
              Ver Kardex
            </button>
          </div>

          {recentMovements.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: 14 }}>No hay movimientos registrados todavía.</p>
            </div>
          ) : (
            <div>
              {recentMovements.map((mov) => {
                const isPositive = mov.type === 'ENTRADA' || mov.type === 'AJUSTE_POSITIVO';
                const pillInfo = getMovementPill(mov.type);

                return (
                  <div
                    key={mov.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '110px 1fr 90px 110px',
                      gap: 16,
                      alignItems: 'center',
                      padding: '14px 28px',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: 14,
                    }}
                  >
                    <div>
                      <b style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>
                        {mov.referenceDoc || 'KARDEX'}
                      </b>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatDateTime(mov.movementDate)}
                      </div>
                    </div>

                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                        {mov.product?.name || 'Producto'}
                      </span>
                      <span className="text-muted"> · {mov.product?.sku}</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <b
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 14,
                          color: isPositive ? '#067a3d' : '#b3382a',
                        }}
                      >
                        {isPositive ? `+${mov.quantity}` : `-${mov.quantity}`}
                      </b>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <Pill variant={pillInfo.pill}>
                        {pillInfo.label}
                      </Pill>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabla Derecha: Alertas de Reposición Prioritarias */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '22px 28px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 20, color: 'var(--text-main)', fontWeight: 600 }}>
              Alertas prioritarias de reposición
            </h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate?.('replenishment')}
              style={{ borderRadius: 999, fontSize: 13, padding: '6px 14px' }}
            >
              Ver Reorden
            </button>
          </div>

          {criticalAlerts.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center' }}>
              <p className="text-muted" style={{ fontSize: 14 }}>¡Inventario en equilibrio! No hay alertas de compra.</p>
            </div>
          ) : (
            <div>
              {criticalAlerts.map((alert) => (
                <div
                  key={alert.productId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr 140px 80px',
                    gap: 16,
                    alignItems: 'center',
                    padding: '14px 28px',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: 14,
                  }}
                >
                  <div>
                    <span className="sku-badge">{alert.sku}</span>
                  </div>

                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                      {alert.name}
                    </span>
                    <span className="text-muted"> · {alert.categoryName}</span>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <Pill variant="danger" dot>
                      Pedir +{alert.suggestedOrderQty} {alert.unitMeasure}
                    </Pill>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onNavigate?.('purchase-orders')}
                      style={{ borderRadius: 999, fontSize: 12, padding: '4px 12px', minHeight: 32 }}
                    >
                      Pedir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
