const CUBE_ISLAND_DATA = typeof module !== "undefined" && module.exports
  ? require("./level-data.js")
  : window.CubeIslandData;

const {
  BLOCKS,
  TERRAINS,
  TERRAIN_LEGEND,
  LOCATIONS,
  LEVELS,
} = CUBE_ISLAND_DATA;

const STORAGE_KEY = "cubeIslandCampaignV2";
const LEGACY_STORAGE_KEY = "cubeIslandLevelsV1";
const SOUND_KEY = "cubeIslandSoundV1";
const SAVE_VERSION = 2;
const MATERIAL_ORDER = ["wood", "stone", "glass", "glow"];

function cellKey(row, column) {
  return `${row}:${column}`;
}

function cellIndex(row, column, columns) {
  return row * columns + column;
}

function cellPosition(index, columns) {
  return { row: Math.floor(index / columns), column: index % columns };
}

function orthogonalNeighbors(index, rows, columns) {
  const { row, column } = cellPosition(index, columns);
  return [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1]]
    .filter(([nextRow, nextColumn]) => (
      nextRow >= 0 && nextRow < rows && nextColumn >= 0 && nextColumn < columns
    ))
    .map(([nextRow, nextColumn]) => cellIndex(nextRow, nextColumn, columns));
}

function allNeighbors(index, rows, columns) {
  const { row, column } = cellPosition(index, columns);
  const result = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) continue;
      const nextRow = row + rowOffset;
      const nextColumn = column + columnOffset;
      if (nextRow >= 0 && nextRow < rows && nextColumn >= 0 && nextColumn < columns) {
        result.push(cellIndex(nextRow, nextColumn, columns));
      }
    }
  }
  return result;
}

function levelAt(index) {
  return LEVELS[index] || LEVELS[0];
}

function parseTerrain(level) {
  const landmarkByCell = new Map(
    level.landmarks.map((landmark) => [cellKey(landmark.row, landmark.column), landmark.id]),
  );
  const cells = [];

  for (let row = 0; row < level.rows; row += 1) {
    for (let column = 0; column < level.columns; column += 1) {
      const terrainId = TERRAIN_LEGEND[level.terrain[row]?.[column]] || "blocked";
      cells.push({
        terrainId,
        stack: [],
        landmarkId: landmarkByCell.get(cellKey(row, column)) || null,
        locked: !TERRAINS[terrainId]?.buildable,
      });
    }
  }

  level.initialBlocks.forEach((block) => {
    if (!BLOCKS[block.materialId]) return;
    const targetCell = cells[cellIndex(block.row, block.column, level.columns)];
    if (!targetCell) return;
    const height = Math.max(1, Math.min(level.maxHeight, Number(block.height) || 1));
    for (let layer = 0; layer < height; layer += 1) targetCell.stack.push(block.materialId);
  });
  return cells;
}

function createLevelState(level) {
  return {
    rows: level.rows,
    columns: level.columns,
    cells: parseTerrain(level),
    inventory: Object.fromEntries(MATERIAL_ORDER.map((materialId) => [
      materialId,
      Math.max(0, Number(level.inventory[materialId]) || 0),
    ])),
    completedObjectiveIds: [],
    activeObjectiveId: level.objectives[0]?.id || null,
  };
}

function createGameState(levelIndex = 0) {
  const safeIndex = Math.max(0, Math.min(LEVELS.length - 1, Number(levelIndex) || 0));
  return {
    version: SAVE_VERSION,
    currentLevelIndex: safeIndex,
    completedLevelIds: LEVELS.slice(0, safeIndex).map((level) => level.id),
    currentLevelState: createLevelState(levelAt(safeIndex)),
    selectedMaterialId: levelAt(safeIndex).availableMaterials[0] || null,
    selectedCell: null,
    selectedHeight: 0,
    phase: "build",
    celebratedLevelIds: [],
    completed: false,
    migratedFromV1: false,
  };
}

function currentLevel(state) {
  return levelAt(state.currentLevelIndex);
}

function getCell(levelState, row, column, columns = levelState?.columns) {
  if (!levelState || !Number.isInteger(row) || !Number.isInteger(column)) return null;
  if (row < 0 || column < 0 || column >= columns) return null;
  return levelState.cells[cellIndex(row, column, columns)] || null;
}

function topBlock(cell) {
  return cell?.stack[cell.stack.length - 1] || null;
}

function stackHeight(cell) {
  return Array.isArray(cell?.stack) ? cell.stack.length : 0;
}

function normalizeCoordinate(value) {
  if (Array.isArray(value)) return { row: value[0], column: value[1], height: value[2] || 0 };
  return value;
}

function samePosition(left, right, includeHeight = false) {
  const a = normalizeCoordinate(left);
  const b = normalizeCoordinate(right);
  return Boolean(a && b && a.row === b.row && a.column === b.column
    && (!includeHeight || (a.height || 0) === (b.height || 0)));
}

function objectiveTargets(level, objective = null) {
  const objectives = objective ? [objective] : level.objectives;
  return objectives.flatMap((item) => Array.isArray(item.params?.targets) ? item.params.targets : []);
}

function targetAt(level, row, column, height = null, objective = null) {
  return objectiveTargets(level, objective).find((target) => (
    target.row === row
    && target.column === column
    && (height === null || (target.height || 0) === height)
  )) || null;
}

function isTargetCell(level, row, column, objective = null) {
  return Boolean(targetAt(level, row, column, null, objective));
}

function activeObjective(levelState, level) {
  return level.objectives.find((objective) => objective.id === levelState.activeObjectiveId)
    || level.objectives.find((objective) => !levelState.completedObjectiveIds.includes(objective.id))
    || null;
}

function hasMaterialAt(levelState, level, target) {
  const cell = getCell(levelState, target.row, target.column, level.columns);
  return Boolean(cell && cell.stack[target.height || 0] === target.materialId);
}

function resultFromChecks(checks, suggestions = []) {
  const missingCells = checks.filter((check) => !check.complete).flatMap((check) => check.missingCells || []);
  const problemCells = checks.filter((check) => !check.complete).flatMap((check) => check.problemCells || []);
  const total = checks.reduce((sum, check) => sum + (check.total || 1), 0);
  const progress = checks.reduce((sum, check) => sum + (check.progress || 0), 0);
  return {
    complete: checks.every((check) => check.complete),
    progress,
    total,
    missingCells,
    problemCells,
    nextSuggestion: missingCells[0] || problemCells[0] || suggestions[0] || null,
  };
}

function validateFillTargets(levelState, level, params) {
  const targets = params.targets || [];
  const missingCells = targets.filter((target) => !hasMaterialAt(levelState, level, target));
  return {
    complete: missingCells.length === 0,
    progress: targets.length - missingCells.length,
    total: targets.length,
    missingCells,
    problemCells: [],
    nextSuggestion: missingCells[0] || null,
  };
}

function validateMatchShape(levelState, level, params) {
  return validateFillTargets(levelState, level, params);
}

