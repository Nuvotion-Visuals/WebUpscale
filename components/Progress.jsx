import React from 'react';
import styled, { keyframes } from 'styled-components';

const S = {
  ProgressBarContainer: styled.div`
    background-color: var(--Surface);
    border-radius: 9999px;
    height: 0.5rem;
    width: 100px;
    position: relative;
    overflow: hidden;
  `,
  ProgressBarProgress: styled.div`
    background-color: var(--Primary_Variant);
    border-radius: 9999px;
    position: absolute;
    bottom: 0;
    top: 0;
    width: 50%;
    animation-duration: 2s;
    animation-iteration-count: infinite;
    animation-name: ${keyframes`
      from {
        left: -50%;
      }
      to {
        left: 100%;
      }
    `};
  `
}

const IndeterminateProgressBar = () => {
  return (
    <S.ProgressBarContainer>
      <S.ProgressBarProgress />
    </S.ProgressBarContainer>
  );
};

export default IndeterminateProgressBar;
