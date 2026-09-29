import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  X, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Activity, 
  ArrowRight,
  PlusCircle,
  Image as ImageIcon,
  Bot
} from 'lucide-react';

interface PhysiqueScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateRatings: (ratings: any) => void;
}

export const PhysiqueScannerModal: React.FC<PhysiqueScannerModalProps> = ({
  isOpen,
  onClose,
  onUpdateRatings,
}) => {
  const [photos, setPhotos] = useState<{ id: string; file: File; preview: string; label: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoLabels = ['Front Pose', 'Side Profile', 'Back Pose', 'Additional'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newPhotos = newFiles.map((file, index) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        label: photoLabels[Math.min(photos.length + index, 3)]
      }));
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  const handleStartScan = () => {
    if (photos.length === 0) return;
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      onUpdateRatings({
        chest: 8,
        back: 7,
        shoulders: 8,
        arms: 7,
        legs: 6,
        core: 7,
        scannedAt: new Date().toISOString()
      });
      onClose();
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 font-sans select-none">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="w-full max-w-xl h-[85vh] flex flex-col ig-glass-card rounded-t-3xl border border-white/20 shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">AI Physique Scanner</h2>
              <p className="text-[10px] text-slate-400 font-mono">Multi-Angle Biomechanical Audit Active</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!isProcessing ? (
            <>
              {/* Instructions */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
                  <Sparkles className="w-4 h-4" />
                  <span>Scanning Protocol</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upload at least 3 photos (Front, Side, Back) for a full muscular audit. Use consistent lighting and poses for accurate weekly delta comparisons.
                </p>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 group shadow-lg">
                    <img src={photo.preview} alt="Physique" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 backdrop-blur-md">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{photo.label}</span>
                    </div>
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                {photos.length < 4 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
                  >
                    <PlusCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Photo</span>
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
                <Bot className="absolute inset-0 m-auto w-10 h-10 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase tracking-widest animate-pulse">Analyzing Muscle Clusters...</h3>
                <p className="text-xs text-slate-400 max-w-xs font-medium">
                  Autonomous Intelligence is calculating muscular density, symmetry, and biomechanical growth deltas from your check-in set.
                </p>
              </div>
              
              <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3 }}
                  className="h-full bg-cyan-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isProcessing && (
          <div className="p-4 border-t border-white/10 bg-slate-950/40 shrink-0">
            <button
              onClick={handleStartScan}
              disabled={photos.length === 0}
              className="w-full py-4 rounded-2xl text-black font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              style={{
                backgroundColor: 'var(--accent-hex)',
                boxShadow: '0 0 20px var(--accent-hex)'
              }}
            >
              <Zap className="w-5 h-5 fill-black" />
              <span>Initiate AI Audit</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
