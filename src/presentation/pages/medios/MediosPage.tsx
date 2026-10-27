import { useMemo, useRef, useState } from "react";
import { App, Button, Drawer, Form, Input, Modal, Popconfirm, Select, Spin } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  HistoryOutlined,
  PlusOutlined,
  SearchOutlined,
  UndoOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import { DataTable } from "@/presentation/components/common/DataTable";
import { formatFecha } from "@/presentation/components/common/status";
import { formatTamano } from "@/presentation/components/common/brandKitArt";
import {
  useCreateMediaAsset,
  useDeleteMediaAsset,
  useDescargarMediaAsset,
  useEliminarMediaAssetVersion,
  useMediaAssetPreview,
  useMediaAssets,
  useMediaAssetVersiones,
  usePropiedades,
  useProyectos,
  useRestaurarMediaAssetVersion,
  useSubirMediaAssetVersion,
  useUpdateMediaAsset,
} from "@/presentation/hooks";
import { mediaAssetSchema } from "@/presentation/validations";
import {
  ACEPTADOS_MEDIA_POR_CATEGORIA,
  CATEGORIA_MEDIA_LABEL,
  CATEGORIAS_MEDIA,
  LIMITE_BYTES_MEDIA,
  validarArchivoMedia,
  type CategoriaMedia,
  type MediaAsset,
  type MediaAssetDescarga,
} from "@/domain/media-asset";

interface FormValues {
  nombre: string;
  categoria: CategoriaMedia;
  descripcion?: string;
  proyecto_id?: string | null;
  propiedad_id?: string | null;
}

