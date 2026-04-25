import React, { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Definim ce parametri primește această componentă de la părinte
interface InvoiceUploaderProps {
  onUploadComplete: (batchId: number) => void;
}

const InvoiceUploader: React.FC<InvoiceUploaderProps> = ({ onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Logica reală de conectare la FastAPI
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    // Deoarece trimitem fișiere fizice, trebuie să folosim FormData
    const formData = new FormData();
    selectedFiles.forEach(file => {
      // Cheia 'files' trebuie să fie exact la fel cu parametrul din backend-ul de Python
      formData.append('files', file); 
    });

    try {
      const response = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
        body: formData, // Trimiterea formData setează automat header-ul multipart/form-data
      });

      if (!response.ok) {
        throw new Error('Eroare la încărcarea fișierelor pe server.');
      }

      const data = await response.json();
      console.log('Răspuns server:', data);

      // Dacă a mers, îi dăm părintelui ID-ul Batch-ului ca să treacă la Extracție
      onUploadComplete(data.batch_id);

    } catch (err: any) {
      setError(err.message || 'A apărut o eroare de rețea. Verifică dacă backend-ul este pornit.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Încărcare Documente</h1>
        <p className="text-slate-500 mt-1">Adăugați facturi de utilități sau bonuri de combustibil pentru analiza amprentei de carbon.</p>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 transition-colors rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer bg-white"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="bg-emerald-100 p-4 rounded-full mb-4">
          <UploadCloud className="text-emerald-600" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Trageți fișierele aici</h3>
        <p className="text-slate-500 text-sm mb-6 text-center max-w-sm">
          Sunt suportate formate PDF, JPG sau PNG. Maxim 10MB per fișier.
        </p>
        <button className="bg-white border border-slate-200 text-slate-700 font-medium px-6 py-2 rounded-xl shadow-sm hover:bg-slate-50">
          Răsfoiește fișiere
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInput} 
          className="hidden" 
          multiple 
          accept=".pdf,image/png,image/jpeg" 
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-200">
          <AlertCircle size={20} className="shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle className="text-emerald-500" size={20} />
            {selectedFiles.length} fișiere pregătite
          </h4>
          <div className="space-y-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <FileIcon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleUpload}
              disabled={isUploading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md ${
                isUploading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg text-white'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Se trimite pe server...
                </>
              ) : (
                'Încarcă și continuă'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceUploader;