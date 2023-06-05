import { initialize, upscale } from 'upscale'
import Image from 'next/image'
import { ReactCompareSlider } from 'react-compare-slider'
import { create } from 'zustand'

const useImageStore = create((set) => ({
  inputURI: './images/colorful-reaction-diffusion.png', // Input image URI
  outputURI: './images/colorful-reaction-diffusion_2x.png', // Output image URI
  fileName: 'example', // Output file name
  extension: 'png', // Output file extension
  upscaleFactor: 1, // Upscale factor (will be automatically log2'd)
  hasntRun: true, // Upscale factor (will be automatically log2'd)
  tempURI: './images/colorful-reaction-diffusion.png',
  tempFileName: 'example',

  setInputURI: (uri) => {
    set(() => ({ inputURI: uri }))
    set(() => ({ outputURI: null }))
    set(() => ({ hasntRun: true }))

    useAppStateStore.setState({ downloadReady: false })

 
    set(() => ({ extension: 'png' }))
  },
  setUpscaleFactor: (newFactor) => set(() => ({ upscaleFactor: Math.log2(newFactor) })),

  setOutputURI: (uri) => {
    set(() => ({ outputURI: uri }))
    set(() => ({ hasntRun: false }))
  },
  setFileName: (newFilename) => set(() => ({ fileName: newFilename })),
  setTempURI: (newTempUri) => set(() => ({ tempURI: newTempUri })),
  setTempFileName: (newTempFileName) => set(() => ({ tempFileName: newTempFileName })),
}))

const useAppStateStore = create((set) => ({
  loadProg: -1, // Progress of model loading

  inputModalOpen: false, // Flag indicating if input modal is open
  mobile: false, // Are we on a mobile aspect ratio?
  errorMessage: null, // Error message to display
  running: false, // Flag indicating if we should run the model, fires a useEffect
  downloadReady: false, // Flag indicating upscale is ready for download
  feedbackMessage: null,
  isUploading: false,
  selectedPreset: 'none',

  setInputModalOpen: (newInputModalOpen) => set(() => ({ inputModalOpen: newInputModalOpen })),
  setMobile: (newMobile) => set(() => ({ mobile: newMobile })),
  setErrorMessage: (newError) => set(() => ({ errorMessage: newError })),
  setRunning: (newRunning) => set(() => ({ running: newRunning })),
  setLoadProg: (newProg) => set(() => ({ loadProg: newProg })),
  setDownloadReady: (newDownloadReady) => set(() => ({ downloadReady: newDownloadReady })),
  setFeedbackMessage: (newFeedbackMessage) => set(() => ({ feedbackMessage: newFeedbackMessage })),
  setIsUploading: (newIsUploading) => set(() => ({ isUploading: newIsUploading })),
  setSelectedPreset: (newSelectedPreset) => set(() => ({ selectedPreset: newSelectedPreset })),
}))


const ImageDisplay = () => {
  const { inputURI, outputURI } = useImageStore()

  return (
    <div id="image-display-container">
      {outputURI == null ? (
        <Image src={inputURI} width="1" height="1" id="stock-image" priority={true} alt="Before image" />
      ) : (
        <ReactCompareSlider
          position={50}
          itemOne={
            <Image width="500" height="500" src={inputURI} id="before-image" priority={true} alt="Before image" />
          }
          itemTwo={
            <Image width="500" height="500" src={outputURI} id="after-image" priority={true} alt="After image" />
          }
        />
      )}
    </div>
  )
}

export function DownloadComponent() {
  const { fileName, extension, outputURI, hasntRun } = useImageStore()

  return (
    <button 
      onClick={() => {
        const link = document.createElement('a')
        link.download = `${fileName}.${extension}`
        link.href = outputURI
        link.click()
      }} 
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
    <button id="upload-button" type="button">
        <input
          type="file"
          onChange={(e) => {
            if (e.target.files[0]) {
              const fileObj = e.target.files[0]
              const reader = new FileReader()
              reader.readAsArrayBuffer(fileObj)

              reader.onloadend = function () {
                let uri
              
                const blob = new Blob([reader.result], { type: fileObj.type })
                const urlCreator = window.URL || window.webkitURL
                uri = urlCreator.createObjectURL(blob)
                setInputURI(uri)
              }

              setTempFileName(fileObj.name.split('.')[0])
              setSelectedPreset('')
            }
          }}
          onClick={(e) => {
            e.target.value = null
          }}
        />
    </button>
  )
}

const RunComponent = () => {
  const { setOutputURI, setUpscaleFactor, inputURI, extension, upscaleFactor } = useImageStore()
  const { setDownloadReady, setRunning, setErrorMessage, setLoadProg, running, loadProg } = useAppStateStore()

  const modelLoading = loadProg >= 0

  return (
    <button disabled={modelLoading || running} onClick={() => {
        setLoadProg(0)
        initialize(setLoadProg)
          .then(() => {
            setRunning(true)
          })
          .then(() => {
            upscale(inputURI, upscaleFactor)
              .then((result) => {
                setOutputURI(result)
              })
              .catch((error) => {
                setErrorMessage(error)
              })
              .finally(() => {
                setDownloadReady(true)
                setRunning(false)
                setUpscaleFactor(2)
              })
          })
          .catch(() => {
            setErrorMessage('Could not load model.')
          })
          .finally(() => {
            setLoadProg(-1)
          })
      }}
    >
      {modelLoading && (
        <div id="upscale-button-bg" style={{ width: `${loadProg * 100}%`, zIndex: -1, transitionProperty: 'width' }}/>
      )}

      {running ? (
        <span> Upscaling... </span>
      ) : !modelLoading ? (
        <span> Upscale </span>
      ) : (
        <span> Loading Model </span>
      )}
    </button>
  )
}

function UpscaleFactorComponent() {
  const setUpscaleFactor = useImageStore((state) => state.setUpscaleFactor)
  const running = useAppStateStore((state) => state.running)

  return (
    <select
      id="resolution-select"
      onInput={(inp) => {
        setUpscaleFactor(parseInt(inp.target.value))
      }}
      disabled={running}
    >
      <option value="2">2&#215;</option>
      <option value="4">4&#215;</option>
      <option value="8">8&#215;</option>
    </select>
  )
}

export default function Main() {
  const outputURI = useImageStore((state) => state.outputURI)

  return (
    <div>
      <div></div>
      <div>
        <ImageDisplay />
      </div>
      {outputURI != null ? (
        <div>
          <UploadButtonComponent />
          <DownloadComponent />
        </div>
      ) : (
        <div>
          <RunComponent />
          <UpscaleFactorComponent />
        </div>
      )}
    </div>
  )
}