function walkableCell(levelState, level, row, column) {
  const blockId = topBlock(getCell(levelState, row, column, level.columns));
  return Boolean(blockId && BLOCKS[blockId]?.walkable);
}

function validateConnectedRoute(levelState, level, params) {
  const starts = (params.startCells || []).map(normalizeCoordinate)
    .filter((point) => walkableCell(levelState, level, point.row, point.column));
  const ends = new Set((params.endCells || []).map((point) => {
    const value = normalizeCoordinate(point);
    return cellKey(value.row, value.column);
  }));
  const visited = new Set();
  const queue = starts.map((point) => cellIndex(point.row, point.column, level.columns));
  let connected = false;

  while (queue.length > 0) {
    const index = queue.shift();
    if (visited.has(index)) continue;
    visited.add(index);
    const position = cellPosition(index, level.columns);
    if (ends.has(cellKey(position.row, position.column))) {
      connected = true;
      break;
    }
    orthogonalNeighbors(index, level.rows, level.columns).forEach((neighborIndex) => {
      const neighbor = cellPosition(neighborIndex, level.columns);
      if (!visited.has(neighborIndex) && walkableCell(levelState, level, neighbor.row, neighbor.column)) {
        queue.push(neighborIndex);
      }
    });
  }

  const targetResult = validateFillTargets(levelState, level, { targets: params.targets || [] });
  return {
    complete: connected,
    progress: connected ? targetResult.total : targetResult.progress,
    total: Math.max(1, targetResult.total),
    missingCells: connected ? [] : targetResult.missingCells,
    problemCells: [],
    nextSuggestion: connected ? null : targetResult.nextSuggestion,
  };
}

function validateRouteWidth(levelState, level, params) {
  const targets = params.targets || [];
  const fill = validateFillTargets(levelState, level, { targets });
  const rows = params.rows || [];
  const minimumWidth = params.minimumWidth || 2;
  let widthReady = false;
  for (let index = 0; index <= rows.length - minimumWidth; index += 1) {
    const band = rows.slice(index, index + minimumWidth);
    if (band.every((row) => targets
      .filter((target) => target.row === row)
      .every((target) => hasMaterialAt(levelState, level, target)))) {
      widthReady = true;
      break;
    }
  }
  return { ...fill, complete: fill.complete && widthReady };
}

function validateSupportedSpan(levelState, level, params) {
  const fill = validateFillTargets(levelState, level, params);
  if (!fill.complete) return fill;
  const woodTargets = (params.targets || []).filter((target) => target.materialId === "wood");
  const grouped = new Map();
  woodTargets.forEach((target) => {
    if (!grouped.has(target.row)) grouped.set(target.row, []);
    grouped.get(target.row).push(target);
  });
  const problemCells = [];
  grouped.forEach((rowTargets) => {
    let unsupported = 0;
    rowTargets.sort((a, b) => a.column - b.column).forEach((target) => {
      const cell = getCell(levelState, target.row, target.column, level.columns);
      const terrainSolid = TERRAINS[cell.terrainId]?.solid;
      const supportedBelow = (target.height || 0) > 0 && Boolean(cell.stack[(target.height || 0) - 1]);
      if (terrainSolid || supportedBelow) unsupported = 0;
      else unsupported += 1;
      if (unsupported > (params.maxUnsupportedRun || level.rules.maxWoodSpan || 1)) {
        problemCells.push(target);
      }
    });
  });
  return {
    ...fill,
    complete: problemCells.length === 0,
    problemCells,
    nextSuggestion: problemCells[0] || null,
  };
}

function validateFoundation(levelState, level, params) {
  const targets = (params.targets || []).map((target) => ({
    ...target,
    materialId: params.materialId || target.materialId,
    height: 0,
  }));
  return validateFillTargets(levelState, level, { targets });
}

function validateStackPattern(levelState, level, params) {
  const targets = params.targets || (params.layers || []).flat();
  return validateFillTargets(levelState, level, { targets });
}

function validateEnclosure(levelState, level, params) {
  return validateFillTargets(levelState, level, { targets: params.targets || params.wallCells || [] });
}

function validateGuardEdges(levelState, level, params) {
  const targets = (params.guardCells || params.targets || []).map((target) => ({ ...target, materialId: "glass" }));
  return validateFillTargets(levelState, level, { targets });
}

function validateKeepClear(levelState, level, params) {
  const problemCells = (params.clearCells || []).map(normalizeCoordinate).filter((point) => (
    stackHeight(getCell(levelState, point.row, point.column, level.columns)) > 0
  ));
  return {
    complete: problemCells.length === 0,
    progress: problemCells.length === 0 ? 1 : 0,
    total: 1,
    missingCells: [],
    problemCells,
    nextSuggestion: problemCells[0] || null,
  };
}

function validateSymmetry(levelState, level, params) {
  const fill = validateFillTargets(levelState, level, params);
  const axis = params.axisColumn;
  const problemCells = [];
  (params.targets || []).forEach((target) => {
    const mirrorColumn = axis * 2 - target.column;
    const left = getCell(levelState, target.row, target.column, level.columns)?.stack || [];
    const right = getCell(levelState, target.row, mirrorColumn, level.columns)?.stack || [];
    if (JSON.stringify(left) !== JSON.stringify(right)) problemCells.push(target);
  });
  return { ...fill, complete: fill.complete && problemCells.length === 0, problemCells };
}

function computeLightMap(levelState, level, radiusOverride = null) {
  const light = Array(level.rows * level.columns).fill(0);
  const queue = [];
  levelState.cells.forEach((cell, index) => {
    cell.stack.forEach((materialId) => {
      if (materialId !== "glow") return;
      const radius = radiusOverride || BLOCKS.glow.lightRadius;
      light[index] = Math.max(light[index], radius + 1);
      queue.push({ index, remaining: radius + 1 });
    });
  });

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.remaining <= 1) continue;
    orthogonalNeighbors(current.index, level.rows, level.columns).forEach((neighborIndex) => {
      const cell = levelState.cells[neighborIndex];
      const materialId = topBlock(cell);
      if (materialId === "stone") return;
      const attenuation = materialId === "wood" ? 2 : 1;
      const nextRemaining = current.remaining - attenuation;
      if (nextRemaining <= light[neighborIndex] || nextRemaining <= 0) return;
      light[neighborIndex] = nextRemaining;
      queue.push({ index: neighborIndex, remaining: nextRemaining });
    });
  }
  return light;
}

function validateLightCoverage(levelState, level, params) {
  const placement = validateFillTargets(levelState, level, { targets: params.targets || [] });
  const light = computeLightMap(levelState, level, params.radius || null);
  const required = (params.requiredCells || []).map(normalizeCoordinate);
  const missingCells = required.filter((point) => (
    light[cellIndex(point.row, point.column, level.columns)] < (params.minimumLight || 1)
  ));
  return {
    complete: placement.complete && missingCells.length === 0,
    progress: required.length - missingCells.length,
    total: required.length,
    missingCells: placement.complete ? missingCells : placement.missingCells,
    problemCells: [],
    nextSuggestion: placement.nextSuggestion || missingCells[0] || null,
  };
}

