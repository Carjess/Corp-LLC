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
  const [responsible, setResponsible] = useState<string>('Administrador (juliam@admin.com)');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProductId(initialProductId || (products.length > 0 ? products[0].id : ''));
      setType('ENTRADA');
      setQuantity('');
      setReferenceDoc('');
      setResponsible('Administrador (juliam@admin.com)');
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
        responsible: responsible.trim() || 'Administrador (juliam@admin.com)',
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
        return 'Suma unidades al Stock Físico (ingreso o recepción)';
      case 'SALIDA':
        return 'Resta unidades al Stock Físico (despacho o consumo)';
      case 'AJUSTE_POSITIVO':
        return 'Incrementa Stock Físico por sobrante verificado';
      case 'AJUSTE_NEGATIVO':
        return 'Reduce Stock Físico por merma o rotura auditada';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Movimiento de Kardex"
      subtitle="Transacción inmutable con actualización automática de existencias físicas y disponibles."
      maxWidth={640}
    >
      {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Fila 1: Producto (Ancho Completo 100%) */}
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
            style={{ cursor: 'pointer', width: '100%' }}
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

        {/* Fila 2: Tipo de Transacción y Cantidad (Grid 2 Columnas 50% / 50%) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'flex-start' }}>
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
              style={{ cursor: 'pointer', width: '100%' }}
            >
              <option value="ENTRADA">ENTRADA (+ Stock)</option>
              <option value="SALIDA">SALIDA (- Stock)</option>
              <option value="AJUSTE_POSITIVO">AJUSTE POSITIVO (+)</option>
              <option value="AJUSTE_NEGATIVO">AJUSTE NEGATIVO (-)</option>
            </select>
            <span className="help-text">
              {getMovementDescription(type)}
            </span>
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
              style={{ width: '100%' }}
            />
            <span className="help-text">
              Unidades enteras a registrar
            </span>
          </div>
        </div>

        {/* Fila 3: Documento de Referencia y Responsable (Grid 2 Columnas 50% / 50%) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'flex-start' }}>
          <div>
            <label className="form-label" htmlFor="mov-ref">
              Documento de Referencia
            </label>
            <input
              id="mov-ref"
              className="in"
              type="text"
              value={referenceDoc}
              onChange={(e) => setReferenceDoc(e.target.value)}
              placeholder="Ej. REC-002, FAC-1049, AJU-001"
              disabled={loading}
              style={{ width: '100%' }}
            />
            <span className="help-text">
              Orden de compra, factura, guía o comprobante
            </span>
          </div>

          <div>
            <label className="form-label" htmlFor="mov-responsible">
              Responsable de Operación
            </label>
            <input
              id="mov-responsible"
              className="in"
              type="text"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              placeholder="Nombre o correo del operador"
              disabled={loading}
              style={{ width: '100%' }}
            />
            <span className="help-text">
              Usuario que ejecuta y audita el movimiento
            </span>
          </div>
        </div>

        {/* Fila 4: Observaciones / Motivo (Ancho Completo 100%) */}
        <div>
          <label className="form-label" htmlFor="mov-notes">
            Observaciones / Motivo
          </label>
          <textarea
            id="mov-notes"
            className="in"
            style={{ minHeight: 84, resize: 'vertical', width: '100%' }}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalle o justificación de la transacción en Kardex..."
            disabled={loading}
          />
        </div>

        {/* Footer: Botones Cancelar y Confirmar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 8,
            paddingTop: 16,
            borderTop: '1px solid var(--border-color)',
          }}
        >
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
