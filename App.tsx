
import React, { useState, useCallback, useEffect } from 'react';
import type { GenerationOptions, Theme, AspectRatio, Quality } from './types';
import { KOREAN_FASHION_CONCEPTS, ENTREPRENEUR_CONCEPTS, HANOI_WINTER_CONCEPTS, INTERNATIONAL_MODEL_CONCEPTS, FLOWER_MUSE_CONCEPTS, CHRISTMAS_CONCEPTS, PRINCESS_MUSE_CONCEPTS, CHRISTMAS_COUPLE_CONCEPTS, CUSTOM_CONCEPTS, SINGER_CONCEPTS, QUEEN_CONCEPTS, VIETNAM_TRAVEL_CONCEPTS } from './constants/prompts';
import { fileToBase64, generateImageWithNanoBanana } from './services/geminiService';
import { UploadIcon, DownloadIcon, SparklesIcon, AlertTriangleIcon, CopyIcon } from './components/icons';

const App: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{ file: File; base64: string; previewUrl: string } | null>(null);
    const [secondImage, setSecondImage] = useState<{ file: File; base64: string; previewUrl: string } | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
    const [gallery, setGallery] = useState<string[]>([]);
    const [options, setOptions] = useState<GenerationOptions>({
        theme: 'korean',
        concept: KOREAN_FASHION_CONCEPTS[0],
        aspectRatio: '3:4',
        quality: 'High',
        faceConsistency: true,
        customPrompt: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleOpenKeySettings = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
        } else {
            // Fallback nếu không chạy trong môi trường preview
            window.open('https://aistudio.google.com/api-keys', '_blank');
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isSecond: boolean = false) => {
        const file = event.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            const previewUrl = URL.createObjectURL(file);
            if (isSecond) {
                setSecondImage({ file, base64, previewUrl });
            } else {
                setOriginalImage({ file, base64, previewUrl });
            }
            setGeneratedImage(null);
            setGeneratedPrompt(null);
            setError(null);
        }
    };

    const handleGenerateImage = useCallback(async () => {
        const isCoupleMode = options.theme === 'christmas_couple';
        const isCustomMode = options.theme === 'custom';

        if (isCoupleMode && (!originalImage || !secondImage)) {
            setError("Vui lòng tải đủ 2 ảnh (Người 1 và Người 2) cho chế độ cặp đôi.");
            return;
        }

        if (!isCoupleMode && !originalImage) {
            setError("Vui lòng tải ảnh gốc lên trước.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const result = await generateImageWithNanoBanana(
                originalImage!.base64,
                originalImage!.file.type,
                options,
                (isCoupleMode && secondImage) ? { base64: secondImage.base64, mimeType: secondImage.file.type } : null
            );
            const newImageUrl = `data:image/png;base64,${result.image}`;
            setGeneratedImage(newImageUrl);
            setGeneratedPrompt(result.prompt);
            setGallery(prev => [newImageUrl, ...prev].slice(0, 36));
        } catch (e: any) {
            if (e.message?.includes("API_KEY") || e.message?.includes("key")) {
                setError("Chưa có API Key hoặc Key không hợp lệ. Vui lòng bấm 'Cài đặt API Key' ở Header.");
            } else {
                setError(e.message || "Đã xảy ra lỗi không xác định.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, secondImage, options]);

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `ms_ly_ai_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyPrompt = () => {
        if (generatedPrompt) {
            navigator.clipboard.writeText(generatedPrompt);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const getConcepts = (theme: Theme) => {
        switch (theme) {
            case 'korean': return KOREAN_FASHION_CONCEPTS;
            case 'entrepreneur': return ENTREPRENEUR_CONCEPTS;
            case 'hanoi_winter': return HANOI_WINTER_CONCEPTS;
            case 'vietnam_travel': return VIETNAM_TRAVEL_CONCEPTS;
            case 'international_model': return INTERNATIONAL_MODEL_CONCEPTS;
            case 'flower_muse': return FLOWER_MUSE_CONCEPTS;
            case 'christmas': return CHRISTMAS_CONCEPTS;
            case 'princess_muse': return PRINCESS_MUSE_CONCEPTS;
            case 'christmas_couple': return CHRISTMAS_COUPLE_CONCEPTS;
            case 'singer': return SINGER_CONCEPTS;
            case 'queen': return QUEEN_CONCEPTS;
            case 'custom': return CUSTOM_CONCEPTS;
            default: return KOREAN_FASHION_CONCEPTS;
        }
    };

    const concepts = getConcepts(options.theme);

    const getThemeLabel = (theme: Theme) => {
        switch (theme) {
            case 'korean': return 'Hàn Quốc';
            case 'entrepreneur': return 'Doanh nhân';
            case 'hanoi_winter': return 'Hà Nội Đông';
            case 'vietnam_travel': return 'Du Lịch Việt Nam';
            case 'international_model': return 'Siêu Mẫu QT';
            case 'flower_muse': return 'Nàng Thơ & Hoa';
            case 'christmas': return 'Giáng Sinh';
            case 'princess_muse': return 'Công Chúa';
            case 'christmas_couple': return 'Cặp Đôi Noel';
            case 'singer': return 'Ca Sỹ';
            case 'queen': return 'Nữ Hoàng';
            case 'custom': return 'Tự Do';
        }
    };

    const getQualityLabel = (q: Quality) => {
        switch (q) {
            case 'Standard': return 'Tiêu chuẩn';
            case 'High': return 'Cao';
            case 'Ultra': return 'Siêu nét';
        }
    };

    const isCoupleMode = options.theme === 'christmas_couple';
    const isCustomMode = options.theme === 'custom';
    const themes: Theme[] = ['korean', 'entrepreneur', 'hanoi_winter', 'vietnam_travel', 'international_model', 'flower_muse', 'christmas', 'princess_muse', 'christmas_couple', 'singer', 'queen', 'custom'];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 flex flex-col font-sans">
            <div className="max-w-7xl mx-auto flex-grow w-full">
                {/* Header Section with API Key Settings */}
                <header className="flex flex-col items-center mb-12 relative">
                    <div className="w-full flex justify-between items-start mb-6">
                        <div className="hidden sm:block"></div> {/* Spacer */}
                        <div className="flex flex-col items-end gap-1">
                            <button 
                                onClick={handleOpenKeySettings}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full shadow-sm hover:border-lypink transition-all group active:scale-95"
                            >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-lypink">Cài đặt API Key</span>
                            </button>
                            <p className="text-[10px] font-bold text-red-500 animate-pulse uppercase tracking-tight">
                                ⚠ Lấy API key để sử dụng app
                            </p>
                            <a 
                                href="https://aistudio.google.com/api-keys" 
                                target="_blank" 
                                className="text-[9px] text-slate-400 hover:text-lypink underline underline-offset-2"
                            >
                                Nhấn vào đây để lấy Key mới
                            </a>
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lypink via-fuchsia-600 to-indigo-600 drop-shadow-sm mb-3">
                        ✨ MS LÝ AI STUDIO ✨
                    </h1>
                    <p className="text-lypink font-black bg-white inline-block px-10 py-2.5 rounded-full border border-lypink/20 shadow-sm uppercase tracking-[0.3em] text-[10px]">
                        Studio Ảnh Nghệ Thuật Năng Động 4.0
                    </p>
                    
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <a 
                            href="https://www.facebook.com/nguyen.ly.254892/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-2xl transition-all transform hover:scale-105 shadow-lg font-black text-xs uppercase tracking-widest"
                        >
                             FACEBOOK MS LÝ
                        </a>
                        <a 
                            href="https://zalo.me/g/losnhe538" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-3 bg-lypink hover:bg-lypink-600 text-white rounded-2xl transition-all transform hover:scale-105 shadow-lg font-black text-xs uppercase tracking-widest"
                        >
                             CỘNG ĐỒNG ZALO
                        </a>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    {/* Left: Configuration */}
                    <div className="flex flex-col gap-6 p-6 sm:p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl">
                        <div className="flex flex-col gap-4">
                             <h2 className="text-xl font-black flex items-center gap-3 text-slate-800 uppercase tracking-tight">
                                <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-lypink text-white font-black shadow-lg">1</span> 
                                {isCoupleMode ? 'Tải ảnh cặp đôi' : 'Tải ảnh gốc'}
                             </h2>
                            
                            <div className={`${isCoupleMode ? 'grid grid-cols-2 gap-4' : 'w-full'}`}>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="file-upload-1" className={`cursor-pointer w-full aspect-square border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center hover:border-lypink hover:bg-lypink/5 transition-all relative overflow-hidden group`}>
                                        {originalImage ? (
                                            <img src={originalImage.previewUrl} alt="1" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center text-slate-400 p-4 group-hover:text-lypink">
                                                <UploadIcon className="mx-auto h-12 w-12 mb-3 opacity-30" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Chọn ảnh chính</p>
                                            </div>
                                        )}
                                    </label>
                                    <input id="file-upload-1" type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
                                </div>
                                {isCoupleMode && (
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="file-upload-2" className={`cursor-pointer w-full aspect-square border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center hover:border-lypink hover:bg-lypink/5 transition-all relative overflow-hidden group`}>
                                            {secondImage ? (
                                                <img src={secondImage.previewUrl} alt="2" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center text-slate-400 p-4 group-hover:text-lypink">
                                                    <UploadIcon className="mx-auto h-12 w-12 mb-3 opacity-30" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Chọn ảnh phụ</p>
                                                </div>
                                            )}
                                        </label>
                                        <input id="file-upload-2" type="file" className="sr-only" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                             <h2 className="text-xl font-black flex items-center gap-3 text-slate-800 uppercase tracking-tight">
                                <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-lypink text-white font-black shadow-lg">2</span> 
                                Chủ đề thời trang trẻ trung
                             </h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                                {themes.map(theme => (
                                    <button 
                                        key={theme} 
                                        onClick={() => setOptions(o => ({ ...o, theme, concept: getConcepts(theme)[0] }))} 
                                        className={`px-1 py-3 text-[9px] font-black rounded-xl transition-all uppercase tracking-tighter ${options.theme === theme ? 'bg-lypink text-white shadow-md scale-105' : 'text-slate-500 hover:bg-white'}`}
                                    >
                                        {getThemeLabel(theme)}
                                    </button>
                                ))}
                            </div>
                             
                             {!isCustomMode && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {concepts.map(concept => (
                                        <button 
                                            key={concept} 
                                            onClick={() => setOptions(o => ({...o, concept}))} 
                                            className={`p-3 text-[10px] leading-tight text-left rounded-xl transition-all border ${options.concept === concept ? 'bg-lypink/10 text-lypink font-black border-lypink shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-lypink/30'}`}
                                        >
                                            {concept}
                                        </button>
                                    ))}
                                </div>
                             )}

                            <div className="mt-2">
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 block">Mô tả thêm phong cách:</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:border-lypink focus:ring-4 focus:ring-lypink/5 outline-none transition-all placeholder-slate-300 text-slate-800"
                                    rows={3}
                                    placeholder="Ví dụ: Phong cách Streetwear năng động, mặc áo thun oversized..."
                                    value={options.customPrompt || ''}
                                    onChange={(e) => setOptions(o => ({ ...o, customPrompt: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-black flex items-center gap-3 text-slate-800 uppercase tracking-tight">
                                <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-lypink text-white font-black shadow-lg">3</span> 
                                Cấu hình xuất bản
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                                    <span className="font-black text-xs text-slate-600 uppercase">Giữ khuôn mặt gốc</span>
                                    <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${options.faceConsistency ? 'bg-lypink' : 'bg-slate-300'}`}>
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${options.faceConsistency ? 'translate-x-6' : 'translate-x-1'}`} />
                                        <input type="checkbox" className="absolute w-full h-full opacity-0 cursor-pointer" checked={options.faceConsistency} onChange={e => setOptions(o => ({...o, faceConsistency: e.target.checked}))} />
                                    </div>
                                </label>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['1:1', '3:4', '9:16'] as AspectRatio[]).map(ratio => (
                                            <button key={ratio} onClick={() => setOptions(o => ({...o, aspectRatio: ratio}))} className={`py-2 text-[10px] font-black rounded-lg transition-all ${options.aspectRatio === ratio ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-200'}`}>{ratio}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 sm:col-span-2">
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['Standard', 'High', 'Ultra'] as Quality[]).map(q => (
                                            <button key={q} onClick={() => setOptions(o => ({...o, quality: q}))} className={`py-3 text-[10px] font-black rounded-xl transition-all border-2 ${options.quality === q ? 'bg-white border-lypink text-lypink shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                {getQualityLabel(q)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerateImage} 
                            disabled={isLoading || (isCoupleMode ? (!originalImage || !secondImage) : !originalImage)} 
                            className="w-full flex items-center justify-center gap-3 py-6 px-8 text-2xl font-black bg-gradient-to-r from-lypink to-fuchsia-600 text-white rounded-[2rem] hover:shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-tighter"
                        >
                           {isLoading ? (
                                <>
                                 <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                 </svg>
                                 MS LÝ AI ĐANG VẼ...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-8 h-8" />
                                    TẠO ẢNH NGAY
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right: Output */}
                    <div className="flex flex-col gap-8">
                        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col items-center">
                            <h2 className="text-3xl font-black mb-8 w-full text-center text-slate-800 uppercase tracking-tighter">KIỆT TÁC CỦA BẠN</h2>
                            <div className="w-full relative aspect-[3/4] max-w-lg bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 group">
                                {isLoading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-lypink z-10 bg-white/90 backdrop-blur-sm">
                                        <SparklesIcon className="w-24 h-24 animate-pulse mb-6" />
                                        <p className="text-xl font-black text-center px-6 animate-bounce tracking-widest uppercase">
                                            Ms Lý AI đang vẽ...
                                        </p>
                                    </div>
                                )}
                                {error && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 text-center p-10 bg-red-50">
                                        <AlertTriangleIcon className="w-20 h-20 mb-6 opacity-40" />
                                        <p className="font-black text-lg uppercase mb-2">Lỗi sáng tạo</p>
                                        <p className="text-xs font-bold leading-relaxed">{error}</p>
                                        <button onClick={() => setError(null)} className="mt-8 px-8 py-3 bg-white border border-red-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">Thử lại</button>
                                    </div>
                                )}
                                {generatedImage ? (
                                    <div className="w-full h-full relative">
                                        <img src={generatedImage} alt="Artwork" className="w-full h-full object-contain"/>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-8">
                                             <div className="flex justify-between items-center">
                                                 <div className="text-white font-black text-[10px] tracking-[0.2em] flex items-center gap-2">
                                                     <SparklesIcon className="w-4 h-4 text-lypink" /> MS LÝ AI STUDIO
                                                 </div>
                                                 <button onClick={handleDownload} className="bg-white text-lypink p-5 rounded-full hover:scale-110 transition-all shadow-2xl active:scale-90">
                                                    <DownloadIcon className="w-8 h-8" />
                                                </button>
                                             </div>
                                        </div>
                                    </div>
                                ) : !isLoading && !error && (
                                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-200 p-12 text-center select-none">
                                        <SparklesIcon className="w-32 h-32 mb-6 opacity-10" />
                                        <p className="font-black text-2xl uppercase tracking-[0.4em] leading-tight opacity-20">CHƯA CÓ<br/>TÁC PHẨM</p>
                                    </div>
                                )}
                            </div>

                            {generatedPrompt && (
                                <div className="w-full mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner group">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Prompt Magic</h3>
                                        <button 
                                            onClick={handleCopyPrompt} 
                                            className={`px-4 py-2 rounded-xl transition-all text-[10px] font-black ${copySuccess ? 'bg-green-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-800 hover:text-white'}`}
                                        >
                                            {copySuccess ? 'ĐÃ COPY!' : 'SAO CHÉP'}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-400 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono italic leading-relaxed custom-scrollbar pr-2">
                                        {generatedPrompt}
                                    </p>
                                </div>
                            )}
                        </div>

                        {gallery.length > 0 && (
                             <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl">
                                <h2 className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-[0.5em] text-center">BỘ SƯU TẬP GẦN ĐÂY</h2>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                    {gallery.map((img, index) => (
                                        <div key={index} className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 hover:border-lypink transition-all cursor-pointer group active:scale-95 shadow-sm">
                                             <img src={img} alt={`${index}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}
                    </div>
                </main>
            </div>

            <footer className="w-full max-w-7xl mx-auto py-12 mt-10 border-t border-slate-200 text-center">
                <div className="flex flex-col items-center gap-6">
                    <p className="text-slate-400 font-black text-xs tracking-[0.5em] uppercase">
                        DEVELOPED BY MS LÝ AI
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                        <a 
                            href="https://zalo.me/g/losnhe538" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="group flex flex-col items-center gap-1"
                        >
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-lypink transition-colors">Cộng đồng Zalo</span>
                            <span className="text-xs text-slate-400 font-bold group-hover:text-slate-600">Kiến thức AI miễn phí</span>
                        </a>
                        <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                        <a 
                            href="https://www.facebook.com/nguyen.ly.254892/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="group flex flex-col items-center gap-1"
                        >
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-lypink transition-colors">Facebook Ms Lý AI</span>
                            <span className="text-xs text-slate-400 font-bold group-hover:text-slate-600">Support 24/7</span>
                        </a>
                    </div>
                    <p className="text-[10px] text-slate-300 font-medium tracking-widest mt-4">
                        © 2025 MS LÝ AI STUDIO. ALL RIGHTS RESERVED.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default App;