function validateLineOfSight(levelState, level, params) {
  const placement = validateFillTargets(levelState, level, { targets: params.targets || [] });
  if (!placement.complete) return placement;
  const targetTerrain = params.targetTerrain;
  const maximumDistance = params.maximumDistance || Math.max(level.rows, level.columns);
  const problemCells = [];
  (params.glowCells || params.targets || []).map(normalizeCoordinate).forEach((source) => {
    let visible = false;
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([rowStep, columnStep]) => {
      for (let distance = 1; distance <= maximumDistance; distance += 1) {
        const row = source.row + rowStep * distance;
        const column = source.column + columnStep * distance;
        const cell = getCell(levelState, row, column, level.columns);
        if (!cell || topBlock(cell) === "stone") break;
        if (cell.terrainId === targetTerrain) {
          visible = true;
          break;
        }
      }
    });
    if (!visible) problemCells.push(source);
  });
  return { ...placement, complete: problemCells.length === 0, problemCells, nextSuggestion: problemCells[0] || null };
}

function validateProtectedLight(levelState, level, params) {
  const glow = normalizeCoordinate(params.glowCell);
  const glowTarget = {
    row: glow.row,
    column: glow.column,
    height: glow.height || 0,
    materialId: "glow",
  };
  return resultFromChecks([
    validateFillTargets(levelState, level, { targets: [glowTarget] }),
    validateFillTargets(levelState, level, { targets: params.glassCells || [] }),
  ]);
}

function validateMaterialZone(levelState, level, params) {
  const targets = (params.zone || params.targets || []).map((target) => ({
    ...normalizeCoordinate(target),
    materialId: params.materialId,
  }));
  return validateFillTargets(levelState, level, { targets });
}

function validateSharedBudget(levelState, level, params) {
  const remaining = Object.values(levelState.inventory).reduce((sum, count) => sum + count, 0);
  const requiredRemaining = params.requiredRemaining || 0;
  return {
    complete: remaining === requiredRemaining,
    progress: remaining === requiredRemaining ? 1 : 0,
    total: 1,
    missingCells: [],
    problemCells: [],
    nextSuggestion: null,
  };
}

const VALIDATORS = {
  "fill-targets": validateFillTargets,
  "match-shape": validateMatchShape,
  "connected-route": validateConnectedRoute,
  "route-width": validateRouteWidth,
  "supported-span": validateSupportedSpan,
  foundation: validateFoundation,
  "stack-pattern": validateStackPattern,
  enclosure: validateEnclosure,
  "guard-edges": validateGuardEdges,
  "keep-clear": validateKeepClear,
  symmetry: validateSymmetry,
  "light-coverage": validateLightCoverage,
  "line-of-sight": validateLineOfSight,
  "protected-light": validateProtectedLight,
  "material-zone": validateMaterialZone,
  "shared-budget": validateSharedBudget,
};

function evaluateRule(levelState, level, validator, params) {
  if (validator === "composite") {
    const checks = (params.validators || []).map((child) => evaluateRule(
      levelState,
      level,
      child.validator,
      { ...child.params, targets: child.params?.targets || [] },
    ));
    if (params.mode === "any") {
      const complete = checks.some((check) => check.complete);
      return { ...resultFromChecks(checks), complete };
    }
    if (params.mode === "count") {
      const required = params.count || checks.length;
      const completeCount = checks.filter((check) => check.complete).length;
      return {
        ...resultFromChecks(checks),
        complete: completeCount >= required,
        progress: completeCount,
        total: required,
      };
    }
    return resultFromChecks(checks);
  }
  const validatorFunction = VALIDATORS[validator];
  return validatorFunction
    ? validatorFunction(levelState, level, params || {})
    : { complete: false, progress: 0, total: 1, missingCells: [], problemCells: [], nextSuggestion: null };
}

function evaluateObjective(levelState, level, objective) {
  return evaluateRule(levelState, level, objective.validator, objective.params);
}

function refreshProgress(state) {
  const level = currentLevel(state);
  const completed = [];
  let changed = true;
  while (changed) {
    changed = false;
    level.objectives.forEach((objective) => {
      if (completed.includes(objective.id)) return;
      if (!objective.dependsOn.every((id) => completed.includes(id))) return;
      if (evaluateObjective(state.currentLevelState, level, objective).complete) {
        completed.push(objective.id);
        changed = true;
      }
    });
  }

  state.currentLevelState.completedObjectiveIds = completed;
  state.currentLevelState.activeObjectiveId = level.objectives
    .find((objective) => !completed.includes(objective.id))?.id || null;
  if (completed.length === level.objectives.length) {
    state.phase = "level-complete";
    if (!state.completedLevelIds.includes(level.id)) state.completedLevelIds.push(level.id);
    state.completed = state.currentLevelIndex === LEVELS.length - 1;
  } else {
    state.phase = "build";
    state.completed = false;
  }
  return completed;
}

function isLevelComplete(level, levelState) {
  return level.objectives.every((objective) => evaluateObjective(levelState, level, objective).complete);
}

function objectiveBuildZone(objective) {
  return objective.params.buildZone || objective.params.targets || [];
}

function coordinateIn(values, row, column) {
  return (values || []).some((value) => samePosition(value, { row, column }));
}

function expectedTarget(objective, row, column, height) {
  return (objective.params.targets || []).find((target) => (
    target.row === row && target.column === column && (target.height || 0) === height
  )) || null;
}

