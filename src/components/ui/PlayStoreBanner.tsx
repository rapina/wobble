import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { t } from '@/utils/localization'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.wobble.physics'

export function PlayStoreBanner() {
    const { i18n } = useTranslation()
    const lang = i18n.language

    return (
        <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-[320px] h-[50px] rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.97] hover:brightness-110"
            style={{
                background: 'linear-gradient(135deg, #374244 0%, #2a3234 100%)',
                border: '2px solid #1a1a1a',
                boxShadow: '0 4px 0 #1a1a1a, inset 0 1px 0 rgba(255,255,255,0.1)',
                textDecoration: 'none',
            }}
        >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#c9a227">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.196 12l2.502-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
            </svg>
            <span
                className="text-xs font-black tracking-wide"
                style={{
                    color: '#c9a227',
                    textShadow: '1px 1px 0 #1a1a1a',
                }}
            >
                {t(
                    {
                        ko: 'Google Play에서 다운로드',
                        en: 'Get it on Google Play',
                        ja: 'Google Playでダウンロード',
                    },
                    lang
                )}
            </span>
            <ExternalLink className="w-3 h-3" style={{ color: '#c9a227' }} />
        </a>
    )
}
