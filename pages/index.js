import { useState, useEffect } from 'react'
import { initialize, upscale } from 'upscale'
import Image from 'next/image'
import { ReactCompareSlider } from 'react-compare-slider'
import localForage from 'localforage'

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
  const [activeProcessIndex, setActiveProcessIndex] = useState(null) 

  

  useEffect(() => {
    if (statusQueue[activeProcessIndex] === 'Queued' && loadProg === -1) {
      upscaleImage(inputURIQueue[activeProcessIndex], activeProcessIndex)
    }
  }, [inputURIQueue, activeProcessIndex, loadProg, statusQueue])

  // New state to track if the data has been loaded from localForage
const [dataLoaded, setDataLoaded] = useState(false)

useEffect(() => {
  async function fetchData() {
      const inputFiles = await localForage.getItem('inputFiles')  // Get File objects
      const outputURIs = await localForage.getItem('outputURIs')
      const fileNames = await localForage.getItem('fileNames')
      const displayFileNames = await localForage.getItem('displayFileNames')
      const displayInputURIs = await localForage.getItem('displayInputURIs')
      const statuses = await localForage.getItem('statuses')
      const extensions = await localForage.getItem('extensions')

      if (inputFiles && outputURIs && fileNames && displayFileNames && displayInputURIs && statuses && extensions) {
          // Reset any 'Processing' status to 'Queued'
          const resetStatuses = statuses.map(status => status === 'Processing' ? 'Queued' : status)

          setInputURIQueue(inputFiles)  // Use the File objects
          setOutputURIQueue(outputURIs)
          setFileNameQueue(fileNames)
          setDisplayFileNameQueue(displayFileNames)
          setDisplayInputURIQueue(displayInputURIs)
          setStatusQueue(resetStatuses)  // Use the reset statuses
          setExtensionQueue(extensions)
          setDataLoaded(true)  // Mark data as loaded
      }
  }
  fetchData()
}, [])

useEffect(() => {
  // Check if the data has been loaded before persisting
  if (dataLoaded) {
      localForage.setItem('inputFiles', inputURIQueue)  // Persist File objects
      localForage.setItem('outputURIs', outputURIQueue)
      localForage.setItem('fileNames', fileNameQueue)
      localForage.setItem('displayFileNames', displayFileNameQueue)
      localForage.setItem('displayInputURIs', displayInputURIQueue)
      localForage.setItem('statuses', statusQueue)
      localForage.setItem('extensions', extensionQueue)
  }
}, [dataLoaded, inputURIQueue, outputURIQueue, fileNameQueue, displayFileNameQueue, displayInputURIQueue, statusQueue, extensionQueue])


const upscaleImage = async (inputFile, index) => {
  setLoadProg(0)
  setStatusQueue(prevQueue => {
    const newQueue = [...prevQueue]
    newQueue[index] = 'Processing'
    return newQueue
  })
  initialize(setLoadProg)
    .then(() => {
        const reader = new FileReader();
        reader.onload = async function(e) {
          try {
            const result = await upscale(reader.result, upscaleFactor)
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
          } catch(error) {
            setStatusQueue(prevQueue => {
              const newQueue = [...prevQueue]
              newQueue[index] = 'Error: ' + error
              return newQueue
            })
          }
        };
        reader.readAsDataURL(inputFile);  // Convert the File object to a Data URL
    })
    .catch(() => setStatusQueue(prevQueue => {
      const newQueue = [...prevQueue]
      newQueue[index] = 'Could not load model.'
      return newQueue
    }))
    .finally(() => {
      setLoadProg(-1)
      if (activeProcessIndex < inputURIQueue.length - 1) {
        setActiveProcessIndex(activeProcessIndex + 1)
      } else {
        setActiveProcessIndex(null)
      }
    })
}


  const fileUploadHandler = (e) => {
    if (e.target.files[0]) {
      let fileObjects = Array.from(e.target.files)
      fileObjects.forEach(fileObj => {
        setInputURIQueue(prevQueue => [fileObj, ...prevQueue])  // Directly store the File object
        setOutputURIQueue(prevQueue => [null, ...prevQueue])
        setFileNameQueue(prevQueue => [fileObj.name, ...prevQueue])
        setDisplayFileNameQueue(prevQueue => [fileObj.name.split('.').shift(), ...prevQueue])
        
        const reader = new FileReader();
        reader.onload = function(e) {
          setDisplayInputURIQueue(prevQueue => [reader.result, ...prevQueue])  // Store the data URL for displaying the image
        };
        reader.readAsDataURL(fileObj);  // Convert the File object to a data URL for displaying
        
        setStatusQueue(prevQueue => ['Queued', ...prevQueue])
        setExtensionQueue(prevQueue => [fileObj.name.split('.').pop(), ...prevQueue])
      })
    }
  }

  const removeFileHandler = (index) => {
    setInputURIQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setOutputURIQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setFileNameQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setDisplayFileNameQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setDisplayInputURIQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setStatusQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
    setExtensionQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
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
          if (statusQueue.length > 0 && statusQueue[activeProcessIndex] !== 'Processing') {
            setActiveProcessIndex(0)
          }
        }}
      >
        Start
      </button>
      <select
        onInput={inp => setUpscaleFactorHandler(parseInt(inp.target.value))}
      >
        <option value='2'>2X</option>
        <option value='4'>4X</option>
        <option value='8'>8X</option>
      </select>
      {
        inputURIQueue.map((inputURI, index) => (
          <div key={index}>
            <img src={displayInputURIQueue[index]} width="50" height="50" /> 
            <p onClick={() => setActiveIndex(index)}>{displayFileNameQueue[index]}</p>
            <p>Status: {statusQueue[index]}</p>
            { statusQueue[index] === 'Processing' && <progress />}
            {
              statusQueue[index] === 'Completed' && <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.download = `${fileNameQueue[index]}.${extensionQueue[index]}`
                  link.href = outputURIQueue[index]
                  link.click()
                }}
              >
                Download
              </button>
            }
            <button onClick={() => removeFileHandler(index)}>X</button>

          </div>
        ))
      }
    </div>
  )
}
