/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo } from "react";
import { Chess, Move } from "chess.js";
import { EVERGREEN_MATCH } from "../data/matches";

export function useChessEngine() {
  const [chess] = useState(new Chess());
  const [currentStep, setCurrentStep] = useState(-1);
  
  const history = useMemo(() => {
    const tempChess = new Chess();
    tempChess.loadPgn(EVERGREEN_MATCH.pgn);
    return tempChess.history({ verbose: true });
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    const targetStep = Math.max(-1, Math.min(stepIndex, history.length - 1));
    setCurrentStep(targetStep);
  }, [history.length]);

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  // Current board state calculation
  const boardState = useMemo(() => {
    const tempChess = new Chess();
    for (let i = 0; i <= currentStep; i++) {
      tempChess.move(history[i]);
    }
    return tempChess.board();
  }, [currentStep, history]);

  const lastMove = currentStep >= 0 ? history[currentStep] : null;
  const isCapture = lastMove ? lastMove.captured !== undefined : false;

  return {
    chess,
    history,
    currentStep,
    boardState,
    lastMove,
    isCapture,
    nextStep,
    prevStep,
    goToStep,
    matchInfo: EVERGREEN_MATCH,
    narrative: EVERGREEN_MATCH.narratives[currentStep + 1] || null
  };
}
