import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  App,
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Spin,
} from "antd";
import {
  AppstoreOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { Plantilla } from "@/domain/plantilla";
import {
  useCreatePlantilla,
  useDeletePlantilla,
  usePlantillas,
  useTiposPlantilla,
  useUpdatePlantilla,
} from "@/presentation/hooks";
import { plantillaSchema } from "@/presentation/validations";

interface FormValues {
  nombre: string;
  tipo_plantilla_id: number;
  descripcion?: string | null;
  url_logo?: string | null;
}

export function PlantillasPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [tipoFiltro, setTipoFiltro] = useState<string>("todas");
  const { data: tiposPlantilla } = useTiposPlantilla();
  const { data: plantillas, isLoading } = usePlantillas();
  const [editing, setEditing] = useState<Plantilla | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const createPlantilla = useCreatePlantilla();
  const updatePlantilla = useUpdatePlantilla();
  const deletePlantilla = useDeletePlantilla();
  const saving = createPlantilla.isPending || updatePlantilla.isPending;

  const filtered = useMemo(
    () =>
      (plantillas ?? []).filter(
        (plantilla) =>
          tipoFiltro === "todas" ||
          String(plantilla.tipo_plantilla_id) === tipoFiltro,
      ),
    [plantillas, tipoFiltro],
  );

  const typeOptions = (tiposPlantilla ?? [])
    .filter((tipo) => Number.isInteger(Number(tipo.tipo_plantilla_id)))
    .map((tipo) => ({
      value: Number(tipo.tipo_plantilla_id),
      label: tipo.nombre,
    }));

  const getTipoNombre = (plantilla: Plantilla) =>
    plantilla.tipo_plantilla?.nombre ??
    tiposPlantilla?.find(
      (tipo) =>
        String(tipo.tipo_plantilla_id) === String(plantilla.tipo_plantilla_id),
    )?.nombre ??
    "Tipo sin definir";

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (row: Plantilla) => {
    setEditing(row);
    form.resetFields();
    form.setFieldsValue({
      nombre: row.nombre,
      tipo_plantilla_id: Number(row.tipo_plantilla_id),
      descripcion: row.descripcion ?? "",
      url_logo: row.url_logo ?? "",
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const parsed = plantillaSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    const payload = {
      ...parsed.data,
      descripcion: parsed.data.descripcion?.trim() || null,
      url_logo: parsed.data.url_logo?.trim() || null,
    };

    try {
      if (editing) {
        await updatePlantilla.mutateAsync({
          id: String(editing.plantilla_id),
          data: payload,
        });
        message.success("Plantilla actualizada.");
      } else {
        await createPlantilla.mutateAsync(payload);
        message.success("Plantilla creada.");
      }
      setDrawerOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar la plantilla.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePlantilla.mutateAsync(String(id));
      message.success("Plantilla eliminada.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  };

  const iconBtn = {
    background: "transparent",
    border: 0,
    color: "#7d9187",
    cursor: "pointer",
    fontSize: 14,
    padding: 4,
  } as const;

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Creative AI</p>
          <h1>Plantillas inmobiliarias</h1>
          <p className="sub">
            Administra las plantillas, su descripción, logo y tipo.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <PlusOutlined /> Nueva plantilla
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab${tipoFiltro === "todas" ? " active" : ""}`}
          onClick={() => setTipoFiltro("todas")}
        >
          Todas ({plantillas?.length ?? 0})
        </button>
        {(tiposPlantilla ?? []).map((tipo) => {
          const count = (plantillas ?? []).filter(
            (plantilla) =>
              String(plantilla.tipo_plantilla_id) === String(tipo.tipo_plantilla_id),
          ).length;
          if (count === 0) return null;
          const id = String(tipo.tipo_plantilla_id);
          return (
            <button
              key={id}
              type="button"
              className={`tab${tipoFiltro === id ? " active" : ""}`}
              onClick={() => setTipoFiltro(id)}
            >
              {tipo.nombre} ({count})
            </button>
          );
        })}
      </div>

      <Spin spinning={isLoading}>
        <div className="grid cols3">
          {filtered.map((plantilla) => (
            <div key={plantilla.plantilla_id} className="template-card">
              <div className="t-icon">
                {plantilla.url_logo ? (
                  <img
                    src={plantilla.url_logo}
                    alt={`Logo de ${plantilla.nombre}`}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <AppstoreOutlined />
                )}
              </div>

              <div>
                <strong>{plantilla.nombre}</strong>
                <p className="desc" style={{ marginTop: 4 }}>
                  {plantilla.descripcion || "Sin descripción"}
                </p>
              </div>

              <div className="meta">
                <span className="mini-badge grey">{getTipoNombre(plantilla)}</span>
                <span className="mini-badge">
                  {plantilla.estado === "activo" ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="foot">
                <span className="credits">{plantilla.url_logo ? "Logo configurado" : "Sin logo"}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    style={iconBtn}
                    onClick={() => openEdit(plantilla)}
                    title="Editar"
                  >
                    <EditOutlined />
                  </button>
                  <Popconfirm
                    title="¿Eliminar esta plantilla?"
                    okText="Eliminar"
                    cancelText="Cancelar"
                    onConfirm={() => handleDelete(plantilla.plantilla_id)}
                  >
                    <button type="button" style={iconBtn} title="Eliminar">
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: "8px 13px", fontSize: 11 }}
                    onClick={() =>
                      navigate("/estudio", {
                        state: { templateId: String(plantilla.plantilla_id) },
                      })
                    }
                  >
                    Utilizar <ArrowRightOutlined />
                  </button>
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !isLoading && (
            <div className="card card-pad" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
              <p className="sub">No hay plantillas para mostrar.</p>
              <div style={{ marginTop: 14 }}>
                <button type="button" className="btn btn-primary" onClick={openCreate}>
                  <PlusOutlined /> Nueva plantilla
                </button>
              </div>
            </div>
          )}
        </div>
      </Spin>

      <Drawer
        title={editing ? "Editar plantilla" : "Nueva plantilla"}
        size="large"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            Guardar
          </Button>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: "Indica el nombre de la plantilla." }]}
          >
            <Input placeholder="Nombre de la plantilla" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="tipo_plantilla_id"
            label="Tipo de plantilla"
            rules={[{ required: true, message: "Selecciona el tipo." }]}
          >
            <Select
              placeholder="Selecciona el tipo"
              showSearch
              optionFilterProp="label"
              options={typeOptions}
            />
          </Form.Item>

          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea
              rows={4}
              maxLength={500}
              showCount
              placeholder="Describe qué produce esta plantilla"
            />
          </Form.Item>

          <Form.Item
            name="url_logo"
            label="URL del logo"
            rules={[{ type: "url", warningOnly: true, message: "Ingresa una URL válida." }]}
          >
            <Input type="url" maxLength={200} placeholder="https://..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
