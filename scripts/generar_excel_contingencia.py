import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
import os

wb = openpyxl.Workbook()
# remove default sheet
wb.remove(wb.active)

# Styles
font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
fill_header_navy = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
fill_header_teal = PatternFill(start_color="135E6E", end_color="135E6E", fill_type="solid")
fill_header_slate = PatternFill(start_color="333F48", end_color="333F48", fill_type="solid")
fill_header_purple = PatternFill(start_color="4A235A", end_color="4A235A", fill_type="solid")
fill_header_green = PatternFill(start_color="196F3D", end_color="196F3D", fill_type="solid")
fill_header_orange = PatternFill(start_color="A04000", end_color="A04000", fill_type="solid")

font_regular = Font(name="Calibri", size=10)
font_bold = Font(name="Calibri", size=10, bold=True)
align_center = Alignment(horizontal="center", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")

thin_border = Border(
    left=Side(style='thin', color='D9D9D9'),
    right=Side(style='thin', color='D9D9D9'),
    top=Side(style='thin', color='D9D9D9'),
    bottom=Side(style='thin', color='D9D9D9')
)

# ----------------------------------------------------
# 1. HOJA: Productos
# ----------------------------------------------------
ws_prod = wb.create_sheet(title="Productos")
ws_prod.sheet_properties.tabColor = "1F4E78"
prod_headers = [
    "SKU", "Producto", "Categoría", "Descripción", "Unidad_Medida",
    "Factor_Conversión", "Stock_Mínimo", "Stock_Seguridad", "Estado"
]
ws_prod.append(prod_headers)

prod_data = [
    ["VAS-001", "Vaso plástico 12 oz", "Vasos", "Vaso transparente desechable 12oz para bebidas frías", "Paquete", 50, 100, 120, "Activo"],
    ["ENV-001", "Envase plástico 500 ml", "Envases", "Envase térmico multiuso con tapa hermética", "Paquete", 25, 80, 100, "Activo"],
    ["CUB-001", "Cubiertos desechables", "Cubiertos", "Set tenedor + cuchillo + servilleta reforzado", "Caja", 100, 50, 60, "Activo"],
    ["SER-001", "Servilletas blancas 100u", "Servilletas", "Servilletas absorbentes de mesa doble hoja", "Paquete", 100, 150, 175, "Activo"],
    ["EMP-001", "Bolsas kraft delivery #8", "Empaques", "Bolsa de papel resistente para delivery", "Bulto", 250, 40, 50, "Activo"]
]
for row in prod_data:
    ws_prod.append(row)

# ----------------------------------------------------
# 2. HOJA: Movimientos
# ----------------------------------------------------
ws_mov = wb.create_sheet(title="Movimientos")
ws_mov.sheet_properties.tabColor = "135E6E"
mov_headers = [
    "ID_Movimiento", "Fecha", "SKU", "Tipo_Movimiento", "Cantidad",
    "Documento_Ref", "Responsable", "Observaciones"
]
ws_mov.append(mov_headers)

mov_data = [
    [1, "2026-11-04", "VAS-001", "Entrada", 300, "REC-001", "Carlos Pérez", "Recepción parcial de COM-001 (llegaron 300 de 500 pedidas)"],
    [2, "2026-11-04", "VAS-001", "Salida", 50, "PED-001", "María Gómez", "Despacho parcial a Distribuidora Los Andes"],
    [3, "2026-11-05", "ENV-001", "Entrada", 200, "REC-002", "Carlos Pérez", "Recepción completa orden COM-002"],
    [4, "2026-11-05", "CUB-001", "Ajuste Positivo", 10, "AJU-001", "Jesús Balza", "Ajuste tras conteo físico auditado Día 1"],
    [5, "2026-11-05", "SER-001", "Salida", 40, "PED-004", "María Gómez", "Despacho pedido Burger House"]
]
for row in mov_data:
    ws_mov.append(row)

# ----------------------------------------------------
# 3. HOJA: Pedidos_Clientes
# ----------------------------------------------------
ws_ped = wb.create_sheet(title="Pedidos_Clientes")
ws_ped.sheet_properties.tabColor = "333F48"
ped_headers = [
    "Numero_Pedido", "Fecha", "Cliente", "SKU", "Cant_Solicitada",
    "Cant_Despachada", "Cant_Pendiente", "Estado"
]
ws_ped.append(ped_headers)

ped_data = [
    ["PED-001", "2026-11-04", "Distribuidora Los Andes", "VAS-001", 100, 50],
    ["PED-002", "2026-11-05", "Restaurante El Fogón", "ENV-001", 80, 0],
    ["PED-003", "2026-11-05", "Café del Valle", "CUB-001", 40, 40],
    ["PED-004", "2026-11-05", "Burger House", "SER-001", 100, 40],
    ["PED-005", "2026-11-05", "Gourmet Express", "EMP-001", 30, 0]
]
for i, row in enumerate(ped_data, start=2):
    cant_pend_formula = f"=MAX(0, E{i}-F{i})"
    estado_formula = f'=IF(G{i}=0, "Despachado", IF(F{i}>0, "Parcial", "Pendiente"))'
    ws_ped.append(row + [cant_pend_formula, estado_formula])

# ----------------------------------------------------
# 4. HOJA: Compras_Proveedores
# ----------------------------------------------------
ws_com = wb.create_sheet(title="Compras_Proveedores")
ws_com.sheet_properties.tabColor = "4A235A"
com_headers = [
    "Numero_Compra", "Fecha_Emision", "Proveedor", "SKU", "Cant_Pedida",
    "Cant_Recibida", "Cant_Pendiente", "Estado"
]
ws_com.append(com_headers)

com_data = [
    ["COM-001", "2026-11-02", "Plásticos Industriales S.A.", "VAS-001", 500, 300],
    ["COM-002", "2026-11-03", "Envases del Norte", "ENV-001", 200, 200],
    ["COM-003", "2026-11-04", "Cubiertos & Menaje S.A.", "CUB-001", 100, 0],
    ["COM-004", "2026-11-05", "Papelera Central", "SER-001", 300, 0],
    ["COM-005", "2026-11-05", "Empaques Ecológicos", "EMP-001", 150, 0]
]
for i, row in enumerate(com_data, start=2):
    cant_pend_formula = f"=MAX(0, E{i}-F{i})"
    estado_formula = f'=IF(G{i}=0, "Recibido", IF(F{i}>0, "Parcial", "Pendiente"))'
    ws_com.append(row + [cant_pend_formula, estado_formula])

# ----------------------------------------------------
# 5. HOJA: Inventario
# ----------------------------------------------------
ws_inv = wb.create_sheet(title="Inventario")
ws_inv.sheet_properties.tabColor = "196F3D"
inv_headers = [
    "SKU", "Producto", "Conteo_Inicial", "Total_Entradas", "Total_Salidas",
    "Stock_Fisico", "Stock_Reservado", "Stock_Disponible", "Estado_Alerta"
]
ws_inv.append(inv_headers)

initial_counts = {
    "VAS-001": 80,
    "ENV-001": 100,
    "CUB-001": 50,
    "SER-001": 40,
    "EMP-001": 60
}

for i in range(2, 7):
    p_row = i
    sku_formula = f"=Productos!A{p_row}"
    prod_formula = f'=VLOOKUP(A{i}, Productos!A:D, 2, FALSE)'
    conteo_ini = initial_counts.get(prod_data[i-2][0], 0)
    # Total entradas = Entradas + Ajustes Positivos
    tot_entradas = f'=SUMIFS(Movimientos!E:E, Movimientos!C:C, A{i}, Movimientos!D:D, "Entrada") + SUMIFS(Movimientos!E:E, Movimientos!C:C, A{i}, Movimientos!D:D, "Ajuste Positivo")'
    # Total salidas = Salidas + Ajustes Negativos
    tot_salidas = f'=SUMIFS(Movimientos!E:E, Movimientos!C:C, A{i}, Movimientos!D:D, "Salida") + SUMIFS(Movimientos!E:E, Movimientos!C:C, A{i}, Movimientos!D:D, "Ajuste Negativo")'
    stock_fisico = f'=C{i} + D{i} - E{i}'
    stock_res = f'=SUMIF(Pedidos_Clientes!D:D, A{i}, Pedidos_Clientes!G:G)'
    stock_disp = f'=F{i} - G{i}'
    alerta_formula = f'=IF(H{i}<=0, "CRÍTICO", IF(H{i}<Productos!G{p_row}, "BAJO", "OK"))'
    
    ws_inv.append([
        sku_formula, prod_formula, conteo_ini, tot_entradas, tot_salidas,
        stock_fisico, stock_res, stock_disp, alerta_formula
    ])

# ----------------------------------------------------
# 6. HOJA: Reposicion
# ----------------------------------------------------
ws_rep = wb.create_sheet(title="Reposicion")
ws_rep.sheet_properties.tabColor = "A04000"
rep_headers = [
    "SKU", "Producto", "Demanda_Diaria", "Tiempo_Entrega_Dias", "Stock_Seguridad",
    "Punto_Reorden", "Stock_Disponible", "Compras_En_Transito", "Posicion_Inventario",
    "Accion_Sugerida", "Cantidad_Sugerida"
]
ws_rep.append(rep_headers)

demand_and_lead = [
    (40, 5),  # VAS-001 (40/día, 5 días)
    (25, 4),  # ENV-001
    (15, 6),  # CUB-001
    (30, 4),  # SER-001
    (10, 5)   # EMP-001
]

for i in range(2, 7):
    p_row = i
    sku_formula = f"=Productos!A{p_row}"
    prod_formula = f'=VLOOKUP(A{i}, Productos!A:D, 2, FALSE)'
    dem_dia, lead_time = demand_and_lead[i-2]
    stock_seg = f"=Productos!H{p_row}"
    punto_reorden = f"=(C{i} * D{i}) + E{i}"
    stock_disp = f"=Inventario!H{i}"
    compras_transito = f"=SUMIF(Compras_Proveedores!D:D, A{i}, Compras_Proveedores!G:G)"
    posicion = f"=G{i} + H{i}"
    accion = f'=IF(I{i} <= F{i}, "COMPRAR", "OK")'
    cant_sugerida = f'=IF(J{i}="COMPRAR", MAX(0, F{i} + (C{i} * 7) - I{i}), 0)'

    ws_rep.append([
        sku_formula, prod_formula, dem_dia, lead_time, stock_seg,
        punto_reorden, stock_disp, compras_transito, posicion,
        accion, cant_sugerida
    ])

# ----------------------------------------------------
# Formateo y Ajuste de Columnas
# ----------------------------------------------------
sheets = [
    (ws_prod, fill_header_navy),
    (ws_mov, fill_header_teal),
    (ws_ped, fill_header_slate),
    (ws_com, fill_header_purple),
    (ws_inv, fill_header_green),
    (ws_rep, fill_header_orange)
]

for ws, header_fill in sheets:
    ws.views.sheetView[0].showGridLines = True
    
    # Headers
    for col in range(1, ws.max_column + 1):
        cell = ws.cell(row=1, column=col)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = align_center
        cell.border = thin_border
    
    # Data Rows
    for row in range(2, ws.max_row + 1):
        for col in range(1, ws.max_column + 1):
            cell = ws.cell(row=row, column=col)
            cell.font = font_regular
            cell.border = thin_border
            if isinstance(cell.value, (int, float)):
                cell.alignment = align_right
            elif str(cell.value).startswith("="):
                cell.alignment = align_right
            else:
                cell.alignment = align_left

    # Auto-width
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            v_str = str(cell.value or "")
            if len(v_str) > max_len and not v_str.startswith("="):
                max_len = len(v_str)
            elif v_str.startswith("="):
                max_len = max(max_len, 14)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

# Validaciones de Datos en Movimientos
dv_tipo_mov = DataValidation(type="list", formula1='"Entrada,Salida,Ajuste Positivo,Ajuste Negativo"', allow_blank=True)
ws_mov.add_data_validation(dv_tipo_mov)
dv_tipo_mov.add("D2:D100")

# Validaciones en Productos
dv_estado = DataValidation(type="list", formula1='"Activo,Inactivo"', allow_blank=True)
ws_prod.add_data_validation(dv_estado)
dv_estado.add("I2:I100")

dv_cat = DataValidation(type="list", formula1='"Envases,Vasos,Cubiertos,Servilletas,Empaques"', allow_blank=True)
ws_prod.add_data_validation(dv_cat)
dv_cat.add("C2:C100")

# Guardar Archivo
output_dir = r"C:\TrabajoVirtual\Corp LLC\contingency"
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "Control_Inventario_Juliam.xlsx")
wb.save(output_path)
print(f"Archivo Excel generado exitosamente en: {output_path}")

