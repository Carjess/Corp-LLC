/**
 * Estados de ciclo de vida para órdenes de clientes y compras a proveedores.
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
