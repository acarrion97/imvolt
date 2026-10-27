import { useMemo, useState } from "react";
import { App, Button, Drawer, Form, Input, Select, Space, Table, Tag, Upload } from "antd";
import type { UploadFile } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  DownloadOutlined,
  HistoryOutlined,
  PlusOutlined,
  SearchOutlined,
  UndoOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  CATEGORIAS_MEDIA,
  EXTENSIONES_MEDIA,
  validarMediaArchivo,
  type CategoriaMedia,
  type MediaAsset,
  type MediaAssetCreate,
  type MediaAssetDescarga,
  type MediaAssetVersion,
} from "@/domain/media-asset";
import { formatFecha } from "@/presentation/components/common/status";
import { useAuth } from "@/presentation/auth/AuthProvider";
import {
  useCreateMediaAsset,
  useDeleteMediaAsset,
  useEliminarMediaAssetVersion,
  useDescargarMediaAsset,
  useMediaAssetVersiones,
  useMediaAssets,
  usePropiedades,
  useProyectos,
  useRestaurarMediaAssetVersion,
  useSubirMediaAssetVersion,
  useUpdateMediaAsset,
} from "@/presentation/hooks";

const CATEGORIA_LABEL: Record<CategoriaMedia, string> = {
  imagen: "Imagen",
  video: "Video",
  documento: "Documento",
  otro: "Otro",
};

