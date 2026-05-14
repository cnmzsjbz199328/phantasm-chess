/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { Chess } from "chess.js";
import type { MatchData } from "../data/matches";

export function useChessEngine(matchData: MatchData) {
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    setCurrentStep(-1);
  }, [matchData]);

  const history = useMemo(() => {
    const tempChess = new Chess();
    tempChess.loadPgn(matchData.pgn);
    return tempChess.history({ verbose: true });
  }, [matchData]);

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
    history,
    currentStep,
    boardState,
    lastMove,
    isCapture,
    nextStep,
    prevStep,
    goToStep,
    matchInfo: matchData,
    narrative: matchData.narratives[currentStep + 1] || null
  };
}
