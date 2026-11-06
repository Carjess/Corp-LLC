import React, { useState, useEffect, useCallback } from 'react';
import { replenishmentService } from '../../services/replenishment/replenishment.service.js';
import type {
  ProductReplenishmentRop,
  ReplenishmentDashboardSummary,
} from '../../services/replenishment/replenishment.types.js';
import { Pill } from '../ui/Pill.js';
import {
  ArrowRight,
  Info,
  RefreshCw,
} from 'lucide-react';

export const ReplenishmentView: React.FC = () => {
  const [summary, setSummary] = useState<ReplenishmentDashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REORDEN' | 'OK'>('ALL');
  const [showFormulaInfo, setShowFormulaInfo] = useState<boolean>(false);

  // Carga de datos del motor ROP
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await replenishmentService.getReplenishmentSummary({
        status: statusFilter,
        search: searchTerm,
      });
      setSummary(data);
    } catch (err: unknown) {
      console.error('Error al cargar análisis ROP:', err);
      setError(err instanceof Error ? err.message : 'Error al consultar motor de reposición');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const items = summary?.items || [];

  return (
    <div className="orders-module-container">
      {/* 1. Encabezado del Módulo */}
      <div className="module-header">
        <div>
          <h2>Punto de Reorden & Sugerencias de Compra</h2>
          <p className="section-description">
            Cálculo matemático de reaprovisionamiento continuo basado en Demanda Diaria (d), Lead Time (L) y Posición de Inventario (IP).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            style={{ borderRadius: '18px', padding: '10px 18px', fontSize: '13px' }}
          >
            <Info size={16} />
            {showFormulaInfo ? 'Ocultar Fórmula' : 'Ver Modelo Matemático'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={loadData}
            disabled={loading}
            style={{ borderRadius: '18px', padding: '10px 20px', fontSize: '13px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Recalcular ROP
          </button>
        </div>
      </div>

      {/* 2. Banner Didáctico del Modelo ROP */}
      {showFormulaInfo && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #d3efe2',
            borderRadius: '24px',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ color: '#0a7a54', fontWeight: 700, fontSize: '14px' }}>
              Fundamento Operativo del Algoritmo ROP
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              fontSize: '13px',
              color: 'var(--text-main)',
            }}
          >
            <div
              style={{
                background: '#f3f8f5',
                padding: '14px 18px',
                borderRadius: '16px',
                border: '1px solid #e0e9e4',
              }}
            >
              <strong>1. Punto de Reorden (ROP):</strong>
              <div style={{ fontFamily: 'monospace', margin: '6px 0', color: '#04251a' }}>
                ROP = (Demanda Diaria × Tiempo de Entrega) + Stock Seguridad
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Indica el nivel de existencias en el que se debe disparar una orden de compra para no romper stock mientras llega el proveedor.
              </span>
            </div>

            <div
              style={{
                background: '#f3f8f5',
                padding: '14px 18px',
                borderRadius: '16px',
                border: '1px solid #e0e9e4',
              }}
            >
              <strong>2. Posición de Inventario (IP):</strong>
              <div style={{ fontFamily: 'monospace', margin: '6px 0', color: '#04251a' }}>
                IP = Stock Disponible + Compras en Tránsito
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Suma las unidades en almacén más las órdenes ya emitidas que vienen en camino. Si IP &gt; ROP, no se compran unidades duplicadas.
              </span>
            </div>

            <div
              style={{
                background: '#f3f8f5',
                padding: '14px 18px',
                borderRadius: '16px',
                border: '1px solid #e0e9e4',
              }}
            >
              <strong>3. Cantidad Sugerida (Q):</strong>
              <div style={{ fontFamily: 'monospace', margin: '6px 0', color: '#04251a' }}>
                Q = Máximo(0, (ROP + Stock Seguridad) - IP)
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Calcula automáticamente el lote exacto a pedir para retornar al stock objetivo sin caer en sobreinventario.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tarjetas KPI */}
      <div className="kpi-grid">
        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>SKUs en Catálogo</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {summary?.totalActiveSkus ?? 0}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Artículos con seguimiento continuo</p>
        </div>

        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Alerta de Reorden</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {summary?.criticalReorderCount ?? 0}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Productos en o bajo su ROP</p>
        </div>

        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Posición Segura (OK)</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {summary?.safeStockCount ?? 0}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Existencias + tránsito suficientes</p>
        </div>

        <div className="card card-brand" style={{ padding: 24 }}>
          <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>En Tránsito Global</p>
          <p className="d font-display" style={{ fontSize: 46, marginTop: 8, fontWeight: 700, lineHeight: 1 }}>
            {summary?.totalInTransitUnits ?? 0}
          </p>
          <p style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Unidades pedidas pendientes de arribo</p>
        </div>
      </div>

      {/* 4. Barra de Filtros */}
      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por SKU, producto o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'REORDEN' | 'OK')}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="REORDEN">Solo en Alerta (Reorden)</option>
            <option value="OK">Solo en Nivel Seguro (OK)</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)' }}>
          Mostrando <strong>{items.length}</strong> de <strong>{summary?.totalActiveSkus ?? 0}</strong> artículos
        </div>
      </div>

      {/* 5. Alerta de error si aplica */}
      {error && <div className="alert-error">{error}</div>}

      {/* 6. Tabla Principal ROP */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto / Categoría</th>
              <th style={{ textAlign: 'center' }}>Parámetros (d × L + SS)</th>
              <th style={{ textAlign: 'center' }}>Punto Reorden (ROP)</th>
              <th style={{ textAlign: 'center' }}>Stock Disp.</th>
              <th style={{ textAlign: 'center' }}>En Tránsito</th>
              <th style={{ textAlign: 'center' }}>Posición (IP)</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Sugerencia Compra</th>
              <th>Proveedor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                    <RefreshCw className="animate-spin" size={18} />
                    Calculando matrices de reposición en tiempo real...
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No se encontraron productos con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              items.map((item: ProductReplenishmentRop) => {
                const isAlert = item.status === 'REORDEN';
                return (
                  <tr
                    key={item.productId}
                    style={{
                      backgroundColor: isAlert ? 'rgba(254, 242, 242, 0.45)' : undefined,
                    }}
                  >
                    {/* SKU */}
                    <td>
                      <span className="sku-badge">{item.sku}</span>
                    </td>

                    {/* Producto */}
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                        <span className="category-tag">{item.categoryName}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ({item.unitMeasure})
                        </span>
                      </div>
                    </td>

                    {/* Parámetros: Demanda, Lead Time, Seguridad */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                        <span title="Demanda diaria estimada">{item.dailyDemand} u/d</span> ×{' '}
                        <span title="Plazo del proveedor en días">{item.leadTimeDays} d</span> +{' '}
                        <span title="Stock de seguridad">{item.securityStock} SS</span>
                      </div>
                    </td>

                    {/* ROP */}
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: '#04251a',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: '#f3f8f5',
                          border: '1px solid #e0e9e4',
                        }}
                      >
                        {item.reorderPoint}
                      </span>
                    </td>

                    {/* Stock Disponible */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="stock-number available">
                        {item.availableStock}
                      </span>
                    </td>

                    {/* Compras en Tránsito */}
                    <td style={{ textAlign: 'center' }}>
                      {item.inTransitStock > 0 ? (
                        <Pill variant="info" dot>
                          +{item.inTransitStock}
                        </Pill>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>0</span>
                      )}
                    </td>

                    {/* Posición de Inventario (IP) */}
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: isAlert ? '#dc2626' : '#067a3d',
                        }}
                      >
                        {item.inventoryPosition}
                      </span>
                    </td>

                    {/* Estado */}
                    <td style={{ textAlign: 'center' }}>
                      {isAlert ? (
                        <Pill variant="danger" dot>
                          COMPRAR
                        </Pill>
                      ) : (
                        <Pill variant="success" dot>
                          NIVEL OK
                        </Pill>
                      )}
                    </td>

                    {/* Cantidad Sugerida */}
                    <td style={{ textAlign: 'center' }}>
                      {item.suggestedOrderQty > 0 ? (
                        <span
                          style={{
                            fontWeight: 700,
                            color: '#b91c1c',
                            background: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '999px',
                            padding: '4px 12px',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <ArrowRight size={13} />
                          Pedir {item.suggestedOrderQty} {item.unitMeasure}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          0 (Cubierto)
                        </span>
                      )}
                    </td>

                    {/* Proveedor */}
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>
                        {item.supplierName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Entrega estimada: {item.leadTimeDays} días
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
