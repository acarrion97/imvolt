import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { App, Button, Form, Input, Result, Spin } from "antd";
import {
  BankOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { RegisterInput } from "@/domain/auth";
import { ApiError } from "@/infrastructure/http/httpClient";
import { getContainer } from "@/infrastructure/container";
import { useAuth } from "@/presentation/auth/AuthProvider";
import { ImvoltLogo } from "@/presentation/components/brand/ImvoltLogo";

interface RegisterFormValues extends RegisterInput {
  confirmPassword: string;
}

export function RegisterPage() {
  const { status } = useAuth();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  if (status === "disabled" || status === "authenticated") {
    return <Navigate to="/inicio" replace />;
  }

  if (status === "loading") {
    return (
      <div className="auth-loading">
        <Spin size="large" />
      </div>
    );
  }

  const onFinish = async ({ confirmPassword: _confirmPassword, ...values }: RegisterFormValues) => {
    setSubmitting(true);
    try {
      await getContainer().register.execute({
        ...values,
        telefono: values.telefono?.trim() || undefined,
        ruc: values.ruc?.trim() || undefined,
      });
      setRegistered(true);
    } catch (error) {
      message.error(error instanceof ApiError ? error.message : "No se pudo crear la cuenta");
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
          <h1>Tu espacio para hacer crecer cada proyecto.</h1>
          <p className="auth-claim">
            Crea tu cuenta y reúne propiedades, contenido, campañas y resultados en un solo lugar.
          </p>
        </div>
        <small className="auth-foot">IMVOLT · Tu negocio inmobiliario, en movimiento</small>
      </aside>

      <main className="auth-form">
        <div className="auth-card auth-card-register">
          {registered ? (
            <Result
              status="success"
              title="¡Tu cuenta está lista!"
              subTitle="Ya puedes iniciar sesión con el correo y la contraseña que registraste."
              extra={
                <Button type="primary" size="large">
                  <Link to="/login">Ir a iniciar sesión</Link>
                </Button>
              }
            />
          ) : (
            <>
              <div className="auth-card-head">
                <h2>Crea tu cuenta</h2>
                <p>Registra tu organización y empieza a trabajar con IMVOLT.</p>
              </div>

              <Form<RegisterFormValues>
                layout="vertical"
                requiredMark={false}
                onFinish={(values) => void onFinish(values)}
                size="large"
              >
                <div className="auth-fields-grid">
                  <Form.Item
                    label="Nombres"
                    name="nombres"
                    rules={[
                      { required: true, message: "Ingresá tus nombres" },
                      { min: 2, max: 60, message: "Usá entre 2 y 60 caracteres" },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Tus nombres"
                      autoComplete="given-name"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Apellidos"
                    name="apellidos"
                    rules={[
                      { required: true, message: "Ingresá tus apellidos" },
                      { min: 2, max: 60, message: "Usá entre 2 y 60 caracteres" },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Tus apellidos"
                      autoComplete="family-name"
                    />
                  </Form.Item>

                  <Form.Item
                    className="auth-fields-full"
                    label="Nombre de la organización"
                    name="organization_name"
                    rules={[
                      { required: true, message: "Ingresá el nombre de tu organización" },
                      { min: 3, max: 120, message: "Usá entre 3 y 120 caracteres" },
                    ]}
                  >
                    <Input
                      prefix={<BankOutlined />}
                      placeholder="Inmobiliaria, empresa o proyecto"
                      autoComplete="organization"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Correo"
                    name="email"
                    rules={[
                      { required: true, message: "Ingresá tu correo" },
                      { type: "email", message: "Ingresá un correo válido" },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="tu@empresa.com"
                      autoComplete="email"
                    />
                  </Form.Item>

                  <Form.Item label="Teléfono (opcional)" name="telefono">
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="+51 999 999 999"
                      autoComplete="tel"
                      maxLength={20}
                    />
                  </Form.Item>

                  <Form.Item
                    label="RUC (opcional)"
                    name="ruc"
                    rules={[
                      {
                        validator: (_, value: string | undefined) =>
                          !value || /^\d{13}$/.test(value)
                            ? Promise.resolve()
                            : Promise.reject(new Error("El RUC debe tener exactamente 13 dígitos")),
                      },
                    ]}
                  >
                    <Input
                      prefix={<SafetyCertificateOutlined />}
                      placeholder="13 dígitos"
                      inputMode="numeric"
                      maxLength={13}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Contraseña"
                    name="password"
                    rules={[
                      { required: true, message: "Crea una contraseña" },
                      { min: 8, max: 72, message: "Usá entre 8 y 72 caracteres" },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Repetir contraseña"
                    name="confirmPassword"
                    dependencies={["password"]}
                    rules={[
                      { required: true, message: "Repetí tu contraseña" },
                      ({ getFieldValue }) => ({
                        validator(_, value: string | undefined) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error("Las contraseñas no coinciden"));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Repite tu contraseña"
                      autoComplete="new-password"
                    />
                  </Form.Item>
                </div>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={submitting}
                  style={{ marginTop: 4, height: 44, fontSize: 13 }}
                >
                  Crear cuenta
                </Button>
              </Form>

              <div className="auth-switch">
                ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
