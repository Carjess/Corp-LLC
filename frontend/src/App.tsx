import { useState } from 'react';
import './App.css';
import { Sidebar, type TabKey } from './components/layout/Sidebar.js';
import { ProductList } from './components/products/ProductList.js';
import { InventoryView } from './components/inventory/InventoryView.js';
import { CustomerOrdersView } from './components/customer-orders/CustomerOrdersView.js';
import { PurchaseOrdersView } from './components/purchase-orders/PurchaseOrdersView.js';
import { ReceiptsView } from './components/receipts/ReceiptsView.js';
import { StockCountsView } from './components/stock-counts/StockCountsView.js';
import { ReplenishmentView } from './components/replenishment/ReplenishmentView.js';
import { DashboardView } from './components/dashboard/DashboardView.js';

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('products');

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="main-content">
        {activeTab === 'products' && <ProductList />}

        {activeTab === 'inventory' && <InventoryView />}

        {activeTab === 'customer-orders' && <CustomerOrdersView />}

        {activeTab === 'purchase-orders' && <PurchaseOrdersView />}

        {activeTab === 'receipts' && <ReceiptsView />}

        {activeTab === 'stock-counts' && <StockCountsView />}

        {activeTab === 'replenishment' && <ReplenishmentView />}

        {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}

        <footer className="app-footer">
          <p>
            Juliam Corp LLC &bull; Sistema Centralizado de Inventario &bull; Solución Integral
            2026
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
