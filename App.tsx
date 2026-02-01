
import React, { useState, useCallback, useEffect } from 'react';
import type { GenerationOptions, Theme, AspectRatio, Quality } from './types';
import { VIETNAM_TRAVEL_CONCEPTS, KOREAN_FASHION_CONCEPTS, ENTREPRENEUR_CONCEPTS, HANOI_WINTER_CONCEPTS, INTERNATIONAL_MODEL_CONCEPTS, FLOWER_MUSE_CONCEPTS, CHRISTMAS_CONCEPTS, PRINCESS_MUSE_CONCEPTS, CHRISTMAS_COUPLE_CONCEPTS, CUSTOM_CONCEPTS, SINGER_CONCEPTS, QUEEN_CONCEPTS } from './constants/prompts';
import { fileToBase64, generateImageWithNanoBanana } from './services/geminiService';
import { UploadIcon, DownloadIcon, SparklesIcon, AlertTriangleIcon } from './components/icons';

const App: React.FC = () => {
    const [hasKey, setHasKey] = useState<boolean>(false);
    const [isCheckingKey, setIsCheckingKey] = useState(true);
    const [originalImage, setOriginalImage] = useState<{ file: File; base64: string; previewUrl: string } | null>(null);
    const [secondImage, setSecondImage] = useState<{ file: File; base64: string; previewUrl: string } | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [options, setOptions] = useState<GenerationOptions>({
        theme: 'vietnam_travel',
        concept: VIETNAM_TRAVEL_CONCEPTS[0],
        aspectRatio: '3:4',
        quality: 'High',
        faceConsistency: true,
        customPrompt: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkKeyStatus = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const selected = await window.aistudio.hasSelectedApiKey();
                setHasKey(selected);
            } else {
                setHasKey(!!process.env.API_KEY);
            }
            setIsCheckingKey(false);
        };
        checkKeyStatus();
    }, []);

    const handleGetKeyLink = () => {
        window.open('https://aistudio.google.com/api-keys', '_blank');
    };

    const handleOpenKeyDialog = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume success and proceed to the app
            setHasKey(true);
        } else {
            handleGetKeyLink();
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
        }
    };

    const handleGenerate = async () => {
        if (!originalImage) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateImageWithNanoBanana(
                originalImage.base64,
                originalImage.file.type,
                options,
                secondImage ? { base64: secondImage.base64, mimeType: secondImage.file.type } : null
            );
            setGeneratedImage(`data:image/png;base64,${result.image}`);
        } catch (e: any) {
            if (e.message?.includes("Requested entity was not found") || e.message?.includes("API_KEY")) {
                setHasKey(false);
            }
            setError(e.message || "Lỗi tạo ảnh. Vui lòng kiểm tra lại API Key.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingKey) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-lypink animate-pulse uppercase tracking-[0.2em]">Đang khởi tạo studio...</div>;

    if (!hasKey) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-white p-12 rounded-[3.5rem] shadow-[0_20px_50px_rgba(242,5,116,0.1)] border border-lypink/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-lypink to-fuchsia-500"></div>
                    
                    <div className="w-20 h-20 bg-lypink/5 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3">
                        <SparklesIcon className="w-10 h-10 text-lypink animate-pulse" />
                    </div>
                    
                    <h1 className="text-4xl font-black text-slate-800 mb-3 uppercase tracking-tighter">KẾT NỐI GEMINI</h1>
                    <p className="text-slate-400 text-sm mb-12 leading-relaxed px-2">
                        Chào mừng bạn đến với <b>Ms Lý AI</b>. Nhấn vào ô bên dưới để nhập mã API và bắt đầu sáng tạo.
                    </p>
                    
                    <div className="relative mb-8 group">
                        <input
                            type="text"
                            placeholder="Nhập API Key của bạn tại đây..."
                            readOnly
                            onClick={handleOpenKeyDialog}
                            className="w-full py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center px-6 text-slate-400 font-bold text-sm cursor-text outline-none focus:border-lypink/30 hover:bg-slate-100/50 transition-all shadow-inner"
                        />
                        <button 
                            onClick={handleOpenKeyDialog}
                            className="absolute right-2.5 top-2.5 bottom-2.5 bg-lypink text-white px-6 rounded-xl text-[11px] font-black uppercase hover:bg-lypink-600 active:scale-95 transition-all shadow-lg shadow-lypink/20"
                        >
                            KẾT NỐI
                        </button>
                    </div>

                    <button 
                        onClick={handleGetKeyLink}
                        className="text-slate-300 hover:text-lypink transition-all text-[10px] font-black uppercase tracking-widest border-b border-transparent hover:border-lypink/30 pb-1"
                    >
                        Chưa có mã? Lấy API miễn phí tại đây
                    </button>
                </div>
            </div>
        );
    }

    const themes: Theme[] = ['vietnam_travel', 'korean', 'entrepreneur', 'hanoi_winter', 'international_model', 'flower_muse', 'christmas', 'princess_muse', 'christmas_couple', 'singer', 'queen', 'custom'];
    const getConcepts = (t: Theme) => {
        switch(t) {
            case 'vietnam_travel': return VIETNAM_TRAVEL_CONCEPTS;
            case 'korean': return KOREAN_FASHION_CONCEPTS;
            case 'entrepreneur': return ENTREPRENEUR_CONCEPTS;
            case 'hanoi_winter': return HANOI_WINTER_CONCEPTS;
            case 'international_model': return INTERNATIONAL_MODEL_CONCEPTS;
            case 'flower_muse': return FLOWER_MUSE_CONCEPTS;
            case 'christmas': return CHRISTMAS_CONCEPTS;
            case 'princess_muse': return PRINCESS_MUSE_CONCEPTS;
            case 'christmas_couple': return CHRISTMAS_COUPLE_CONCEPTS;
            case 'singer': return SINGER_CONCEPTS;
            case 'queen': return QUEEN_CONCEPTS;
            default: return VIETNAM_TRAVEL_CONCEPTS;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex flex-col font-sans">
            <header className="text-center mb-12">
                <div className="flex justify-end mb-4">
                    <button 
                        onClick={handleOpenKeyDialog}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full text-[9px] font-black uppercase text-slate-400 hover:text-lypink transition-all"
                    >
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div> Cấu hình API
                    </button>
                </div>
                <h1 className="text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lypink to-indigo-600 mb-4 tracking-tighter">MS LÝ AI STUDIO</h1>
                <p className="text-lypink font-black bg-white inline-block px-8 py-2 rounded-full border border-lypink/10 shadow-sm uppercase tracking-widest text-[10px]">Thời Trang & Du Lịch Trẻ</p>
            </header>

            <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200">
                    <h2 className="text-xl font-black mb-6 uppercase flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-lypink"/> Sáng tạo nghệ thuật</h2>
                    
                    <div className="mb-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Tải ảnh gốc:</label>
                        <label className="cursor-pointer block aspect-video border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden hover:border-lypink transition-all group relative">
                            {originalImage ? (
                                <img src={originalImage.previewUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 group-hover:text-lypink">
                                    <UploadIcon className="w-12 h-12 mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Chọn ảnh chân dung</span>
                                </div>
                            )}
                            <input type="file" className="sr-only" onChange={(e) => handleImageUpload(e)} />
                        </label>
                    </div>

                    <div className="mb-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Chủ đề trẻ trung:</label>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {themes.map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setOptions({...options, theme: t, concept: getConcepts(t)[0]})}
                                    className={`py-2 text-[10px] font-black rounded-xl border transition-all ${options.theme === t ? 'bg-lypink border-lypink text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                                >
                                    {t.replace('_', ' ').toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <select 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-lypink font-medium"
                            value={options.concept}
                            onChange={(e) => setOptions({...options, concept: e.target.value})}
                        >
                            {getConcepts(options.theme).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={isLoading || !originalImage}
                        className="w-full py-5 bg-gradient-to-r from-lypink to-fuchsia-600 text-white font-black rounded-3xl text-xl shadow-xl hover:shadow-lypink/30 hover:scale-[1.01] transition-all disabled:opacity-30 uppercase tracking-tighter"
                    >
                        {isLoading ? "ĐANG VẼ..." : "TẠO ẢNH NGAY"}
                    </button>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 flex flex-col items-center justify-center min-h-[500px]">
                    {generatedImage ? (
                        <div className="w-full flex flex-col items-center animate-in zoom-in duration-500">
                            <img src={generatedImage} className="w-full max-w-md rounded-3xl shadow-2xl mb-6 border-4 border-white" />
                            <a 
                                href={generatedImage} 
                                download="ms-ly-ai.png"
                                className="px-10 py-4 bg-slate-800 text-white font-black rounded-2xl flex items-center gap-2 hover:bg-lypink transition-all shadow-lg active:scale-95"
                            >
                                <DownloadIcon className="w-5 h-5"/> TẢI KIỆT TÁC
                            </a>
                        </div>
                    ) : (
                        <div className="text-slate-200 text-center select-none">
                            <SparklesIcon className="w-32 h-32 mx-auto mb-4 opacity-5 animate-pulse" />
                            <p className="text-2xl font-black uppercase tracking-[0.3em] opacity-10">Kiệt tác chờ đợi</p>
                        </div>
                    )}
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-500">
                            <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
                            <p className="text-[10px] font-bold leading-tight">{error}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;
