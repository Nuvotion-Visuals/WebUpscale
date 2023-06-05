import { useState, useEffect } from 'react'
import { initialize, upscale } from 'upscale'
import Image from 'next/image'
import { ReactCompareSlider } from 'react-compare-slider'

export default function Main() {
  const [inputURIQueue, setInputURIQueue] = useState([])
  const [outputURIQueue, setOutputURIQueue] = useState([])
  const [fileNameQueue, setFileNameQueue] = useState([])
  const [displayFileNameQueue, setDisplayFileNameQueue] = useState([]) 
  const [displayInputURIQueue, setDisplayInputURIQueue] = useState([]) 
  const [statusQueue, setStatusQueue] = useState([]) 
  const [extensionQueue, setExtensionQueue] = useState([])
  const [upscaleFactor, setUpscaleFactor] = useState(1)
  const [loadProg, setLoadProg] = useState(-1)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeProcessIndex, setActiveProcessIndex] = useState(0) 

  useEffect(() => {
    if (statusQueue[activeProcessIndex] === 'Queued' && loadProg === -1) {
      upscaleImage(inputURIQueue[activeProcessIndex], activeProcessIndex)
    }
  }, [inputURIQueue, activeProcessIndex, loadProg, statusQueue])

  const upscaleImage = (inputURI, index) => {
    setLoadProg(0)
    setStatusQueue(prevQueue => {
      const newQueue = [...prevQueue]
      newQueue[index] = 'Processing'
      return newQueue
    })
    initialize(setLoadProg)
      .then(() => upscale(inputURI, upscaleFactor)
        .then(result => {
          setOutputURIQueue(prevQueue => {
            const newQueue = [...prevQueue]
            newQueue[index] = result
            return newQueue
          })
          setStatusQueue(prevQueue => {
            const newQueue = [...prevQueue]
            newQueue[index] = 'Completed'
            return newQueue
          })
          setLoadProg(-1)
          if (activeProcessIndex < inputURIQueue.length - 1) {
            setActiveProcessIndex(prevIndex => prevIndex + 1)
          }
        })
        .catch(error => {
          setStatusQueue(prevQueue => {
            const newQueue = [...prevQueue]
            newQueue[index] = 'Error: ' + error.message
            return newQueue
          })
          setLoadProg(-1)
        })
      )
      .catch(() => {
        setStatusQueue(prevQueue => {
          const newQueue = [...prevQueue]
          newQueue[index] = 'Error: Could not load model.'
          return newQueue
        })
        setLoadProg(-1)
      })
  }

  const fileUploadHandler = (e) => {
    for (let i = 0; i < e.target.files.length; i++) {
      const fileObj = e.target.files[i];
      setFileNameQueue(prevQueue => [...prevQueue, fileObj.name])
      setDisplayFileNameQueue(prevQueue => [...prevQueue, fileObj.name]) 
      const reader = new FileReader()
      reader.readAsArrayBuffer(fileObj)

      reader.onloadend = () => {
        const blob = new Blob([reader.result], { type: fileObj.type })
        const urlCreator = window.URL || window.webkitURL
        const objectURL = urlCreator.createObjectURL(blob)
        setInputURIQueue(prevQueue => [...prevQueue, objectURL])
        setDisplayInputURIQueue(prevQueue => [...prevQueue, objectURL])
        setStatusQueue(prevQueue => [...prevQueue, 'Queued'])
        setExtensionQueue(prevQueue => [...prevQueue, fileObj.name.split('.').pop()])
        setOutputURIQueue(prevQueue => [...prevQueue, null])
      }
    }
  }

  return (
    <div>
      {
        outputURIQueue[activeIndex] 
          ? <div style={{width: '512px'}}>
              <ReactCompareSlider
                position={50}
                itemOne={<Image width='512' height='512' src={displayInputURIQueue[activeIndex]} />}
                itemTwo={<Image width='512' height='512' src={outputURIQueue[activeIndex]} />}
              />
            </div>
          : <Image src={displayInputURIQueue[activeIndex]} width='512' height='512'/>
      }
      <input
        type='file'
        onChange={fileUploadHandler}
        onClick={e => e.target.value = null}
        multiple
      />
      <button
        onClick={() => {
          if (statusQueue.length > 0) {
            setActiveProcessIndex(0)
          }
        }}
      >
        Start
      </button>
      {
        displayFileNameQueue.map((fileName, index) => (
          <div key={index} onClick={() => setActiveIndex(index)}>
            <img src={displayInputURIQueue[index]} width="50" height="50" /> 
            {fileName} - {statusQueue[index]}
            {statusQueue[index] === 'Processing' && <progress />}
            {statusQueue[index] === 'Completed' && 
              <button onClick={(e) => {
                e.stopPropagation();  // to prevent setActiveIndex
                const link = document.createElement('a')
                link.download = `${fileNameQueue[index]}.${extensionQueue[index]}`
                link.href = outputURIQueue[index]
                link.click()
              }}>
                Download
              </button>
            }
          </div>
        ))
      }
    </div>
  )
}
