import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { App, Button, Form, Input } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { ImvoltLogo } from "@/presentation/components/brand/ImvoltLogo";
import { useAuth } from "@/presentation/auth/AuthProvider";
import { ApiError } from "@/infrastructure/http/httpClient";

/**
 * Pantalla de acceso IMVOLT (`/login`) — solo con VITE_DATA_PROVIDER=rest.
 *
 * Llama a `POST /api/auth/login`, guarda la sesión (localStorage) y entra a
 * la ruta que se intentaba abrir (`location.state.from`) o al Inicio.
 */

interface LoginValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/inicio";

  // Modo mock (sin backend) o ya autenticado: /login no corresponde.
  if (status === "disabled") return <Navigate to="/inicio" replace />;
  if (status === "authenticated") return <Navigate to={from} replace />;

  const onFinish = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "No se pudo iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-brand">
        <ImvoltLogo variant="horizontal-oscuro" height={34} />
        <div>
          <p className="auth-eyebrow">MARKETING INMOBILIARIO AI</p>
          <h1>De la propiedad al anuncio, sin fricción.</h1>
          <p className="auth-claim">
            Contenido generado con IA, campañas Meta y analítica de leads para desarrolladores,
            inmobiliarias y agentes.
          </p>
        </div>
        <small className="auth-foot">IMVOLT · Sesión segura con Supabase Auth</small>
      </aside>

      <main className="auth-form">
        <div className="auth-card">
          <div className="auth-card-head">
            <h2>Bienvenido de vuelta</h2>
            <p>Iniciá sesión para entrar a tu espacio de trabajo.</p>
          </div>

          <Form<LoginValues>
            layout="vertical"
            requiredMark={false}
            onFinish={(values) => void onFinish(values)}
            size="large"
            initialValues={{ email: "", password: "" }}
          >
            <Form.Item
              label="Correo"
              name="email"
              rules={[
                { required: true, message: "Ingresá tu correo" },
                { type: "email", message: "Ingresá un correo válido" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="tu@empresa.com" autoComplete="email" />
            </Form.Item>

            <Form.Item
              label="Contraseña"
              name="password"
              rules={[{ required: true, message: "Ingresá tu contraseña" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              style={{ marginTop: 4, height: 44, fontSize: 13 }}
            >
              Iniciar sesión
            </Button>
          </Form>

          <div className="auth-switch">
            ¿Todavía no tenés cuenta? <Link to="/registro">Crear una cuenta</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
