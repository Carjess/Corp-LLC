import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventory/inventory.service.js';
import { stockCountsService } from '../../services/stock-counts/stock-counts.service.js';
import type { ProductStockSummary } from '../../services/inventory/inventory.types.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Pill } from '../ui/Pill.js';

interface CreateStockCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedProductId?: string;
}

export const CreateStockCountModal: React.FC<CreateStockCountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedProductId,
}) => {
  const [stockList, setStockList] = useState<ProductStockSummary[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [countedStock, setCountedStock] = useState<number | ''>('');
  const [counterName, setCounterName] = useState<string>('juliam@admin.com');
  const [approverName, setApproverName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [applyAdjustment, setApplyAdjustment] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProductsStock();
    }
  }, [isOpen]);

  const loadProductsStock = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await inventoryService.getStockSummary();
      setStockList(list);

      const targetId =
        preselectedProductId && list.some((p) => p.productId === preselectedProductId)
          ? preselectedProductId
          : list.length > 0
            ? list[0].productId
            : '';

      setSelectedProductId(targetId);
      setCountedStock('');
      setCounterName('juliam@admin.com');
      setApproverName('Auditor Jefe Almacén');
      setNotes('');
      setApplyAdjustment(true);
    } catch (err: unknown) {
      console.error('Error al cargar saldos de stock para conteo:', err);
      setError('Error al consultar los productos y existencias actuales.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = stockList.find((p) => p.productId === selectedProductId);
  const systemStock = selectedProduct ? selectedProduct.physicalStock : 0;

  const hasCountValue = countedStock !== '';
  const difference = hasCountValue ? Number(countedStock) - systemStock : 0;
  const hasDiscrepancy = hasCountValue && difference !== 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProductId) {
      setError('Debe seleccionar un producto del catálogo.');
      return;
    }

    if (countedStock === '' || Number(countedStock) < 0) {
      setError('Debe ingresar un conteo físico observado válido (mayor o igual a cero).');
      return;
    }

    if (hasDiscrepancy && applyAdjustment) {
      if (!notes.trim()) {
        setError('Al existir discrepancia, el motivo o justificación de auditoría es obligatorio.');
        return;
      }
      if (!approverName.trim()) {
        setError('Debe indicar el nombre del auditor o responsable que autoriza el ajuste.');
        return;
      }
    }

    setLoading(true);

    try {
      await stockCountsService.createCount({
        productId: selectedProductId,
        countedStock: Math.floor(Number(countedStock)),
        counterName: counterName.trim() || 'juliam@admin.com',
        approverName: approverName.trim() || undefined,
        notes: notes.trim() || undefined,
        applyAdjustment,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al registrar la conciliación física de inventario.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Conteo Físico & Auditoría"
      subtitle="Conciliación de existencias observadas en estanterías con generación automática de ajustes de Kardex."
      maxWidth={680}
    >
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label className="form-label" htmlFor="count-product">
            Producto a Conciliar *
          </label>
          <select
            id="count-product"
            className="in"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            required
            disabled={loading}
            style={{ cursor: 'pointer' }}
          >
            {stockList.map((p) => (
              <option key={p.productId} value={p.productId}>
                [{p.sku}] {p.name} — Físico Actual: {p.physicalStock} {p.unitMeasure}s
              </option>
            ))}
          </select>
        </div>

        {/* Comparador de Stock: Sistema vs Conteo Físico */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 14,
            background: 'var(--bg-app)',
            padding: 16,
            borderRadius: 20,
            border: '1px solid var(--border-color)',
            alignItems: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span className="form-label" style={{ marginBottom: 4 }}>Stock Físico Sistema</span>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}>
              {systemStock} <small style={{ fontSize: 13, fontWeight: 400 }}>uds</small>
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="counted-stock" style={{ textAlign: 'center' }}>
              Conteo Observado *
            </label>
            <input
              id="counted-stock"
              className="in"
              type="number"
              min="0"
              step="1"
              value={countedStock}
              onChange={(e) => setCountedStock(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ej. 160"
              required
              disabled={loading}
              style={{ textAlign: 'center', fontSize: 18, fontWeight: 700 }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <span className="form-label" style={{ marginBottom: 4 }}>Variación (&Delta;)</span>
            <div style={{ minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!hasCountValue ? (
                <span className="text-muted" style={{ fontSize: 14 }}>Esperando conteo...</span>
              ) : difference === 0 ? (
                <Pill variant="success">Cuadrado (0)</Pill>
              ) : difference > 0 ? (
                <Pill variant="info">+{difference} (Sobrante)</Pill>
              ) : (
                <Pill variant="danger">{difference} (Faltante)</Pill>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="form-label" htmlFor="counter-name">Operador Contador</label>
            <input
              id="counter-name"
              className="in"
              type="text"
              value={counterName}
              onChange={(e) => setCounterName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="approver-name">
              Auditor / Aprobador {hasDiscrepancy && '*'}
            </label>
            <input
              id="approver-name"
              className="in"
              type="text"
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              placeholder="Ej. Auditor Jefe Almacén"
              required={hasDiscrepancy && applyAdjustment}
              disabled={loading}
            />
          </div>
        </div>

        {hasDiscrepancy && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 16,
              backgroundColor: difference > 0 ? 'var(--status-info-bg)' : 'var(--status-danger-bg)',
              color: difference > 0 ? 'var(--status-info-text)' : 'var(--status-danger-text)',
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            <strong>{difference > 0 ? 'Sobrante Físico detectado:' : 'Faltante / Merma detectada:'}</strong>{' '}
            Se generará automáticamente un movimiento de{' '}
            <strong>{difference > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO'}</strong> por{' '}
            <strong>{Math.abs(difference)} unidades</strong> en el Kardex al confirmar.
          </div>
        )}

        <div>
          <label className="form-label" htmlFor="count-notes">
            Motivo / Justificación de Auditoría {hasDiscrepancy && '*'}
          </label>
          <textarea
            id="count-notes"
            className="in"
            style={{ minHeight: 70, resize: 'vertical' }}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              hasDiscrepancy
                ? 'Explique la causa comprobada: rotura de empaque, error de picking, sobrante en tarima...'
                : 'Observaciones opcionales del conteo cíclico...'
            }
            required={hasDiscrepancy && applyAdjustment}
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <input
            id="apply-adjustment"
            type="checkbox"
            checked={applyAdjustment}
            onChange={(e) => setApplyAdjustment(e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
            disabled={loading}
          />
          <label htmlFor="apply-adjustment" style={{ fontSize: 13, color: 'var(--text-main)', margin: 0, cursor: 'pointer' }}>
            Aplicar ajuste de inventario inmediatamente en el Kardex inmutable
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            {hasDiscrepancy && applyAdjustment ? 'Aplicar Ajuste y Conciliar' : 'Guardar Conteo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

