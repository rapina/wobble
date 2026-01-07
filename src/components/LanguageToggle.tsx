import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ko' ? 'en' : 'ko';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="relative h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-95"
            style={{
                background: '#374244',
                border: '2px solid #1a1a1a',
                boxShadow: '0 3px 0 #1a1a1a',
            }}
            aria-label="Toggle language"
        >
            <span className="text-lg">🌐</span>
            <span
                className="absolute -bottom-1 -right-1 text-[10px] font-bold rounded px-1"
                style={{
                    background: 'rgba(255,255,255,0.9)',
                    color: '#1a1a1a',
                }}
            >
                {i18n.language.toUpperCase()}
            </span>
        </button>
    );
}
