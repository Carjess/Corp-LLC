import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventory/inventory.service.js';
import type { MovementType } from '../../services/inventory/inventory.types.js';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

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
        return 'Suma unidades al Stock Físico (ingreso o recepción).';
      case 'SALIDA':
        return 'Resta unidades al Stock Físico. Requiere saldo físico suficiente.';
      case 'AJUSTE_POSITIVO':
        return 'Ajuste auditado: incrementa el Stock Físico por sobrante en conteo.';
      case 'AJUSTE_NEGATIVO':
        return 'Ajuste auditado: reduce el Stock Físico por merma o rotura.';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Movimiento de Kardex"
      subtitle="Transacción inmutable con actualización automática de existencias físicas y disponibles."
      maxWidth={620}
    >
      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="form-label" htmlFor="mov-product">
            Producto (SKU & Nombre) *
          </label>
          <select
            id="mov-product"
            className="in"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            disabled={loading}
            style={{ cursor: 'pointer' }}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="form-label" htmlFor="mov-type">
              Tipo de Transacción *
            </label>
            <select
              id="mov-type"
              className="in"
              value={type}
              onChange={(e) => setType(e.target.value as MovementType)}
              required
              disabled={loading}
              style={{ cursor: 'pointer' }}
            >
              <option value="ENTRADA">ENTRADA (+ Stock)</option>
              <option value="SALIDA">SALIDA (- Stock)</option>
              <option value="AJUSTE_POSITIVO">AJUSTE POSITIVO (+)</option>
              <option value="AJUSTE_NEGATIVO">AJUSTE NEGATIVO (-)</option>
            </select>
            <small className="help-text">{getMovementDescription(type)}</small>
          </div>

          <div>
            <label className="form-label" htmlFor="mov-quantity">
              Cantidad de Unidades *
            </label>
            <input
              id="mov-quantity"
              className="in"
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

        <div>
          <label className="form-label" htmlFor="mov-ref">Documento de Referencia</label>
          <input
            id="mov-ref"
            className="in"
            type="text"
            value={referenceDoc}
            onChange={(e) => setReferenceDoc(e.target.value)}
            placeholder="Ej. REC-002, FAC-1049, AJU-001"
            disabled={loading}
          />
          <small className="help-text">Orden de compra, factura, guía o número de ajuste.</small>
        </div>

        <div>
          <label className="form-label" htmlFor="mov-notes">Observaciones / Motivo</label>
          <textarea
            id="mov-notes"
            className="in"
            style={{ minHeight: 70, resize: 'vertical' }}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalle o justificación de la transacción..."
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
            Cancelar
          </Button>
          <Button variant="primary" type="submit" isLoading={loading}>
            Confirmar Transacción
          </Button>
        </div>
      </form>
    </Modal>
  );
};
