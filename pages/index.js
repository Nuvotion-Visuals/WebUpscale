import { useAppStateStore, useImageStore } from '@/services/useState'
import { useEffect } from 'react'
import { useWindowSize } from '@/services/windowUtilities'
import { initializeONNX, upScaleFromURI } from '@/services/inference/utils'
import Image from 'next/image'
import { ReactCompareSlider } from 'react-compare-slider'
import { downloadImage } from '@/services/imageUtilities'
import { setDataURIFromFile } from '@/services/imageUtilities'

const ImageDisplay = () => {
  const { inputURI, outputURI } = useImageStore()

  return (
    <div
      id="image-display-container"
      className={`items-center flex justify-center drop-shadow-md overflow-hidden ml-5 mr-5 w-auto md:w-full`}
    >
      {outputURI == null ? (
        <Image src={inputURI} width="1" height="1" id="stock-image" className="z-0" priority={true} alt="Before image" />
      ) : (
        <ReactCompareSlider
          position={50}
          itemOne={
            <Image width="500" height="500" src={inputURI} id="before-image" className="z-0" priority={true} alt="Before image" />
          }
          itemTwo={
            <Image width="500" height="500" src={outputURI} id="after-image" className="z-0" priority={true} alt="After image" />
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


const RunComponent = () => {
  const { setOutputURI, setUpscaleFactor, setTags, inputURI, extension, upscaleFactor } = useImageStore()
  const { setDownloadReady, setRunning, setErrorMessage, setLoadProg, running, loadProg } = useAppStateStore()

  const modelLoading = loadProg >= 0

  return (
    <button
      className="grow text-white font-bold py-2 px-4 overflow-hidden rounded drop-shadow-lg bg-pink inline-flex items-center disabled:bg-gray-400 disabled:opacity-60 disabled:text-white disabled:cursor-not-allowed"
      disabled={modelLoading || running}
      onClick={() => {
        setLoadProg(0)
        initializeONNX(setLoadProg)
          .then(() => {
            setRunning(true)
          })
          .then(() => {
            upScaleFromURI(extension, setTags, inputURI, upscaleFactor)
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
      {modelLoading && ( // Model downloading progress displayed underneath button
        <div
          id="upscale-button-bg"
          className="bg-litepink absolute h-full left-0 rounded duration-300"
          style={{ width: `${loadProg * 100}%`, zIndex: -1, transitionProperty: 'width' }}
        />
      )}

      {running ? ( // Button text
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
      className="form-select appearance-none border-none text-white font-bold py-2 px-4 rounded drop-shadow-lg bg-pink inline-flex items-center w-16 disabled:bg-gray-400 disabled:opacity-60 disabled:text-white disabled:cursor-not-allowed"
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
  const size = useWindowSize()
  const setMobile = useAppStateStore((state) => state.setMobile)
  const outputURI = useImageStore((state) => state.outputURI)

  useEffect(() => {
    setMobile(size.width / size.height < 1.0)
  }, [size])

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
    
    </div>
  )
}
