import { useState } from "react";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  EditOutlined,
  PlusOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type {
  ConfiguracionSistema,
  ConfiguracionSistemaInput,
  EmpresaAdmin,
  Plan,
  PlanInput,
} from "@/domain/admin";
import { usePlantillas } from "@/presentation/hooks";
import {
  useActualizarEmpresaAdmin,
  useAdminConfiguraciones,
  useAdminEmpresas,
  useAdminPlanes,
  useAdminResumenEmpresas,
  useGuardarConfiguracion,
  useGuardarPlan,
} from "@/presentation/hooks/usePlatformAdmin";
import { PlantillasPage } from "@/presentation/pages/plantillas/PlantillasPage";

interface PlanFormValues {
  nombre: string;
  descripcion: string;
  precio_mensual: number;
  limite_usuarios: number;
  limite_proyectos: number | null;
  limite_imagenes_ia: number | null;
  limite_videos_ia: number | null;
  limite_campanias_meta: number | null;
  estado: "activo" | "inactivo";
}

interface EmpresaFormValues {
  plan_id: number | null;
  estado: "activo" | "inactivo";
}

interface ConfiguracionFormValues {
  clave: string;
  valor: string | number | boolean;
  tipo: ConfiguracionSistemaInput["tipo"];
  descripcion: string;
}

const PAGE_SIZE = 20;
const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value);

