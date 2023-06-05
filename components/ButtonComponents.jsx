import { downloadImage } from '@/services/imageUtilities'
import { useAppStateStore, useImageStore } from '@/services/useState'

import { setDataURIFromFile } from '@/services/imageUtilities'

export function DownloadComponent() {
  const { fileName, extension, outputURI, hasntRun } = useImageStore()

  return (
    <button
      className={`text-white h-12 mt-1 font-bold py-2 px-2 rounded drop-shadow-lg bg-pink inline-flex items-center disabled:bg-gray-400 disabled:opacity-60 disabled:text-white disabled:cursor-not-allowed
        ${hasntRun ? '' : 'animate-pulse'}`}
      onClick={() => downloadImage(fileName, extension, outputURI)}
      disabled={hasntRun}
    >
      <span>Download</span>
    </button>
  )
}

export function UploadButtonComponent() {
  const { setTempFileName, setInputURI } = useImageStore()
  const setSelectedPreset = useAppStateStore((state) => state.setSelectedPreset)

  return (
    <div className="grid grid-cols-1">
      <button
        id="upload-button"
        type="button"
        className="relative mt-1 rounded right-0 bottom-0 text-white shadow-sm px-2 py-1
text-base font-medium h-12 border-blue border-2 bg-blue disabled:bg-white disabled:text-gray-200 disabled:border-gray-200"
      >
        <label className="absolute left-0 top-0 w-full h-full cursor-pointer">
          <input
            type="file"
            className="hidden"
            onInput={(e) => {
              if (e.target.files[0]) {
                setDataURIFromFile(e.target.files[0], setInputURI)
                setTempFileName(e.target.files[0].name.split('.')[0])
                setSelectedPreset('')
              }
            }}
            onChange={(e) => {
              if (e.target.files[0]) {
                setDataURIFromFile(e.target.files[0], setInputURI)
                setTempFileName(e.target.files[0].name.split('.')[0])
                setSelectedPreset('')
              }
            }}
            onClick={(e) => {
              e.target.value = null
            }}
          />
        </label>
        Upload
      </button>
    </div>
  )
}


export function DoneButtonComponent() {
  const { setTags, setInputURI, tempURI } = useImageStore()
  const { setInputModalOpen, setSelectedPreset } = useAppStateStore()

  return (
    <div className="md:grid-cols-1 md:grid hidden">
      <button
        id="done-button"
        type="button"
        className="mt-7 rounded-md right-0 bottom-0 text-blue shadow-sm px-4 py-1
text-base font-medium h-12 focus:outline-none focus:ring-2 focus:ring-offset-2
border-blue border-2 bg-white hover:bg-blue hover:text-white disabled:bg-white disabled:text-gray-200 disabled:border-gray-200"
        onClick={() => {
          setInputURI(tempURI)
          setTags(null)
          setInputModalOpen(false)
          setSelectedPreset('')
        }}
      >
        Done
      </button>
    </div>
  )
}
