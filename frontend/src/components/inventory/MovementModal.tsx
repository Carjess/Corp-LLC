import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventory/inventory.service.js';
import type { MovementType } from '../../services/inventory/inventory.types.js';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProductId?: string;
  products: { id: string; sku: string; name: string }[];
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProductId,
  products,
}) => {
  const [productId, setProductId] = useState<string>('');
  const [type, setType] = useState<MovementType>('ENTRADA');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [referenceDoc, setReferenceDoc] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProductId(initialProductId || (products.length > 0 ? products[0].id : ''));
      setType('ENTRADA');
      setQuantity('');
      setReferenceDoc('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, initialProductId, products]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productId) {
      setError('Debe seleccionar un producto.');
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('La cantidad debe ser un número entero mayor a 0.');
      return;
    }

    setLoading(true);

    try {
      await inventoryService.createMovement({
        productId,
        type,
        quantity: Math.floor(qty),
        referenceDoc: referenceDoc.trim() || undefined,
        responsible: 'Administrador (juliam@admin.com)',
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al registrar el movimiento en el Kardex');
      }
    } finally {
      setLoading(false);
    }
  };

  const getMovementDescription = (movType: MovementType) => {
    switch (movType) {
      case 'ENTRADA':
        return 'Suma unidades al Stock Físico (ingreso manual o recepción de mercancía).';
      case 'SALIDA':
        return 'Resta unidades al Stock Físico (despacho directo o merma). Requiere saldo físico suficiente.';
      case 'AJUSTE_POSITIVO':
        return 'Ajuste auditado: incrementa el Stock Físico por sobrante en conteo.';
      case 'AJUSTE_NEGATIVO':
        return 'Ajuste auditado: reduce el Stock Físico por rotura, daño o merma comprobada.';
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Registrar Movimiento de Kardex</h3>
            <p className="modal-subtitle">
              Transacción inmutable de almacén con actualización automática de stock físico y disponible.
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} disabled={loading}>
            &times;
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="mov-product">
              Producto (SKU & Nombre) <span className="required">*</span>
            </label>
            <select
              id="mov-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              disabled={loading}
            >
              <option value="" disabled>
                Seleccione un producto...
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="mov-type">
                Tipo de Transacción <span className="required">*</span>
              </label>
              <select
                id="mov-type"
                value={type}
                onChange={(e) => setType(e.target.value as MovementType)}
                required
                disabled={loading}
              >
                <option value="ENTRADA">ENTRADA (+ Stock)</option>
                <option value="SALIDA">SALIDA (- Stock)</option>
                <option value="AJUSTE_POSITIVO">AJUSTE POSITIVO (+)</option>
                <option value="AJUSTE_NEGATIVO">AJUSTE NEGATIVO (-)</option>
              </select>
              <span className="help-text">{getMovementDescription(type)}</span>
            </div>

            <div className="form-group">
              <label htmlFor="mov-quantity">
                Cantidad de Unidades <span className="required">*</span>
              </label>
              <input
                id="mov-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ej. 100"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mov-ref">Documento de Referencia</label>
            <input
              id="mov-ref"
              type="text"
              value={referenceDoc}
              onChange={(e) => setReferenceDoc(e.target.value)}
              placeholder="Ej. REC-002, FAC-1049, AJU-001"
              disabled={loading}
            />
            <span className="help-text">Orden de compra, factura, guía o número de ajuste</span>
          </div>

          <div className="form-group">
            <label htmlFor="mov-notes">Observaciones / Motivo</label>
            <textarea
              id="mov-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle o justificación de la transacción..."
              disabled={loading}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando en Kardex...' : 'Confirmar Transacción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

