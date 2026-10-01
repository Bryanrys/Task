import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Plus, Trash2, Globe, GraduationCap, FolderGit2, Mail, MessageSquare } from 'lucide-react';

export interface UniversityLinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
}

interface UniversityLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export const DEFAULT_LINKS: UniversityLinkItem[] = [
  {
    id: 'link-1',
    title: 'Portal Estudiantes UEES',
    url: 'https://portal.uees.edu.sv',
    category: 'Oficial',
  },
  {
    id: 'link-2',
    title: 'Aula Virtual (Moodle / Canvas)',
    url: 'https://aulavirtual.uees.edu.sv',
    category: 'Clases',
  },
  {
    id: 'link-3',
    title: 'Correo Institucional UEES',
    url: 'https://outlook.office.com',
    category: 'Correo',
  },
  {
    id: 'link-4',
    title: 'Microsoft Teams (Clases)',
    url: 'https://teams.microsoft.com',
    category: 'En vivo',
  },
  {
    id: 'link-5',
    title: 'OneDrive Proyectos UEES',
    url: 'https://onedrive.live.com',
    category: 'Archivos',
  },
];

export const LINKS_STORAGE_KEY = 'academic_university_links_v1';

export const UniversityLinksModal: React.FC<UniversityLinksModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
}) => {
  const [links, setLinks] = useState<UniversityLinkItem[]>(() => {
    try {
      const saved = localStorage.getItem(LINKS_STORAGE_KEY);
      if (saved) {
        const parsed: UniversityLinkItem[] = JSON.parse(saved);
        // Migrar links antiguos de Google a OneDrive
        return parsed.map((item) => {
          if (item.url.includes('drive.google.com')) {
            return {
              ...item,
              title: item.title.includes('Google') ? 'OneDrive Proyectos UEES' : item.title,
              url: 'https://onedrive.live.com',
            };
          }
          return item;
        });
      }
    } catch {}
    return DEFAULT_LINKS;
  });

  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Personal');

  // Reload when modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(LINKS_STORAGE_KEY);
        if (saved) setLinks(JSON.parse(saved));
      } catch {}
    }
  }, [isOpen]);

  // Live sync with cloud downloads
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(LINKS_STORAGE_KEY);
        if (saved) setLinks(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('academic_data_synced', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('academic_data_synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links));
  }, [links]);

  if (!isOpen) return null;

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let formattedUrl = newUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const newItem: UniversityLinkItem = {
      id: `link-${Date.now()}`,
      title: newTitle.trim(),
      url: formattedUrl,
      category: newCategory.trim() || 'General',
    };

    setLinks((prev) => [...prev, newItem]);
    setNewTitle('');
    setNewUrl('');
    setIsAdding(false);
  };

  const handleDeleteLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-sm rounded-3xl p-6 border shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#141210] border-[#292524] text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-yellow-400/10 text-yellow-500">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider font-mono">
                ENLACES RÁPIDOS UEES
              </h3>
              <p className="text-[11px] text-stone-400">Portales, aulas y recursos en 1 toque</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-400 hover:text-stone-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links List */}
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 mb-4">
          {links.map((link) => (
            <div
              key={link.id}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                isDark
                  ? 'bg-[#1a1715] border-[#292524] hover:border-[#38332e]'
                  : 'bg-stone-50 border-stone-200 hover:border-stone-300'
              }`}
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center gap-2.5 overflow-hidden"
              >
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isDark ? 'bg-[#24201c] text-yellow-400' : 'bg-stone-200/80 text-amber-700'
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                </div>
                <div className="truncate">
                  <span className="font-extrabold text-xs block truncate group-hover:text-yellow-400 transition-colors">
                    {link.title}
                  </span>
                  <span className="text-[10px] text-stone-400 truncate block">
                    {link.url.replace(/^https?:\/\//i, '')}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-yellow-400 shrink-0 ml-auto mr-1" />
              </a>

              <button
                onClick={() => handleDeleteLink(link.id)}
                title="Eliminar enlace"
                className="text-stone-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Link Form */}
        {isAdding ? (
          <form onSubmit={handleAddLink} className="space-y-2 p-3 rounded-2xl border bg-stone-900/50 border-stone-700 mb-3">
            <input
              type="text"
              placeholder="Título (ej. OneDrive Proyectos o Repositorio)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-xs bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-yellow-400"
              autoFocus
            />
            <input
              type="text"
              placeholder="URL (ej. onedrive.live.com o uees.edu.sv)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full text-xs bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-yellow-400"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-1.5 text-xs text-stone-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 bg-yellow-400 text-black font-extrabold text-xs rounded-lg cursor-pointer"
              >
                Guardar Enlace
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2 mb-2 border border-dashed border-stone-700 hover:border-yellow-400/60 rounded-xl text-xs font-bold text-stone-400 hover:text-yellow-400 transition-colors flex items-center justify-center gap-1 cursor-pointer font-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Agregar Enlace Universitario</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