function evaluatePlacement(state, level, blockId, targetIndex) {
  const refusal = (reason, targetHeight = 0) => ({
    allowed: false,
    reason,
    targetHeight,
    consumedBlock: null,
    changedCells: [],
  });
  if (!state || state.phase !== "build" || !BLOCKS[blockId]) return refusal("not-buildable");
  if (!level.availableMaterials.includes(blockId)) return refusal("wrong-material");
  if ((state.currentLevelState.inventory[blockId] || 0) <= 0) return refusal("empty-inventory");

  const cell = state.currentLevelState.cells[targetIndex];
  if (!cell || cell.locked || !TERRAINS[cell.terrainId]?.buildable) return refusal("not-buildable");
  const targetHeight = stackHeight(cell);
  if (targetHeight >= level.maxHeight || targetHeight >= BLOCKS[blockId].maxStackHeight) {
    return refusal("stack-full", targetHeight);
  }

  const position = cellPosition(targetIndex, level.columns);
  const objective = activeObjective(state.currentLevelState, level);
  if (!objective) return refusal("objective-locked", targetHeight);
  if (coordinateIn(objective.params.clearCells, position.row, position.column)) {
    return refusal("must-stay-clear", targetHeight);
  }

  const zone = objectiveBuildZone(objective);
  if (zone.length > 0 && !coordinateIn(zone, position.row, position.column)) {
    return refusal("objective-locked", targetHeight);
  }
  const expected = expectedTarget(objective, position.row, position.column, targetHeight);
  const exactOnly = !objective.params.buildZone;
  if (exactOnly && !expected) return refusal("objective-locked", targetHeight);
  if (expected && expected.materialId !== blockId) return refusal("wrong-material", targetHeight);

  const below = targetHeight > 0 ? cell.stack[targetHeight - 1] : null;
  const terrainSolid = TERRAINS[cell.terrainId]?.solid;
  const foundationAnchor = coordinateIn(level.rules.foundationAnchors, position.row, position.column);

  if (blockId === "stone") {
    if (targetHeight === 0 && !terrainSolid && !foundationAnchor) return refusal("needs-solid-ground", targetHeight);
    if (targetHeight > 0 && below !== "stone") return refusal("needs-stone-support", targetHeight);
  }
  if (blockId === "wood") {
    if (targetHeight === 0 && !terrainSolid && !foundationAnchor && !level.rules.allowWoodOnVoid) {
      return refusal("needs-any-support", targetHeight);
    }
    if (targetHeight > 0 && !BLOCKS[below]?.supportsAbove) return refusal("needs-any-support", targetHeight);
  }
  if (blockId === "glass") {
    const guardAllowed = level.rules.allowGlassGuard && expected;
    if (targetHeight === 0 && !terrainSolid && !guardAllowed) return refusal("needs-any-support", targetHeight);
    if (targetHeight > 0 && !BLOCKS[below]?.supportsAbove) return refusal("needs-any-support", targetHeight);
  }
  if (blockId === "glow") {
    if (targetHeight === 0 && !terrainSolid && !foundationAnchor) return refusal("needs-any-support", targetHeight);
    if (targetHeight > 0 && !BLOCKS[below]?.supportsAbove && below !== "glass") {
      return refusal("needs-any-support", targetHeight);
    }
  }

  return {
    allowed: true,
    reason: null,
    targetHeight,
    consumedBlock: blockId,
    changedCells: [targetIndex, ...orthogonalNeighbors(targetIndex, level.rows, level.columns)],
  };
}

function placeBlock(state, row, column, blockId = state?.selectedMaterialId) {
  if (!state) return false;
  const level = currentLevel(state);
  const index = cellIndex(row, column, level.columns);
  const result = evaluatePlacement(state, level, blockId, index);
  if (!result.allowed) return false;
  state.currentLevelState.cells[index].stack.push(blockId);
  state.currentLevelState.inventory[blockId] -= 1;
  state.selectedHeight = stackHeight(state.currentLevelState.cells[index]);
  refreshProgress(state);
  return true;
}

function removeBlock(state, row, column) {
  if (!state || state.phase !== "build") return false;
  const level = currentLevel(state);
  const cell = getCell(state.currentLevelState, row, column, level.columns);
  if (!cell || cell.stack.length === 0) return false;
  const materialId = cell.stack.pop();
  state.currentLevelState.inventory[materialId] += 1;
  state.selectedHeight = stackHeight(cell);
  refreshProgress(state);
  return true;
}

function advanceLevel(state) {
  if (!state || state.phase !== "level-complete" || state.completed) return false;
  state.currentLevelIndex += 1;
  const level = currentLevel(state);
  state.currentLevelState = createLevelState(level);
  state.selectedMaterialId = level.availableMaterials[0] || null;
  state.selectedCell = null;
  state.selectedHeight = 0;
  state.phase = "build";
  state.completed = false;
  refreshProgress(state);
  return true;
}

function normalizeSavedState(value) {
  if (!value || typeof value !== "object" || value.version !== SAVE_VERSION) return createGameState();
  const index = Math.max(0, Math.min(LEVELS.length - 1, Number(value.currentLevelIndex) || 0));
  const state = createGameState(index);
  const level = currentLevel(state);
  const sourceCells = Array.isArray(value.currentLevelState?.cells) ? value.currentLevelState.cells : [];
  const pending = [];
  sourceCells.slice(0, level.rows * level.columns).forEach((sourceCell, sourceIndex) => {
    if (!Array.isArray(sourceCell?.stack)) return;
    sourceCell.stack.slice(0, level.maxHeight).forEach((materialId, height) => {
      if (BLOCKS[materialId] && level.availableMaterials.includes(materialId)) {
        pending.push({ sourceIndex, materialId, height });
      }
    });
  });

  let progress = true;
  while (pending.length > 0 && progress) {
    progress = false;
    for (let indexValue = pending.length - 1; indexValue >= 0; indexValue -= 1) {
      const item = pending[indexValue];
      const cell = state.currentLevelState.cells[item.sourceIndex];
      if (stackHeight(cell) !== item.height) continue;
      const position = cellPosition(item.sourceIndex, level.columns);
      if (placeBlock(state, position.row, position.column, item.materialId)) {
        pending.splice(indexValue, 1);
        progress = true;
      }
    }
  }

  state.completedLevelIds = LEVELS.slice(0, index).map((item) => item.id);
  state.celebratedLevelIds = Array.isArray(value.celebratedLevelIds)
    ? [...new Set(value.celebratedLevelIds.filter((id) => LEVELS.some((levelValue) => levelValue.id === id)))]
    : [];
  state.selectedMaterialId = level.availableMaterials.includes(value.selectedMaterialId)
    && state.currentLevelState.inventory[value.selectedMaterialId] > 0
    ? value.selectedMaterialId
    : level.availableMaterials.find((id) => state.currentLevelState.inventory[id] > 0)
      || level.availableMaterials[0]
      || null;
  state.selectedCell = null;
  state.migratedFromV1 = Boolean(value.migratedFromV1);
  refreshProgress(state);
  return state;
}

function migrateLegacyState(value) {
  if (!value || typeof value !== "object") return createGameState();
  const oldIndex = Math.max(0, Math.min(4, Number(value.levelIndex) || 0));
  const oldLevelFinished = value.phase === "level-complete" || value.completed === true;
  const migratedIndex = Math.min(5, oldIndex + (oldLevelFinished ? 1 : 0));
  const state = createGameState(migratedIndex);
  state.migratedFromV1 = true;
  return state;
}

function applyKnownSolution(state) {
  const level = currentLevel(state);
  const pending = level.solution.map((target) => ({ ...target }));
  let madeProgress = true;
  while (pending.length > 0 && madeProgress && state.phase === "build") {
    madeProgress = false;
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const target = pending[index];
      const currentCell = getCell(state.currentLevelState, target.row, target.column, level.columns);
      if (stackHeight(currentCell) !== (target.height || 0)) continue;
      if (placeBlock(state, target.row, target.column, target.materialId)) {
        pending.splice(index, 1);
        madeProgress = true;
      }
    }
  }
  refreshProgress(state);
  return { complete: state.phase === "level-complete", pending };
}

