import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  App,
  Button,
  ColorPicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Spin,
  Upload,
} from "antd";
import type { UploadFile } from "antd";
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

import {
  CATEGORIA_ASSET_LABEL,
  USO_COLOR_LABEL,
  esImagenPreview,
  extensionDe,
  formatTamano,
  formatFechaCorta,
  hexASeguro,
  textoSobre,
} from "@/presentation/components/common/brandKitArt";
import {
  useBrandAssetPreview,
  useBrandAssetVersiones,
  useBrandAssets,
  useBrandColors,
  useCreateBrandAsset,
  useCreateBrandColor,
  useDeleteBrandAsset,
  useDeleteBrandColor,
  useDescargarBrandAsset,
  useEliminarBrandAssetVersion,
  useRestaurarBrandAssetVersion,
  useSubirBrandAssetVersion,
  useUpdateBrandAsset,
  useUpdateBrandColor,
} from "@/presentation/hooks";
import { brandAssetSchema, brandColorSchema } from "@/presentation/validations";
import {
  ACEPTADOS_POR_CATEGORIA,
  CATEGORIAS_ASSET,
  USOS_COLOR,
  validarArchivoCliente,
  type BrandAsset,
  type BrandAssetDescarga,
  type BrandAssetVersion,
  type BrandColor,
  type CategoriaAsset,
  type UsoColor,
} from "@/domain/brand-kit";

type Pestana = "archivos" | "colores";

interface AssetFormValues {
  nombre: string;
  categoria: CategoriaAsset;
  descripcion?: string;
}

interface ColorFormValues {
  nombre: string;
  hex: string;
  uso: UsoColor;
  orden: number;
}

const iconBtn: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 99,
  border: 0,
  background: "rgba(255,255,255,.91)",
  color: "#1c4e32",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  boxShadow: "0 3px 14px rgba(13,38,18,.16)",
};

/** Normaliza cualquier salida del selector a #RRGGBB (6 dígitos). */
function aHex7(valor: string): string {
  const s = valor.trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(s)) return s;
  if (/^#[0-9A-F]{7,8}$/.test(s)) return s.slice(0, 7);
  return s;
}

/** Dispara la descarga en el navegador a partir de la URL firmada. */
function abrirDescarga(res: BrandAssetDescarga): void {
  const a = document.createElement("a");
  a.href = res.url;
  a.download = res.nombre_archivo;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ── Tarjeta de archivo ───────────────────────────────────────────────────────
interface AssetCardProps {
  asset: BrandAsset;
  onEditar: (asset: BrandAsset) => void;
  onHistorial: (asset: BrandAsset) => void;
  onEliminar: (asset: BrandAsset) => void;
  onDescargar: (asset: BrandAsset) => void;
}

/**
 * Tarjeta de un archivo del Brand Kit. Es un componente aparte para poder
 * pedir la URL firmada de la previsualización con un hook por tarjeta
 * (las reglas de hooks prohíben llamarlos dentro del `map` del listado).
 */
function AssetCard({ asset, onEditar, onHistorial, onEliminar, onDescargar }: AssetCardProps) {
  const version = asset.version_activa;
  const previewHabilitado = esImagenPreview(asset.categoria) && Boolean(asset.version_activa_id);
  const { data: preview, isPending: cargandoPreview } = useBrandAssetPreview(
    asset.brand_asset_id,
    previewHabilitado,
  );

  const badgeActiva = version ? `v${version.numero}` : null;
  const nombreArchivo = version?.nombre_archivo ?? asset.nombre;

  return (
    <div className="card item-card">
      <div
        className="art"
        style={{ background: "linear-gradient(135deg,#eef6f1,#dcece3)" }}
      >
        {preview?.url ? (
          <img
            src={preview.url}
            alt={asset.nombre}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 20,
              boxSizing: "border-box",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              display: "grid",
              placeItems: "center",
              color: "#5d7a6c",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  textTransform: "uppercase",
                }}
              >
                .{extensionDe(nombreArchivo)}
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {cargandoPreview ? "Cargando…" : "Sin vista previa"}
              </div>
            </div>
          </div>
        )}

        <span className="tag">{CATEGORIA_ASSET_LABEL[asset.categoria]}</span>

        <div
          style={{
            position: "absolute",
            top: 11,
            right: 11,
            zIndex: 2,
            display: "flex",
            gap: 6,
          }}
        >
          <button
            type="button"
            style={iconBtn}
            title="Historial de versiones"
            onClick={() => onHistorial(asset)}
          >
            <HistoryOutlined style={{ fontSize: 13 }} />
          </button>
          <button
            type="button"
            style={iconBtn}
            title="Editar"
            onClick={() => onEditar(asset)}
          >
            <EditOutlined style={{ fontSize: 13 }} />
          </button>
          <Popconfirm
            title="¿Eliminar este archivo?"
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => onEliminar(asset)}
          >
            <button type="button" style={iconBtn} title="Eliminar">
              <DeleteOutlined style={{ fontSize: 13 }} />
            </button>
          </Popconfirm>
        </div>
      </div>

      <div className="item-meta">
        <h3>{asset.nombre}</h3>
        <span className="where">
          {asset.descripcion?.trim() || "Sin notas de uso."}
        </span>
        <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
          {badgeActiva ? (
            <span className="mini-badge">Activa {badgeActiva}</span>
          ) : (
            <span className="mini-badge warn">Sin versión</span>
          )}
          {version?.tamano_bytes ? (
            <span className="mini-badge grey">{formatTamano(version.tamano_bytes)}</span>
          ) : null}
          {version?.mime_type ? (
            <span className="mini-badge grey">{version.mime_type}</span>
          ) : null}
        </div>
      </div>

      <div className="item-bottom">
        <span className="price" style={{ fontSize: 12, color: "#4c6558" }}>
          {version ? formatFechaCorta(version.creado_en) : "—"}
        </span>
        <button
          type="button"
          className="btn btn-outline"
          style={{ padding: "8px 13px", fontSize: 11 }}
          onClick={() => onDescargar(asset)}
        >
          <DownloadOutlined /> Descargar
        </button>
      </div>
    </div>
  );
}

