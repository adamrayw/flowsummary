'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type AppLanguage = 'id' | 'en'

interface LanguageContextValue {
  language: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  t: (key: string, fallback?: string) => string
}

const UI_STRINGS: Record<AppLanguage, Record<string, string>> = {
  id: {
    language: 'Bahasa',
    aiLanguage: 'Bahasa Luaran AI',
    uploadTitle: 'Unggah Dokumen',
    uploadDesc: 'Seret dan lepas file Anda atau klik untuk menjelajah',
    presentationTitle: 'Presentation Workspace',
    exportPptx: 'Unduh PPTX',
    exportPdf: 'Unduh PDF',
    regenerate: 'Generate Ulang',
    analystConsole: 'AI Analyst Console',
    statusOperational: 'Status Operasional',
    dataIntegrity: 'Integritas Data',
    decisionMandate: 'Mandat Keputusan',
  },
  en: {
    language: 'Language',
    aiLanguage: 'AI Output Language',
    uploadTitle: 'Upload Document',
    uploadDesc: 'Drag and drop your file or click to browse',
    presentationTitle: 'Presentation Workspace',
    exportPptx: 'Download PPTX',
    exportPdf: 'Download PDF',
    regenerate: 'Regenerate',
    analystConsole: 'AI Analyst Console',
    statusOperational: 'Operational Status',
    dataIntegrity: 'Data Integrity',
    decisionMandate: 'Executive Directive',
  },
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'id',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key,
})

const STORAGE_KEY = 'flowsummary:language'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('id')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AppLanguage | null
      if (stored === 'id' || stored === 'en') {
        setLanguageState(stored)
      }
    } catch {
      // localStorage might not be accessible in private browsing
    }
  }, [])

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang)
    try {
      localStorage.setItem(STORAGE_KEY, newLang)
    } catch {
      // ignore storage errors
    }
  }

  const t = (key: string, fallback?: string) => {
    return UI_STRINGS[language]?.[key] || fallback || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
