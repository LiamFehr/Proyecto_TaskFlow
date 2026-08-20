import { useState, useEffect } from 'react';
import './HelpCenter.css';

interface HelpCenterProps {
    role?: 'ADMIN' | 'VENDEDOR' | 'CLIENTE';
}

const TUTORIALS = {
    ADMIN: [
        { id: 'admin_dashboard', title: '📊 Panel de Control' },
        { id: 'admin_stock', title: '📦 Gestión de Stock' },
        { id: 'admin_products', title: '🏷️ Gestión de Productos' },
        { id: 'admin_backup', title: '💾 Backup y Seguridad' },
    ],
    VENDEDOR: [
        { id: 'vendedor_pedidos', title: '📋 Gestión de Pedidos en Cola' },
        { id: 'vendedor_ventas', title: '🛒 Realizar una Venta (POS)' },
        { id: 'vendedor_presupuesto', title: '📄 Generar Presupuestos' },
        { id: 'vendedor_registros', title: '📅 Historial y Registros' },
    ],
    CLIENTE: [],
};

const TUTORIAL_CONTENT: Record<string, string> = {
    admin_dashboard: `**Dashboard Principal**

El dashboard te muestra:
- Estadísticas en tiempo real
- Productos con stock crítico
- Valoración total del inventario
- Accesos rápidos a funciones principales

**Navegación:**
- Usa el menú lateral para acceder a cada sección
- El botón "Backup" descarga una copia de seguridad completa
- El botón "?" abre este centro de ayuda`,

    admin_stock: `**Cómo gestionar el inventario:**

1. **Ver Stock**: Navega a "Stock" en el menú lateral
2. **Buscar Productos**: Usa la barra de búsqueda para filtrar
3. **Paginación**: Navega entre páginas con los botones
4. **Exportar**: Descarga el inventario completo

**Indicadores:**
- 🟢 Verde: Stock disponible
- 🔴 Rojo: Stock agotado o crítico`,

    admin_products: `**Administrar Catálogo:**

1. **Editar Precios**: 
   - Haz clic en el ícono de lápiz
   - Ingresa el nuevo precio
   - Presiona guardar (✓)

2. **Buscar Productos**: Usa la barra de búsqueda

3. **Importar Productos**:
   - Usa el Agente IA
   - Arrastra archivos Excel/CSV
   - El sistema detecta automáticamente los encabezados`,

    admin_backup: `**Realizar Backup:**

1. Haz clic en el botón "Backup" en el header
2. El sistema descargará un archivo JSON con todos los datos

**Recomendaciones:**
- Realiza backups semanales
- Guarda los archivos en un lugar seguro
- Verifica que el archivo no esté vacío`,

    vendedor_pedidos: `**Ver y Modificar Pedidos en Cola:**

1. Ve a la sección "Pedidos" (pantalla principal)
2. Verás todos los pedidos pendientes en tarjetas
3. Haz clic en un pedido para ver sus detalles

**Modificar un Pedido:**
1. Selecciona el pedido que deseas modificar
2. Presiona "Modificar Pedido"
3. **Buscar Productos**: Usa el buscador integrado para agregar items
4. **Calculadora**: Haz clic en el ícono de calculadora para ver opciones de pago
5. **Editar Cantidades**: Ajusta las cantidades en el carrito
6. **Guardar Cambios**: Esto eliminará el pedido original y creará uno nuevo

**Importante:** Cuando modificas un pedido, el original se elimina automáticamente.`,

    vendedor_ventas: `**Proceso de Venta (POS):**

1. Ve a la sección "Ventas"
2. **Ingresar Cliente**: Completa el nombre del cliente
3. **Buscar Producto**: Usa la barra de búsqueda o escáner
4. **Agregar al Carrito**: Ajusta la cantidad según necesites
5. **Cerrar Pedido**: Revisa el total y confirma

**Atajos:**
- Enter: Buscar producto
- Items manuales: Puedes agregar productos sin código

**El pedido se envía a la cola de Caja para ser procesado.**`,

    vendedor_presupuesto: `**Crear Cotizaciones:**

1. Ve a "Presupuesto"
2. **Datos del Cliente**: Completa la información
3. **Agregar Productos**: Busca o ingresa items manuales
4. **Calcular**: Puedes ver diferentes opciones de pago
5. **Descargar PDF**: Presiona "Descargar PDF"

**Importante:** Los presupuestos NO descuentan stock ni generan pedidos.`,
};

