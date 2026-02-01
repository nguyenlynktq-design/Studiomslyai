
import React, { useState, useCallback } from 'react';
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

        if (isCustomMode && !options.customPrompt?.trim()) {
            setError("Vui lòng nhập mô tả cho ảnh bạn muốn tạo.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setGeneratedPrompt(null);

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
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("Đã xảy ra lỗi không xác định.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, secondImage, options]);

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `anh_ai_ms_ly_${Date.now()}.png`;
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
        <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 flex flex-col">
            <div className="max-w-7xl mx-auto flex-grow w-full">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lypink via-fuchsia-600 to-indigo-600 drop-shadow-sm">
                        ✨ MS LÝ AI STUDIO ✨
                    </h1>
                    <p className="text-lypink font-bold bg-white inline-block px-6 py-1.5 rounded-full border border-lypink/20 shadow-sm mt-3">
                        Ảnh tạo bởi Ms Lý AI - Studio 4.0 Đẳng Cấp
                    </p>
                    
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <a 
                            href="https://www.facebook.com/nguyen.ly.254892/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl transition-all transform hover:scale-105 shadow-md font-bold text-sm"
                        >
                             <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                             FACEBOOK MS LÝ
                        </a>
                        <a 
                            href="https://zalo.me/g/losnhe538" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-lypink hover:bg-lypink-600 text-white rounded-xl transition-all transform hover:scale-105 shadow-md font-bold text-sm"
                        >
                             <SparklesIcon className="w-5 h-5" />
                             CỘNG ĐỒNG ZALO
                        </a>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                    {/* Left Panel: Configuration */}
                    <div className="flex flex-col gap-6 p-6 sm:p-8 bg-white rounded-[2rem] border border-slate-200 shadow-xl">
                        {/* Step 1: Upload */}
                        <div className="flex flex-col gap-4">
                             <h2 className="text-xl font-black flex items-center gap-3 text-slate-800 uppercase tracking-tight">
                                <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-lypink to-fuchsia-600 text-white font-black shadow-lg">1</span> 
                                {isCoupleMode ? 'Tải ảnh cặp đôi' : 'Tải ảnh gốc'}
                             </h2>
                            
                            <div className={`${isCoupleMode ? 'grid grid-cols-2 gap-4' : 'w-full'}`}>
                                <div className="flex flex-col gap-2">
                                    {isCoupleMode && <span className="text-[10px] text-slate-500 text-center font-black uppercase tracking-widest">Người 1</span>}
                                    <label htmlFor="file-upload-1" className={`cursor-pointer w-full aspect-square border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center hover:border-lypink hover:bg-lypink/5 transition-all relative overflow-hidden group`}>
                                        {originalImage ? (
                                            <img src={originalImage.previewUrl} alt="Ảnh gốc 1" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center text-slate-400 p-4 group-hover:text-lypink transition-colors">
                                                <UploadIcon className="mx-auto h-12 w-12 mb-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                                <p className="text-xs font-black uppercase tracking-widest">Chọn ảnh</p>
                                            </div>
                                        )}
                                    </label>
                                    <input id="file-upload-1" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={(e) => handleImageUpload(e, false)} />
                                </div>

                                {isCoupleMode && (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] text-slate-500 text-center font-black uppercase tracking-widest">Người 2</span>
                                        <label htmlFor="file-upload-2" className={`cursor-pointer w-full aspect-square border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center hover:border-lypink hover:bg-lypink/5 transition-all relative overflow-hidden group`}>
                                            {secondImage ? (
                                                <img src={secondImage.previewUrl} alt="Ảnh gốc 2" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center text-slate-400 p-4 group-hover:text-lypink transition-colors">
                                                    <UploadIcon className="mx-auto h-12 w-12 mb-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                                    <p className="text-xs font-black uppercase tracking-widest">Chọn ảnh</p>
                                                </div>
                                            )}
                                        </label>
                                        <input id="file-upload-2" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={(e) => handleImageUpload(e, true)} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 2: Select Concept */}
                        <div className="flex flex-col gap-4">
                             <h2 className="text-xl font-black flex items-center gap-3 text-slate-800 uppercase tracking-tight">
                                <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-lypink to-fuchsia-600 text-white font-black shadow-lg">2</span> 
                                {isCustomMode ? 'Ý tưởng của bạn' : 'Chủ đề sáng tạo'}
                             </h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 bg-slate-100 rounded-2xl border border-slate-200">
                                {themes.map(theme => (
                                    <button 
                                        key={theme} 
                                        onClick={() => setOptions(o => ({ ...o, theme, concept: getConcepts(theme)[0] }))} 
                                        className={`px-1 py-2.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-tighter ${options.theme === theme ? 'bg-lypink text-white shadow-md scale-105' : 'text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        {getThemeLabel(theme)}
                                    </button>
                                ))}
                            </div>
                             
                             {!isCustomMode && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                    {concepts.map(concept => (
                                        <button 
                                            key={concept} 
                                            onClick={() => setOptions(o => ({...o, concept}))} 
                                            className={`p-3 text-[11px] leading-tight text-left rounded-xl transition-all border ${options.concept === concept ? 'bg-lypink/10 text-lypink font-bold border-lypink shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-lypink/40 hover:bg-white'}`}
                                        >
                                            {concept}
                                        </button>
                                    ))}
                                </div>
                             )}

                            <div className="mt-2">
                                <label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 block">
                                    {isCustomMode ? 'Mô tả tác phẩm (Bắt buộc):' : 'Yêu cầu thêm (Tuỳ chọn):'}
                                </label>
                                <textarea
                                    className={`w-full bg-slate-50 border rounded-2xl p-4 text-sm focus:border-lypink focus:ring-4 focus:ring-lypink/5 outline-none transition-all placeholder-slate-300 text-slate-800 ${isCustomMode ? 'border-lypink/50 min-h-[140px]' : 'border-slate-200'}`}
                                    rows={isCustomMode ? 5 : 2}
                                    placeholder={isCustomMode ? "Ví dụ: Một nữ hoàng dạo bước trên mây, váy đính kim cương lấp lánh..." : "Ví dụ: Thêm nụ cười tươi, ánh sáng lung linh hơn..."}
                                    value={options.customPrompt || ''}
                                    onChange={(e) => setOptions(o => ({ ...o, customPrompt: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Step 3: Customize */}
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-black flex items-center gap-3 text-slate-800 uppercase tracking-tight">
                                <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-lypink to-fuchsia-600 text-white font-black shadow-lg">3</span> 
                                Cấu hình
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-lypink/30 transition-colors cursor-pointer">
                                    <span className="font-bold text-sm text-slate-700">Giữ khuôn mặt gốc</span>
                                    <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${options.faceConsistency ? 'bg-lypink' : 'bg-slate-300'}`}>
                                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-md ${options.faceConsistency ? 'translate-x-6' : 'translate-x-1'}`} />
                                        <input type="checkbox" className="absolute w-full h-full opacity-0 cursor-pointer" checked={options.faceConsistency} onChange={e => setOptions(o => ({...o, faceConsistency: e.target.checked}))} />
                                    </div>
                                </label>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <span className="font-black text-[10px] text-slate-400 mb-3 block uppercase tracking-widest">Tỷ lệ</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['1:1', '3:4', '9:16'] as AspectRatio[]).map(ratio => (
                                            <button key={ratio} onClick={() => setOptions(o => ({...o, aspectRatio: ratio}))} className={`py-1.5 text-[11px] font-black rounded-lg transition-all ${options.aspectRatio === ratio ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100'}`}>{ratio}</button>
                                        ))}
                                    </div>
                                </div>
                                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 sm:col-span-2">
                                    <span className="font-black text-[10px] text-slate-400 mb-3 block text-center uppercase tracking-[0.3em]">Chất lượng xuất bản</span>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['Standard', 'High', 'Ultra'] as Quality[]).map(q => (
                                            <button key={q} onClick={() => setOptions(o => ({...o, quality: q}))} className={`py-2 text-[10px] font-black rounded-xl transition-all border-2 ${options.quality === q ? 'bg-white border-lypink text-lypink shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
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
                            className="w-full flex items-center justify-center gap-3 py-6 px-8 text-2xl font-black bg-gradient-to-r from-lypink to-fuchsia-600 text-white rounded-[2rem] hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-tighter"
                        >
                           {isLoading ? (
                                <>
                                 <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                 </svg>
                                 MS LÝ AI ĐANG VẼ...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-8 h-8" />
                                    BẮT ĐẦU SÁNG TẠO
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right Panel: Result Display */}
                    <div className="flex flex-col gap-8">
                        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col items-center">
                            <h2 className="text-3xl font-black mb-8 w-full text-center text-slate-800 uppercase tracking-tighter">KIỆT TÁC CỦA BẠN</h2>
                            <div className="w-full relative aspect-[3/4] max-w-lg bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 group">
                                {isLoading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-lypink z-10 bg-white/80 backdrop-blur-sm">
                                        <SparklesIcon className="w-24 h-24 animate-pulse mb-6" />
                                        <p className="text-lg font-black text-center px-6 animate-bounce tracking-widest uppercase">
                                            Ms Lý AI đang vẽ...
                                        </p>
                                    </div>
                                )}
                                {error && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 text-center p-10 bg-red-50">
                                        <AlertTriangleIcon className="w-20 h-20 mb-6 opacity-40" />
                                        <p className="font-black text-xl uppercase mb-3 tracking-tighter">Sáng tạo thất bại</p>
                                        <p className="text-xs font-bold leading-relaxed">{error}</p>
                                        <button onClick={() => setError(null)} className="mt-8 px-6 py-2 bg-white hover:bg-red-50 border border-red-200 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">THỬ LẠI</button>
                                    </div>
                                )}
                                {generatedImage ? (
                                    <div className="w-full h-full relative">
                                        <img src={generatedImage} alt="Artwork by Ms Lý AI" className="w-full h-full object-contain"/>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                                             <div className="flex justify-between items-center">
                                                 <div className="text-white font-black text-xs flex items-center gap-2 tracking-[0.2em]">
                                                     <SparklesIcon className="w-5 h-5 text-lypink" /> MS LÝ AI CERTIFIED
                                                 </div>
                                                 <button onClick={handleDownload} className="bg-white text-lypink p-5 rounded-full hover:bg-lypink hover:text-white transition-all shadow-xl transform hover:scale-110 active:scale-90 group/dl">
                                                    <DownloadIcon className="w-8 h-8 group-hover/dl:animate-bounce" />
                                                </button>
                                             </div>
                                        </div>
                                    </div>
                                ) : !isLoading && !error && (
                                     <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 p-12 text-center select-none">
                                        <SparklesIcon className="w-32 h-32 mb-6 opacity-20" />
                                        <p className="font-black text-2xl uppercase tracking-[0.4em] leading-tight">CHƯA CÓ<br/>TÁC PHẨM</p>
                                    </div>
                                )}
                            </div>

                            {generatedPrompt && (
                                <div className="w-full mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-inner group">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Prompt Magic</h3>
                                        <button 
                                            onClick={handleCopyPrompt} 
                                            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black ${copySuccess ? 'bg-green-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-800 hover:text-white'}`}
                                        >
                                            {copySuccess ? 'ĐÃ COPY!' : 'SAO CHÉP PROMPT'}
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
                                        <div key={index} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-lypink transition-all cursor-pointer group shadow-sm active:scale-95">
                                             <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
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
                    <div className="flex items-center gap-4">
                        <div className="h-px w-12 bg-slate-200"></div>
                        <p className="text-slate-400 font-black text-sm tracking-[0.5em] uppercase">
                            DEVELOPING BY MS LÝ AI
                        </p>
                        <div className="h-px w-12 bg-slate-200"></div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <a 
                            href="https://zalo.me/g/losnhe538" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="group flex flex-col items-center gap-1"
                        >
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-lypink transition-colors">CỘNG ĐỒNG ZALO</span>
                            <span className="text-xs text-slate-400 font-bold group-hover:text-slate-600 transition-colors">Nhận kiến thức AI miễn phí</span>
                        </a>
                        <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                        <a 
                            href="https://www.facebook.com/nguyen.ly.254892/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="group flex flex-col items-center gap-1"
                        >
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-lypink transition-colors">FACEBOOK MS LÝ</span>
                            <span className="text-xs text-slate-400 font-bold group-hover:text-slate-600 transition-colors">Hỗ trợ kỹ thuật 24/7</span>
                        </a>
                    </div>

                    <p className="text-[10px] text-slate-300 font-medium tracking-[0.2em] mt-4">
                        © 2025 MS LÝ AI STUDIO. ALL RIGHTS RESERVED.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default App;