# Frontend - Guía de Implementación

## 📁 Estructura Creada

```
frontend/src/
├── api/
│   ├── http.ts                    # Configuración de Axios
│   └── products.ts                # Funciones API de productos
│
├── hooks/
│   ├── useProducts.ts             # Hook para obtener productos
│   └── useProductSearch.ts        # Hook para búsqueda
│
├── store/
│   └── cartStore.ts               # Store del carrito (Zustand)
│
├── components/
│   ├── ProductList.tsx            # Lista de productos
│   ├── ProductItem.tsx            # Item individual de producto
│   ├── CartList.tsx               # Lista del carrito
│   ├── PaymentSummary.tsx         # Resumen de pago
│   └── SearchBar.tsx              # Barra de búsqueda
│
├── pages/
│   ├── SearchPage.tsx             # Página de búsqueda
│   └── CartPage.tsx               # Página del carrito
│
├── router/
│   └── index.tsx                  # Configuración de rutas
│
├── utils/
│   └── paymentCalculator.ts      # Utilidades de cálculo
│
├── App.tsx                        # Componente principal
├── main.tsx                       # Punto de entrada
└── index.css                      # Estilos globales
```

---

## 📝 Guía de Implementación por Archivo

### 1. **api/http.ts**
**Propósito:** Configurar cliente HTTP con Axios

**Implementar:**
- Crear instancia de Axios
- Configurar baseURL: `http://localhost:8000/api`
- Configurar headers por defecto
- Interceptores de request/response (opcional)

**Ejemplo:**
```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

### 2. **api/products.ts**
**Propósito:** Funciones para llamar a la API de productos

**Implementar:**
- `getProducts(page, size)` - GET /products
- `searchProducts(query, page, size)` - GET /products/search?q=
- `getProductById(id)` - GET /products/{id}
- `getProductByCode(code)` - GET /products/code/{code}
- `getProductByBarcode(barcode)` - GET /products/barcode/{barcode}

**Tipos de respuesta:**
```typescript
interface Product {
  id: number;
  code: string;
  barcode: string;
  description: string;
  price: number;
  hidden: boolean;
  searchable: boolean;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
}
```

---

### 3. **hooks/useProducts.ts**
**Propósito:** Hook personalizado para obtener productos con React Query

**Implementar:**
- Usar `useQuery` de React Query
- Llamar a `getProducts()` de la API
- Manejar paginación
- Retornar: `{ data, isLoading, error, refetch }`

---

### 4. **hooks/useProductSearch.ts**
**Propósito:** Hook para búsqueda de productos

**Implementar:**
- Usar `useQuery` con parámetro de búsqueda
- Debounce para evitar llamadas excesivas
- Llamar a `searchProducts()` de la API
- Retornar resultados de búsqueda

---

### 5. **store/cartStore.ts**
**Propósito:** Estado global del carrito con Zustand

**Implementar:**
```typescript
interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}
```

---

### 6. **components/ProductList.tsx**
**Propósito:** Mostrar lista de productos

**Implementar:**
- Recibir array de productos como prop
- Mapear productos y renderizar `ProductItem`
- Manejar estado de carga y errores
- Grid o lista responsive

---

### 7. **components/ProductItem.tsx**
**Propósito:** Mostrar un producto individual

**Implementar:**
- Props: `product: Product`
- Mostrar: código, descripción, precio
- Botón "Agregar al carrito"
- Llamar a `cartStore.addItem()`

---

### 8. **components/CartList.tsx**
**Propósito:** Mostrar items del carrito

**Implementar:**
- Obtener items del `cartStore`
- Mostrar cada item con cantidad
- Botones para aumentar/disminuir cantidad
- Botón para eliminar item
- Mostrar total

---

### 9. **components/PaymentSummary.tsx**
**Propósito:** Resumen de pago

**Implementar:**
- Mostrar subtotal
- Calcular impuestos (si aplica)
- Mostrar total
- Botón "Procesar pago"

---

### 10. **components/SearchBar.tsx**
**Propósito:** Barra de búsqueda

**Implementar:**
- Input de texto
- Icono de búsqueda (Lucide Icons)
- Evento onChange para actualizar búsqueda
- Debounce para optimizar

---

### 11. **pages/SearchPage.tsx**
**Propósito:** Página principal de búsqueda

**Implementar:**
- Renderizar `SearchBar`
- Renderizar `ProductList`
- Usar `useProductSearch` hook
- Manejar paginación

---

### 12. **pages/CartPage.tsx**
**Propósito:** Página del carrito

**Implementar:**
- Renderizar `CartList`
- Renderizar `PaymentSummary`
- Botón para volver a búsqueda
- Mensaje si carrito está vacío

---

### 13. **router/index.tsx**
**Propósito:** Configuración de rutas

**Implementar:**
```typescript
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SearchPage />,
  },
  {
    path: '/cart',
    element: <CartPage />,
  },
]);
```

---

### 14. **utils/paymentCalculator.ts**
**Propósito:** Funciones de cálculo

**Implementar:**
```typescript
export const calculateSubtotal = (items: CartItem[]): number => {
  // Sumar precio * cantidad
};

export const calculateTax = (subtotal: number, taxRate: number): number => {
  // Calcular impuesto
};

export const calculateTotal = (subtotal: number, tax: number): number => {
  // Total final
};
```

---

### 15. **App.tsx**
**Propósito:** Componente raíz

**Implementar:**
```typescript
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
```

---

### 16. **main.tsx**
**Propósito:** Punto de entrada

**Implementar:**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 🔧 Dependencias Necesarias

Asegúrate de tener instaladas estas dependencias:

```bash
npm install axios
npm install @tanstack/react-query
npm install zustand
npm install react-router-dom
npm install lucide-react
```

---

## 🎯 Orden Sugerido de Implementación

1. **api/http.ts** - Base para todo
2. **api/products.ts** - Funciones de API
3. **store/cartStore.ts** - Estado global
4. **utils/paymentCalculator.ts** - Utilidades
5. **hooks/useProducts.ts** - Hook de productos
6. **hooks/useProductSearch.ts** - Hook de búsqueda
7. **components/SearchBar.tsx** - Componente simple
8. **components/ProductItem.tsx** - Componente simple
9. **components/ProductList.tsx** - Usa ProductItem
10. **components/CartList.tsx** - Usa store
11. **components/PaymentSummary.tsx** - Usa utils
12. **pages/SearchPage.tsx** - Combina componentes
13. **pages/CartPage.tsx** - Combina componentes
14. **router/index.tsx** - Rutas
15. **App.tsx** - Raíz
16. **main.tsx** - Entrada

---

## 📚 Recursos

- **React Query:** https://tanstack.com/query/latest
- **Zustand:** https://zustand-demo.pmnd.rs/
- **React Router:** https://reactrouter.com/
- **Axios:** https://axios-http.com/
- **Lucide Icons:** https://lucide.dev/

---

**¡Listo para empezar a implementar!** 🚀
