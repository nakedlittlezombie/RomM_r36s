import { ThemeMode } from './types';

export interface ThemeStyles {
  rootBg: string;
  canvasBg: string;
  canvasBorder: string;
  headerBg: string;
  headerBorder: string;
  footerBg: string;
  footerBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentColor: string;
  accentBg: string;
  accentText: string;
  activeBorder: string;
  focusGlowClass: string;
  scanlines: boolean;
  fontFamily: string;
  tagClass: string;
  activeRowClass: string;
  normalRowClass: string;
  cardBg: string;
  cardBorder: string;
  panelBg: string;
}

export const getThemeStyles = (theme: ThemeMode): ThemeStyles => {
  switch (theme) {
    case 'amber':
      return {
        rootBg: 'bg-[#0a0702]',
        canvasBg: 'bg-[#130d05]',
        canvasBorder: 'border-[#524533]',
        headerBg: 'bg-[#130d05]',
        headerBorder: 'border-[#524533]',
        footerBg: 'bg-[#130d05]',
        footerBorder: 'border-[#524533]',
        textPrimary: 'text-[#ffd597]',
        textSecondary: 'text-[#ffba43]',
        textMuted: 'text-[#9f8e78]',
        accentColor: '#ffb000',
        accentBg: 'bg-[#ffb000]',
        accentText: 'text-[#281800]',
        activeBorder: 'border-[#ffb000]',
        focusGlowClass: 'amber-box-glow',
        scanlines: true,
        fontFamily: 'font-mono',
        tagClass: 'border border-[#ffb000] text-[#ffb000]',
        activeRowClass: 'bg-[#31291d] border-y border-[#ffb000] text-[#ffd597] amber-box-glow',
        normalRowClass: 'hover:bg-[#211a10] text-[#efe0cf] border-b border-[#524533]/40',
        cardBg: 'bg-[#211a10]',
        cardBorder: 'border-[#524533]',
        panelBg: 'bg-[#191208]',
      };

    case 'paper':
      return {
        rootBg: 'bg-[#cfd5dc]',
        canvasBg: 'bg-[#f6faff]',
        canvasBorder: 'border-[#b0b9c3]',
        headerBg: 'bg-[#ffffff]',
        headerBorder: 'border-[#c1c7d2]',
        footerBg: 'bg-[#ffffff]',
        footerBorder: 'border-[#c1c7d2]',
        textPrimary: 'text-[#171c21]',
        textSecondary: 'text-[#005394]',
        textMuted: 'text-[#545f72]',
        accentColor: '#2b6cb0',
        accentBg: 'bg-[#2b6cb0]',
        accentText: 'text-white',
        activeBorder: 'border-[#2b6cb0]',
        focusGlowClass: 'beveled-box ring-2 ring-[#2b6cb0]',
        scanlines: false,
        fontFamily: 'font-sans',
        tagClass: 'border border-[#727782] text-[#171c21] bg-[#e9eef4]',
        activeRowClass: 'bg-[#2b3136] text-[#ffffff] border-l-4 border-[#2b6cb0] beveled-box',
        normalRowClass: 'hover:bg-[#e9eef4] text-[#171c21] border-b border-[#c1c7d2]',
        cardBg: 'bg-[#ffffff]',
        cardBorder: 'border-[#b0b9c3]',
        panelBg: 'bg-[#eff4fa]',
      };

    case 'cyan':
    default:
      return {
        rootBg: 'bg-[#05080c]',
        canvasBg: 'bg-[#090e16]',
        canvasBorder: 'border-[#3b494c]',
        headerBg: 'bg-[#090e16]',
        headerBorder: 'border-[#3b494c]',
        footerBg: 'bg-[#090e16]',
        footerBorder: 'border-[#3b494c]',
        textPrimary: 'text-[#c3f5ff]',
        textSecondary: 'text-[#00e5ff]',
        textMuted: 'text-[#849396]',
        accentColor: '#00e5ff',
        accentBg: 'bg-[#00e5ff]',
        accentText: 'text-[#00363d]',
        activeBorder: 'border-[#00e5ff]',
        focusGlowClass: 'neon-focus-glow',
        scanlines: false,
        fontFamily: 'font-mono',
        tagClass: 'border border-[#00e5ff]/50 text-[#00e5ff] bg-[#00e5ff]/10',
        activeRowClass: 'bg-[#252a33] border-2 border-[#00e5ff] text-white neon-focus-glow',
        normalRowClass: 'hover:bg-[#1b2028] text-[#dee2ee] border-b border-[#3b494c]/50',
        cardBg: 'bg-[#171c24]',
        cardBorder: 'border-[#3b494c]',
        panelBg: 'bg-[#0f141c]',
      };
  }
};
