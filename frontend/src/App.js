import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLogin from "./pages/AdminLogin";
import ChangePassword from "./pages/ChangePassword";
import { LocaleProvider } from "./context/LocaleContext";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Categories from "./pages/Categories";
import ProductDetail from "./pages/ProductDetail";
import CustomOrders from "./pages/CustomOrders";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import AdminOrderCreate from "./pages/AdminOrderCreate";
import AdminTickets from "./pages/AdminTickets";
import AdminTicketDetail from "./pages/AdminTicketDetail";
import TicketAccess from "./pages/TicketAccess";
import TicketView from "./pages/TicketView";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="App">
      <LocaleProvider>
        <CartProvider>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/custom-orders" element={<CustomOrders />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/account/password" element={<ProtectedRoute allowedRoles={["admin", "support"]}><ChangePassword /></ProtectedRoute>} />
              <Route path="/ticket/access" element={<TicketAccess />} />
              <Route path="/ticket/:id" element={<TicketView />} />
              <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin", "support"]}><Admin /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProducts /></ProtectedRoute>} />
            <Route path="/admin/products/new" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProducts /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/orders/new" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOrderCreate /></ProtectedRoute>} />
            <Route path="/admin/orders/:id" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOrderDetail /></ProtectedRoute>} />
            <Route path="/admin/tickets" element={<ProtectedRoute allowedRoles={["admin", "support"]}><AdminTickets /></ProtectedRoute>} />
            <Route path="/admin/tickets/:id" element={<ProtectedRoute allowedRoles={["admin", "support"]}><AdminTicketDetail /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
        </AuthProvider>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#0A4143",
              color: "#fff",
              border: "1px solid rgba(212,165,58,0.3)",
              borderRadius: 0,
            },
          }}
        />
        </CartProvider>
      </LocaleProvider>
    </div>
  );
}

export default App;