export default function HelpCenter({ role = "ADMIN" }: HelpCenterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'manual' | 'tutorials'>('tutorials');
    const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);

    const tutorials = TUTORIALS[role] || TUTORIALS.ADMIN;

    // Expose openHelpCenter to window
    useEffect(() => {
        (window as any).openHelpCenter = () => {
            setIsOpen(true);
        };

        return () => {
            delete (window as any).openHelpCenter;
        };
    }, []);

    const onClose = () => {
        setIsOpen(false);
        setSelectedTutorial(null);
    };

    if (!isOpen) return null;

    return (
        <div className="help-modal-overlay" onClick={onClose}>
            <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="help-modal-header">
                    <h2>💡 Centro de Ayuda - {role === 'ADMIN' ? 'Administrador' : 'Vendedor'}</h2>
                    <button className="help-modal-close" onClick={onClose} aria-label="Cerrar">
                        ✕
                    </button>
                </div>

                <div className="help-tabs">
                    <button
                        className={`help-tab ${activeTab === 'tutorials' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('tutorials'); setSelectedTutorial(null); }}
                    >
                        📖 Tutoriales
                    </button>
                    <button
                        className={`help-tab ${activeTab === 'manual' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('manual'); setSelectedTutorial(null); }}
                    >
                        📚 Manual
                    </button>
                </div>

                <div className="help-tab-content">
                    {activeTab === 'tutorials' && !selectedTutorial && (
                        <div className="help-tutorial-list">
                            <p className="tutorial-intro">
                                Selecciona un tutorial para comenzar:
                            </p>
                            {tutorials.map((tutorial: { id: string; title: string }) => (
                                <button
                                    key={tutorial.id}
                                    className="tutorial-item"
                                    onClick={() => setSelectedTutorial(tutorial.id)}
                                >
                                    <span className="tutorial-icon">▶️</span>
                                    <span className="tutorial-title">{tutorial.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'tutorials' && selectedTutorial && TUTORIAL_CONTENT[selectedTutorial] && (
                        <div className="help-manual">
                            <button
                                onClick={() => setSelectedTutorial(null)}
                                className="back-button"
                                style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                ← Volver a tutoriales
                            </button>
                            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                                {TUTORIAL_CONTENT[selectedTutorial]}
                            </div>
                        </div>
                    )}

                    {activeTab === 'manual' && (
                        <div className="help-manual">
                            <h3>Manual de Usuario - {role === 'ADMIN' ? 'Administrador' : 'Vendedor'}</h3>

                            {role === 'ADMIN' ? (
                                <>
                                    <h4>Bienvenido al Panel de Administración</h4>
                                    <p>Como administrador, tienes acceso completo al sistema TaskFlow.</p>

                                    <h4>Funciones Principales:</h4>
                                    <ul>
                                        <li><strong>Dashboard:</strong> Vista general con estadísticas en tiempo real</li>
                                        <li><strong>Stock:</strong> Gestión completa del inventario</li>
                                        <li><strong>Productos:</strong> Administración del catálogo</li>
                                        <li><strong>Documentos:</strong> Historial de movimientos</li>
                                        <li><strong>Backup:</strong> Copias de seguridad del sistema</li>
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <h4>Bienvenido al Panel de Ventas</h4>
                                    <p>Como vendedor, tienes acceso a las herramientas para atender clientes.</p>

                                    <h4>Funciones Principales:</h4>
                                    <ul>
                                        <li><strong>Pedidos:</strong> Gestionar pedidos en cola, modificar y consultar precios</li>
                                        <li><strong>Ventas (POS):</strong> Pantalla para crear nuevas ventas</li>
                                        <li><strong>Presupuesto:</strong> Genera cotizaciones en PDF</li>
                                    </ul>
                                </>
                            )}

                            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
                                    💡 <strong>Tip:</strong> Usa los tutoriales para aprender paso a paso cada función.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
