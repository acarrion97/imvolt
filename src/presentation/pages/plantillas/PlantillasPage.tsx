import { useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { PageToolbar } from "@/presentation/components/common/PageToolbar";
import { useCreatePlantilla, useDeletePlantilla, usePlantillas, useUpdatePlantilla } from "@/presentation/hooks";
import { plantillaSchema } from "@/presentation/validations";
import { brand, IMVOLT_GRADIENT } from "@/presentation/theme/brand";
import type { Plantilla, PlantillaCategoria, PlantillaFormato, PlantillaObjetivo } from "@/domain/plantilla";

const { Text, Paragraph } = Typography;

const CATEGORIA_LABELS: Record<PlantillaCategoria, string> = {
  lotizaciones: "Lotizaciones",
  casas: "Casas",
  departamentos: "Departamentos",
  proyecto_planos: "Proyecto en planos",
  publicidad_comercial: "Publicidad comercial",
  marca_inmobiliaria: "Marca inmobiliaria",
};

const FORMATO_LABELS: Record<PlantillaFormato, string> = {
  reels_9_16: "Reels 9:16",
  imagen_4_5: "Imagen 4:5",
  feed_1_1: "Feed 1:1",
  banner_16_9: "Banner 16:9",
};

const OBJETIVO_LABELS: Record<PlantillaObjetivo, string> = {
  visitas: "Visitas",
  mensajes: "Mensajes",
  formularios: "Formularios",
  branding: "Branding",
};

interface FormValues {
  nombre: string;
  categoria: PlantillaCategoria;
  objetivo: PlantillaObjetivo;
  media_type: "image" | "video";
  formato: PlantillaFormato;
  prompt_base: string;
  estructura_narrativa?: string | null;
  movimiento_camara?: string | null;
  estilo_visual?: string | null;
  requiere_referencia_original?: boolean;
}

export function PlantillasPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Plantilla | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const { data: plantillas, isLoading } = usePlantillas();
  const createPlantilla = useCreatePlantilla();
  const updatePlantilla = useUpdatePlantilla();
  const deletePlantilla = useDeletePlantilla();
  const saving = createPlantilla.isPending || updatePlantilla.isPending;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = (plantillas ?? []).filter((p) => p.activo);
    if (!q) return rows;
    return rows.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.prompt_base.toLowerCase().includes(q),
    );
  }, [plantillas, search]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ media_type: "image", requiere_referencia_original: true });
    setDrawerOpen(true);
  };

  const openEdit = (row: Plantilla) => {
    setEditing(row);
    form.setFieldsValue({
      nombre: row.nombre,
      categoria: row.categoria,
      objetivo: row.objetivo,
      media_type: row.media_type,
      formato: row.formato,
      prompt_base: row.prompt_base,
      estructura_narrativa: row.estructura_narrativa,
      movimiento_camara: row.movimiento_camara,
      estilo_visual: row.estilo_visual,
      requiere_referencia_original: row.requiere_referencia_original,
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

    try {
      if (editing) {
        await updatePlantilla.mutateAsync({ id: editing.template_id, data: parsed.data });
        message.success("Plantilla actualizada.");
      } else {
        await createPlantilla.mutateAsync({
          ...parsed.data,
          estructura_narrativa: parsed.data.estructura_narrativa ?? null,
          movimiento_camara: parsed.data.movimiento_camara ?? null,
          estilo_visual: parsed.data.estilo_visual ?? null,
          requiere_referencia_original: parsed.data.requiere_referencia_original ?? false,
        });
        message.success("Plantilla creada.");
      }
      setDrawerOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar la plantilla.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlantilla.mutateAsync(id);
      message.success("Plantilla eliminada.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  };

  return (
    <div>
      <PageToolbar
        title="Plantillas"
        subtitle="Estructuras creativas del sistema: narrativa, cámara y estilo visual."
        search={{ value: search, onChange: setSearch, placeholder: "Buscar plantilla..." }}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nueva plantilla
          </Button>
        }
      />

      <Spin spinning={isLoading}>
        <Row gutter={[16, 16]}>
          {filtered.map((plantilla) => (
            <Col key={plantilla.template_id} xs={24} sm={12} xl={8}>
            <Card
              style={{ borderRadius: 12, height: "100%", display: "flex", flexDirection: "column" }}
              title={
                <Space direction="vertical" size={2}>
                  <Text strong>{plantilla.nombre}</Text>
                  <Space size={4} wrap>
                    <Tag style={{ marginInlineEnd: 0 }}>{CATEGORIA_LABELS[plantilla.categoria]}</Tag>
                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                      {FORMATO_LABELS[plantilla.formato]}
                    </Tag>
                    <Tag color="green" style={{ marginInlineEnd: 0 }}>
                      {OBJETIVO_LABELS[plantilla.objetivo]}
                    </Tag>
                  </Space>
                </Space>
              }
              extra={
                <Space>
                  <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(plantilla)} />
                  <Popconfirm
                    title="¿Desactivar esta plantilla?"
                    okText="Desactivar"
                    cancelText="Cancelar"
                    onConfirm={() => handleDelete(plantilla.template_id)}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              }
              actions={[
                <Button
                  key="usar"
                  type="text"
                  icon={<ThunderboltOutlined style={{ color: brand.light.primary }} />}
                  onClick={() => navigate("/estudio", { state: { templateId: plantilla.template_id } })}
                >
                  Usar en Estudio
                </Button>,
              ]}
            >
              <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ minHeight: 44 }}>
                {plantilla.estructura_narrativa ?? plantilla.prompt_base}
              </Paragraph>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 12, color: brand.light.textTertiary }}>
                  {plantilla.media_type === "video" ? "Video" : "Imagen"} · {plantilla.creditos_base} créditos base
                </Text>
                {plantilla.requiere_referencia_original && (
                  <Tag color="gold" style={{ marginInlineEnd: 0 }}>
                    Requiere foto real
                  </Tag>
                )}
              </div>
            </Card>
          </Col>
        ))}
        </Row>
      </Spin>

      <Drawer
        title={editing ? "Editar plantilla" : "Nueva plantilla"}
        width={560}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" onClick={handleSubmit} loading={saving} style={{ background: IMVOLT_GRADIENT }}>
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
            <Input placeholder="Ej: Reels Lote con Vista" maxLength={120} />
          </Form.Item>

          <Space size={12} style={{ display: "flex" }}>
            <Form.Item
              name="categoria"
              label="Categoría"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                placeholder="Categoría"
                options={Object.entries(CATEGORIA_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="objetivo" label="Objetivo" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                placeholder="Objetivo"
                options={Object.entries(OBJETIVO_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
          </Space>

          <Space size={12} style={{ display: "flex" }}>
            <Form.Item name="media_type" label="Tipo de medio" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                options={[
                  { value: "image", label: "Imagen" },
                  { value: "video", label: "Video" },
                ]}
              />
            </Form.Item>
            <Form.Item name="formato" label="Formato" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                placeholder="Formato"
                options={Object.entries(FORMATO_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
          </Space>

          <Form.Item
            name="prompt_base"
            label="Prompt base"
            rules={[{ required: true, message: "El prompt base es obligatorio." }]}
            tooltip="Usa {variable} para los campos dinámicos, p.ej. {precio}."
          >
            <Input.TextArea rows={3} maxLength={1000} showCount placeholder="Video vertical del lote en {ubicacion}, {precio}..." />
          </Form.Item>

          <Form.Item name="estructura_narrativa" label="Estructura narrativa">
            <Input maxLength={300} placeholder="Gancho → desarrollo → llamado a la acción" />
          </Form.Item>

          <Space size={12} style={{ display: "flex" }}>
            <Form.Item name="movimiento_camara" label="Movimiento de cámara" style={{ flex: 1 }}>
              <Input maxLength={200} placeholder="Travelling lateral lento" />
            </Form.Item>
            <Form.Item name="estilo_visual" label="Estilo visual" style={{ flex: 1 }}>
              <Input maxLength={200} placeholder="Luz dorada, colores naturales" />
            </Form.Item>
          </Space>

          <Form.Item
            name="requiere_referencia_original"
            label="Requiere foto real de la propiedad"
            valuePropName="checked"
            tooltip="Si la plantilla parte de una fotografía real, marca esta opción (fidelidad de contenido §07)."
          >
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
