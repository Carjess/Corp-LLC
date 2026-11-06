import React, { useState, useEffect, useCallback } from 'react';
import { stockCountsService } from '../../services/stock-counts/stock-counts.service.js';
import type { StockCount } from '../../services/stock-counts/stock-counts.types.js';
import { CreateStockCountModal } from './CreateStockCountModal.js';
import { Pill } from '../ui/Pill.js';

export const StockCountsView: React.FC = () => {
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'DISCREPANCY' | 'BALANCED'>('ALL');

  // Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stockCountsService.getCounts();
      setCounts(data);
    } catch (err: unknown) {
      console.error('Error al cargar historial de conteos físicos:', err);
      setError(err instanceof Error ? err.message : 'Error al consultar auditorías de stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cálculos de KPI
  const totalAudits = counts.length;
  const balancedAudits = counts.filter((c) => c.difference === 0).length;
  const appliedAdjustments = counts.filter(
    (c) => c.difference !== 0 && c.status === 'APPLIED',
  ).length;

  // Filtrado en memoria
  const filteredCounts = counts.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    const matchSearch =
      !q ||
      c.product?.name.toLowerCase().includes(q) ||
      c.product?.sku.toLowerCase().includes(q) ||
      c.counterName.toLowerCase().includes(q) ||
      (c.approverName && c.approverName.toLowerCase().includes(q));

    let matchType = true;
    if (filterType === 'DISCREPANCY') {
      matchType = c.difference !== 0;
    } else if (filterType === 'BALANCED') {
      matchType = c.difference === 0;
    }

    return matchSearch && matchType;
  });

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  const renderDifferencePill = (diff: number) => {
    if (diff === 0) {
      return <Pill variant="success">0 (Cuadrado)</Pill>;
    }
    if (diff > 0) {
      return <Pill variant="info">+{diff} (Sobrante)</Pill>;
    }
    return <Pill variant="danger">{diff} (Faltante)</Pill>;
  };

  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return <Pill variant="success">AJUSTE APLICADO</Pill>;
      case 'CONCILIATED':
        return <Pill variant="success">CONCILIADO OK</Pill>;
      case 'PENDING_AUDIT':
        return <Pill variant="warning">AUDITORÍA PENDIENTE</Pill>;
      default:
        return <Pill variant="tag">{status}</Pill>;
    }
  };

  return (
    <div className="orders-module-container">
      {/* Header del módulo */}
      <div className="module-header">
        <div>
          <h2>Conteo Físico & Auditoría de Ajustes</h2>
          <p className="section-description">
            Conciliación de existencias reales en estanterías contra el sistema. Generación de movimientos auditados en Kardex con motivo y aprobador obligatorio.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-with-icon"
          onClick={() => setIsCreateOpen(true)}
        >
          <span>+</span> Registrar Conteo Físico
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Auditorías Realizadas</span>
          <span className="kpi-value text-primary">{totalAudits}</span>
          <span className="kpi-subtext">Conteos ciegos registrados en estantería</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Conteos Cuadrados (Exactos)</span>
          <span className="kpi-value text-success">{balancedAudits}</span>
          <span className="kpi-subtext">Artículos sin discrepancia física</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Ajustes Auditados al Kardex</span>
          <span className="kpi-value text-warning">{appliedAdjustments}</span>
          <span className="kpi-subtext">Variaciones justificadas con salida/entrada</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por SKU, producto o auditor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-select">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            style={{ cursor: 'pointer' }}
          >
            <option value="ALL">Todos los Conteos</option>
            <option value="DISCREPANCY">Solo con Discrepancia</option>
            <option value="BALANCED">Solo Cuadrados (0)</option>
          </select>
        </div>
      </div>

      {/* Tabla de Conteos Físicos */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>SKU & Suministro</th>
              <th style={{ textAlign: 'center' }}>Stock Sistema</th>
              <th style={{ textAlign: 'center' }}>Conteo Observado</th>
              <th style={{ textAlign: 'center' }}>Variación (&Delta;)</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th>Auditor / Contador</th>
              <th>Justificación de Auditoría</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  Cargando historial de conteos físicos y auditorías...
                </td>
              </tr>
            ) : filteredCounts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4 text-muted">
                  {searchTerm || filterType !== 'ALL'
                    ? 'No se encontraron conteos con los filtros seleccionados.'
                    : 'No hay conteos físicos registrados todavía.'}
                </td>
              </tr>
            ) : (
              filteredCounts.map((count) => (
                <tr key={count.id}>
                  <td className="text-sm">{formatDateTime(count.countDate || count.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="sku-badge">{count.product?.sku || 'N/A'}</span>
                      <b style={{ color: 'var(--text-main)' }}>{count.product?.name}</b>
                    </div>
                    <span className="text-muted text-xs">
                      {count.product?.unitMeasure} &bull; {count.product?.category?.name || 'General'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{count.systemStock}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-main)' }}>
                    {count.countedStock}
                  </td>
                  <td style={{ textAlign: 'center' }}>{renderDifferencePill(count.difference)}</td>
                  <td style={{ textAlign: 'center' }}>{renderStatusPill(count.status)}</td>
                  <td className="text-sm">
                    {count.approverName ? (
                      <div>
                        <strong>{count.approverName}</strong>
                        <span className="text-muted text-xs block">Contó: {count.counterName}</span>
                      </div>
                    ) : (
                      <span>{count.counterName}</span>
                    )}
                  </td>
                  <td className="text-sm">
                    <span className="text-muted">{count.notes || '—'}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Conteo Físico */}
      <CreateStockCountModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