export function AdministracionPage() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState("planes");
  const [pagina, setPagina] = useState(1);
  const [busquedaDraft, setBusquedaDraft] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<EmpresaAdmin | null>(null);
  const [editingConfiguracion, setEditingConfiguracion] =
    useState<ConfiguracionSistema | null>(null);
  const [configuracionModalOpen, setConfiguracionModalOpen] = useState(false);
  const [planForm] = Form.useForm<PlanFormValues>();
  const [empresaForm] = Form.useForm<EmpresaFormValues>();
  const [configuracionForm] = Form.useForm<ConfiguracionFormValues>();

  const planesQuery = useAdminPlanes();
  const empresasQuery = useAdminEmpresas(pagina, busqueda, estadoFiltro);
  const empresasResumenQuery = useAdminResumenEmpresas();
  const configuracionesQuery = useAdminConfiguraciones();
  const plantillasQuery = usePlantillas();
  const guardarPlan = useGuardarPlan();
  const actualizarEmpresa = useActualizarEmpresaAdmin();
  const guardarConfiguracion = useGuardarConfiguracion();

  const planes = planesQuery.data ?? [];
  const empresas = empresasQuery.data?.items ?? [];
  const configuraciones = configuracionesQuery.data ?? [];
  const empresasTotal = empresasQuery.data?.total ?? 0;

  const abrirCrearPlan = () => {
    setEditingPlan(null);
    planForm.resetFields();
    planForm.setFieldsValue({
      precio_mensual: 0,
      limite_usuarios: 1,
      limite_proyectos: null,
      limite_imagenes_ia: null,
      limite_videos_ia: null,
      limite_campanias_meta: null,
      estado: "activo",
    });
    setPlanModalOpen(true);
  };

  const abrirEditarPlan = (plan: Plan) => {
    setEditingPlan(plan);
    planForm.setFieldsValue({
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precio_mensual: Number(plan.precio_mensual),
      limite_usuarios: plan.limite_usuarios,
      limite_proyectos: plan.limite_proyectos,
      limite_imagenes_ia: plan.limite_imagenes_ia,
      limite_videos_ia: plan.limite_videos_ia,
      limite_campanias_meta: plan.limite_campanias_meta,
      estado: plan.estado,
    });
    setPlanModalOpen(true);
  };

  const guardarPlanFormulario = async (values: PlanFormValues) => {
    // `caracteristicas` no se envía: el backend lo deriva de estos límites.
    const data: PlanInput = {
      nombre: values.nombre.trim(),
      descripcion: values.descripcion.trim(),
      precio_mensual: values.precio_mensual,
      limite_usuarios: values.limite_usuarios,
      limite_proyectos: values.limite_proyectos,
      limite_imagenes_ia: values.limite_imagenes_ia,
      limite_videos_ia: values.limite_videos_ia,
      limite_campanias_meta: values.limite_campanias_meta,
      estado: values.estado,
    };

    try {
      await guardarPlan.mutateAsync({ id: editingPlan?.plan_id, data });
      message.success(editingPlan ? "Plan actualizado." : "Plan creado.");
      setPlanModalOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar el plan.");
    }
  };

  const abrirEditarEmpresa = (empresa: EmpresaAdmin) => {
    setEditingEmpresa(empresa);
    empresaForm.setFieldsValue({
      plan_id: empresa.plan_id,
      estado: empresa.estado,
    });
  };

  const guardarEmpresaFormulario = async (values: EmpresaFormValues) => {
    if (!editingEmpresa) return;
    try {
      await actualizarEmpresa.mutateAsync({
        id: editingEmpresa.empresa_id,
        data: { plan_id: values.plan_id, estado: values.estado },
      });
      message.success("Empresa actualizada.");
      setEditingEmpresa(null);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo actualizar la empresa.");
    }
  };

  const abrirCrearConfiguracion = () => {
    setEditingConfiguracion(null);
    configuracionForm.resetFields();
    configuracionForm.setFieldsValue({ tipo: "texto", valor: "", descripcion: "" });
    setConfiguracionModalOpen(true);
  };

  const abrirEditarConfiguracion = (configuracion: ConfiguracionSistema) => {
    setEditingConfiguracion(configuracion);
    configuracionForm.setFieldsValue({
      clave: configuracion.clave,
      valor:
        configuracion.tipo === "booleano"
          ? configuracion.valor === "true"
          : configuracion.tipo === "numero"
            ? Number(configuracion.valor)
            : configuracion.valor,
      tipo: configuracion.tipo,
      descripcion: configuracion.descripcion,
    });
    setConfiguracionModalOpen(true);
  };

  const guardarConfiguracionFormulario = async (values: ConfiguracionFormValues) => {
    const data: ConfiguracionSistemaInput = {
      clave: values.clave.trim(),
      valor: String(values.valor),
      tipo: values.tipo,
      descripcion: values.descripcion.trim(),
    };
    try {
      await guardarConfiguracion.mutateAsync({
        id: editingConfiguracion?.configuracion_sistema_id,
        data,
      });
      message.success(editingConfiguracion ? "Configuración actualizada." : "Configuración creada.");
      setConfiguracionModalOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar la configuración.");
    }
  };

  const columnasPlanes: TableColumnsType<Plan> = [
    {
      title: "Plan",
      dataIndex: "nombre",
      render: (_: string, plan) => (
        <div>
          <strong>{plan.nombre}</strong>
          <div className="admin-table-secondary">{plan.descripcion || "Sin descripción"}</div>
        </div>
      ),
    },
    {
      title: "Precio mensual",
      dataIndex: "precio_mensual",
      render: (precio: number) => <strong>{formatMoney(Number(precio))}</strong>,
    },
    {
      title: "Incluye",
      dataIndex: "caracteristicas",
      width: 430,
      render: (caracteristicas: string[]) => (
        <div className="admin-plan-features">
          {caracteristicas.map((caracteristica) => (
            <Tag key={caracteristica}>{caracteristica}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Usuarios",
      dataIndex: "limite_usuarios",
      render: (limite: number) => `${limite} ${limite === 1 ? "usuario" : "usuarios"}`,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (estado: string) => (
        <Tag color={estado === "activo" ? "green" : "default"}>
          {estado === "activo" ? "Activo" : "Inactivo"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "acciones",
      align: "right",
      render: (_: unknown, plan) => (
        <Button type="text" icon={<EditOutlined />} onClick={() => abrirEditarPlan(plan)}>
          Editar
        </Button>
      ),
    },
  ];

  const columnasEmpresas: TableColumnsType<EmpresaAdmin> = [
    {
      title: "Empresa",
      dataIndex: "razon_social",
      render: (_: string, empresa) => (
        <div>
          <strong>{empresa.razon_social}</strong>
          <div className="admin-table-secondary">
            {empresa.ruc || "RUC pendiente"} · {empresa.cantidad_usuarios}{" "}
            {empresa.cantidad_usuarios === 1 ? "usuario" : "usuarios"}
          </div>
        </div>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      render: (plan: EmpresaAdmin["plan"]) => plan?.nombre ?? "Sin plan",
    },
    {
      title: "Registro",
      dataIndex: "creado_en",
      render: (fecha: string) =>
        new Intl.DateTimeFormat("es-EC", { dateStyle: "medium" }).format(new Date(fecha)),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      render: (estado: string) => (
        <Tag color={estado === "activo" ? "green" : "default"}>
          {estado === "activo" ? "Activa" : "Suspendida"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "acciones",
      align: "right",
      render: (_: unknown, empresa) => (
        <Button type="text" icon={<EditOutlined />} onClick={() => abrirEditarEmpresa(empresa)}>
          Administrar
        </Button>
      ),
    },
  ];

  const columnasConfiguracion: TableColumnsType<ConfiguracionSistema> = [
    {
      title: "Configuración",
      dataIndex: "clave",
      render: (clave: string, configuracion) => (
        <div>
          <strong>{clave.replaceAll("_", " ")}</strong>
          <div className="admin-table-secondary">{configuracion.descripcion}</div>
        </div>
      ),
    },
    {
      title: "Valor actual",
      dataIndex: "valor",
      render: (valor: string, configuracion) =>
        configuracion.tipo === "booleano" ? (
          <Tag color={valor === "true" ? "green" : "default"}>
            {valor === "true" ? "Activado" : "Desactivado"}
          </Tag>
        ) : (
          valor
        ),
    },
    {
      title: "Tipo",
      dataIndex: "tipo",
      render: (tipo: string) => tipo.charAt(0).toUpperCase() + tipo.slice(1),
    },
    {
      title: "",
      key: "acciones",
      align: "right",
      render: (_: unknown, configuracion) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => abrirEditarConfiguracion(configuracion)}
        >
          Editar
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: "planes",
      label: (
        <span>
          <CrownOutlined /> Planes
        </span>
      ),
      children: (
        <Card className="admin-content-card">
          <div className="admin-table-toolbar">
            <div>
              <h2>Planes de suscripción</h2>
              <p>
                Videos adicionales y modelos premium: precio por generación. Valores en USD, antes
                de impuestos.
              </p>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={abrirCrearPlan}>
              Nuevo plan
            </Button>
          </div>
          <Table
            rowKey="plan_id"
            columns={columnasPlanes}
            dataSource={planes}
            loading={planesQuery.isLoading}
            pagination={false}
            scroll={{ x: 1280 }}
          />
        </Card>
      ),
    },
    {
      key: "empresas",
      label: (
        <span>
          <BankOutlined /> Empresas
        </span>
      ),
      children: (
        <Card className="admin-content-card">
          <div className="admin-table-toolbar">
            <div>
              <h2>Empresas registradas</h2>
              <p>Asigna un plan, revisa el estado y administra el acceso a la plataforma.</p>
            </div>
            <Space wrap>
              <Input.Search
                allowClear
                placeholder="Buscar por razón social"
                value={busquedaDraft}
                onChange={(event) => setBusquedaDraft(event.target.value)}
                onSearch={(value) => {
                  setPagina(1);
                  setBusqueda(value.trim());
                }}
                style={{ width: 240 }}
              />
              <Select
                value={estadoFiltro || undefined}
                placeholder="Todos los estados"
                allowClear
                onChange={(value) => {
                  setPagina(1);
                  setEstadoFiltro(value ?? "");
                }}
                options={[
                  { value: "activo", label: "Activas" },
                  { value: "inactivo", label: "Suspendidas" },
                ]}
                style={{ width: 160 }}
              />
            </Space>
          </div>
          <Table
            rowKey="empresa_id"
            columns={columnasEmpresas}
            dataSource={empresas}
            loading={empresasQuery.isLoading}
            scroll={{ x: 760 }}
            pagination={{
              current: pagina,
              pageSize: PAGE_SIZE,
              total: empresasTotal,
              showSizeChanger: false,
              onChange: setPagina,
            }}
          />
        </Card>
      ),
    },
    {
      key: "plantillas",
      label: (
        <span>
          <CheckCircleOutlined /> Plantillas
        </span>
      ),
      children: (
        <div className="admin-templates-panel">
          <PlantillasPage />
        </div>
      ),
    },
    {
      key: "configuracion",
      label: (
        <span>
          <SettingOutlined /> Configuración
        </span>
      ),
      children: (
        <Card className="admin-content-card">
          <div className="admin-table-toolbar">
            <div>
              <h2>Configuración global</h2>
              <p>Controla los valores predeterminados que usa la plataforma.</p>
            </div>
            <Button icon={<PlusOutlined />} onClick={abrirCrearConfiguracion}>
              Nueva configuración
            </Button>
          </div>
          <Table
            rowKey="configuracion_sistema_id"
            columns={columnasConfiguracion}
            dataSource={configuraciones}
            loading={configuracionesQuery.isLoading}
            pagination={false}
            scroll={{ x: 680 }}
          />
        </Card>
      ),
    },
  ];

  const errorQueries = [
    planesQuery.error,
    empresasQuery.error,
    empresasResumenQuery.error,
    configuracionesQuery.error,
  ].filter(Boolean);

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Centro de control · Plataforma</p>
          <h1>Administración</h1>
          <p className="sub">
            Gestiona planes, empresas, plantillas y parámetros globales de IMVOLT.
          </p>
        </div>
        <Tag color="green" className="admin-security-badge">
          <CheckCircleOutlined /> Acceso de superadministrador
        </Tag>
      </div>

      {errorQueries.length > 0 && (
        <div className="notice warning admin-error">
          No se pudieron cargar los datos del sistema:{" "}
          {errorQueries[0]?.message ?? "Error desconocido"}. Comprueba la conexión y las migraciones pendientes.
        </div>
      )}

      <div className="grid cols4 admin-stats">
        <Card className="admin-stat-card">
          <span className="admin-stat-icon"><BankOutlined /></span>
          <span className="admin-stat-label">Empresas registradas</span>
          <strong>
            {(empresasResumenQuery.data?.total ?? empresasTotal).toLocaleString("es-EC")}
          </strong>
        </Card>
        <Card className="admin-stat-card">
          <span className="admin-stat-icon"><TeamOutlined /></span>
          <span className="admin-stat-label">Empresas activas</span>
          <strong>
            {empresasResumenQuery.isLoading
              ? "—"
              : (empresasResumenQuery.data?.activas ?? 0).toLocaleString("es-EC")}
          </strong>
        </Card>
        <Card className="admin-stat-card">
          <span className="admin-stat-icon"><CrownOutlined /></span>
          <span className="admin-stat-label">Planes activos</span>
          <strong>{planes.filter((plan) => plan.estado === "activo").length}</strong>
        </Card>
        <Card className="admin-stat-card">
          <span className="admin-stat-icon"><CheckCircleOutlined /></span>
          <span className="admin-stat-label">Plantillas disponibles</span>
          <strong>{plantillasQuery.isLoading ? "—" : (plantillasQuery.data?.length ?? 0)}</strong>
        </Card>
      </div>

      <Spin spinning={errorQueries.length > 0 && planesQuery.isFetching}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="admin-tabs" />
      </Spin>

      <Modal
        title={editingPlan ? "Editar plan" : "Crear plan"}
        open={planModalOpen}
        onCancel={() => setPlanModalOpen(false)}
        onOk={() => void planForm.submit()}
        confirmLoading={guardarPlan.isPending}
        okText="Guardar plan"
        cancelText="Cancelar"
        destroyOnHidden
      >
        <Form form={planForm} layout="vertical" onFinish={(values) => void guardarPlanFormulario(values)}>
          <Form.Item name="nombre" label="Nombre" rules={[{ required: true, min: 2, max: 60 }]}>
            <Input maxLength={60} placeholder="Ej. Profesional" />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea maxLength={300} rows={2} placeholder="¿Para quién es este plan?" />
          </Form.Item>
          <div className="admin-form-grid">
            <Form.Item
              name="precio_mensual"
              label="Precio mensual (USD)"
              rules={[{ required: true, type: "number", min: 0 }]}
            >
              <InputNumber min={0} precision={2} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="limite_usuarios"
              label="Límite de usuarios"
              rules={[{ required: true, type: "number", min: 1 }]}
            >
              <InputNumber min={1} precision={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="estado" label="Estado" rules={[{ required: true }]}>
              <Select options={[{ value: "activo", label: "Activo" }, { value: "inactivo", label: "Inactivo" }]} />
            </Form.Item>
          </div>
          <div className="admin-plan-limits">
            <p className="admin-plan-limits-title">
              Límites de uso
              <span>Lo que la cuenta puede crear con este plan. Vacío = sin límite.</span>
            </p>
            <div className="admin-form-grid">
              <Form.Item
                name="limite_proyectos"
                label="Proyectos"
                rules={[{ type: "number", min: 1 }]}
              >
                <InputNumber min={1} precision={0} placeholder="Sin límite" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="limite_imagenes_ia"
                label="Imágenes IA"
                rules={[{ type: "number", min: 1 }]}
              >
                <InputNumber min={1} precision={0} placeholder="Sin límite" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="limite_videos_ia"
                label="Videos IA"
                rules={[{ type: "number", min: 1 }]}
              >
                <InputNumber min={1} precision={0} placeholder="Sin límite" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="limite_campanias_meta"
                label="Campañas Meta"
                rules={[{ type: "number", min: 1 }]}
              >
                <InputNumber min={1} precision={0} placeholder="Sin límite" style={{ width: "100%" }} />
              </Form.Item>
            </div>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Administrar empresa"
        open={editingEmpresa !== null}
        onCancel={() => setEditingEmpresa(null)}
        onOk={() => void empresaForm.submit()}
        confirmLoading={actualizarEmpresa.isPending}
        okText="Guardar cambios"
        cancelText="Cancelar"
        destroyOnHidden
      >
        {editingEmpresa && (
          <Form
            form={empresaForm}
            layout="vertical"
            onFinish={(values) => void guardarEmpresaFormulario(values)}
          >
            <p className="admin-modal-company">{editingEmpresa.razon_social}</p>
            <Form.Item name="plan_id" label="Plan asignado">
              <Select
                allowClear
                placeholder="Selecciona un plan"
                onChange={(value) => empresaForm.setFieldValue("plan_id", value ?? null)}
                options={planes
                  .filter(
                    (plan) =>
                      plan.estado === "activo" || plan.plan_id === editingEmpresa.plan_id,
                  )
                  .map((plan) => ({
                    value: plan.plan_id,
                    label: plan.estado === "activo" ? plan.nombre : `${plan.nombre} (inactivo)`,
                    disabled: plan.estado !== "activo",
                  }))}
              />
            </Form.Item>
            <Form.Item name="estado" label="Acceso" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "activo", label: "Activa" },
                  { value: "inactivo", label: "Suspendida" },
                ]}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title={editingConfiguracion ? "Editar configuración" : "Nueva configuración"}
        open={configuracionModalOpen}
        onCancel={() => setConfiguracionModalOpen(false)}
        onOk={() => void configuracionForm.submit()}
        confirmLoading={guardarConfiguracion.isPending}
        okText="Guardar configuración"
        cancelText="Cancelar"
        destroyOnHidden
      >
        <Form
          form={configuracionForm}
          layout="vertical"
          onFinish={(values) => void guardarConfiguracionFormulario(values)}
        >
          <Form.Item
            name="clave"
            label="Clave"
            rules={[
              { required: true },
              { pattern: /^[a-z][a-z0-9_]{1,59}$/, message: "Usa minúsculas, números y guion bajo." },
            ]}
          >
            <Input disabled={editingConfiguracion !== null} maxLength={60} placeholder="nombre_configuracion" />
          </Form.Item>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
            <Select
              disabled={editingConfiguracion !== null}
              options={[
                { value: "texto", label: "Texto" },
                { value: "numero", label: "Número" },
                { value: "booleano", label: "Sí / No" },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(previous, current) => previous.tipo !== current.tipo}>
            {({ getFieldValue }) => {
              const tipo = getFieldValue("tipo") as ConfiguracionSistemaInput["tipo"] | undefined;
              if (tipo === "booleano") {
                return (
                  <Form.Item name="valor" label="Valor" valuePropName="checked">
                    <Switch checkedChildren="Activado" unCheckedChildren="Desactivado" />
                  </Form.Item>
                );
              }
              if (tipo === "numero") {
                return (
                  <Form.Item name="valor" label="Valor" rules={[{ required: true, type: "number" }]}>
                    <InputNumber style={{ width: "100%" }} />
                  </Form.Item>
                );
              }
              return (
                <Form.Item name="valor" label="Valor" rules={[{ required: true }]}>
                  <Input maxLength={1000} />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción" rules={[{ required: true, max: 180 }]}>
            <Input.TextArea maxLength={180} rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
