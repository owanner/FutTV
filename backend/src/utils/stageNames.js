/**
 * Stage name mappings for competitions.
 * Some APIs return English or incorrect stage names, so we map them
 * to the correct Portuguese names for display.
 */

const STAGE_MAP = {
  // Generic mappings (applied to all competitions)
  GROUP_STAGE: "Fase de Grupos",
  ROUND_1: "1ª Fase",
  ROUND_2: "2ª Fase",
  ROUND_3: "3ª Fase",
  PLAY_OFFS: "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinal",
  FINAL: "Final",
  
  // Competition-specific overrides
  libertadores2026: {
    PLAY_OFFS: "Oitavas de Final",
    ROUND_1: "1ª Fase",
    ROUND_2: "2ª Fase",
    ROUND_3: "3ª Fase",
  },
  copadobrasil2026: {
    ROUND_1: "Fase Inicial",
    ROUND_2: "Oitavas de Final",
    ROUND_3: "Quartas de Final",
    SEMI_FINALS: "Semifinal",
    FINAL: "Final",
  },
  sulamericana2026: {
    PLAY_OFFS: "Oitavas de Final",
    QUARTER_FINALS: "Quartas de Final",
    SEMI_FINALS: "Semifinal",
  },
  wc2026: {
    GROUP_STAGE: "Fase de Grupos",
    ROUND_16: "Oitavas de Final",
    QUARTER_FINALS: "Quartas de Final",
    SEMI_FINALS: "Semifinal",
    FINAL: "Final",
  },
  brasileirao2026: {
    // CBF uses "RODADA_N" format, we keep as-is
  },
};

/**
 * Get the display name for a stage, with competition-specific overrides.
 */
function getStageDisplayName(stageName, stageId, competitionId) {
  // Try competition-specific mapping first (overrides everything)
  const compMap = STAGE_MAP[competitionId];
  if (compMap && compMap[stageId]) {
    return compMap[stageId];
  }
  
  // Try generic mapping
  if (STAGE_MAP[stageId]) {
    return STAGE_MAP[stageId];
  }
  
  // If stageName is provided and not empty, use it
  if (stageName) {
    return stageName;
  }
  
  // Fallback
  return stageId || "Fase Desconhecida";
}

/**
 * Map an English stage ID to Portuguese display name.
 */
function mapStageId(stageId, competitionId) {
  const compMap = STAGE_MAP[competitionId];
  if (compMap && compMap[stageId]) {
    return compMap[stageId];
  }
  if (STAGE_MAP[stageId]) {
    return STAGE_MAP[stageId];
  }
  return stageId || "Fase Desconhecida";
}

module.exports = { getStageDisplayName, mapStageId, STAGE_MAP };
