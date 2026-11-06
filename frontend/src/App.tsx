import { useState } from 'react';
import './App.css';
import { Navbar, type TabKey } from './components/navigation/Navbar.js';
import { ProductList } from './components/products/ProductList.js';
import { InventoryView } from './components/inventory/InventoryView.js';
import { CustomerOrdersView } from './components/customer-orders/CustomerOrdersView.js';
import { PurchaseOrdersView } from './components/purchase-orders/PurchaseOrdersView.js';

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('products');

  return (
    <div className="app-layout">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="main-content">
        {activeTab === 'products' && <ProductList />}

        {activeTab === 'inventory' && <InventoryView />}

        {activeTab === 'customer-orders' && <CustomerOrdersView />}

        {activeTab === 'purchase-orders' && <PurchaseOrdersView />}

        {activeTab === 'receipts' && (
          <div className="placeholder-module">
            <div className="placeholder-card">
              <span className="step-tag">Paso 7 del Plan</span>
              <h3>Módulo de Recepción de Mercancía en Almacén</h3>
              <p>
                Este módulo se implementará en el <strong>Paso 7</strong>: Verificación física en muelle de descarga, recepciones parciales y entradas automáticas al stock físico.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'stock-counts' && (
          <div className="placeholder-module">
            <div className="placeholder-card">
              <span className="step-tag">Paso 8 del Plan</span>
              <h3>Módulo de Conteos Físicos y Auditoría de Ajustes</h3>
              <p>
                Este módulo se implementará en el <strong>Paso 8</strong>: Conteos ciegos periódicos, cálculo de desviaciones y aprobación auditada de ajustes de inventario.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'replenishment' && (
          <div className="placeholder-module">
            <div className="placeholder-card">
              <span className="step-tag">Paso 9 del Plan</span>
              <h3>Módulo de Reposición y Sugerencias de Compra</h3>
              <p>
                Este módulo se implementará en el <strong>Paso 9</strong>: Motor matemático de Punto de Reorden ($ROP$), Posición de Inventario y sugerencias automáticas de abastecimiento.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="placeholder-module">
            <div className="placeholder-card">
              <span className="step-tag">Paso 10 del Plan</span>
              <h3>Dashboard de Operaciones y Resumen Ejecutivo</h3>
              <p>
                Este módulo se implementará en el <strong>Paso 10</strong>: Indicadores de stock crítico, órdenes pendientes y movimientos consolidados en tiempo real.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Juliam Corp LLC &bull; Sistema Centralizado de Inventario &bull; Solución Integral
          2026
        </p>
      </footer>
    </div>
  );
}

export default App;
