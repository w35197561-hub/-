import { createContext, useContext } from 'react'

const PreviewContext = createContext<boolean>(false)

export function PreviewProvider({
  isPreview,
  children,
}: {
  isPreview: boolean
  children: React.ReactNode
}) {
  return <PreviewContext.Provider value={isPreview}>{children}</PreviewContext.Provider>
}

export function useIsPreview(): boolean {
  return useContext(PreviewContext)
}