function initializeGame() {
  const elements = {
    shell: document.querySelector("#game-shell"),
    goalPanel: document.querySelector(".goal-panel"),
    goal: document.querySelector("#goal-visual"),
    levelNumber: document.querySelector("#level-number"),
    world: document.querySelector("#world"),
    frame: document.querySelector(".world-frame"),
    hero: document.querySelector("#hero"),
    friend: document.querySelector("#friend"),
    celebration: document.querySelector("#celebration"),
    inventory: document.querySelector("#inventory"),
    action: document.querySelector("#action-button"),
    actionIcon: document.querySelector("#action-icon"),
    actionLabel: document.querySelector("#action-label"),
    hint: document.querySelector("#hint-button"),
    sound: document.querySelector("#sound-button"),
    pause: document.querySelector("#pause-button"),
    pauseOverlay: document.querySelector("#pause-overlay"),
    resume: document.querySelector("#resume-button"),
    restart: document.querySelector("#restart-button"),
    levelComplete: document.querySelector("#level-complete"),
    completeLevel: document.querySelector("#complete-level"),
    completeTitle: document.querySelector("#complete-title"),
    completeText: document.querySelector("#complete-text"),
    nextLevel: document.querySelector("#next-level-button"),
    nextLevelLabel: document.querySelector("#next-level-label"),
    status: document.querySelector("#status"),
  };

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = motionQuery.matches;
  let state = loadGame();
  let keyboardPosition = firstUsefulPosition();
  let keyboardActive = false;
  let paused = false;
  let soundEnabled = loadSoundPreference();
  let hintTimers = [];
  let hintClearTimer = null;
  let renderedLevelId = null;

  function loadGame() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return normalizeSavedState(JSON.parse(saved));
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const migrated = migrateLegacyState(JSON.parse(legacy));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return migrated;
      }
    } catch {
      return createGameState();
    }
    return createGameState();
  }

  function saveGame() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The current session remains playable when storage is unavailable.
    }
  }

  function clearSavedGame() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // There is no saved progress to clear when storage is unavailable.
    }
  }

  function loadSoundPreference() {
    try {
      return localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      return true;
    }
  }

  function saveSoundPreference() {
    try {
      localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
    } catch {
      // The preference remains active for this session.
    }
  }

  function announce(message) {
    elements.status.textContent = "";
    window.requestAnimationFrame(() => {
      elements.status.textContent = message;
    });
  }

  function playTone(frequency, delay, duration, wave = "sine") {
    if (!soundEnabled) return;
    window.GameSound?.tone({ frequency, delay, duration, wave, volume: 0.05 });
  }

  function playSound(name, materialId = "wood") {
    const materialBase = { wood: 250, stone: 165, glass: 520, glow: 680 }[materialId] || 250;
    const patterns = {
      select: [[340, 0, 0.07]],
      place: [[materialBase, 0, 0.07, "square"], [materialBase * 1.25, 0.06, 0.1, "triangle"]],
      remove: [[310, 0, 0.07], [220, 0.06, 0.1]],
      hint: [[520, 0, 0.08], [660, 0.1, 0.12]],
      error: [[175, 0, 0.08, "triangle"], [145, 0.07, 0.1, "triangle"]],
      success: [[392, 0, 0.11], [523, 0.1, 0.13], [659, 0.22, 0.18], [784, 0.36, 0.25]],
    };
    (patterns[name] || []).forEach(([frequency, delay, duration, wave]) => {
      playTone(frequency, delay, duration, wave);
    });
  }

  function currentObjectiveResult() {
    const level = currentLevel(state);
    const objective = activeObjective(state.currentLevelState, level);
    return objective ? evaluateObjective(state.currentLevelState, level, objective) : null;
  }

  function firstUsefulPosition() {
    const result = currentObjectiveResult();
    const level = currentLevel(state);
    const suggestion = result?.nextSuggestion || objectiveTargets(level)[0];
    return suggestion
      ? { row: suggestion.row, column: suggestion.column }
      : { row: 0, column: 0 };
  }

  function locationName(level) {
    return LOCATIONS[level.location]?.name || level.location;
  }

  function blueprintMarkup(level, objective) {
    if (level.guidance.blueprint === "none") return "<span class=\"goal-function\" aria-hidden=\"true\">↔</span>";
    const targets = objectiveTargets(level, objective);
    if (targets.length === 0) return "<span class=\"goal-function\" aria-hidden=\"true\">◆</span>";
    const minRow = Math.min(...targets.map((target) => target.row));
    const maxRow = Math.max(...targets.map((target) => target.row));
    const minColumn = Math.min(...targets.map((target) => target.column));
    const maxColumn = Math.max(...targets.map((target) => target.column));
    const rows = maxRow - minRow + 1;
    const columns = maxColumn - minColumn + 1;
    const cellsMarkup = [];
    for (let row = minRow; row <= maxRow; row += 1) {
      for (let column = minColumn; column <= maxColumn; column += 1) {
        const target = targets.find((item) => item.row === row && item.column === column);
        const classes = ["blueprint-cell"];
        if (target) classes.push("is-target", `material--${target.materialId}`);
        if (target && hasMaterialAt(state.currentLevelState, level, target)) classes.push("is-done");
        cellsMarkup.push(`<span class="${classes.join(" ")}"></span>`);
      }
    }
    return `<span class="goal-blueprint" style="--blueprint-columns:${columns};--blueprint-rows:${rows}">${cellsMarkup.join("")}</span>`;
  }

  function renderGoal() {
    const level = currentLevel(state);
    const current = state.currentLevelIndex + 1;
    const active = activeObjective(state.currentLevelState, level);
    const result = active ? evaluateObjective(state.currentLevelState, level, active) : null;
    const objectiveCards = level.objectives.map((objective, index) => {
      const complete = state.currentLevelState.completedObjectiveIds.includes(objective.id);
      const locked = !complete && !objective.dependsOn.every((id) => (
        state.currentLevelState.completedObjectiveIds.includes(id)
      ));
      const selected = active?.id === objective.id;
      const icon = complete ? "✓" : locked ? "▣" : String(index + 1);
      return `<span class="objective-card${complete ? " is-complete" : ""}${locked ? " is-locked" : ""}${selected ? " is-active" : ""}" aria-label="${objective.title}"><b>${icon}</b><span>${locked ? "Next task" : objective.title}</span></span>`;
    }).join("");
    elements.levelNumber.textContent = String(current);
    elements.goalPanel.setAttribute("aria-label", `${level.title}. ${active?.title || "Complete"}.`);
    elements.goal.innerHTML = [
      "<div class=\"goal-copy\">",
      `<span class="level-counter">Chapter ${level.chapter} · ${locationName(level)} · Level ${current} of ${LEVELS.length}</span>`,
      `<strong class="goal-title">${level.title}</strong>`,
      `<span class="goal-instruction">${active?.title || level.rewardText}</span>`,
      `<span class="goal-count">${result ? `${result.progress} of ${result.total}` : "Ready"}</span>`,
      `<span class="objective-list">${objectiveCards}</span>`,
      "</div>",
      blueprintMarkup(level, active),
    ].join("");
  }

  function selectMaterial(materialId) {
    const level = currentLevel(state);
    if (!level.availableMaterials.includes(materialId)) {
      playSound("error");
      announce(`${BLOCKS[materialId].name} is still locked.`);
      return;
    }
    if ((state.currentLevelState.inventory[materialId] || 0) <= 0) {
      playSound("error");
      announce(`No ${BLOCKS[materialId].name.toLowerCase()} blocks remain.`);
      return;
    }
    state.selectedMaterialId = materialId;
    saveGame();
    playSound("select");
    renderInventory();
    renderAction();
    announce(`${BLOCKS[materialId].name} selected.`);
  }

  function renderInventory() {
    const level = currentLevel(state);
    elements.inventory.replaceChildren();
    elements.inventory.setAttribute("aria-label", "Material hotbar");
    MATERIAL_ORDER.forEach((materialId, index) => {
      const available = level.availableMaterials.includes(materialId);
      const count = state.currentLevelState.inventory[materialId] || 0;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `material-slot material-slot--${materialId}`;
      if (state.selectedMaterialId === materialId) button.classList.add("is-selected");
      if (!available) button.classList.add("is-locked");
      if (available && count === 0) button.classList.add("is-empty");
      button.disabled = !available || count === 0 || state.phase !== "build";
      button.dataset.material = materialId;
      button.setAttribute("aria-label", available
        ? `${BLOCKS[materialId].name}, ${count} blocks, shortcut ${index + 1}`
        : `${BLOCKS[materialId].name}, locked`);
      button.innerHTML = [
        `<span class="slot-block material--${materialId}" aria-hidden="true"></span>`,
        `<span class="material-name">${BLOCKS[materialId].name}</span>`,
        `<span class="material-count" aria-hidden="true">${available ? count : "▣"}</span>`,
        `<span class="material-key" aria-hidden="true">${index + 1}</span>`,
      ].join("");
      button.addEventListener("click", () => selectMaterial(materialId));
      elements.inventory.append(button);
    });
  }

  function cellSizeFor(level) {
    const largest = Math.max(level.rows, level.columns);
    const target = largest <= 7 ? 82 : largest <= 9 ? 68 : largest === 10 ? 60 : 54;
    const availableWidth = Math.min(window.innerWidth - 48, 940);
    const fitted = Math.floor((availableWidth - (level.columns - 1) * 4) / level.columns);
    return Math.max(34, Math.min(target, fitted));
  }

  function layoutWorld() {
    const level = currentLevel(state);
    const size = cellSizeFor(level);
    elements.frame.style.setProperty("--columns", String(level.columns));
    elements.frame.style.setProperty("--rows", String(level.rows));
    elements.frame.style.setProperty("--cell-size", `${size}px`);
    elements.frame.style.width = `calc(${size}px * ${level.columns} + var(--cell-gap-x) * ${level.columns - 1})`;
    elements.frame.style.height = `calc(${size}px * ${level.rows} + var(--cell-gap-y) * ${level.rows - 1} + var(--block-depth))`;
    elements.world.style.setProperty("--columns", String(level.columns));
    elements.world.style.setProperty("--rows", String(level.rows));
  }

  function buildWorld() {
    const level = currentLevel(state);
    if (renderedLevelId === level.id && elements.world.children.length === level.rows * level.columns) return;
    renderedLevelId = level.id;
    elements.world.replaceChildren();
    layoutWorld();

    for (let index = 0; index < level.rows * level.columns; index += 1) {
      const tile = document.createElement("button");
      const position = cellPosition(index, level.columns);
      tile.type = "button";
      tile.tabIndex = -1;
      tile.dataset.index = String(index);
      tile.dataset.row = String(position.row);
      tile.dataset.column = String(position.column);
      tile.setAttribute("role", "gridcell");
      tile.style.zIndex = String(position.row + 1);
      tile.innerHTML = "<span class=\"block-depth\" aria-hidden=\"true\"></span><span class=\"cell-content\" aria-hidden=\"true\"></span><span class=\"cell-feedback\" aria-hidden=\"true\"></span>";
      elements.world.append(tile);
    }
  }

  function visibleTargetKeys() {
    const level = currentLevel(state);
    const objective = activeObjective(state.currentLevelState, level);
    if (!objective || level.guidance.fieldTargets === "none") return new Set();
    const missing = evaluateObjective(state.currentLevelState, level, objective).missingCells;
    const values = level.guidance.fieldTargets === "all" ? missing : missing.slice(0, 1);
    return new Set(values.map((target) => cellKey(target.row, target.column)));
  }

  function tileLabel(index) {
    const level = currentLevel(state);
    const position = cellPosition(index, level.columns);
    const cell = state.currentLevelState.cells[index];
    const terrainNames = {
      grass: "Grass", water: "Water", bank: "Bank", snow: "Snow", "thin-ice": "Thin ice",
      rock: "Rock", "canyon-floor": "Canyon floor", gap: "Gap", "night-grass": "Night grass",
      "road-start": "Road start", "road-end": "Road end", protected: "Protected area", blocked: "Blocked area",
    };
    const terrainName = terrainNames[cell.terrainId] || "Cell";
    if (cell.stack.length > 0) {
      const materialName = BLOCKS[topBlock(cell)].name;
      return cell.landmarkId
        ? `${terrainName}, landmark, ${materialName}, height ${cell.stack.length}, row ${position.row + 1}, column ${position.column + 1}`
        : `${terrainName}, ${materialName}, height ${cell.stack.length}, row ${position.row + 1}, column ${position.column + 1}`;
    }
    return cell.landmarkId
      ? `${terrainName}, landmark, empty, row ${position.row + 1}, column ${position.column + 1}`
      : `${terrainName}, empty, row ${position.row + 1}, column ${position.column + 1}`;
  }

  function stackMarkup(cell) {
    return cell.stack.map((materialId, height) => (
      `<span class="cube-block material--${materialId}" style="--stack-level:${height}" aria-hidden="true"></span>`
    )).join("");
  }

  function updateWorld() {
    buildWorld();
    const level = currentLevel(state);
    const targets = visibleTargetKeys();
    const light = level.location === "night" ? computeLightMap(state.currentLevelState, level) : [];
    Array.from(elements.world.children).forEach((tile, index) => {
      const position = cellPosition(index, level.columns);
      const cell = state.currentLevelState.cells[index];
      const selected = state.selectedCell?.row === position.row && state.selectedCell?.column === position.column;
      const classes = ["tile", `terrain--${cell.terrainId}`];
      classes.push(TERRAINS[cell.terrainId]?.solid ? "land" : "water");
      if (targets.has(cellKey(position.row, position.column))) classes.push("is-build-target");
      if (selected) classes.push("is-selected");
      if (keyboardActive && keyboardPosition.row === position.row && keyboardPosition.column === position.column) {
        classes.push("is-keyboard-target");
      }
      if (cell.stack.length > 0) classes.push("has-stack", "can-return");
      if (state.currentLevelState.completedObjectiveIds.length > 0) classes.push("world-progressed");
      if (light[index] > 0) classes.push(light[index] > 1 ? "is-lit" : "is-dim");
      tile.className = classes.join(" ");
      tile.setAttribute("aria-label", tileLabel(index));
      tile.setAttribute("aria-disabled", state.phase === "build" ? "false" : "true");
      tile.querySelector(".cell-content").innerHTML = [
        cell.landmarkId ? `<span class="landmark landmark--${cell.landmarkId}" title="${cell.landmarkId}"></span>` : "",
        stackMarkup(cell),
        targets.has(cellKey(position.row, position.column)) ? "<span class=\"build-target\">+</span>" : "",
      ].join("");
    });
    window.requestAnimationFrame(positionCharacters);
  }

  function positionElementAtCell(element, landmark, fallback) {
    const position = landmark || fallback;
    const index = cellIndex(position.row, position.column, currentLevel(state).columns);
    const tile = elements.world.children[index];
    if (!tile) return;
    element.style.left = `${tile.offsetLeft + (tile.offsetWidth - element.offsetWidth) / 2}px`;
    element.style.top = `${tile.offsetTop + tile.offsetHeight - element.offsetHeight + 2}px`;
  }

  function positionCharacters() {
    const landmarks = currentLevel(state).landmarks;
    positionElementAtCell(elements.hero, landmarks[0], { row: 0, column: 0 });
    const friendLandmark = landmarks[1];
    elements.friend.classList.toggle("is-hidden", !friendLandmark);
    if (friendLandmark) positionElementAtCell(elements.friend, friendLandmark, { row: 0, column: 0 });
    elements.friend.classList.toggle("is-waiting", state.phase === "build" && !reduceMotion);
  }

  const REFUSAL_LABELS = {
    "not-buildable": "This cell cannot be changed.",
    "needs-solid-ground": "Stone needs solid ground.",
    "needs-stone-support": "Stone needs stone below it.",
    "needs-any-support": "This block needs support.",
    "stack-full": "This stack is already full.",
    "wrong-material": "Choose the material shown for this part.",
    "must-stay-clear": "This access cell must stay open.",
    "objective-locked": "Finish the current task first.",
    "needs-glass-protection": "Protect the light with glass.",
    "span-too-long": "Add a closer bridge support.",
    "empty-inventory": "No blocks of this material remain.",
  };

  function currentAction() {
    if (paused || state.phase !== "build" || !state.selectedCell) {
      return { name: "idle", label: "Choose", ariaLabel: "Choose a world cell", enabled: false };
    }
    const level = currentLevel(state);
    const index = cellIndex(state.selectedCell.row, state.selectedCell.column, level.columns);
    const placement = evaluatePlacement(state, level, state.selectedMaterialId, index);
    if (placement.allowed) {
      return {
        name: placement.targetHeight > 0 ? "place-up" : "place",
        label: placement.targetHeight > 0 ? "Place up" : "Place",
        ariaLabel: `Place ${BLOCKS[state.selectedMaterialId].name} here`,
        enabled: true,
        placement,
      };
    }
    if (state.currentLevelState.cells[index].stack.length > 0) {
      return { name: "remove", label: "Take", ariaLabel: "Take the top block back", enabled: true, placement };
    }
    return { name: "check", label: "Check", ariaLabel: REFUSAL_LABELS[placement.reason], enabled: true, placement };
  }

  function renderAction() {
    const action = currentAction();
    elements.action.disabled = !action.enabled;
    elements.action.setAttribute("aria-label", action.ariaLabel);
    elements.actionIcon.className = `action-icon action-icon--${action.name}`;
    elements.actionLabel.textContent = action.label;
  }

  function renderSound() {
    elements.sound.classList.toggle("is-muted", !soundEnabled);
    elements.sound.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  }

  function renderCompletion() {
    const complete = state.phase === "level-complete";
    elements.levelComplete.hidden = !complete;
    elements.celebration.classList.toggle("is-visible", complete);
    if (!complete) return;
    const level = currentLevel(state);
    if (state.completed) {
      elements.levelComplete.setAttribute("aria-label", "All levels complete");
      elements.completeLevel.textContent = `All ${LEVELS.length} levels complete`;
      elements.completeTitle.textContent = "Island town complete!";
      elements.completeText.textContent = "Every route, shelter, and light is ready.";
      elements.nextLevelLabel.textContent = "Play again";
      return;
    }
    elements.levelComplete.setAttribute("aria-label", `Level ${state.currentLevelIndex + 1} complete`);
    elements.completeLevel.textContent = `Level ${state.currentLevelIndex + 1} complete`;
    elements.completeTitle.textContent = level.completionTitle;
    elements.completeText.textContent = level.rewardText;
    elements.nextLevelLabel.textContent = "Next level";
  }

  function render() {
    const level = currentLevel(state);
    elements.shell.dataset.level = level.location;
    elements.shell.dataset.chapter = String(level.chapter);
    renderGoal();
    updateWorld();
    renderInventory();
    renderAction();
    renderSound();
    renderCompletion();
  }

  function clearHint() {
    window.clearTimeout(hintClearTimer);
    document.querySelectorAll(".is-hint, .is-strong-hint").forEach((element) => {
      element.classList.remove("is-hint", "is-strong-hint");
    });
  }

  function clearHintTimers() {
    hintTimers.forEach((timer) => window.clearTimeout(timer));
    hintTimers = [];
  }

  function hintCell() {
    const suggestion = currentObjectiveResult()?.nextSuggestion;
    if (!suggestion) return null;
    return elements.world.querySelector(`[data-row="${suggestion.row}"][data-column="${suggestion.column}"]`);
  }

  function showHint(strength = 2, withSound = true) {
    clearHint();
    const target = currentAction().enabled && currentAction().name !== "check" ? elements.action : hintCell();
    if (!target) return;
    target.classList.add("is-hint");
    if (strength > 1) target.classList.add("is-strong-hint");
    if (withSound) playSound("hint");
    announce("The next useful place is highlighted.");
    hintClearTimer = window.setTimeout(clearHint, 5000);
  }

  function restartHintTimers() {
    clearHintTimers();
    if (paused || state.phase !== "build") return;
    const delay = currentLevel(state).guidance.autoHintDelay || 8000;
    hintTimers.push(window.setTimeout(() => showHint(1, false), delay));
    hintTimers.push(window.setTimeout(() => showHint(2, false), delay * 2));
  }

  function showRefusal(row, column, reason) {
    const tile = elements.world.querySelector(`[data-row="${row}"][data-column="${column}"]`);
    if (tile) {
      tile.dataset.refusal = reason;
      tile.classList.add("is-refused");
      window.setTimeout(() => {
        tile.classList.remove("is-refused");
        delete tile.dataset.refusal;
      }, reduceMotion ? 900 : 1500);
    }
    playSound("error");
    announce(`${REFUSAL_LABELS[reason] || "Try another place."} Nothing was lost.`);
  }

  function chooseCell(row, column) {
    if (paused || state.phase !== "build") return;
    clearHint();
    state.selectedCell = { row, column };
    state.selectedHeight = stackHeight(getCell(state.currentLevelState, row, column, currentLevel(state).columns));
    playSound("select");
    updateWorld();
    renderAction();
    announce(tileLabel(cellIndex(row, column, currentLevel(state).columns)));
    restartHintTimers();
  }

  function finishLevel() {
    clearHintTimers();
    state.selectedCell = null;
    saveGame();
    playSound("success");
    render();
    announce(state.completed ? "All levels complete." : `${currentLevel(state).rewardText} Choose the next level.`);
    window.requestAnimationFrame(() => elements.nextLevel.focus());
  }

  function performAction() {
    const action = currentAction();
    if (!action.enabled || !state.selectedCell) return;
    clearHint();
    const { row, column } = state.selectedCell;
    if (action.name === "place" || action.name === "place-up") {
      const materialId = state.selectedMaterialId;
      if (!placeBlock(state, row, column, materialId)) {
        showRefusal(row, column, action.placement.reason);
        return;
      }
      state.selectedCell = null;
      playSound("place", materialId);
      if (state.phase === "level-complete") {
        finishLevel();
        return;
      }
      announce(`${BLOCKS[materialId].name} placed.`);
    } else if (action.name === "remove") {
      const materialId = topBlock(getCell(state.currentLevelState, row, column, currentLevel(state).columns));
      if (!removeBlock(state, row, column)) return;
      state.selectedCell = null;
      playSound("remove", materialId);
      announce(`${BLOCKS[materialId].name} returned to the hotbar.`);
    } else {
      showRefusal(row, column, action.placement.reason);
      return;
    }
    saveGame();
    render();
    restartHintTimers();
  }

  function openNextLevel() {
    if (state.completed) {
      restartGame();
      return;
    }
    if (!advanceLevel(state)) return;
    renderedLevelId = null;
    keyboardPosition = firstUsefulPosition();
    keyboardActive = false;
    saveGame();
    render();
    restartHintTimers();
    announce(`${currentLevel(state).title}. ${activeObjective(state.currentLevelState, currentLevel(state))?.title}.`);
    elements.world.focus();
  }

  function setPaused(value) {
    paused = value;
    elements.pauseOverlay.hidden = !paused;
    elements.shell.inert = paused;
    if (paused) {
      clearHint();
      clearHintTimers();
      elements.resume.focus();
      announce("Game paused.");
    } else {
      elements.pause.focus();
      restartHintTimers();
      announce("Game resumed.");
    }
    renderAction();
  }

  function restartGame() {
    state = createGameState();
    renderedLevelId = null;
    keyboardPosition = firstUsefulPosition();
    keyboardActive = false;
    clearSavedGame();
    if (paused) setPaused(false);
    render();
    restartHintTimers();
    announce("Level 1 is ready. Build the bunny bridge.");
    elements.world.focus();
  }

  function moveKeyboardCursor(rowDelta, columnDelta) {
    const level = currentLevel(state);
    keyboardPosition = {
      row: Math.max(0, Math.min(level.rows - 1, keyboardPosition.row + rowDelta)),
      column: Math.max(0, Math.min(level.columns - 1, keyboardPosition.column + columnDelta)),
    };
    keyboardActive = true;
    updateWorld();
    announce(tileLabel(cellIndex(keyboardPosition.row, keyboardPosition.column, level.columns)));
  }

  elements.world.addEventListener("pointerdown", () => {
    keyboardActive = false;
  });
  elements.world.addEventListener("click", (event) => {
    const tile = event.target.closest(".tile");
    if (!tile) return;
    const row = Number(tile.dataset.row);
    const column = Number(tile.dataset.column);
    keyboardPosition = { row, column };
    chooseCell(row, column);
  });
  elements.world.addEventListener("focus", () => {
    keyboardActive = true;
    updateWorld();
  });
  elements.world.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const directions = {
      arrowup: [-1, 0], w: [-1, 0], arrowdown: [1, 0], s: [1, 0],
      arrowleft: [0, -1], a: [0, -1], arrowright: [0, 1], d: [0, 1],
    };
    if (directions[key]) {
      event.preventDefault();
      moveKeyboardCursor(...directions[key]);
    } else if (key === "enter") {
      event.preventDefault();
      chooseCell(keyboardPosition.row, keyboardPosition.column);
    } else if (key === " ") {
      event.preventDefault();
      performAction();
    } else if (/^[1-4]$/.test(key)) {
      event.preventDefault();
      selectMaterial(MATERIAL_ORDER[Number(key) - 1]);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (/^[1-4]$/.test(event.key) && document.activeElement !== elements.world) {
      selectMaterial(MATERIAL_ORDER[Number(event.key) - 1]);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setPaused(!paused);
    }
  });
  elements.action.addEventListener("click", performAction);
  elements.nextLevel.addEventListener("click", openNextLevel);
  elements.hint.addEventListener("click", () => showHint(2));
  elements.sound.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    saveSoundPreference();
    renderSound();
    if (soundEnabled) playSound("select");
  });
  elements.pause.addEventListener("click", () => setPaused(true));
  elements.resume.addEventListener("click", () => setPaused(false));
  elements.restart.addEventListener("click", restartGame);
  window.addEventListener("resize", () => window.requestAnimationFrame(() => {
    layoutWorld();
    positionCharacters();
  }));
  motionQuery.addEventListener("change", (event) => {
    reduceMotion = event.matches;
    positionCharacters();
  });
  window.GameLanguage?.onChange(() => render());

  refreshProgress(state);
  render();
  restartHintTimers();
  announce(`${currentLevel(state).title}. ${activeObjective(state.currentLevelState, currentLevel(state))?.title || "Complete"}.`);
  if (state.phase === "level-complete") window.requestAnimationFrame(() => elements.nextLevel.focus());
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SAVE_VERSION,
    STORAGE_KEY,
    LEGACY_STORAGE_KEY,
    BLOCKS,
    TERRAINS,
    TERRAIN_LEGEND,
    LOCATIONS,
    LEVELS,
    VALIDATORS,
    cellKey,
    cellIndex,
    cellPosition,
    orthogonalNeighbors,
    allNeighbors,
    parseTerrain,
    createLevelState,
    createGameState,
    currentLevel,
    getCell,
    topBlock,
    stackHeight,
    objectiveTargets,
    targetAt,
    isTargetCell,
    activeObjective,
    validateFillTargets,
    evaluateRule,
    evaluateObjective,
    computeLightMap,
    refreshProgress,
    isLevelComplete,
    evaluatePlacement,
    placeBlock,
    removeBlock,
    advanceLevel,
    normalizeSavedState,
    migrateLegacyState,
    applyKnownSolution,
  };
}

if (typeof document !== "undefined") initializeGame();
