import styled from 'styled-components'
import React from 'react'
import { FileDrop } from 'react-file-drop'


const Droppable = ({ children, onClick, onDrop }) => {
  return (
    <S.FileDrop onDrop={onDrop} onClick={onClick}>
     {
        children
     }
    </S.FileDrop>
  )
}

export default Droppable

const S = {
  FileDrop: styled(FileDrop)`
      /* relatively position the container bc the contents are absolute */
      position: relative;
      padding: 8px;
      height: 100px;
      max-height: 80vh;
      width: 100%;
      box-sizing:border-box;
      border: 2px dashed gray;
      background: var(--Background_Alternating);

    .file-drop-target {
      /* basic styles */
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      border-radius: 2px;

      /* horizontally and vertically center all content */
      display: flex;
      display: -webkit-box;
      display: -webkit-flex;
      display: -ms-flexbox;

      flex-direction: column;
      -webkit-box-orient: vertical;
      -webkit-box-direction: normal;
      -webkit-flex-direction: column;
      -ms-flex-direction: column;

      align-items: center;
      -webkit-box-align: center;
      -webkit-align-items: center;
      -ms-flex-align: center;

      justify-content: center;
      -webkit-box-pack: center;
      -webkit-justify-content: center;
      -ms-flex-pack: center;

      align-content: center;
      -webkit-align-content: center;
      -ms-flex-line-pack: center;

      text-align: center;
    }

    .file-drop-target.file-drop-dragging-over-frame {
      /* overlay a black mask when dragging over the frame */
      border: none;
      background: var(--Primary);
      box-shadow: none;
      z-index: 50;
      opacity: 1;

      /* typography */
      color: white;
    }

    .file-drop-target.file-drop-dragging-over-target {
      /* turn stuff orange when we are dragging over the target */
      background: var(--Hover);
    }
  `
}