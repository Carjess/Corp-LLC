import React from 'react';
import {
  Boxes,
  ClipboardCheck,
  FolderTree,
  LayoutDashboard,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
} from 'lucide-react';

export type TabKey =
  | 'products'
  | 'inventory'
  | 'customer-orders'
  | 'purchase-orders'
  | 'receipts'
  | 'stock-counts'
  | 'replenishment'
  | 'dashboard';

interface NavigationItem {
  key: TabKey;
  title: string;
  icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  { key: 'products', title: 'Catálogo Productos', icon: <Package size={17} /> },
  { key: 'inventory', title: 'Inventario & Kardex', icon: <Boxes size={17} /> },
  { key: 'customer-orders', title: 'Pedidos Clientes', icon: <ShoppingCart size={17} /> },
  { key: 'purchase-orders', title: 'Compras Fabricantes', icon: <Truck size={17} /> },
  { key: 'receipts', title: 'Recepción Muelle', icon: <FolderTree size={17} /> },
  { key: 'stock-counts', title: 'Conteos Físicos', icon: <ClipboardCheck size={17} /> },
  { key: 'replenishment', title: 'Punto de Reorden', icon: <RefreshCw size={17} /> },
  { key: 'dashboard', title: 'Dashboard', icon: <LayoutDashboard size={17} /> },
];

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          J
        </div>
        <div className="sidebar-brand-text">
          <b>Juliam Corp</b>
          <span>Gestión de Almacén</span>
        </div>
      </div>

      {/* Navigation Links (Pill Style) */}
      <nav className="sidebar-nav">
        {navigationItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.key)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer to push user card to the bottom */}
      <div className="sidebar-spacer" />

      {/* Bottom User Card */}
      <div className="sidebar-user-card">
        <div className="user-avatar">
          J
        </div>
        <div className="user-details">
          <b className="user-name">juliam@admin.com</b>
          <span className="user-role">Administrador</span>
        </div>
      </div>
    </aside>
  );
};

