import { useEffect, useState } from 'react'

import { useAppStateStore } from '@/services/useState'

const ProgressComponent = () => {
  const [loadingText, setLoadingText] = useState('')
  const { running, downloadReady, modelLoading } = useAppStateStore()

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingText((prev) => (prev === '...' ? '' : `${prev}.`))
    }, 750)
    return () => clearInterval(interval)
  }, [])

  const title = modelLoading ? (
    <>
      Preparing to <span className="text-pink">run{loadingText}</span>
    </>
  ) : (
    <>
      {downloadReady ? 'Download' : running ? 'Upscaling' : 'Upscale'} your{' '}
      <span className="text-pink">image{running ? loadingText : '!'}</span>
    </>
  )

  return (
    <div className="flex flex-col items-center justify-center w-full text-center mb-3">
      <h1 id="title" className="select-none text-2xl font-bold text-white">
        {title}
      </h1>
    </div>
  )
}

export default ProgressComponent