// ── Página ───────────────────────────────────────────────────────────────────
/**
 * Brand Kit — biblioteca de marca por empresa (tenant):
 *
 *  - **Archivos** (logos, tipografías, imágenes, documentos) con control de
 *    VERSIONES: cada subida crea una versión y queda activa; se pueden
 *    descargar, restaurar y borrar. Los blobs viven en un bucket PRIVADO de
 *    Supabase Storage y la descarga siempre pasa por el API (URL firmada).
 *  - **Paleta de colores** corporativa (nombre, hex, uso y orden).
 */
export function BrandKitPage() {
  const { message, modal } = App.useApp();

  const [pestana, setPestana] = useState<Pestana>("archivos");
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaAsset | undefined>();
  const [searchColor, setSearchColor] = useState("");
  const [filtroUso, setFiltroUso] = useState<UsoColor | undefined>();

  // Drawer de archivo (alta / edición + archivo adjunto)
  const [assetOpen, setAssetOpen] = useState(false);
  const [assetEditing, setAssetEditing] = useState<BrandAsset | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [assetForm] = Form.useForm<AssetFormValues>();
  const categoriaActual = Form.useWatch("categoria", assetForm);

  // Drawer de historial de versiones
  const [historialAsset, setHistorialAsset] = useState<BrandAsset | null>(null);
  const [archivoVersion, setArchivoVersion] = useState<File | null>(null);
  const [notaVersion, setNotaVersion] = useState("");

  // Drawer de color (alta / edición)
  const [colorOpen, setColorOpen] = useState(false);
  const [colorEditing, setColorEditing] = useState<BrandColor | null>(null);
  const [colorForm] = Form.useForm<ColorFormValues>();
  const hexActual = aHex7(Form.useWatch("hex", colorForm) ?? "#00D94B");

  // Datos
  const { data: assets, isLoading: cargandoAssets } = useBrandAssets();
  const { data: colores, isLoading: cargandoColores } = useBrandColors();
  const { data: versiones, isLoading: cargandoVersiones } = useBrandAssetVersiones(
    historialAsset?.brand_asset_id,
  );

  // Escrituras de archivos
  const crearAsset = useCreateBrandAsset();
  const actualizarAsset = useUpdateBrandAsset();
  const eliminarAsset = useDeleteBrandAsset();
  const subirVersion = useSubirBrandAssetVersion();
  const restaurarVersion = useRestaurarBrandAssetVersion();
  const borrarVersion = useEliminarBrandAssetVersion();
  const descargar = useDescargarBrandAsset();

  // Escrituras de colores
  const crearColor = useCreateBrandColor();
  const actualizarColor = useUpdateBrandColor();
  const eliminarColor = useDeleteBrandColor();

  const guardandoAsset = crearAsset.isPending || actualizarAsset.isPending || subirVersion.isPending;
  const guardandoColor = crearColor.isPending || actualizarColor.isPending;

  // ── Selección / filtros ────────────────────────────────────────────────────
  const assetsFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (assets ?? []).filter((a) => {
      if (filtroCategoria && a.categoria !== filtroCategoria) return false;
      if (!q) return true;
      return (
        a.nombre.toLowerCase().includes(q) ||
        (a.descripcion ?? "").toLowerCase().includes(q) ||
        (a.version_activa?.nombre_archivo ?? "").toLowerCase().includes(q)
      );
    });
  }, [assets, search, filtroCategoria]);

  const coloresFiltrados = useMemo(() => {
    const q = searchColor.trim().toLowerCase();
    return [...(colores ?? [])]
      .filter((c) => {
        if (filtroUso && c.uso !== filtroUso) return false;
        if (!q) return true;
        return c.nombre.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q);
      })
      .sort((a, b) => a.orden - b.orden);
  }, [colores, searchColor, filtroUso]);

  const categoriaOptions = useMemo(
    () =>
      CATEGORIAS_ASSET.map((value) => ({ value, label: CATEGORIA_ASSET_LABEL[value] })),
    [],
  );

  // ── Acciones de archivo ────────────────────────────────────────────────────
  const abrirAltaAsset = () => {
    setAssetEditing(null);
    assetForm.resetFields();
    assetForm.setFieldsValue({ categoria: "logo_horizontal" });
    setArchivo(null);
    setAssetOpen(true);
  };

  const abrirEdicionAsset = (row: BrandAsset) => {
    setAssetEditing(row);
    assetForm.setFieldsValue({
      nombre: row.nombre,
      categoria: row.categoria,
      descripcion: row.descripcion ?? undefined,
    });
    setArchivo(null);
    setAssetOpen(true);
  };

  const guardarAsset = async () => {
    const values = await assetForm.validateFields().catch(() => null);
    if (!values) return;

    const parsed = brandAssetSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    if (archivo) {
      const error = validarArchivoCliente(archivo, parsed.data.categoria);
      if (error) {
        message.error(error);
        return;
      }
    }

    try {
      if (assetEditing) {
        await actualizarAsset.mutateAsync({
          id: assetEditing.brand_asset_id,
          data: parsed.data,
        });
        if (archivo) {
          await subirVersion.mutateAsync({
            assetId: assetEditing.brand_asset_id,
            file: archivo,
            nota: "Reemplazo desde la edición del archivo.",
          });
          message.success("Archivo y nueva versión guardados.");
        } else {
          message.success("Archivo actualizado.");
        }
      } else {
        const creado = await crearAsset.mutateAsync(parsed.data);
        if (archivo) {
          await subirVersion.mutateAsync({
            assetId: creado.brand_asset_id,
            file: archivo,
            nota: "Versión inicial.",
          });
          message.success("Archivo creado con su primera versión.");
        } else {
          message.success("Archivo creado. Sube una versión desde su historial.");
        }
      }
      setAssetOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar el archivo.");
    }
  };

  const eliminarAssetConfirmado = (row: BrandAsset) => {
    modal.confirm({
      title: "¿Eliminar este archivo?",
      content: `${row.nombre} y TODAS sus versiones se eliminarán del bucket de marca. Esta acción no se puede deshacer.`,
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await eliminarAsset.mutateAsync(row.brand_asset_id);
          message.success("Archivo eliminado.");
        } catch (error) {
          message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
        }
      },
    });
  };

  const descargarAsset = async (row: BrandAsset) => {
    if (!row.version_activa_id) {
      message.warning("Este archivo aún no tiene versiones para descargar.");
      return;
    }
    try {
      const res = await descargar.mutateAsync({ assetId: row.brand_asset_id });
      abrirDescarga(res);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo generar la descarga.");
    }
  };

  const descargarVersion = async (assetId: string, versionId: string) => {
    try {
      const res = await descargar.mutateAsync({ assetId, versionId });
      abrirDescarga(res);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo generar la descarga.");
    }
  };

  // ── Acciones de historial ──────────────────────────────────────────────────
  const abrirHistorial = (row: BrandAsset) => {
    setHistorialAsset(row);
    setArchivoVersion(null);
    setNotaVersion("");
  };

  const subirNuevaVersion = async () => {
    if (!historialAsset) return;
    if (!archivoVersion) {
      message.warning("Selecciona primero un archivo.");
      return;
    }
    const error = validarArchivoCliente(archivoVersion, historialAsset.categoria);
    if (error) {
      message.error(error);
      return;
    }
    try {
      await subirVersion.mutateAsync({
        assetId: historialAsset.brand_asset_id,
        file: archivoVersion,
        nota: notaVersion.trim() || null,
      });
      setArchivoVersion(null);
      setNotaVersion("");
      message.success("Nueva versión subida y activada.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "No se pudo subir la versión.");
    }
  };

  const restaurar = async (versionId: string) => {
    if (!historialAsset) return;
    try {
      await restaurarVersion.mutateAsync({
        assetId: historialAsset.brand_asset_id,
        versionId,
      });
      message.success("Versión restaurada como activa.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo restaurar.");
    }
  };

  const borrarVersionConfirmada = (versionId: string) => {
    if (!historialAsset) return;
    modal.confirm({
      title: "¿Eliminar esta versión?",
      content: "Se borrará también su archivo del bucket. Las demás versiones se conservan.",
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await borrarVersion.mutateAsync({
            assetId: historialAsset.brand_asset_id,
            versionId,
          });
          message.success("Versión eliminada.");
        } catch (error) {
          message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
        }
      },
    });
  };

  // ── Acciones de color ──────────────────────────────────────────────────────
  const abrirAltaColor = () => {
    setColorEditing(null);
    colorForm.resetFields();
    colorForm.setFieldsValue({ hex: "#00D94B", uso: "principal", orden: 0 });
    setColorOpen(true);
  };

  const abrirEdicionColor = (row: BrandColor) => {
    setColorEditing(row);
    colorForm.setFieldsValue({
      nombre: row.nombre,
      hex: row.hex,
      uso: row.uso,
      orden: row.orden,
    });
    setColorOpen(true);
  };

  const guardarColor = async () => {
    const values = await colorForm.validateFields().catch(() => null);
    if (!values) return;

    const parsed = brandColorSchema.safeParse(values);
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? "Revisa los datos del formulario.");
      return;
    }

    try {
      if (colorEditing) {
        await actualizarColor.mutateAsync({ id: colorEditing.brand_color_id, data: parsed.data });
        message.success("Color actualizado.");
      } else {
        await crearColor.mutateAsync(parsed.data);
        message.success("Color añadido a la paleta.");
      }
      setColorOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo guardar el color.");
    }
  };

  const eliminarColorConfirmado = (row: BrandColor) => {
    modal.confirm({
      title: "¿Eliminar este color?",
      content: `${row.nombre} (${row.hex}) se quitará de la paleta de la empresa.`,
      okText: "Eliminar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await eliminarColor.mutateAsync(row.brand_color_id);
          message.success("Color eliminado.");
        } catch (error) {
          message.error(error instanceof Error ? error.message : "No se pudo eliminar.");
        }
      },
    });
  };

  // ── Upload controlado (no sube hasta que lo pedimos) ──────────────────────
  const fileList: UploadFile[] = archivo
    ? [{ uid: "archivo-nuevo", name: archivo.name, status: "done" }]
    : [];
  const fileListVersion: UploadFile[] = archivoVersion
    ? [{ uid: "version-nueva", name: archivoVersion.name, status: "done" }]
    : [];

  const presetsColores = [
    {
      label: "Paleta IMVOLT",
      colors: ["#00D94B", "#04EB40", "#075335", "#101719", "#F2F7F4"],
    },
  ];

  const uploadArchivo = (
    <Upload
      accept={ACEPTADOS_POR_CATEGORIA[categoriaActual ?? "otro"]}
      maxCount={1}
      fileList={fileList}
      beforeUpload={(file) => {
        setArchivo(file);
        return false;
      }}
      onRemove={() => {
        setArchivo(null);
        return false;
      }}
      showUploadList={{ showPreviewIcon: false }}
    >
      <Button icon={<UploadOutlined />}>
        {archivo ? "Cambiar archivo" : "Seleccionar archivo"}
      </Button>
    </Upload>
  );

  return (
    <div>
      <div className="header">
        <div>
          <p className="eyebrow">Identidad de marca</p>
          <h1>Brand Kit</h1>
          <p className="sub">
            Logotipos, tipografías y colores de la empresa en un solo lugar, con versiones y
            descarga autorizada.
          </p>
        </div>
        <div className="header-actions">
          {pestana === "archivos" ? (
            <button type="button" className="btn btn-primary" onClick={abrirAltaAsset}>
              <PlusOutlined /> Nuevo archivo
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={abrirAltaColor}>
              <PlusOutlined /> Nuevo color
            </button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab${pestana === "archivos" ? " active" : ""}`}
          onClick={() => setPestana("archivos")}
        >
          Archivos ({assets?.length ?? 0})
        </button>
        <button
          type="button"
          className={`tab${pestana === "colores" ? " active" : ""}`}
          onClick={() => setPestana("colores")}
        >
          Paleta de colores ({colores?.length ?? 0})
        </button>
      </div>

      {pestana === "archivos" ? (
        <>
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div className="filters" style={{ marginBottom: 0 }}>
              <Input
                className="search"
                allowClear
                prefix={<SearchOutlined style={{ color: "#9db3a8" }} />}
                placeholder="Buscar por nombre, notas o archivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                allowClear
                placeholder="Categoría"
                style={{ width: 210 }}
                value={filtroCategoria}
                onChange={setFiltroCategoria}
                options={categoriaOptions}
              />
              <span className="spacer" />
              <span className="count-pill">{assetsFiltrados.length} archivos</span>
            </div>
          </div>

          <Spin spinning={cargandoAssets}>
            <div className="grid cols3">
              {assetsFiltrados.map((asset) => (
                <AssetCard
                  key={asset.brand_asset_id}
                  asset={asset}
                  onEditar={abrirEdicionAsset}
                  onHistorial={abrirHistorial}
                  onEliminar={eliminarAssetConfirmado}
                  onDescargar={descargarAsset}
                />
              ))}

              {assetsFiltrados.length === 0 && !cargandoAssets && (
                <div
                  className="card card-pad"
                  style={{ gridColumn: "1 / -1", textAlign: "center" }}
                >
                  <p className="sub">
                    {assets?.length
                      ? "Ningún archivo coincide con los filtros."
                      : "Aún no hay archivos en el Brand Kit."}
                  </p>
                  <div style={{ marginTop: 14 }}>
                    <button type="button" className="btn btn-primary" onClick={abrirAltaAsset}>
                      <PlusOutlined /> Nuevo archivo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Spin>
        </>
      ) : (
        <>
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div className="filters" style={{ marginBottom: 0 }}>
              <Input
                className="search"
                allowClear
                prefix={<SearchOutlined style={{ color: "#9db3a8" }} />}
                placeholder="Buscar por nombre o código hex..."
                value={searchColor}
                onChange={(e) => setSearchColor(e.target.value)}
              />
              <Select
                allowClear
                placeholder="Uso"
                style={{ width: 170 }}
                value={filtroUso}
                onChange={setFiltroUso}
                options={USOS_COLOR.map((value) => ({
                  value,
                  label: USO_COLOR_LABEL[value],
                }))}
              />
              <span className="spacer" />
              <span className="count-pill">{coloresFiltrados.length} colores</span>
            </div>
          </div>

          <Spin spinning={cargandoColores}>
            <div className="grid cols4">
              {coloresFiltrados.map((color) => {
                const hex = hexASeguro(color.hex);
                return (
                  <div key={color.brand_color_id} className="card item-card">
                    <div
                      style={{
                        position: "relative",
                        height: 130,
                        borderRadius: 12,
                        background: hex,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          color: textoSobre(hex),
                        }}
                      >
                        {color.hex}
                      </span>
                      <span
                        className="tag"
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          background: "rgba(255,255,255,.91)",
                          padding: "5px 10px",
                          borderRadius: 99,
                          fontSize: 10,
                          fontWeight: 750,
                          color: "#1c4e32",
                        }}
                      >
                        {USO_COLOR_LABEL[color.uso]}
                      </span>
                      <div
                        style={{
                          position: "absolute",
                          top: 11,
                          right: 11,
                          display: "flex",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          style={iconBtn}
                          title="Editar"
                          onClick={() => abrirEdicionColor(color)}
                        >
                          <EditOutlined style={{ fontSize: 13 }} />
                        </button>
                        <Popconfirm
                          title="¿Eliminar este color?"
                          okText="Eliminar"
                          cancelText="Cancelar"
                          onConfirm={() => eliminarColorConfirmado(color)}
                        >
                          <button type="button" style={iconBtn} title="Eliminar">
                            <DeleteOutlined style={{ fontSize: 13 }} />
                          </button>
                        </Popconfirm>
                      </div>
                    </div>

                    <div className="item-meta">
                      <h3>{color.nombre}</h3>
                      <span className="where">Orden en la paleta: {color.orden}</span>
                    </div>
                  </div>
                );
              })}

              {coloresFiltrados.length === 0 && !cargandoColores && (
                <div
                  className="card card-pad"
                  style={{ gridColumn: "1 / -1", textAlign: "center" }}
                >
                  <p className="sub">
                    {colores?.length
                      ? "Ningún color coincide con los filtros."
                      : "La paleta de la empresa está vacía."}
                  </p>
                  <div style={{ marginTop: 14 }}>
                    <button type="button" className="btn btn-primary" onClick={abrirAltaColor}>
                      <PlusOutlined /> Nuevo color
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Spin>
        </>
      )}

      {/* ── Drawer: alta / edición de archivo ─────────────────────────────── */}
      <Drawer
        title={assetEditing ? "Editar archivo" : "Nuevo archivo"}
        size="large"
        open={assetOpen}
        onClose={() => setAssetOpen(false)}
        extra={
          <Button type="primary" onClick={guardarAsset} loading={guardandoAsset}>
            Guardar
          </Button>
        }
      >
        <Form form={assetForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: "Indica el nombre del archivo." }]}
          >
            <Input placeholder="Ej: Logo horizontal principal" maxLength={80} showCount />
          </Form.Item>

          <div className="form-grid">
            <Form.Item
              name="categoria"
              label="Categoría"
              rules={[{ required: true, message: "Selecciona la categoría." }]}
            >
              <Select placeholder="Categoría" options={categoriaOptions} />
            </Form.Item>
            <Form.Item
              name="descripcion"
              label="Notas de uso"
              rules={[{ max: 500, message: "Máximo 500 caracteres." }]}
            >
              <Input placeholder="Ej: Versión principal sobre fondo claro" maxLength={500} />
            </Form.Item>
          </div>

          <Form.Item
            label="Archivo"
            extra={
              assetEditing
                ? "Al adjuntar un archivo se creará una NUEVA VERSIÓN y quedará activa."
                : "Opcional: si lo adjuntas, se creará la versión 1 del archivo. Tamaño máximo 10 MB."
            }
          >
            {uploadArchivo}
          </Form.Item>
        </Form>
      </Drawer>

      {/* ── Drawer: historial de versiones ────────────────────────────────── */}
      <Drawer
        title={historialAsset ? `Versiones — ${historialAsset.nombre}` : "Versiones"}
        width={560}
        open={Boolean(historialAsset)}
        onClose={() => setHistorialAsset(null)}
      >
        {historialAsset && (
          <>
            <div className="card card-pad" style={{ marginBottom: 18 }}>
              <div className="field">
                <label>Subir nueva versión</label>
                <Upload
                  accept={ACEPTADOS_POR_CATEGORIA[historialAsset.categoria]}
                  maxCount={1}
                  fileList={fileListVersion}
                  beforeUpload={(file) => {
                    setArchivoVersion(file);
                    return false;
                  }}
                  onRemove={() => {
                    setArchivoVersion(null);
                    return false;
                  }}
                  showUploadList={{ showPreviewIcon: false }}
                >
                  <Button icon={<UploadOutlined />}>
                    {archivoVersion ? "Cambiar" : "Seleccionar archivo"}
                  </Button>
                </Upload>
              </div>

              <div className="field">
                <label>Nota del cambio (opcional)</label>
                <Input
                  value={notaVersion}
                  onChange={(e) => setNotaVersion(e.target.value)}
                  placeholder="Ej: Margen de seguridad ampliado"
                  maxLength={500}
                />
              </div>

              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={subirNuevaVersion}
                loading={subirVersion.isPending}
                disabled={!archivoVersion}
              >
                Subir versión
              </Button>
            </div>

            <Spin spinning={cargandoVersiones}>
              {(versiones ?? []).map((v: BrandAssetVersion) => {
                const esActiva = v.brand_asset_version_id === historialAsset.version_activa_id;
                return (
                  <div className="list-row" key={v.brand_asset_version_id}>
                    <div className="who">
                      <span className={`list-dot${esActiva ? "" : " grey"}`} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5 }}>
                          v{v.numero} · {v.nombre_archivo}
                        </div>
                        <div style={{ fontSize: 11, color: "#7b8f85" }}>
                          {formatFechaCorta(v.creado_en)} · {formatTamano(v.tamano_bytes)}
                          {esActiva ? " · ACTIVA" : ""}
                        </div>
                        {v.nota && (
                          <div style={{ fontSize: 11, color: "#7b8f85", marginTop: 2 }}>
                            {v.nota}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        style={{ ...iconBtn, boxShadow: "none", background: "#eff5f1" }}
                        title="Descargar"
                        onClick={() =>
                          descargarVersion(
                            historialAsset.brand_asset_id,
                            v.brand_asset_version_id,
                          )
                        }
                      >
                        <DownloadOutlined style={{ fontSize: 13 }} />
                      </button>
                      {!esActiva && (
                        <button
                          type="button"
                          style={{ ...iconBtn, boxShadow: "none", background: "#eff5f1" }}
                          title="Restaurar como activa"
                          onClick={() => restaurar(v.brand_asset_version_id)}
                        >
                          <UndoOutlined style={{ fontSize: 13 }} />
                        </button>
                      )}
                      <Popconfirm
                        title="¿Eliminar esta versión?"
                        okText="Eliminar"
                        cancelText="Cancelar"
                        onConfirm={() => borrarVersionConfirmada(v.brand_asset_version_id)}
                      >
                        <button
                          type="button"
                          style={{ ...iconBtn, boxShadow: "none", background: "#fff0ec" }}
                          title="Eliminar"
                        >
                          <DeleteOutlined style={{ fontSize: 13, color: "#a8432e" }} />
                        </button>
                      </Popconfirm>
                    </div>
                  </div>
                );
              })}

              {!cargandoVersiones && (versiones ?? []).length === 0 && (
                <p className="sub" style={{ textAlign: "center" }}>
                  Este archivo todavía no tiene versiones.
                </p>
              )}
            </Spin>
          </>
        )}
      </Drawer>

      {/* ── Drawer: alta / edición de color ───────────────────────────────── */}
      <Drawer
        title={colorEditing ? "Editar color" : "Nuevo color"}
        open={colorOpen}
        onClose={() => setColorOpen(false)}
        extra={
          <Button type="primary" onClick={guardarColor} loading={guardandoColor}>
            Guardar
          </Button>
        }
      >
        <Form form={colorForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: "Indica el nombre del color." }]}
          >
            <Input placeholder="Ej: Verde IMVOLT" maxLength={50} showCount />
          </Form.Item>

          <Form.Item label="Selector de color">
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <ColorPicker
                value={hexActual}
                onChangeComplete={(c) => colorForm.setFieldValue("hex", aHex7(c.toHexString()))}
                presets={presetsColores}
                showText
              />
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: hexASeguro(hexActual),
                  border: "1px solid rgba(16,23,25,.12)",
                }}
              />
            </div>
          </Form.Item>

          <div className="form-grid">
            <Form.Item
              name="hex"
              label="Código hexadecimal"
              rules={[
                { required: true, message: "Indica el color." },
                {
                  pattern: /^#[0-9A-Fa-f]{6}$/,
                  message: "Usa el formato #RRGGBB (p. ej. #00D94B).",
                },
              ]}
            >
              <Input placeholder="#00D94B" maxLength={7} />
            </Form.Item>

            <Form.Item
              name="uso"
              label="Uso"
              rules={[{ required: true, message: "Selecciona el uso." }]}
            >
              <Select
                options={USOS_COLOR.map((value) => ({
                  value,
                  label: USO_COLOR_LABEL[value],
                }))}
              />
            </Form.Item>

            <Form.Item
              name="orden"
              label="Orden en la paleta"
              rules={[{ required: true, message: "Indica el orden." }]}
            >
              <InputNumber min={0} max={999} style={{ width: "100%" }} />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </div>
  );
}