function iniciarDescarga(result: MediaAssetDescarga): void {
  const link = document.createElement("a");
  link.href = result.url;
  link.download = result.nombre_archivo;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function MediaAssetsPage() {
  const { message, modal } = App.useApp();
  const { tienePermiso } = useAuth();
  const puedeCrearContenido = tienePermiso("crear_contenidos");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CategoriaMedia | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [history, setHistory] = useState<MediaAsset | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [historyFile, setHistoryFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [form] = Form.useForm<MediaAssetCreate>();

  const { data: assets, isLoading } = useMediaAssets();
  const { data: projects } = useProyectos();
  const { data: properties } = usePropiedades();
  const { data: versions, isLoading: loadingVersions } = useMediaAssetVersiones(
    history?.media_asset_id,
  );

  const create = useCreateMediaAsset();
  const update = useUpdateMediaAsset();
  const remove = useDeleteMediaAsset();
  const uploadVersion = useSubirMediaAssetVersion();
  const download = useDescargarMediaAsset();
  const restore = useRestaurarMediaAssetVersion();
  const removeVersion = useEliminarMediaAssetVersion();
  const saving = create.isPending || update.isPending || uploadVersion.isPending;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (assets ?? []).filter((asset) => {
      if (filter && asset.categoria !== filter) return false;
      return (
        !query ||
        asset.nombre.toLowerCase().includes(query) ||
        (asset.descripcion ?? "").toLowerCase().includes(query) ||
        (asset.proyecto?.nombre ?? "").toLowerCase().includes(query) ||
        (asset.propiedad?.nombre ?? "").toLowerCase().includes(query)
      );
    });
  }, [assets, filter, search]);

  const openCreate = () => {
    setEditing(null);
    setFile(null);
    form.resetFields();
    form.setFieldsValue({ categoria: "imagen" });
    setFormOpen(true);
  };

  const openEdit = (asset: MediaAsset) => {
    setEditing(asset);
    setFile(null);
    form.setFieldsValue({
      nombre: asset.nombre,
      categoria: asset.categoria,
      descripcion: asset.descripcion ?? undefined,
      proyecto_id: asset.proyecto_id ?? undefined,
      propiedad_id: asset.propiedad_id ?? undefined,
    });
    setFormOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    const payload: MediaAssetCreate = {
      ...values,
      descripcion: values.descripcion?.trim() || null,
      proyecto_id: values.proyecto_id || null,
      propiedad_id: values.propiedad_id || null,
    };
    if (file) {
      const error = validarMediaArchivo(file, payload.categoria);
      if (error) {
        message.error(error);
        return;
      }
    }
    try {
      let assetId: string;
      if (editing) {
        await update.mutateAsync({ id: editing.media_asset_id, data: payload });
        assetId = editing.media_asset_id;
      } else {
        const created = await create.mutateAsync(payload);
        assetId = created.media_asset_id;
      }
      if (file) {
        await uploadVersion.mutateAsync({
          assetId,
          file,
          nota: editing ? "Nueva versión desde edición." : "Versión inicial.",
        });
      }
      message.success(editing ? "Medio actualizado." : "Medio creado.");
      setFormOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar el medio.");
    }
  };

  const confirmDelete = (asset: MediaAsset) => {
    modal.confirm({
      title: "¿Eliminar este medio?",
      content: `${asset.nombre} y todo su historial de versiones se eliminarán.`,
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await remove.mutateAsync(asset.media_asset_id);
          message.success("Medio eliminado.");
        } catch (error) {
          message.error(error instanceof Error ? error.message : "No se pudo eliminar el medio.");
        }
      },
    });
  };

  const doDownload = async (assetId: string, versionId?: string) => {
    try {
      iniciarDescarga(await download.mutateAsync({ assetId, versionId }));
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo descargar el archivo.");
    }
  };

  const upload = async () => {
    if (!history || !historyFile) {
      message.warning("Selecciona primero un archivo.");
      return;
    }
    const error = validarMediaArchivo(historyFile, history.categoria);
    if (error) {
      message.error(error);
      return;
    }
    try {
      await uploadVersion.mutateAsync({
        assetId: history.media_asset_id,
        file: historyFile,
        nota: note.trim() || null,
      });
      setHistoryFile(null);
      setNote("");
      message.success("Versión subida y activada.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "No se pudo subir la versión.");
    }
  };

  const restoreVersion = async (version: MediaAssetVersion) => {
    if (!history) return;
    try {
      await restore.mutateAsync({
        assetId: history.media_asset_id,
        versionId: version.media_asset_version_id,
      });
      message.success(`Se activó la versión ${version.numero}.`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo restaurar la versión.");
    }
  };

  const deleteVersion = (version: MediaAssetVersion) => {
    if (!history) return;
    modal.confirm({
      title: `¿Eliminar la versión ${version.numero}?`,
      content: "También se eliminará el archivo guardado en el storage.",
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await removeVersion.mutateAsync({
            assetId: history.media_asset_id,
            versionId: version.media_asset_version_id,
          });
          message.success("Versión eliminada.");
        } catch (error) {
          message.error(error instanceof Error ? error.message : "No se pudo eliminar la versión.");
        }
      },
    });
  };

  const columns: ColumnsType<MediaAsset> = [
    {
      title: "Medio",
      dataIndex: "nombre",
      render: (name: string, asset) => (
        <div>
          <strong>{name}</strong>
          <div style={{ color: "#718579", fontSize: 12 }}>
            {asset.descripcion || "Sin descripción"}
          </div>
        </div>
      ),
    },
    {
      title: "Categoría",
      dataIndex: "categoria",
      render: (category: CategoriaMedia) => <Tag>{CATEGORIA_LABEL[category]}</Tag>,
    },
    {
      title: "Asociado a",
      render: (_, asset) => asset.propiedad?.nombre ?? asset.proyecto?.nombre ?? "General",
    },
    {
      title: "Archivo activo",
      render: (_, asset) =>
        asset.version_activa ? (
          <span>
            v{asset.version_activa.numero} · {asset.version_activa.nombre_archivo}
          </span>
        ) : (
          <Tag color="orange">Sin archivo</Tag>
        ),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 160,
      render: (_, asset) => (
        <Space>
          <Button
            type="text"
            title="Historial y versiones"
            icon={<HistoryOutlined />}
            onClick={() => {
              setHistory(asset);
              setHistoryFile(null);
              setNote("");
            }}
          />
          <Button
            type="text"
            title="Descargar versión activa"
            icon={<DownloadOutlined />}
            disabled={!asset.version_activa_id}
            onClick={() => void doDownload(asset.media_asset_id)}
          />
          {puedeCrearContenido && (
            <>
              <Button type="text" title="Editar" onClick={() => openEdit(asset)}>
                Editar
              </Button>
              <Button
                type="text"
                danger
                title="Eliminar"
                icon={<DeleteOutlined />}
                onClick={() => confirmDelete(asset)}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  const versionColumns: ColumnsType<MediaAssetVersion> = [
    { title: "Versión", dataIndex: "numero", render: (number: number) => `v${number}` },
    { title: "Archivo", dataIndex: "nombre_archivo" },
    {
      title: "Tamaño",
      dataIndex: "tamano_bytes",
      render: (bytes: number | null) => (bytes ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : "—"),
    },
    { title: "Nota", dataIndex: "nota", render: (value: string | null) => value || "—" },
    { title: "Fecha", dataIndex: "creado_en", render: formatFecha },
    {
      title: "Acciones",
      render: (_, version) => (
        <Space>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            title="Descargar versión"
            onClick={() =>
              history && void doDownload(history.media_asset_id, version.media_asset_version_id)
            }
          />
          {puedeCrearContenido && (
            <>
              <Button
                type="text"
                icon={<UndoOutlined />}
                title="Activar versión"
                disabled={history?.version_activa_id === version.media_asset_version_id}
                onClick={() => void restoreVersion(version)}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                title="Eliminar versión"
                onClick={() => deleteVersion(version)}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  const currentCategory = Form.useWatch("categoria", form) ?? "imagen";
  const fileList: UploadFile[] = file
    ? [{ uid: "media-file", name: file.name, status: "done" }]
    : [];
  const historyFileList: UploadFile[] = historyFile
    ? [{ uid: "media-version", name: historyFile.name, status: "done" }]
    : [];

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1>Medios</h1>
          <p className="sub">Imágenes, videos y documentos vinculados a proyectos y propiedades.</p>
        </div>
        <div className="header-actions">
          {puedeCrearContenido && (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <PlusOutlined /> Nuevo medio
            </button>
          )}
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          <Input
            className="search"
            allowClear
            prefix={<SearchOutlined style={{ color: "#9db3a8" }} />}
            placeholder="Buscar medios, proyectos o propiedades..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            allowClear
            placeholder="Todas las categorías"
            style={{ width: 190 }}
            value={filter}
            onChange={setFilter}
            options={CATEGORIAS_MEDIA.map((value) => ({
              value,
              label: CATEGORIA_LABEL[value],
            }))}
          />
          <span className="spacer" />
          <span className="count-pill">{filtered.length} medios</span>
        </div>
      </div>

      <div className="card" style={{ padding: "8px 16px" }}>
        <Table<MediaAsset>
          rowKey="media_asset_id"
          columns={columns}
          dataSource={filtered}
          loading={isLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: "Todavía no hay medios registrados." }}
        />
      </div>

      <Drawer
        title={editing ? "Editar medio" : "Nuevo medio"}
        size="large"
        open={formOpen}
        onClose={() => setFormOpen(false)}
        extra={puedeCrearContenido && (
          <Button type="primary" onClick={() => void save()} loading={saving}>
            Guardar
          </Button>
        )}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[
              { required: true, message: "Indica un nombre." },
              { min: 3, max: 80, message: "Usa entre 3 y 80 caracteres." },
            ]}
          >
            <Input maxLength={80} placeholder="Ej.: Render fachada principal" />
          </Form.Item>
          <Form.Item
            name="categoria"
            label="Categoría"
            rules={[{ required: true, message: "Selecciona la categoría." }]}
          >
            <Select
              options={CATEGORIAS_MEDIA.map((value) => ({
                value,
                label: CATEGORIA_LABEL[value],
              }))}
            />
          </Form.Item>
          <Form.Item name="descripcion" label="Descripción">
            <Input.TextArea rows={3} maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="proyecto_id" label="Proyecto asociado">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Ninguno"
              options={(projects ?? []).map((project) => ({
                value: project.project_id,
                label: project.nombre,
              }))}
            />
          </Form.Item>
          <Form.Item name="propiedad_id" label="Propiedad asociada">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Ninguna"
              options={(properties ?? []).map((property) => ({
                value: property.propiedad_id,
                label: `${property.nombre} · ${property.ubicacion}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={editing ? "Adjuntar nueva versión (opcional)" : "Archivo inicial (opcional)"}
          >
            <Upload
              accept={EXTENSIONES_MEDIA[currentCategory]}
              maxCount={1}
              fileList={fileList}
              beforeUpload={(selected) => {
                const error = validarMediaArchivo(selected, currentCategory);
                if (error) {
                  message.error(error);
                  setFile(null);
                  return Upload.LIST_IGNORE;
                }
                setFile(selected);
                return false;
              }}
              onRemove={() => {
                setFile(null);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>
                {file ? "Cambiar archivo" : "Seleccionar archivo"}
              </Button>
            </Upload>
            <div style={{ marginTop: 6, color: "#718579", fontSize: 12 }}>
              Máximo 100 MB. Los tipos permitidos dependen de la categoría.
            </div>
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title={history ? `Versiones · ${history.nombre}` : "Versiones"}
        size="large"
        open={Boolean(history)}
        onClose={() => setHistory(null)}
      >
        {history && (
          <>
            {puedeCrearContenido && <div className="card card-pad" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Subir nueva versión</div>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Upload
                  accept={EXTENSIONES_MEDIA[history.categoria]}
                  maxCount={1}
                  fileList={historyFileList}
                  beforeUpload={(selected) => {
                    const error = validarMediaArchivo(selected, history.categoria);
                    if (error) {
                      message.error(error);
                      setHistoryFile(null);
                      return Upload.LIST_IGNORE;
                    }
                    setHistoryFile(selected);
                    return false;
                  }}
                  onRemove={() => {
                    setHistoryFile(null);
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />}>
                    {historyFile ? "Cambiar archivo" : "Seleccionar archivo"}
                  </Button>
                </Upload>
                <Input
                  maxLength={500}
                  placeholder="Nota del cambio (opcional)"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <Button
                  type="primary"
                  onClick={() => void upload()}
                  loading={uploadVersion.isPending}
                >
                  Subir y activar
                </Button>
              </Space>
            </div>}
            <Table<MediaAssetVersion>
              rowKey="media_asset_version_id"
              columns={versionColumns}
              dataSource={versions ?? []}
              loading={loadingVersions}
              pagination={false}
              size="small"
            />
          </>
        )}
      </Drawer>
    </div>
  );
}
