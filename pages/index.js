import { useState, useEffect, useMemo } from 'react'
import { initialize, upscale } from 'upscale'
import { ReactCompareSlider } from 'react-compare-slider'
import localForage from 'localforage'
import styled from 'styled-components'
import Droppable from '@/components/Droppable'
import Progress from '@/components/Progress'
import Image from 'next/image'

export default function Main() {
  const [upscaleQueue, setUpscaleQueue] = useState([])
  const [upscaleFactor, setUpscaleFactor] = useState(1)
  const [loadProg, setLoadProg] = useState(-1)
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeProcessIndex, setActiveProcessIndex] = useState(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    if (upscaleQueue[activeProcessIndex]?.status === 'Queued' && loadProg === -1) {
      upscaleImage(activeProcessIndex)
    }
  }, [upscaleQueue, activeProcessIndex, loadProg])

  useEffect(() => {
    async function fetchData() {
      const savedQueue = await localForage.getItem('upscaleQueue')
      if (savedQueue) {
        const queue = savedQueue.map(item => {
          if (item.status === 'Upscaling') {
            item.status = 'Queued'
          }
          return item
        })
        setUpscaleQueue(queue)
      }
      setDataLoaded(true)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (dataLoaded) {
      localForage.setItem('upscaleQueue', upscaleQueue)
    }
  }, [dataLoaded, upscaleQueue])

  const upscaleImage = async (index) => {
     // Check if the image is already completed
    if(upscaleQueue[index].status === 'Completed') {
      // If the image is completed and it's not the last image in the queue
      if(index < upscaleQueue.length - 1) {
        upscaleImage(index + 1); // Call the next image in the queue
      }
      return; // Do not continue with the current image
    }
    setLoadProg(0)
    setUpscaleQueue(prevQueue => {
      const newQueue = [...prevQueue]
      newQueue[index].status = 'Upscaling'
      return newQueue
    })
    initialize(setLoadProg)
      .then(() => {
        const reader = new FileReader();
        reader.onload = async function(e) {
          try {
            const result = await upscale(reader.result, upscaleFactor)
            setUpscaleQueue(prevQueue => {
              const newQueue = [...prevQueue]
              newQueue[index].outputURI = result
              newQueue[index].status = 'Completed'
              return newQueue
            })
            if (index < upscaleQueue.length - 1) { // check if there are more items to process
              upscaleImage(index + 1); // call the next item in the queue
            }
          } catch(error) {
            setUpscaleQueue(prevQueue => {
              const newQueue = [...prevQueue]
              newQueue[index].status = 'Error: ' + error
              return newQueue
            })
            if (index < upscaleQueue.length - 1) { // check if there are more items to process
              upscaleImage(index + 1); // call the next item in the queue
            }
          }
        };
        reader.readAsDataURL(upscaleQueue[index].inputFile);
      })
      .catch(() => setUpscaleQueue(prevQueue => {
        const newQueue = [...prevQueue]
        newQueue[index].status = 'Could not load model.'
        return newQueue
      }))
      .finally(() => {
        setLoadProg(-1)
      })
  }
  

  const fileUploadHandler = (files) => {
    if (files[0]) {
      let fileObjects = Array.from(files)
      fileObjects.forEach(fileObj => {
        const reader = new FileReader();
        reader.onload = function(e) {
          setUpscaleQueue(prevQueue => [
            ...prevQueue, 
            {
              inputFile: fileObj,
              outputURI: null,
              fileName: fileObj.name,
              displayFileName: fileObj.name.split('.').shift(),
              displayInputURI: reader.result,
              status: 'Queued',
              extension: fileObj.name.split('.').pop()
            }
          ])
        };
        reader.readAsDataURL(fileObj);
      })
    }
  }  

  const removeFileHandler = (index) => {
    setUpscaleQueue(prevQueue => prevQueue.filter((_, i) => i !== index))
  }

  const disabled = useMemo(() => {
    const isProcessing = upscaleQueue.some(item => item.status === 'Upscaling');
    const hasQueuedItems = upscaleQueue.some(item => item.status === 'Queued');
    return isProcessing || !hasQueuedItems;
  }, [upscaleQueue]);

  return (
    <S.Container>
      <S.Sidebar>
        <S.Top>
        <S.Logo src="webupscale-typography.svg" alt="WebUpscale"/>
  
        <S.Description>Upscale batches of images in your browser with AI - private, free, and no installation required. 2x scaling is recommended.</S.Description>
  
        <Droppable
          onDrop={(files) => fileUploadHandler(files)}
          onClick={() => {document.getElementById("hiddenFileInput").click()}}
        >
          <span style={{width: '140px'}}>
            <S.Button onClick={e => {
              e.stopPropagation()
              document.getElementById("hiddenFileInput").click();
            }}>
              <img src='upload.svg' />
              Upload
            </S.Button>
          </span>
          <input type="file" id="hiddenFileInput" hidden multiple accept="image/*" onChange={e => fileUploadHandler(e.target.files)} />
        </Droppable>
  
        <S.Upscale>
        <S.Button
          onClick={() => {
            if (upscaleQueue.length > 0 && upscaleQueue[0]?.status !== 'Upscaling') {
              upscaleImage(0) // start the upscaling from the first item in the queue
            }
          }}
          disabled={disabled}
        >
          Start Upscaling
        </S.Button>
          <S.Select onInput={inp => setUpscaleFactor(parseInt(inp.target.value))}>
            <option value='2'>2x</option>
            <option value='4'>4x</option>
            <option value='8'>8x</option>
          </S.Select>
        </S.Upscale>

        </S.Top>
  
        <S.Items>
          {
            upscaleQueue.map((item, index) => (
              <S.Item key={index} active={activeIndex === index} onClick={() => setActiveIndex(index)}>
                <S.Thumbnail src={item.displayInputURI} />
                <S.Details>
                  <S.Name >{`${item.displayFileName}.${item.extension}`}</S.Name>
                  <S.Progress>
                    <S.Status> {item.status}</S.Status>{ item.status === 'Upscaling' && <Progress />}
                  </S.Progress>
                </S.Details>
  
                <S.Spacer />
  
                <S.Buttons>
                {
                  item.status === 'Completed' && <S.SquareButton
                    onClick={(e) => {
                      e.stopPropagation()
                      const link = document.createElement('a')
                      link.download = `${item.fileName}_upscaled.${item.extension}`
                      link.href = item.outputURI
                      link.click()
                    }}
                  >
                      <img src='download.svg' />
                  </S.SquareButton>
                }
                <S.SquareButton onClick={() => removeFileHandler(index)}>✕</S.SquareButton>
                </S.Buttons>
              </S.Item>
            ))
          }
        </S.Items>
        <S.Link>
          <a href="https://avsync.live" target="_blank"><Image height={18} width={18} src='up-right-from-square-solid.svg' />Create audio-reactive visuals for free</a>
        </S.Link>
      </S.Sidebar>
  
      <S.Content>
      {
          upscaleQueue.length
            ? upscaleQueue[activeIndex]?.outputURI
              ? 
                <ReactCompareSlider
                  position={50}
                  itemOne={<S.Image src={upscaleQueue[activeIndex].displayInputURI} />}
                  itemTwo={<S.Image src={upscaleQueue[activeIndex].outputURI} />}
                />
              : upscaleQueue[activeIndex]?.displayInputURI
                ? <ReactCompareSlider
                    position={50}
                    itemOne={<S.Image src={upscaleQueue[activeIndex].displayInputURI} />}
                    itemTwo={<S.Image src={'/empty.svg'} />}
                  />
                : 'Your upscales will appear here.'
            : <ReactCompareSlider
                position={50}
                itemOne={<S.Image src={'/images/tree.png'} />}
                itemTwo={<S.Image src={'/images/tree_4x.png'} />}
              />
        }
      </S.Content>
    </S.Container>
  )  
}

