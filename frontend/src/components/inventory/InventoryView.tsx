import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../services/inventory/inventory.service.js';
import type {
  InventoryMovement,
  MovementType,
  ProductStockSummary,
} from '../../services/inventory/inventory.types.js';
import { MovementModal } from './MovementModal.js';

type InventoryTab = 'stock' | 'kardex';

export const InventoryView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<InventoryTab>('stock');
  const [stockList, setStockList] = useState<ProductStockSummary[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros de saldos
  const [stockSearch, setStockSearch] = useState<string>('');
  const [stockAlertFilter, setStockAlertFilter] = useState<string>('ALL');

  // Filtros de movimientos
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('');

  // Modal de movimiento
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [preselectedProductId, setPreselectedProductId] = useState<string | undefined>(undefined);

  const fetchStock = useCallback(async () => {
    try {
      const data = await inventoryService.getStockSummary();
      setStockList(data);
    } catch (err: unknown) {
      console.error('Error al cargar saldos de stock:', err);
      setError(err instanceof Error ? err.message : 'Error al consultar stock');
    }
  }, []);

  const fetchMovements = useCallback(async () => {
    try {
      const data = await inventoryService.getMovements({
        productId: selectedProductFilter || undefined,
        type: (selectedTypeFilter as MovementType) || undefined,
      });
      setMovements(data);
    } catch (err: unknown) {
      console.error('Error al cargar kardex:', err);
      setError(err instanceof Error ? err.message : 'Error al consultar kardex');
    }
  }, [selectedProductFilter, selectedTypeFilter]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStock(), fetchMovements()]);
    } finally {
      setLoading(false);
    }
  }, [fetchStock, fetchMovements]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Manejo de apertura de modal
  const handleOpenMovementModal = (productId?: string) => {
    setPreselectedProductId(productId);
    setIsModalOpen(true);
  };

  const handleMovementSuccess = () => {
    loadAllData();
  };

  // Cálculos de KPI totales
  const totalPhysicalStock = stockList.reduce((sum, item) => sum + item.physicalStock, 0);
  const totalReservedStock = stockList.reduce((sum, item) => sum + item.reservedStock, 0);
  const totalAvailableStock = stockList.reduce((sum, item) => sum + item.availableStock, 0);
  const criticalAlertsCount = stockList.filter(
    (item) => item.statusAlert === 'CRITICO' || item.statusAlert === 'BAJO',
  ).length;

  // Filtrado de la tabla de stock
  const filteredStock = stockList.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(stockSearch.toLowerCase()) ||
      item.name.toLowerCase().includes(stockSearch.toLowerCase());

    let matchesAlert = true;
    if (stockAlertFilter === 'ALERT_ONLY') {
      matchesAlert = item.statusAlert === 'CRITICO' || item.statusAlert === 'BAJO';
    } else if (stockAlertFilter === 'CRITICO') {
      matchesAlert = item.statusAlert === 'CRITICO';
    } else if (stockAlertFilter === 'OK') {
      matchesAlert = item.statusAlert === 'OK';
    }

    return matchesSearch && matchesAlert;
  });

  // Opciones de productos para selects
  const productOptions = stockList.map((item) => ({
    id: item.productId,
    sku: item.sku,
    name: item.name,
  }));

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  const renderBadgeType = (type: MovementType) => {
    switch (type) {
      case 'ENTRADA':
        return <span className="badge badge-success">ENTRADA</span>;
      case 'SALIDA':
        return <span className="badge badge-danger">SALIDA</span>;
      case 'AJUSTE_POSITIVO':
        return <span className="badge badge-info">AJUSTE (+)</span>;
      case 'AJUSTE_NEGATIVO':
        return <span className="badge badge-warning">AJUSTE (-)</span>;
    }
  };

  const renderAlertBadge = (status: 'CRITICO' | 'BAJO' | 'OK') => {
    switch (status) {
      case 'CRITICO':
        return <span className="badge badge-danger">CRÍTICO</span>;
      case 'BAJO':
        return <span className="badge badge-warning">BAJO</span>;
      case 'OK':
        return <span className="badge badge-success">OK</span>;
    }
  };

  return (
    <div className="inventory-module-container">
      {/* Header del módulo */}
      <div className="module-header">
        <div>
          <h2>Inventario & Kardex Inmutable</h2>
          <p className="section-description">
            Control de existencias físicas reales, reservas por pedidos y trazabilidad histórica inalterable.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-with-icon"
          onClick={() => handleOpenMovementModal()}
        >
          <span>+</span> Registrar Movimiento Kardex
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Tarjetas KPI de Resumen */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Stock Físico Total</span>
          <span className="kpi-value text-primary">{totalPhysicalStock.toLocaleString()}</span>
          <span className="kpi-subtext">Unidades en almacén central</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Stock Reservado Total</span>
          <span className="kpi-value text-warning">{totalReservedStock.toLocaleString()}</span>
          <span className="kpi-subtext">Comprometido en pedidos de clientes</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Stock Disponible Total</span>
          <span className="kpi-value text-success">{totalAvailableStock.toLocaleString()}</span>
          <span className="kpi-subtext">Físico - Reservado (libre para venta)</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Alertas de Stock</span>
          <span className={`kpi-value ${criticalAlertsCount > 0 ? 'text-danger' : 'text-success'}`}>
            {criticalAlertsCount}
          </span>
          <span className="kpi-subtext">SKUs bajo el umbral de seguridad</span>
        </div>
      </div>

      {/* Subnavegación: Saldos vs Kardex */}
      <div className="subtabs-bar">
        <button
          type="button"
          className={`subtab-btn ${activeSubTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('stock')}
        >
          Saldos de Stock por SKU ({stockList.length})
        </button>
        <button
          type="button"
          className={`subtab-btn ${activeSubTab === 'kardex' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('kardex')}
        >
          Historial de Kardex ({movements.length} transacciones)
        </button>
      </div>

      {/* VISTA 1: SALDOS DE STOCK */}
      {activeSubTab === 'stock' && (
        <div className="subtab-content">
          <div className="filter-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Filtrar por SKU o nombre de producto..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
              />
            </div>

            <div className="filter-select">
              <select
                value={stockAlertFilter}
                onChange={(e) => setStockAlertFilter(e.target.value)}
              >
                <option value="ALL">Todas las Alertas</option>
                <option value="ALERT_ONLY">Solo en Alerta (Crítico / Bajo)</option>
                <option value="CRITICO">Solo Críticos</option>
                <option value="OK">Solo Stock Seguro (OK)</option>
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Unidad</th>
                  <th style={{ textAlign: 'right' }}>Stock Físico</th>
                  <th style={{ textAlign: 'right' }}>Stock Reservado</th>
                  <th style={{ textAlign: 'right' }}>Stock Disponible</th>
                  <th style={{ textAlign: 'center' }}>Mín / Seg</th>
                  <th style={{ textAlign: 'center' }}>Alerta</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4">
                      Calculando saldos en tiempo real...
                    </td>
                  </tr>
                ) : filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4">
                      No se encontraron productos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => (
                    <tr key={item.productId}>
                      <td className="sku-cell">{item.sku}</td>
                      <td className="product-name-cell">
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.categoryName}</td>
                      <td>{item.unitMeasure}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="stock-number physical">{item.physicalStock.toLocaleString()}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="stock-number reserved">{item.reservedStock.toLocaleString()}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className="stock-number available">
                          {item.availableStock.toLocaleString()}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="text-muted text-sm">
                          {item.minStock} / {item.securityStock}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{renderAlertBadge(item.statusAlert)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-action btn-action-primary"
                          onClick={() => handleOpenMovementModal(item.productId)}
                          title="Registrar movimiento rápido para este SKU"
                        >
                          + Movimiento
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: KARDEX INMUTABLE */}
      {activeSubTab === 'kardex' && (
        <div className="subtab-content">
          <div className="filter-bar">
            <div className="filter-select" style={{ minWidth: '240px' }}>
              <select
                value={selectedProductFilter}
                onChange={(e) => setSelectedProductFilter(e.target.value)}
              >
                <option value="">Todos los Productos</option>
                {productOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select">
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
              >
                <option value="">Todos los Tipos de Transacción</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SALIDA">Salida</option>
                <option value="AJUSTE_POSITIVO">Ajuste Positivo (+)</option>
                <option value="AJUSTE_NEGATIVO">Ajuste Negativo (-)</option>
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Tipo</th>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th style={{ textAlign: 'right' }}>Cantidad</th>
                  <th>Doc. Referencia</th>
                  <th>Responsable</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      Cargando historial de movimientos del Kardex...
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4">
                      No se registran movimientos con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  movements.map((mov) => {
                    const isPositive = mov.type === 'ENTRADA' || mov.type === 'AJUSTE_POSITIVO';
                    return (
                      <tr key={mov.id}>
                        <td className="text-sm">{formatDateTime(mov.movementDate || mov.createdAt)}</td>
                        <td>{renderBadgeType(mov.type)}</td>
                        <td className="sku-cell">{mov.product?.sku || 'N/A'}</td>
                        <td className="product-name-cell">{mov.product?.name || 'N/A'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className={`quantity-cell ${isPositive ? 'qty-positive' : 'qty-negative'}`}
                          >
                            {isPositive ? `+${mov.quantity}` : `-${mov.quantity}`}
                          </span>
                        </td>
                        <td>
                          <span className="reference-doc-tag">
                            {mov.referenceDoc || 'Sin Ref.'}
                          </span>
                        </td>
                        <td>{mov.responsible}</td>
                        <td className="text-muted text-sm">{mov.notes || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para registrar nuevo movimiento */}
      <MovementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleMovementSuccess}
        initialProductId={preselectedProductId}
        products={productOptions}
      />
    </div>
  );
};

