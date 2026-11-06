import React from 'react';

export type TabKey =
  | 'products'
  | 'inventory'
  | 'customer-orders'
  | 'purchase-orders'
  | 'receipts'
  | 'stock-counts'
  | 'replenishment'
  | 'dashboard';

interface NavbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const navItems: { key: TabKey; label: string; badge?: string }[] = [
    { key: 'products', label: 'Catálogo de Productos' },
    { key: 'inventory', label: 'Inventario & Kardex' },
    { key: 'customer-orders', label: 'Pedidos Clientes' },
    { key: 'purchase-orders', label: 'Compras' },
    { key: 'receipts', label: 'Recepciones' },
    { key: 'stock-counts', label: 'Conteos Físicos' },
    { key: 'replenishment', label: 'Punto de Reorden' },
    { key: 'dashboard', label: 'Dashboard' },
  ];

  return (
    <header className="navbar-container">
      <div className="navbar-top">
        <div className="navbar-brand">
          <div className="brand-logo">J</div>
          <div>
            <h1 className="brand-title">Juliam Corp LLC</h1>
            <p className="brand-subtitle">Gestión Integral de Almacén e Inventario</p>
          </div>
        </div>
        <div className="navbar-user-info">
          <span className="user-role-badge">ADMIN</span>
          <span className="user-email">juliam@admin.com</span>
        </div>
      </div>

      <nav className="navbar-tabs">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`tab-button ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => onTabChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
};