const S = {
  Container: styled.div`
    width: 100%;
    height: 100vh;
    background: black;
    display: flex;
  `,

  Description: styled.div`
    font-size: 13px;
    line-height: 19.5px;
    margin-bottom: 20px;
    color: #ccc;
  `,

  Top: styled.div`
    padding: 16px;
    padding-top: 8px;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  `,

  Logo: styled.img`
    width: 100%;
    max-width: 300px;
    margin-bottom: 10px;
  `,

  Sidebar: styled.div`
    max-width: 432px;
    padding-bottom: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: left;
    background-color: #121212;
  `,

  Buttons: styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
  `,

  Upscale: styled.div`
    display: flex;
    width: 100%;
    gap: 8px;  
    margin-top: 16px;
  `,

  Spacer: styled.div`
    display: flex;
    flex-grow: 1;
  `,

  Items: styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: calc(100% - 32px);
    padding: 0 16px;
    height: calc(100vh - 292px);
    overflow-y: auto;
    align-content: flex-start;
  `,

  Item: styled.div`
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    background: ${props => props.active ? 'var(--Surface_0)' : 'none'};
    cursor: pointer;
  `,

  Thumbnail: styled.img`
    width: 50px;
    height: 50px;
    object-fit: contain;
  `,

  Select: styled.select`
    display: inline-block;
    padding: 8px 16px;
    background-color: var(--Surface);
    color: #ffffff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
  `,

  Progress: styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
  `,

  Button: styled.button`
    display: inline-block;
    padding: 8px 16px;
    width: 100%;
    background-color: var(--Surface);
    color: #ffffff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: var(--Surface_1);
    }

    &:disabled {
      background-color: var(--Surface) !important;
      opacity: 0.5;
      cursor: not-allowed;
    }

    img {
      margin-right: 8px;
      filter: invert();
    }
  `,

  SquareButton: styled.button`
    background-color: var(--Surface);
    color: #ffffff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;

   
    width: 32px;
    min-width: 32px;
    max-width: 32px;
    max-height: 32px;
    height: 32px;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: var(--Surface_1);
    }

    &:disabled {
      background-color: var(--Surface) !important;
      opacity: 0.5;
      cursor: not-allowed;
    }

    img {
      filter: invert();
    }
  `,

  Details: styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 8px;
  `,

  Name: styled.div`
    font-size: 13px;
    width: 100%;
  `,

  Status: styled.div`
    font-size: 12px;
    color: #ccc;
  `,

  Content: styled.div`
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  `,

  Image: styled.img`
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    object-fit: contain;
  `,

  Link: styled.div`
    display: flex;
    align-items: center;
    bottom: 0;
    width: calc(100% - 32px);
    border-top: 1px solid var(--Surface);
    padding: 16px;

    a {
        font-size: 13px;
        color: #bbb;
        text-decoration: underline;
        display: flex;
        gap: 8px;
    }

    img {
        height: 18px;
        color: #bbb;
        text-decoration: underline;
        display: flex;
        gap: 8px;
        margin-top: -1px;
    }
  `,
}