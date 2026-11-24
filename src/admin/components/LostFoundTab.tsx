import { useEffect, useState, useRef } from 'react';
import type { DragEvent, FormEvent } from 'react';
import { Plus, Trash2, X, UploadCloud, MapPin, Calendar, User, Pencil, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DatePicker from './DatePicker';

interface LostItem {
  id: string;
  description: string;
  image_url: string | null;   // legacy — kept for compat
  images: string[];            // multi-photo array (source of truth)
  found_date: string;
  found_by: string | null;
  location_found: string | null;
  status: 'pendiente' | 'reclamado' | 'descartado';
  guest_name: string | null;
  notes: string | null;
  created_at: string;
}

type FormData = {
  description: string;
  found_date: string;
  found_by: string;
  location_found: string;
  guest_name: string;
  notes: string;
  images: string[];
  status: LostItem['status'];
};

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', reclamado: 'Reclamado', descartado: 'Descartado',
};
const STATUS_STYLE: Record<string, string> = {
  pendiente:  'bg-amber-100 text-amber-700 border-amber-200',
  reclamado:  'bg-green-100 text-green-700 border-green-200',
  descartado: 'bg-gray-100 text-gray-500 border-gray-200',
};

// ── Lightbox (module-level, stable) ──
function Lightbox({ images, index, onClose, onPrev, onNext }: {
  images: string[]; index: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
      onClick={onClose}>
      <button onClick={e => { e.stopPropagation(); onPrev(); }} disabled={index === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white disabled:opacity-20 transition-colors">
        <ChevronLeft size={22} />
      </button>
      <img src={images[index]} alt={`foto ${index + 1}`}
        className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
        onClick={e => e.stopPropagation()} />
      <button onClick={e => { e.stopPropagation(); onNext(); }} disabled={index === images.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white disabled:opacity-20 transition-colors">
        <ChevronRight size={22} />
      </button>
      <button onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors">
        <X size={18} />
      </button>
      <p className="absolute bottom-4 text-white/60 text-sm">{index + 1} / {images.length}</p>
    </div>
  );
}

// ── Card photo strip (module-level) ──
function CardPhotos({ images, onLightbox }: {
  images: string[];
  onLightbox: (i: number) => void;
}) {
  if (images.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-5xl">🔍</div>;
  }
  if (images.length === 1) {
    return (
      <img src={images[0]} alt="foto" onClick={() => onLightbox(0)}
        className="w-full h-full object-cover cursor-zoom-in" />
    );
  }
  return (
    <div className="w-full h-full grid grid-cols-2 gap-0.5 cursor-pointer" onClick={() => onLightbox(0)}>
      <img src={images[0]} alt="foto 1" className="w-full h-full object-cover" />
      <div className="relative">
        <img src={images[1]} alt="foto 2" className="w-full h-full object-cover" />
        {images.length > 2 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">+{images.length - 2}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Photo gallery editor inside modal (module-level) ──
function PhotoGalleryEditor({
  images, uploading, dragOver,
  onDragOver, onDragLeave, onDrop, onAdd, onRemove, fileRef, onChange,
}: {
  images: string[]; uploading: boolean; dragOver: boolean;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  fileRef: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-600">Fotos</label>

      {/* Existing photos grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
              <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => onRemove(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] leading-none shadow">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={onAdd}
        className={`border-2 border-dashed rounded-xl px-4 py-3 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}>
        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-1">
            <UploadCloud size={18} className="text-blue-400 animate-pulse" />
            <p className="text-sm text-gray-400">Subiendo foto...</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1">
            <Camera size={16} className="text-gray-300" />
            <p className="text-sm text-gray-400">
              {images.length === 0 ? 'Arrastrá o clickeá para agregar fotos' : 'Agregar otra foto'}
            </p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onChange} />
      </div>
    </div>
  );
}

export default function LostFoundTab() {
  const { profile: _profile } = useAuth();
  const [items,        setItems]        = useState<LostItem[]>([]);
  const [loading,      setLoading]      = useState(true);

  // ── Lightbox ──
  const [lightboxItem,  setLightboxItem]  = useState<LostItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ── Add modal ──
  const [showAdd,      setShowAdd]      = useState(false);
  const [adding,       setAdding]       = useState(false);
  const [addError,     setAddError]     = useState<string | null>(null);
  const [addDragOver,  setAddDragOver]  = useState(false);
  const [addUploading, setAddUploading] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);

  // ── Edit modal ──
  const [editTarget,    setEditTarget]    = useState<LostItem | null>(null);
  const [editSaving,    setEditSaving]    = useState(false);
  const [editError,     setEditError]     = useState<string | null>(null);
  const [editDragOver,  setEditDragOver]  = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  // ── Delete modal ──
  const [deleteTarget, setDeleteTarget] = useState<LostItem | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const emptyForm: FormData = {
    description: '', found_date: today, found_by: '',
    location_found: '', guest_name: '', notes: '', images: [], status: 'pendiente',
  };
  const [addForm,  setAddForm]  = useState<FormData>(emptyForm);
  const [editForm, setEditForm] = useState<FormData>(emptyForm);

  // ── Fetch ──
  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase.from('lost_items').select('*').order('found_date', { ascending: false });
    // normalise: if images[] is empty/null but image_url exists, back-fill
    const normalised = (data ?? []).map((x: LostItem) => ({
      ...x,
      images: (x.images && x.images.length > 0)
        ? x.images
        : x.image_url ? [x.image_url] : [],
    }));
    setItems(normalised);
    setLoading(false);
  }
  useEffect(() => { fetchItems(); }, []);

  // ── Upload one or multiple files ──
  async function uploadFiles(files: FileList | File[], forEdit: boolean) {
    const setErr = forEdit ? setEditError : setAddError;
    const setUpl = forEdit ? setEditUploading : setAddUploading;
    const addImgs = forEdit
      ? (urls: string[]) => setEditForm(f => ({ ...f, images: [...f.images, ...urls] }))
      : (urls: string[]) => setAddForm(f => ({ ...f, images: [...f.images, ...urls] }));

    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (arr.length === 0) { setErr('Selecciona imágenes válidas.'); return; }
    setUpl(true); setErr(null);

    const uploaded: string[] = [];
    for (const file of arr) {
      const ext  = file.name.split('.').pop() || 'jpg';
      const path = `lost-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('vitrina-images').upload(path, file);
      if (error) { setErr(error.message); continue; }
      const { data: pub } = supabase.storage.from('vitrina-images').getPublicUrl(path);
      uploaded.push(pub.publicUrl);
    }
    if (uploaded.length) addImgs(uploaded);
    setUpl(false);
  }

  // ── Add submit ──
  async function handleAddSubmit(e: FormEvent) {
    e.preventDefault();
    if (!addForm.description.trim()) { setAddError('La descripción es obligatoria.'); return; }
    setAdding(true); setAddError(null);
    const { data, error } = await supabase.from('lost_items').insert({
      description:    addForm.description.trim(),
      images:         addForm.images,
      image_url:      addForm.images[0] ?? null,   // keep legacy col in sync
      found_date:     addForm.found_date,
      found_by:       addForm.found_by.trim()       || null,
      location_found: addForm.location_found.trim() || null,
      status:         addForm.status,
      guest_name:     addForm.guest_name.trim()     || null,
      notes:          addForm.notes.trim()          || null,
    }).select().single();
    setAdding(false);
    if (error) { setAddError(error.message); return; }
    setItems(prev => [{ ...data, images: data.images ?? [] }, ...prev]);
    setShowAdd(false);
    setAddForm(emptyForm);
  }

  // ── Open edit ──
  function openEdit(item: LostItem) {
    setEditTarget(item);
    setEditForm({
      description:    item.description,
      found_date:     item.found_date,
      found_by:       item.found_by       ?? '',
      location_found: item.location_found ?? '',
      guest_name:     item.guest_name     ?? '',
      notes:          item.notes          ?? '',
      images:         item.images ?? [],
      status:         item.status,
    });
    setEditError(null);
  }

  // ── Edit submit ──
  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.description.trim()) { setEditError('La descripción es obligatoria.'); return; }
    setEditSaving(true); setEditError(null);
    const updates = {
      description:    editForm.description.trim(),
      images:         editForm.images,
      image_url:      editForm.images[0] ?? null,
      found_date:     editForm.found_date,
      found_by:       editForm.found_by.trim()       || null,
      location_found: editForm.location_found.trim() || null,
      status:         editForm.status,
      guest_name:     editForm.guest_name.trim()     || null,
      notes:          editForm.notes.trim()          || null,
    };
    const { error } = await supabase.from('lost_items').update(updates).eq('id', editTarget.id);
    setEditSaving(false);
    if (error) { setEditError(error.message); return; }
    setItems(prev => prev.map(x => x.id === editTarget.id ? { ...x, ...updates } as LostItem : x));
    setEditTarget(null);
  }

  async function updateStatus(item: LostItem, status: LostItem['status']) {
    await supabase.from('lost_items').update({ status }).eq('id', item.id);
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, status } : x));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('lost_items').delete().eq('id', deleteTarget.id);
    setItems(prev => prev.filter(x => x.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  }

  const pendientes = items.filter(x => x.status === 'pendiente').length;

  function StatusPicker({ value, onChange }: { value: LostItem['status']; onChange: (s: LostItem['status']) => void }) {
    return (
      <div className="flex gap-2">
        {(['pendiente', 'reclamado', 'descartado'] as LostItem['status'][]).map(s => (
          <button key={s} type="button" onClick={() => onChange(s)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl border-2 transition-all ${
              value === s
                ? s === 'pendiente' ? 'border-amber-400 bg-amber-400 text-white'
                : s === 'reclamado' ? 'border-green-500 bg-green-500 text-white'
                :                    'border-gray-400 bg-gray-400 text-white'
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
    );
  }

  // ── Shared text fields (inlined, no inner component) ──
  function TextFields({ form, setF }: { form: FormData; setF: React.Dispatch<React.SetStateAction<FormData>> }) {
    return (
      <>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción *</label>
          <input type="text" value={form.description}
            onChange={e => setF(f => ({ ...f, description: e.target.value }))}
            placeholder="Ej: Cargador iPhone negro, billetera café..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha hallado</label>
            <DatePicker value={form.found_date}
              onChange={v => setF(f => ({ ...f, found_date: v || today }))}
              placeholder="Seleccionar fecha" useFixed />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Encontrado en</label>
            <input type="text" value={form.location_found}
              onChange={e => setF(f => ({ ...f, location_found: e.target.value }))}
              placeholder="Hab. 203, lobby..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Encontrado por</label>
            <input type="text" value={form.found_by}
              onChange={e => setF(f => ({ ...f, found_by: e.target.value }))}
              placeholder="Nombre del staff"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Reclamado por</label>
            <input type="text" value={form.guest_name}
              onChange={e => setF(f => ({ ...f, guest_name: e.target.value }))}
              placeholder="Nombre del huésped"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
          <StatusPicker value={form.status} onChange={s => setF(f => ({ ...f, status: s }))} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Notas</label>
          <textarea value={form.notes} rows={2}
            onChange={e => setF(f => ({ ...f, notes: e.target.value }))}
            placeholder="Detalles adicionales..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none" />
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          {items.length} objetos registrados · <span className="text-amber-600 font-semibold">{pendientes} pendientes</span>
        </p>
        <button onClick={() => { setAddForm(emptyForm); setAddError(null); setShowAdd(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm rounded-lg transition-colors">
          <Plus size={16} /> Reportar objeto
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🔍</p>
          <p className="font-medium text-gray-500">No hay objetos perdidos registrados</p>
          <p className="text-xs mt-1">Cuando el staff encuentre algo, aparecerá aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="relative bg-gray-50 aspect-square overflow-hidden">
                <CardPhotos images={item.images}
                  onLightbox={i => { setLightboxItem(item); setLightboxIndex(i); }} />
                <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[item.status]}`}>
                  {STATUS_LABEL[item.status]}
                </span>
                {item.images.length > 1 && (
                  <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Camera size={9} /> {item.images.length}
                  </span>
                )}
                <button onClick={() => setDeleteTarget(item)}
                  className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm transition-colors">
                  <Trash2 size={11} />
                </button>
                <button onClick={() => openEdit(item)}
                  className="absolute bottom-2 right-2 w-7 h-7 bg-white/95 rounded-full flex items-center justify-center text-gray-500 hover:text-amber-600 hover:bg-amber-50 shadow-sm transition-colors">
                  <Pencil size={12} />
                </button>
              </div>
              <div className="p-3 flex-1 flex flex-col gap-1.5">
                <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2">{item.description}</p>
                {item.location_found && (
                  <p className="text-[11px] text-gray-500 flex items-center gap-1"><MapPin size={10} />{item.location_found}</p>
                )}
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(item.found_date + 'T12:00:00').toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                {item.found_by && (
                  <p className="text-[11px] text-gray-400 flex items-center gap-1"><User size={10} />{item.found_by}</p>
                )}
                {item.guest_name && (
                  <p className="text-[11px] text-green-600 font-medium">Reclamado por: {item.guest_name}</p>
                )}
                {item.notes && <p className="text-[11px] text-gray-400 italic line-clamp-2">{item.notes}</p>}
                <div className="mt-auto pt-2 flex gap-1 flex-wrap">
                  {item.status !== 'reclamado' && (
                    <button onClick={() => updateStatus(item, 'reclamado')}
                      className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition-colors">
                      ✓ Reclamado
                    </button>
                  )}
                  {item.status !== 'descartado' && (
                    <button onClick={() => updateStatus(item, 'descartado')}
                      className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100 transition-colors">
                      Descartar
                    </button>
                  )}
                  {item.status !== 'pendiente' && (
                    <button onClick={() => updateStatus(item, 'pendiente')}
                      className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors">
                      Pendiente
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxItem && (
        <Lightbox
          images={lightboxItem.images}
          index={lightboxIndex}
          onClose={() => setLightboxItem(null)}
          onPrev={() => setLightboxIndex(i => Math.max(0, i - 1))}
          onNext={() => setLightboxIndex(i => Math.min(lightboxItem.images.length - 1, i + 1))}
        />
      )}

      {/* ── Add Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-bold text-gray-900">Reportar objeto perdido</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <PhotoGalleryEditor
                images={addForm.images} uploading={addUploading} dragOver={addDragOver}
                onDragOver={e => { e.preventDefault(); setAddDragOver(true); }}
                onDragLeave={() => setAddDragOver(false)}
                onDrop={e => { e.preventDefault(); setAddDragOver(false); if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files, false); }}
                onAdd={() => addFileRef.current?.click()}
                onRemove={i => setAddForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                fileRef={addFileRef}
                onChange={e => { if (e.target.files?.length) uploadFiles(e.target.files, false); e.target.value = ''; }}
              />
              <TextFields form={addForm} setF={setAddForm} />
              {addError && <p className="text-sm text-red-500">{addError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={adding || addUploading}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors">
                  {adding ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-bold text-gray-900">Editar objeto perdido</h2>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <PhotoGalleryEditor
                images={editForm.images} uploading={editUploading} dragOver={editDragOver}
                onDragOver={e => { e.preventDefault(); setEditDragOver(true); }}
                onDragLeave={() => setEditDragOver(false)}
                onDrop={e => { e.preventDefault(); setEditDragOver(false); if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files, true); }}
                onAdd={() => editFileRef.current?.click()}
                onRemove={i => setEditForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                fileRef={editFileRef}
                onChange={e => { if (e.target.files?.length) uploadFiles(e.target.files, true); e.target.value = ''; }}
              />
              <TextFields form={editForm} setF={setEditForm} />
              {editError && <p className="text-sm text-red-500">{editError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="button"
                  onClick={() => { setDeleteTarget(editTarget); setEditTarget(null); }}
                  className="px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors">
                  <Trash2 size={15} />
                </button>
                <button type="submit" disabled={editSaving || editUploading}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors">
                  {editSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
            <p className="text-2xl mb-3">🗑️</p>
            <p className="font-bold text-gray-900 mb-1">¿Eliminar este objeto?</p>
            <p className="text-sm text-gray-500 mb-6 line-clamp-2">"{deleteTarget.description}"</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors">
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
