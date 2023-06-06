import styled from 'styled-components';
import React, { useCallback, useState } from 'react';

const Droppable = ({ children, onClick, onDrop }) => {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragging(false);
    if (onDrop) {
      onDrop([...event.dataTransfer.files]);
    }
  }, [onDrop]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleDragEnter = useCallback((event) => {
    event.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setDragging(false);
  }, []);

  return (
    <S.DroppableDiv 
      onDrop={handleDrop} 
      onDragOver={handleDragOver} 
      onClick={onClick} 
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      dragging={dragging}
    >
      {children}
    </S.DroppableDiv>
  )
}

export default Droppable

const S = {
  DroppableDiv: styled.div`
      /* relatively position the container bc the contents are absolute */
      position: relative;
      padding: 8px;
      height: 100px;
      max-height: 80vh;
      width: 100%;
      box-sizing:border-box;
      border: 2px dashed gray;
      background: var(--Background_Alternating);
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      align-content: center;

      ${({ dragging }) => dragging && `
        background: var(--Primary);
        color: white;
      `}
  `
}
