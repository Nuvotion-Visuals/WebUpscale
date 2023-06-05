import { DownloadComponent } from '@/components/ButtonComponents'
import { UploadButtonComponent } from '@/components/ButtonComponents'
import { Sidebar, UpscaleFactorComponent } from '@/components/SidebarComponent'
import { useAppStateStore, useImageStore } from '@/services/useState'

import ImageDisplay from '@/components/ImageDisplayComponent'
import RunComponent from '@/components/RunComponent'
import { useEffect } from 'react'
import { useWindowSize } from '@/services/windowUtilities'

export default function Main() {
  const size = useWindowSize()
  const setMobile = useAppStateStore((state) => state.setMobile)

  useEffect(() => {
    setMobile(size.width / size.height < 1.0)
  }, [size])

  return (
    <>
      <MobileLayout />
    </>
  )
}

function MobileLayout() {
  const outputURI = useImageStore((state) => state.outputURI)

  return (
    <div className="h-fit overflow-hidden">
      <div className="grid grid-flow-col gap-1 ml-1 mr-1 justify-center mb-2"></div>
      <div className="mb-2">
        <ImageDisplay />
      </div>
      {outputURI != null ? (
        <div className="grid grid-flow-col gap-1 ml-1 mr-1 justify-center">
          <UploadButtonComponent />
          <DownloadComponent />
        </div>
      ) : (
        <div className="grid grid-flow-col gap-1 ml-1 mr-1 justify-center">
          <RunComponent />
          <UpscaleFactorComponent />
        </div>
      )}
      <div className="overflow-hidden hidden md:block min-h-screen hidden" style={{display: 'none'}}>
      <main className="flex-1">
        <Sidebar />
        <div className="h-3/4 grow w-full">
          <ImageDisplay />
        </div>
      </main>
    </div>
    </div>
  )
}