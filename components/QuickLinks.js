'use client';

import { useState, useEffect } from 'react';
import { FileText, Cloud, ExternalLink, X, Bookmark, ChevronLeft, HardDrive } from 'lucide-react';

const QUICK_LINKS = [
    {
        title: "Brand Guidelines",
        url: "https://drive.google.com/file/d/12K4j9mn4m0n6XUSQVsdYYP6Y3gCYE72Z/view?usp=sharing",
        type: "doc",
        description: "Renoweb official branding rules & assets"
    },
    {
        title: "Shared Drive",
        url: "https://drive.google.com/drive/folders/10qe5ueYqO56LDt8krAr570lP5q2IwbqD?usp=sharing",
        type: "drive",
        description: "Access to company shared Google Drive"
    },
    {
        title: "Company Site",
        url: "https://renowebhq.com",
        type: "link",
        description: "Main Renoweb Site"
    }
];

export default function QuickLinks() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'doc':
                return <FileText className="w-6 h-6 text-blue-500" />;
            case 'drive':
                return <Cloud className="w-6 h-6 text-emerald-500" />;
            default:
                return <ExternalLink className="w-6 h-6 text-purple-500" />;
        }
    };

    return (
        <>
            {/* Sticky Button on the right edge */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 
        bg-white/90 dark:bg-[#111111] backdrop-blur-md border border-r-0 border-gray-200 dark:border-[#222222] shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        text-gray-700 dark:text-gray-300 p-3 py-4 rounded-l-2xl font-medium
        flex flex-col items-center gap-2
        hover:bg-blue-50 dark:hover:bg-[#1a1a1a] hover:text-blue-600 dark:hover:text-blue-400 hover:-translate-x-1
        transition-all duration-300 group
        ${isOpen ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
            >
                <Bookmark className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="[writing-mode:vertical-lr] rotate-180 tracking-widest text-sm font-semibold uppercase">
                    Quick Links
                </span>
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/20 dark:bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sliding Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 
        bg-white/80 dark:bg-[#0a0a0a] backdrop-blur-xl border-l border-white/40 dark:border-[#222222] shadow-2xl
        transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100/50 dark:border-[#222222] bg-white/50 dark:bg-[#111111]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-950/50 rounded-xl">
                            <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Essential Links</h2>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-[#1a1a1a] rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Links List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Find all important company resources and documents here without scrolling through chats.
                    </p>

                    {QUICK_LINKS.map((link, index) => (
                        <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-4 p-4 rounded-2xl bg-white/60 dark:bg-[#111111] border border-gray-100 dark:border-[#222222] shadow-sm hover:shadow-md dark:hover:border-[#333333] hover:bg-white dark:hover:bg-[#1a1a1a] hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] group-hover:scale-110 transition-transform duration-300">
                                {getIcon(link.type)}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {link.title}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                    {link.description}
                                </p>
                            </div>
                            <ChevronLeft className="w-5 h-5 text-gray-300 dark:text-gray-600 rotate-180 self-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                        </a>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100/50 dark:border-[#222222] bg-white/50 dark:bg-[#111111] text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        Renoweb Internal Workspace
                    </p>
                </div>
            </div>
        </>
    );
}