/** Dispara la descarga en el navegador a partir de la URL firmada. */
function abrirDescarga(res: MediaAssetDescarga): void {
  const a = document.createElement("a");
  a.href = res.url;
  a.download = res.nombre_archivo;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Miniatura de la versión activa (solo imágenes; el resto muestra la categoría). */
function Miniatura({ asset }: { asset: MediaAsset }) {
  const esImagen = asset.categoria === "imagen" && Boolean(asset.version_activa_id);
  const { data } = useMediaAssetPreview(asset.media_asset_id, esImagen);
  const caja = {
    width: 56,
    height: 42,
    borderRadius: 8,
    background: "#eef3f0",
    display: "grid",
    placeItems: "center",
    color: "#8b9a93",
    fontSize: 10,
    overflow: "hidden",
    flex: "none",
  } as const;

  return (
    <span style={caja}>
      {esImagen && data ? (
        <img src={data.url} alt={asset.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        CATEGORIA_MEDIA_LABEL[asset.categoria]
      )}
    </span>
  );
}

/**
 * Medios — biblioteca de fotos, renders, videos y documentos del catálogo
 * (`/api/v1/media-assets`): metadatos + versiones en bucket privado (100 MB),
 * descarga por URL firmada y vínculo opcional a proyecto / propiedad.
 */
export function MediosPage() {
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaMedia | undefined>();
  const [filtroProyecto, setFiltroProyecto] = useState<string | undefined>();
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [historial, setHistorial] = useState<MediaAsset | null>(null);
  const [subiendoId, setSubiendoId] = useState<string | null>(null);
  const [form] = Form.useForm<FormValues>();

  // Selector de archivo único: la fila que lo abrió se recuerda en `destino`.
  const inputRef = useRef<HTMLInputElement>(null);
  const destino = useRef<MediaAsset | null>(null);

  const { data: medios, isLoading } = useMediaAssets();
  const { data: proyectos } = useProyectos();
  const { data: propiedades } = usePropiedades();
  const createMedia = useCreateMediaAsset();
  const updateMedia = useUpdateMediaAsset();
  const deleteMedia = useDeleteMediaAsset();
  const subirVersion = useSubirMediaAssetVersion();
  const descargar = useDescargarMediaAsset();
  const saving = createMedia.isPending || updateMedia.isPending;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (medios ?? []).filter((m) => {
      if (filtroCategoria && m.categoria !== filtroCategoria) return false;
      if (filtroProyecto && String(m.proyecto_id) !== filtroProyecto) return false;
      if (!q) return true;
      return (
        m.nombre.toLowerCase().includes(q) || (m.descripcion ?? "").toLowerCase().includes(q)
      );
    });
  }, [medios, search, filtroCategoria, filtroProyecto]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ categoria: "imagen" });
    setDrawerOpen(true);
  };

  const openEdit = (row: MediaAsset) => {
    setEditing(row);
    form.setFieldsValue({
      nombre: row.nombre,
      categoria: row.categoria,
      descripcion: row.descripcion ?? "",
      proyecto_id: row.proyecto_id ? String(row.proyecto_id) : null,
      propiedad_id: row.propiedad_id ? String(row.propiedad_id) : null,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    const parsed = mediaAssetSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    const payload = {
      nombre: parsed.data.nombre,
      categoria: parsed.data.categoria,
      descripcion: parsed.data.descripcion || null,
      proyecto_id: parsed.data.proyecto_id ?? null,
      propiedad_id: parsed.data.propiedad_id ?? null,
    };

    try {
      if (editing) {
        await updateMedia.mutateAsync({ id: editing.media_asset_id, data: payload });
        message.success("Medio actualizado.");
      } else {
        await createMedia.mutateAsync(payload);
        message.success("Medio creado. Sube su primer archivo desde la tabla.");
      }
      setDrawerOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar el medio.");
    }
  };

  const handleDelete = async (row: MediaAsset) => {
    try {
      await deleteMedia.mutateAsync(row.media_asset_id);
      message.success("Medio eliminado con todas sus versiones.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  };

  const pedirArchivo = (row: MediaAsset) => {
    destino.current = row;
    if (inputRef.current) {
      inputRef.current.accept = ACEPTADOS_MEDIA_POR_CATEGORIA[row.categoria];
      inputRef.current.click();
    }
  };

  const onArchivoElegido = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const asset = destino.current;
    event.target.value = "";
    if (!file || !asset) return;

    const error = validarArchivoMedia(file, asset.categoria);
    if (error) {
      message.error(error);
      return;
    }

    setSubiendoId(asset.media_asset_id);
    try {
      const version = await subirVersion.mutateAsync({
        assetId: asset.media_asset_id,
        file,
      });
      message.success(`Versión ${version.numero} subida y activada.`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "No se pudo subir el archivo.");
    } finally {
      setSubiendoId(null);
    }
  };

  const handleDescargar = async (row: MediaAsset) => {
    try {
      abrirDescarga(await descargar.mutateAsync({ assetId: row.media_asset_id }));
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo descargar.");
    }
  };

  const columns: ColumnsType<MediaAsset> = [
    {
      title: "Medio",
      dataIndex: "nombre",
      key: "nombre",
      render: (nombre: string, row) => (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Miniatura asset={row} />
          <div>
            <span style={{ fontWeight: 650, display: "block" }}>{nombre}</span>
            <span style={{ color: "#8b9a93", fontSize: 11.5 }}>
              {row.descripcion ?? "Sin descripción"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
      key: "categoria",
      width: 120,
      render: (c: CategoriaMedia) => <span className="mini-badge grey">{CATEGORIA_MEDIA_LABEL[c]}</span>,
    },
    {
      title: "Vinculado a",
      key: "vinculo",
      render: (_, row) =>
        row.propiedad || row.proyecto ? (
          <div>
            {row.proyecto && <span style={{ display: "block" }}>{row.proyecto.nombre}</span>}
            {row.propiedad && (
              <span style={{ color: "#8b9a93", fontSize: 11.5 }}>{row.propiedad.nombre}</span>
            )}
          </div>
        ) : (
          "—"
        ),
    },
    {
      title: "Versión activa",
      key: "version",
      width: 160,
      render: (_, row) =>
        row.version_activa ? (
          <span>
            <span className="mini-badge">v{row.version_activa.numero}</span>{" "}
            <span style={{ color: "#8b9a93", fontSize: 11.5 }}>
              {formatTamano(row.version_activa.tamano_bytes)}
            </span>
          </span>
        ) : (
          <span className="mini-badge warn">Sin archivo</span>
        ),
    },
    {
      title: "Actualizado",
      dataIndex: "actualizado_en",
      key: "actualizado_en",
      width: 130,
      render: (v: string) => formatFecha(v),
    },
    {
      title: "",
      key: "acciones",
      width: 250,
      render: (_, row) => (
        <span style={{ display: "flex", gap: 4 }}>
          <Button
            type="text"
            title="Subir nueva versión"
            icon={<UploadOutlined />}
            loading={subiendoId === row.media_asset_id}
            onClick={() => pedirArchivo(row)}
          />
          <Button
            type="text"
            title="Descargar versión activa"
            icon={<DownloadOutlined />}
            disabled={!row.version_activa_id}
            onClick={() => handleDescargar(row)}
          />
          <Button
            type="text"
            title="Historial de versiones"
            icon={<HistoryOutlined />}
            onClick={() => setHistorial(row)}
          />
          <Button type="text" title="Editar" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm
            title="¿Eliminar este medio?"
            description="Se borrarán también todas sus versiones."
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(row)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Catálogo inmobiliario</p>
          <h1>Medios</h1>
          <p className="sub">
            Fotos, renders, videos y documentos con historial de versiones en almacenamiento
            privado.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <PlusOutlined /> Nuevo medio
          </button>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          <Input
            className="search"
            allowClear
            prefix={<SearchOutlined style={{ color: "#9db3a8" }} />}
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            allowClear
            placeholder="Categoría"
            style={{ width: 160 }}
            value={filtroCategoria}
            onChange={setFiltroCategoria}
            options={CATEGORIAS_MEDIA.map((c) => ({ value: c, label: CATEGORIA_MEDIA_LABEL[c] }))}
          />
          <Select
            allowClear
            placeholder="Proyecto"
            style={{ width: 200 }}
            value={filtroProyecto}
            onChange={setFiltroProyecto}
            options={(proyectos ?? []).map((p) => ({
              value: String(p.proyecto_id),
              label: p.nombre,
            }))}
          />
          <span className="spacer" />
          <span className="count-pill">{filtered.length} medios</span>
        </div>
      </div>

      <Spin spinning={isLoading}>
        <div className="card" style={{ padding: "0 16px 8px" }}>
          <DataTable<MediaAsset>
            card={false}
            columns={columns}
            dataSource={filtered}
            rowKey="media_asset_id"
            pagination={filtered.length > 10 ? undefined : false}
          />
        </div>
      </Spin>
      <p className="footer-note">
        Máximo {LIMITE_BYTES_MEDIA / 1024 / 1024} MB por archivo · Imágenes PNG/JPG/WEBP/SVG, video
        MP4/WEBM y documentos PDF.
      </p>

      <input ref={inputRef} type="file" hidden onChange={onArchivoElegido} />

      <Drawer
        title={editing ? "Editar medio" : "Nuevo medio"}
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
            rules={[{ required: true, message: "Indica el nombre del medio." }]}
          >
            <Input placeholder="Ej: Render fachada norte" maxLength={80} />
          </Form.Item>
          <Form.Item
            name="categoria"
            label="Categoría"
            extra="Define qué tipos de archivo se aceptan al subir."
            rules={[{ required: true, message: "Selecciona la categoría." }]}
          >
            <Select
              options={CATEGORIAS_MEDIA.map((c) => ({ value: c, label: CATEGORIA_MEDIA_LABEL[c] }))}
            />
          </Form.Item>
          <div className="form-grid">
            <Form.Item name="proyecto_id" label="Proyecto">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Sin proyecto"
                options={(proyectos ?? []).map((p) => ({
                  value: String(p.proyecto_id),
                  label: p.nombre,
                }))}
              />
            </Form.Item>
            <Form.Item name="propiedad_id" label="Propiedad">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Sin propiedad"
                options={(propiedades ?? []).map((p) => ({
                  value: String(p.propiedad_id),
                  label: p.nombre,
                }))}
              />
            </Form.Item>
          </div>
          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Drawer>

      <HistorialModal asset={historial} onClose={() => setHistorial(null)} />
    </div>
  );
}

function HistorialModal({ asset, onClose }: { asset: MediaAsset | null; onClose: () => void }) {
  const { message } = App.useApp();
  const assetId = asset?.media_asset_id;
  const { data: versiones, isLoading } = useMediaAssetVersiones(assetId);
  const descargar = useDescargarMediaAsset();
  const restaurar = useRestaurarMediaAssetVersion();
  const eliminar = useEliminarMediaAssetVersion();

  const accion = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      message.success(ok);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo completar la acción.");
    }
  };

  return (
    <Modal
      title={asset ? `Versiones — ${asset.nombre}` : "Versiones"}
      open={asset !== null}
      onCancel={onClose}
      footer={null}
      width={680}
    >
      <Spin spinning={isLoading}>
        {(versiones ?? []).length === 0 && !isLoading && (
          <p className="sub">Aún no hay versiones. Sube el primer archivo desde la tabla.</p>
        )}
        {(versiones ?? []).map((v) => {
          const activa = String(asset?.version_activa_id) === String(v.media_asset_version_id);
          return (
            <div key={v.media_asset_version_id} className="list-row">
              <span className="who" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                <span>
                  <b>v{v.numero}</b> · {v.nombre_archivo}{" "}
                  {activa && <span className="mini-badge">Activa</span>}
                </span>
                <span style={{ color: "#8b9a93", fontSize: 11.5 }}>
                  {formatFecha(v.creado_en)} · {formatTamano(v.tamano_bytes)}
                  {v.nota ? ` · ${v.nota}` : ""}
                </span>
              </span>
              <span className="right" style={{ display: "flex", gap: 2 }}>
                <Button
                  type="text"
                  title="Descargar"
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    accion(async () => {
                      abrirDescarga(
                        await descargar.mutateAsync({
                          assetId: v.media_asset_id,
                          versionId: v.media_asset_version_id,
                        }),
                      );
                    }, "Descarga iniciada.")
                  }
                />
                {!activa && (
                  <Button
                    type="text"
                    title="Restaurar como activa"
                    icon={<UndoOutlined />}
                    onClick={() =>
                      accion(async () => {
                        await restaurar.mutateAsync({
                          assetId: v.media_asset_id,
                          versionId: v.media_asset_version_id,
                        });
                        onClose();
                      }, `Versión ${v.numero} restaurada.`)
                    }
                  />
                )}
                <Popconfirm
                  title="¿Eliminar esta versión?"
                  okText="Eliminar"
                  cancelText="Cancelar"
                  onConfirm={() =>
                    accion(
                      () =>
                        eliminar.mutateAsync({
                          assetId: v.media_asset_id,
                          versionId: v.media_asset_version_id,
                        }),
                      "Versión eliminada.",
                    )
                  }
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </span>
            </div>
          );
        })}
      </Spin>
    </Modal>
  );
}
