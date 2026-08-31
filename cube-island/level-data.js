(function initializeCubeIslandData(root) {
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  const BLOCKS = {
    wood: {
      id: "wood", name: "Wood", iconClass: "wood", maxStackHeight: 3,
      walkable: true, supportsAbove: true, lightTransmission: 0.5, lightRadius: 0, soundId: "wood",
    },
    stone: {
      id: "stone", name: "Stone", iconClass: "stone", maxStackHeight: 3,
      walkable: true, supportsAbove: true, lightTransmission: 0, lightRadius: 0, soundId: "stone",
    },
    glass: {
      id: "glass", name: "Glass", iconClass: "glass", maxStackHeight: 3,
      walkable: false, supportsAbove: false, lightTransmission: 1, lightRadius: 0, soundId: "glass",
    },
    glow: {
      id: "glow", name: "Glow cube", iconClass: "glow", maxStackHeight: 3,
      walkable: true, supportsAbove: true, lightTransmission: 1, lightRadius: 2, soundId: "glow",
    },
  };

  const TERRAINS = {
    grass: { id: "grass", solid: true, buildable: true },
    water: { id: "water", solid: false, buildable: true },
    bank: { id: "bank", solid: true, buildable: true },
    snow: { id: "snow", solid: true, buildable: true },
    "thin-ice": { id: "thin-ice", solid: false, buildable: true },
    rock: { id: "rock", solid: true, buildable: true },
    "canyon-floor": { id: "canyon-floor", solid: true, buildable: true },
    gap: { id: "gap", solid: false, buildable: true },
    "night-grass": { id: "night-grass", solid: true, buildable: true },
    "road-start": { id: "road-start", solid: true, buildable: true },
    "road-end": { id: "road-end", solid: true, buildable: true },
    protected: { id: "protected", solid: true, buildable: false },
    blocked: { id: "blocked", solid: true, buildable: false },
  };

  const TERRAIN_LEGEND = {
    G: "grass", W: "water", B: "bank", S: "snow", I: "thin-ice", R: "rock",
    C: "canyon-floor", X: "gap", N: "night-grass", A: "road-start", E: "road-end",
    P: "protected", O: "blocked",
  };

  const LOCATIONS = {
    river: { id: "river", name: "River", themeClass: "river", icon: "≈" },
    snow: { id: "snow", name: "Snow", themeClass: "snow", icon: "✦" },
    canyon: { id: "canyon", name: "Canyon", themeClass: "canyon", icon: "▰" },
    night: { id: "night", name: "Night Island", themeClass: "night", icon: "◆" },
  };

  function cell(row, column, materialId = "wood", height = 0) {
    return { row, column, materialId, height };
  }

  function cells(values, materialId = "wood", height = 0) {
    return values.map(([row, column]) => cell(row, column, materialId, height));
  }

  function rectangle(top, left, height, width, materialId = "stone", layer = 0) {
    const result = [];
    for (let row = top; row < top + height; row += 1) {
      for (let column = left; column < left + width; column += 1) {
        result.push(cell(row, column, materialId, layer));
      }
    }
    return result;
  }

  function rowCells(row, from, to, materialId = "wood", height = 0) {
    return cells(Array.from({ length: to - from + 1 }, (_, index) => [row, from + index]), materialId, height);
  }

  function objective(id, title, validator, targets, params = {}, dependsOn = []) {
    return {
      id,
      title,
      icon: validator,
      validator,
      params: { ...params, targets },
      dependsOn,
      completionEffect: id,
    };
  }

  function terrain(rows, columns, base, overlays = []) {
    const grid = Array.from({ length: rows }, () => Array(columns).fill(base));
    overlays.forEach(({ char, cells: overlayCells }) => {
      overlayCells.forEach(([row, column]) => {
        if (grid[row]?.[column] !== undefined) grid[row][column] = char;
      });
    });
    return grid.map((terrainRow) => terrainRow.join(""));
  }

  function verticalBand(rows, from, to) {
    const result = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = from; column <= to; column += 1) result.push([row, column]);
    }
    return result;
  }

  function inventoryFor(objectives, spare = {}) {
    const inventory = { wood: 0, stone: 0, glass: 0, glow: 0, ...spare };
    const seen = new Set();
    objectives.forEach((item) => item.params.targets.forEach((target) => {
      const key = `${target.row}:${target.column}:${target.height}`;
      if (seen.has(key)) return;
      seen.add(key);
      inventory[target.materialId] += 1;
    }));
    return inventory;
  }

  function makeLevel(config) {
    const solution = [];
    const seen = new Set();
    config.objectives.forEach((item) => item.params.targets.forEach((target) => {
      const key = `${target.row}:${target.column}:${target.height}`;
      if (seen.has(key)) return;
      seen.add(key);
      solution.push({ ...target });
    }));
    solution.sort((a, b) => a.height - b.height);

    return {
      id: config.id,
      chapter: config.chapter,
      order: config.order,
      location: config.location,
      title: config.title,
      story: config.story,
      completionTitle: config.completionTitle || `${config.title} complete!`,
      completionText: config.completionText || config.rewardText,
      rows: config.rows,
      columns: config.columns,
      maxHeight: config.maxHeight || 1,
      terrain: config.terrain,
      landmarks: config.landmarks || [],
      initialBlocks: config.initialBlocks || [],
      inventory: config.inventory || inventoryFor(config.objectives),
      availableMaterials: config.materials,
      guidance: {
        fieldTargets: config.fieldTargets || "next",
        blueprint: config.blueprint || "partial",
        autoHintDelay: 8000,
      },
      rules: {
        allowWoodOnVoid: false,
        maxWoodSpan: 1,
        foundationAnchors: [],
        allowGlassGuard: false,
        ...config.rules,
      },
      objectives: config.objectives,
      reward: config.reward,
      rewardText: config.rewardText,
      complication: config.complication,
      solution,
    };
  }

  const levels = [];
  function add(config) {
    levels.push(makeLevel(config));
  }

  const riverLandmarks = (rows, columns, rightId = "friend") => [
    { id: "home", row: Math.floor(rows / 2), column: 1 },
    { id: rightId, row: Math.floor(rows / 2), column: columns - 2 },
  ];

  let targets;
  let objectives;

  targets = rowCells(1, 2, 4);
  objectives = [objective("bridge", "Build one bridge", "fill-targets", targets)];
  add({
    id: "river-01-bunny-bridge", chapter: 1, order: 1, location: "river",
    title: "Bunny Bridge", story: "Build a bridge for the bunny.", rows: 3, columns: 7,
    terrain: terrain(3, 7, "G", [{ char: "W", cells: verticalBand(3, 2, 4) }]),
    landmarks: riverLandmarks(3, 7), materials: ["wood"], objectives,
    fieldTargets: "all", blueprint: "full", rules: { allowWoodOnVoid: true, maxWoodSpan: 3 },
    reward: "friend-crosses", rewardText: "The bunny crosses safely.",
    complication: "Full field targets and a safe first placement",
  });

  targets = [...rowCells(1, 2, 4), cell(2, 4)];
  objectives = [objective("dock", "Build one fishing dock", "match-shape", targets, { allowTranslation: false })];
  add({
    id: "river-02-fishing-dock", chapter: 1, order: 2, location: "river",
    title: "Fishing Dock", story: "Build a dock for the boat.", rows: 4, columns: 7,
    terrain: terrain(4, 7, "G", [{ char: "W", cells: verticalBand(4, 2, 4) }]),
    landmarks: riverLandmarks(4, 7, "boat"), materials: ["wood"], objectives,
    fieldTargets: "none", blueprint: "full", rules: { allowWoodOnVoid: true, maxWoodSpan: 3 },
    reward: "boat-docks", rewardText: "The fishing boat has a safe stop.",
    complication: "The plan is shown only in the blueprint",
  });

  targets = rectangle(1, 3, 2, 3, "wood");
  objectives = [objective("raft", "Build one supply raft", "composite", targets, {
    mode: "all",
    validators: [
      { validator: "match-shape", params: { targets } },
      { validator: "shared-budget", params: { requiredRemaining: 0 } },
    ],
  })];
  add({
    id: "river-03-supply-raft", chapter: 1, order: 3, location: "river",
    title: "Supply Raft", story: "Build a raft for the supply box.", rows: 4, columns: 8,
    terrain: terrain(4, 8, "G", [{ char: "W", cells: verticalBand(4, 2, 5) }]),
    landmarks: riverLandmarks(4, 8, "supplies"), materials: ["wood"], objectives,
    fieldTargets: "none", blueprint: "full", rules: { allowWoodOnVoid: true, maxWoodSpan: 4 },
    reward: "raft-sails", rewardText: "The supplies can travel across the river.",
    complication: "The inventory has no spare block",
  });

  targets = rowCells(2, 2, 5);
  const pathZone4 = [...rowCells(1, 2, 5), ...rowCells(2, 2, 5), ...rowCells(3, 2, 5)];
  objectives = [objective("mill-path", "Connect the bank to the mill", "connected-route", targets, {
    startCells: [[1, 2], [2, 2], [3, 2]], endCells: [[1, 5], [2, 5], [3, 5]], buildZone: pathZone4,
  })];
  add({
    id: "river-04-mill-path", chapter: 1, order: 4, location: "river",
    title: "Mill Path", story: "Make any safe path to the mill.", rows: 5, columns: 8,
    terrain: terrain(5, 8, "G", [{ char: "W", cells: verticalBand(5, 2, 5) }]),
    landmarks: riverLandmarks(5, 8, "mill"), materials: ["wood"], objectives,
    inventory: { wood: 4 }, fieldTargets: "none", blueprint: "none",
    rules: { allowWoodOnVoid: true, maxWoodSpan: 4 }, reward: "mill-turns",
    rewardText: "The mill receives its supplies.", complication: "Several routes are correct",
  });

  const repair = rowCells(2, 2, 6);
  const platform = cells([[1, 5], [1, 6]], "wood");
  objectives = [
    objective("repair", "Repair the flood bridge", "connected-route", repair, {
      startCells: [[2, 2]], endCells: [[2, 6]], buildZone: repair,
    }),
    objective("boat-platform", "Add a boat platform", "fill-targets", platform, {}, ["repair"]),
  ];
  add({
    id: "river-05-flood-repair", chapter: 1, order: 5, location: "river",
    title: "Flood Repair", story: "Repair the crossing, then add a boat platform.", rows: 5, columns: 9,
    terrain: terrain(5, 9, "G", [{ char: "W", cells: verticalBand(5, 2, 6) }]),
    landmarks: riverLandmarks(5, 9, "boat"), materials: ["wood"], objectives,
    fieldTargets: "next", blueprint: "partial", rules: { allowWoodOnVoid: true, maxWoodSpan: 5 },
    reward: "flood-route-opens", rewardText: "The crossing and boat stop are open.",
    complication: "Existing work and two ordered tasks",
  });

  targets = rowCells(2, 1, 6, "stone");
  objectives = [objective("ice-path", "Build a safe stone path", "connected-route", targets, {
    startCells: [[2, 1]], endCells: [[2, 6]], buildZone: [...rowCells(1, 1, 6, "stone"), ...targets],
  })];
  add({
    id: "snow-06-ice-path", chapter: 2, order: 6, location: "snow",
    title: "Ice Path", story: "Build a firm path across the snow.", rows: 5, columns: 8,
    terrain: terrain(5, 8, "S", [{ char: "I", cells: [[0, 3], [0, 4]] }]),
    landmarks: [{ id: "camp", row: 2, column: 0 }, { id: "cabin", row: 2, column: 7 }],
    materials: ["stone"], objectives, fieldTargets: "next", blueprint: "partial",
    reward: "warm-window", rewardText: "The cabin has a safe path.",
    complication: "Stone needs solid ground",
  });

  const screenBase = rowCells(3, 2, 5, "stone");
  const screenGlass = rowCells(3, 2, 5, "glass", 1);
  targets = [...screenBase, ...screenGlass];
  objectives = [objective("wind-screen", "Build a wind screen", "composite", targets, {
    mode: "all",
    validators: [
      { validator: "foundation", params: { targets: screenBase, materialId: "stone" } },
      { validator: "fill-targets", params: { targets: screenGlass } },
    ],
  })];
  add({
    id: "snow-07-wind-screen", chapter: 2, order: 7, location: "snow",
    title: "Wind Screen", story: "Build a stone base and a glass screen.", rows: 5, columns: 8,
    terrain: terrain(5, 8, "S"), landmarks: [{ id: "camp", row: 2, column: 3 }],
    materials: ["stone", "glass"], maxHeight: 2, objectives, fieldTargets: "all", blueprint: "full",
    reward: "camp-calms", rewardText: "The campsite is sheltered from the wind.",
    complication: "Choose between two materials",
  });

  const houseBase = rectangle(3, 2, 1, 5, "stone");
  const window = cells([[3, 3], [3, 4], [3, 5]], "glass", 1);
  objectives = [
    objective("house-base", "Build the house base", "foundation", houseBase, { materialId: "stone" }),
    objective("house-window", "Add the window", "fill-targets", window, {}, ["house-base"]),
  ];
  add({
    id: "snow-08-snow-house", chapter: 2, order: 8, location: "snow",
    title: "Snow House", story: "Build a base, then add a window.", rows: 6, columns: 9,
    terrain: terrain(6, 9, "S"), landmarks: [{ id: "family", row: 2, column: 4 }],
    materials: ["stone", "glass"], maxHeight: 2, objectives,
    reward: "house-warms", rewardText: "The family has a warm snow house.",
    complication: "The second task unlocks after the first",
  });

  const greenhouseBase = rowCells(4, 2, 6, "stone");
  const greenhouseWalls = cells([[3, 2], [3, 3], [3, 5], [3, 6]], "glass");
  const greenhouseClear = [cell(3, 4, "glass")];
  objectives = [
    objective("greenhouse-base", "Build the greenhouse base", "foundation", greenhouseBase, { materialId: "stone" }),
    objective("greenhouse-walls", "Mirror the glass walls", "symmetry", greenhouseWalls, { axisColumn: 4 }, ["greenhouse-base"]),
    objective("greenhouse-door", "Keep the entrance open", "keep-clear", [], { clearCells: greenhouseClear }, ["greenhouse-walls"]),
  ];
  add({
    id: "snow-09-greenhouse", chapter: 2, order: 9, location: "snow",
    title: "Greenhouse", story: "Build a balanced greenhouse with an open door.", rows: 6, columns: 9,
    terrain: terrain(6, 9, "S"), landmarks: [{ id: "entrance", row: 3, column: 4 }],
    materials: ["stone", "glass"], objectives, fieldTargets: "next", blueprint: "partial",
    reward: "plants-grow", rewardText: "The winter plants begin to grow.",
    complication: "Copy one half and preserve the entrance",
  });

  const snowWall = rowCells(1, 2, 7, "stone");
  const safePassage = rowCells(4, 1, 8, "stone");
  objectives = [
    objective("snow-wall", "Build a strong snow wall", "material-zone", snowWall, { materialId: "stone", zone: snowWall }),
    objective("safe-passage", "Build a safe passage", "connected-route", safePassage, {
      startCells: [[4, 1]], endCells: [[4, 8]], buildZone: safePassage, maxHeightDifference: 1,
    }, ["snow-wall"]),
  ];
  add({
    id: "snow-10-snow-safety", chapter: 2, order: 10, location: "snow",
    title: "Snow Safety", story: "Stop the drift and make a safe passage.", rows: 6, columns: 10,
    terrain: terrain(6, 10, "S"), landmarks: [{ id: "gate", row: 4, column: 0 }, { id: "school", row: 4, column: 9 }],
    materials: ["stone"], maxHeight: 2, objectives, reward: "safe-passage-opens",
    rewardText: "Everyone can walk through the snow safely.",
    complication: "Neighboring path heights stay close",
  });

  const yard = rectangle(3, 2, 2, 3, "stone");
  const wellClear = cells([[2, 3], [2, 4], [2, 5], [3, 5]], "stone");
  objectives = [objective("well-yard", "Build a service platform", "composite", yard, {
    mode: "all",
    validators: [
      { validator: "fill-targets", params: { targets: yard } },
      { validator: "keep-clear", params: { clearCells: wellClear } },
    ],
  })];
  add({
    id: "canyon-11-well-yard", chapter: 3, order: 11, location: "canyon",
    title: "Well Yard", story: "Build a platform without blocking the well.", rows: 6, columns: 9,
    terrain: terrain(6, 9, "C", [{ char: "P", cells: [[2, 4]] }]),
    landmarks: [{ id: "well", row: 2, column: 4 }, { id: "access", row: 3, column: 5 }],
    materials: ["stone"], objectives, reward: "well-opens", rewardText: "The well cart can reach the platform.",
    complication: "The well and access lane must stay clear",
  });

  const supports = cells([[3, 3], [3, 6]], "stone");
  const deck = [
    cell(3, 2, "wood"), cell(3, 3, "wood", 1), cell(3, 4, "wood"),
    cell(3, 5, "wood"), cell(3, 6, "wood", 1), cell(3, 7, "wood"),
  ];
  objectives = [
    objective("bridge-supports", "Build two bridge supports", "foundation", supports, { materialId: "stone" }),
    objective("bridge-deck", "Add the wooden bridge deck", "supported-span", deck, {
      supportCells: supports, maxUnsupportedRun: 2,
    }, ["bridge-supports"]),
  ];
  add({
    id: "canyon-12-high-bridge", chapter: 3, order: 12, location: "canyon",
    title: "High Bridge", story: "Build supports, then add the high deck.", rows: 6, columns: 10,
    terrain: terrain(6, 10, "C", [{ char: "X", cells: verticalBand(6, 2, 7) }]),
    landmarks: [{ id: "west", row: 3, column: 1 }, { id: "east", row: 3, column: 8 }],
    materials: ["stone", "wood"], maxHeight: 2, objectives,
    rules: { allowWoodOnVoid: true, foundationAnchors: [[3, 3], [3, 6]], maxWoodSpan: 2 },
    reward: "cart-crosses", rewardText: "The canyon cart crosses the bridge.",
    complication: "Wood spans need stone supports",
  });

  const lookoutBase = rectangle(4, 3, 2, 4, "stone");
  const rails = rowCells(3, 3, 6, "glass");
  objectives = [
    objective("lookout-platform", "Build the lookout platform", "foundation", lookoutBase, { materialId: "stone" }),
    objective("lookout-rails", "Guard the exposed edge", "guard-edges", rails, { platformCells: lookoutBase, guardCells: rails }, ["lookout-platform"]),
  ];
  add({
    id: "canyon-13-lookout", chapter: 3, order: 13, location: "canyon",
    title: "Lookout", story: "Build a platform with a glass safety edge.", rows: 7, columns: 10,
    terrain: terrain(7, 10, "C", [{ char: "X", cells: verticalBand(2, 0, 9) }]),
    landmarks: [{ id: "view", row: 2, column: 5 }], materials: ["stone", "glass"], objectives,
    rules: { allowGlassGuard: true }, reward: "lookout-opens",
    rewardText: "The lookout is open and safe.", complication: "Every exposed edge needs glass",
  });

  const roadRows = [...rowCells(3, 1, 8, "stone"), ...rowCells(4, 1, 8, "stone")];
  objectives = [
    objective("mine-road", "Repair the wide mine road", "route-width", roadRows, {
      startColumns: [1], endColumns: [8], minimumWidth: 2, rows: [3, 4], buildZone: roadRows,
    }),
    objective("depot-link", "Connect the depot", "connected-route", rowCells(5, 6, 8, "stone"), {
      startCells: [[5, 6]], endCells: [[5, 8]], buildZone: rowCells(5, 6, 8, "stone"),
    }, ["mine-road"]),
  ];
  add({
    id: "canyon-14-mine-road", chapter: 3, order: 14, location: "canyon",
    title: "Mine Road", story: "Repair a road wide enough for the mine cart.", rows: 7, columns: 10,
    terrain: terrain(7, 10, "C"), landmarks: [{ id: "mine", row: 3, column: 0 }, { id: "depot", row: 5, column: 9 }],
    materials: ["stone"], objectives, reward: "mine-cart-rolls",
    rewardText: "The mine cart reaches the depot.", complication: "The main road must be two cells wide",
  });

  const rescueBridge = rowCells(3, 2, 5, "wood");
  const shelter = [...rowCells(5, 6, 8, "stone"), ...rowCells(4, 6, 8, "glass")];
  const cargo = rectangle(5, 2, 2, 2, "stone");
  objectives = [
    objective("rescue-bridge", "Build the rescue bridge", "supported-span", rescueBridge, { maxUnsupportedRun: 4 }),
    objective("rescue-shelter", "Build the rescue shelter", "composite", shelter, {
      mode: "all", validators: [
        { validator: "foundation", params: { targets: rowCells(5, 6, 8, "stone"), materialId: "stone" } },
        { validator: "fill-targets", params: { targets: rowCells(4, 6, 8, "glass") } },
      ],
    }, ["rescue-bridge"]),
    objective("cargo-pad", "Build the cargo pad", "composite", cargo, {
      mode: "all", validators: [
        { validator: "fill-targets", params: { targets: cargo } },
        { validator: "shared-budget", params: { requiredRemaining: 0 } },
      ],
    }, ["rescue-shelter"]),
  ];
  add({
    id: "canyon-15-rescue-station", chapter: 3, order: 15, location: "canyon",
    title: "Rescue Station", story: "Build a bridge, shelter, and cargo pad.", rows: 7, columns: 11,
    terrain: terrain(7, 11, "C", [{ char: "X", cells: verticalBand(5, 2, 5) }]),
    landmarks: [{ id: "station", row: 5, column: 9 }, { id: "cargo", row: 6, column: 1 }],
    materials: ["stone", "wood", "glass"], objectives, rules: { allowWoodOnVoid: true, maxWoodSpan: 4 },
    reward: "rescue-station-opens", rewardText: "The rescue station is ready for work.",
    complication: "Three tasks share one exact inventory",
  });

  targets = cells([[2, 2], [2, 5], [3, 7]], "glow");
  objectives = [objective("light-path", "Light the path to the house", "light-coverage", targets, {
    requiredCells: rowCells(2, 1, 7, "glow"), minimumLight: 1, radius: 2,
  })];
  add({
    id: "night-16-light-path", chapter: 4, order: 16, location: "night",
    title: "Light Path", story: "Place glow cubes along the path.", rows: 6, columns: 9,
    terrain: terrain(6, 9, "N"), landmarks: [{ id: "start", row: 2, column: 0 }, { id: "house", row: 2, column: 8 }],
    materials: ["glow"], objectives, reward: "path-lights", rewardText: "The path to the house is bright.",
    complication: "Light reveals nearby cells",
  });

  const shelterBase = rowCells(4, 2, 6, "stone");
  const lightCore = [cell(3, 4, "glow")];
  const lightGlass = cells([[2, 4], [3, 3], [3, 5]], "glass");
  objectives = [
    objective("night-shelter", "Build a night shelter", "enclosure", [...shelterBase, ...lightGlass], {
      protectedCells: lightCore, wallCells: lightGlass, doorGaps: [[4, 4]],
    }),
    objective("protected-lamp", "Protect the glow cube", "protected-light", [...lightCore], {
      glowCell: [3, 4], glassCells: lightGlass,
    }, ["night-shelter"]),
  ];
  add({
    id: "night-17-night-stop", chapter: 4, order: 17, location: "night",
    title: "Night Stop", story: "Build a shelter and protect its light.", rows: 6, columns: 9,
    terrain: terrain(6, 9, "N"), landmarks: [{ id: "stop", row: 3, column: 4 }],
    materials: ["stone", "glass", "glow"], objectives, reward: "stop-glows",
    rewardText: "Travelers have a bright sheltered stop.", complication: "Glow must be protected by glass",
  });

  const nightDock = rowCells(4, 2, 6, "wood");
  const signals = cells([[3, 6], [5, 6]], "glow");
  objectives = [
    objective("harbor-dock", "Repair the harbor dock", "connected-route", nightDock, {
      startCells: [[4, 2]], endCells: [[4, 6]], buildZone: nightDock,
    }),
    objective("harbor-signals", "Add two harbor signals", "line-of-sight", signals, {
      glowCells: signals, targetTerrain: "water", maximumDistance: 3,
    }, ["harbor-dock"]),
  ];
  add({
    id: "night-18-harbor-lights", chapter: 4, order: 18, location: "night",
    title: "Harbor Lights", story: "Repair the dock and guide boats with light.", rows: 7, columns: 10,
    terrain: terrain(7, 10, "N", [{ char: "W", cells: verticalBand(7, 7, 9) }]),
    landmarks: [{ id: "harbor", row: 4, column: 7 }], materials: ["wood", "stone", "glow"], objectives,
    rules: { allowWoodOnVoid: true, maxWoodSpan: 5 }, reward: "boats-arrive",
    rewardText: "Boats can find the repaired harbor.", complication: "Signals need a clear view of water",
  });

  const nightHouse = [...rowCells(5, 2, 7, "stone"), ...cells([[4, 2], [4, 7], [3, 2], [3, 7]], "glass")];
  const plantLights = cells([[4, 4], [4, 6]], "glow");
  objectives = [
    objective("night-greenhouse", "Build the night greenhouse", "enclosure", nightHouse, {
      protectedCells: rectangle(4, 3, 1, 4, "stone"), wallCells: nightHouse,
    }),
    objective("plant-lights", "Light every plant bed", "light-coverage", plantLights, {
      requiredCells: rectangle(4, 3, 1, 4, "glow"), minimumLight: 1, radius: 2,
    }, ["night-greenhouse"]),
  ];
  add({
    id: "night-19-night-greenhouse", chapter: 4, order: 19, location: "night",
    title: "Night Greenhouse", story: "Build a greenhouse and light its plants.", rows: 7, columns: 10,
    terrain: terrain(7, 10, "N"), landmarks: [{ id: "plants", row: 4, column: 5 }],
    materials: ["stone", "glass", "glow"], objectives, reward: "night-plants-grow",
    rewardText: "The island plants glow and grow.", complication: "Cover an area with the fewest lights",
  });

  const towerBase = rectangle(5, 4, 1, 3, "stone");
  const lanternRoom = cells([[5, 4], [5, 5], [5, 6]], "glass", 1);
  const topLight = [cell(5, 5, "glow", 2)];
  objectives = [
    objective("lighthouse-base", "Build the lighthouse base", "foundation", towerBase, { materialId: "stone" }),
    objective("lantern-room", "Build the glass lantern room", "stack-pattern", lanternRoom, { layers: [towerBase, lanternRoom] }, ["lighthouse-base"]),
    objective("lighthouse-light", "Place the top light", "protected-light", topLight, {
      glowCell: [5, 5, 2], glassCells: lanternRoom,
    }, ["lantern-room"]),
  ];
  add({
    id: "night-20-lighthouse", chapter: 4, order: 20, location: "night",
    title: "Lighthouse", story: "Build three layers for the lighthouse.", rows: 7, columns: 11,
    terrain: terrain(7, 11, "N", [{ char: "W", cells: verticalBand(7, 0, 2) }]),
    landmarks: [{ id: "sea", row: 5, column: 2 }], materials: ["stone", "glass", "glow"], maxHeight: 3,
    objectives, reward: "lighthouse-beam", rewardText: "The lighthouse beam reaches the sea.",
    complication: "The structure has three vertical layers",
  });

  const crossing = rowCells(4, 2, 7, "wood");
  const entranceLights = cells([[3, 2], [3, 7]], "glow");
  objectives = [
    objective("school-crossing", "Build the school crossing", "connected-route", crossing, {
      startCells: [[4, 2]], endCells: [[4, 7]], buildZone: crossing, maxHeightDifference: 0,
    }),
    objective("school-lights", "Light both school entrances", "light-coverage", entranceLights, {
      requiredCells: entranceLights, minimumLight: 1, radius: 2,
    }, ["school-crossing"]),
  ];
  add({
    id: "town-21-school-crossing", chapter: 5, order: 21, location: "night",
    title: "School Crossing", story: "Build a level crossing and light the doors.", rows: 7, columns: 10,
    terrain: terrain(7, 10, "N", [{ char: "W", cells: verticalBand(7, 3, 6) }]),
    landmarks: [{ id: "school-west", row: 3, column: 1 }, { id: "school-east", row: 3, column: 8 }],
    materials: ["stone", "wood", "glow"], objectives, rules: { allowWoodOnVoid: true, maxWoodSpan: 4 },
    reward: "children-cross", rewardText: "The school crossing is safe and bright.",
    complication: "The accessible route has no steep step",
  });

  const clinicRoad = [...rowCells(5, 1, 9, "stone"), cell(4, 5, "stone"), ...rowCells(3, 5, 9, "stone")];
  const clinicShelter = cells([[2, 8], [2, 9]], "glass");
  const clinicLights = cells([[4, 6], [2, 7], [4, 9]], "glow");
  objectives = [
    objective("clinic-network", "Connect the clinic network", "connected-route", clinicRoad, {
      startCells: [[5, 1]], endCells: [[3, 9]], buildZone: clinicRoad,
    }),
    objective("clinic-shelter", "Build the clinic shelter", "enclosure", clinicShelter, {
      protectedCells: [cell(3, 9, "stone")], wallCells: clinicShelter,
    }, ["clinic-network"]),
    objective("clinic-lights", "Light all three entrances", "light-coverage", clinicLights, {
      requiredCells: clinicLights, minimumLight: 1, radius: 2,
    }, ["clinic-shelter"]),
  ];
  add({
    id: "town-22-clinic-route", chapter: 5, order: 22, location: "night",
    title: "Clinic Route", story: "Connect, shelter, and light the clinic route.", rows: 7, columns: 11,
    terrain: terrain(7, 11, "N"), landmarks: [{ id: "homes", row: 5, column: 0 }, { id: "clinic", row: 3, column: 10 }],
    materials: ["stone", "glass", "glow"], objectives, reward: "clinic-network-opens",
    rewardText: "Three neighborhoods can reach the clinic.",
    complication: "One branching network serves three landmarks",
  });

  const plaza = rectangle(5, 3, 2, 5, "stone");
  const stalls = cells([[3, 3], [3, 4], [3, 6], [3, 7]], "glass");
  const centerLight = [cell(4, 4, "glow")];
  objectives = [
    objective("market-plaza", "Build the market plaza", "foundation", plaza, { materialId: "stone" }),
    objective("market-stalls", "Build symmetric stalls", "symmetry", stalls, { axisColumn: 5 }, ["market-plaza"]),
    objective("market-center", "Light the clear center", "composite", centerLight, {
      mode: "all", validators: [
        { validator: "keep-clear", params: { clearCells: [cell(4, 5, "stone")] } },
        { validator: "light-coverage", params: { targets: centerLight, requiredCells: rectangle(4, 4, 1, 3, "glow"), minimumLight: 1, radius: 2 } },
      ],
    }, ["market-stalls"]),
  ];
  add({
    id: "town-23-market-square", chapter: 5, order: 23, location: "night",
    title: "Market Square", story: "Build a balanced market around a bright center.", rows: 8, columns: 11,
    terrain: terrain(8, 11, "N"), landmarks: [{ id: "square", row: 4, column: 5 }],
    materials: ["stone", "glass", "glow"], objectives, reward: "market-opens",
    rewardText: "The night market opens around the clear square.",
    complication: "Preserve a clear symmetric center",
  });

  const seaWall = rowCells(1, 2, 8, "stone");
  const escapeBridge = rowCells(5, 3, 7, "wood");
  const escapeLights = cells([[4, 3], [4, 7]], "glow");
  objectives = [
    objective("sea-wall", "Build the stone sea wall", "material-zone", seaWall, { materialId: "stone", zone: seaWall }),
    objective("escape-bridge", "Build the escape bridge", "supported-span", escapeBridge, { maxUnsupportedRun: 4 }, ["sea-wall"]),
    objective("escape-lights", "Light the escape route", "light-coverage", escapeLights, {
      requiredCells: escapeBridge, minimumLight: 1, radius: 4,
    }, ["escape-bridge"]),
  ];
  add({
    id: "town-24-storm-defense", chapter: 5, order: 24, location: "night",
    title: "Storm Defense", story: "Protect the coast and light an escape route.", rows: 8, columns: 11,
    terrain: terrain(8, 11, "N", [{ char: "W", cells: verticalBand(8, 0, 1) }]),
    landmarks: [{ id: "coast", row: 1, column: 1 }, { id: "shelter", row: 5, column: 8 }],
    materials: ["stone", "wood", "glow"], objectives, rules: { allowWoodOnVoid: true, maxWoodSpan: 5 },
    reward: "storm-defense-ready", rewardText: "The town is protected and the escape route shines.",
    complication: "Exposed cells require stone",
  });

  const townRoads = [
    ...rowCells(6, 1, 10, "stone"), cell(5, 6, "stone"), cell(4, 6, "stone"),
    ...rowCells(3, 5, 10, "stone"),
  ];
  const townRoadZone = [...townRoads, cell(5, 8, "stone"), cell(4, 8, "stone")];
  const portBridge = rowCells(4, 1, 5, "wood");
  const finalTower = [
    ...rectangle(2, 8, 1, 3, "stone"),
    ...cells([[2, 8], [2, 9], [2, 10]], "glass", 1),
    cell(2, 9, "glow", 2),
  ];
  objectives = [
    objective("town-network", "Connect the island homes", "connected-route", townRoads, {
      startCells: [[6, 1]], endCells: [[3, 10]], buildZone: townRoadZone,
    }),
    objective("port-bridge", "Build the bridge to the port", "supported-span", portBridge, { maxUnsupportedRun: 4 }, ["town-network"]),
    objective("town-lighthouse", "Start the town lighthouse", "composite", finalTower, {
      mode: "all", validators: [
        { validator: "stack-pattern", params: { targets: finalTower, layers: [finalTower] } },
        { validator: "shared-budget", params: { requiredRemaining: 0 } },
      ],
    }, ["port-bridge"]),
  ];
  add({
    id: "town-25-island-town", chapter: 5, order: 25, location: "night",
    title: "Island Town", story: "Connect the town, port, and lighthouse.", rows: 8, columns: 12,
    terrain: terrain(8, 12, "N", [{ char: "W", cells: verticalBand(8, 0, 0) }]),
    landmarks: [{ id: "homes", row: 6, column: 0 }, { id: "port", row: 4, column: 0 }, { id: "lighthouse", row: 2, column: 11 }],
    materials: ["wood", "stone", "glass", "glow"], maxHeight: 3, objectives,
    rules: { allowWoodOnVoid: true, maxWoodSpan: 5 }, reward: "town-celebrates",
    rewardText: "The whole island town is connected and bright.",
    complication: "Three systems share one final budget",
  });

  const data = deepFreeze({ BLOCKS, TERRAINS, TERRAIN_LEGEND, LOCATIONS, LEVELS: levels });
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  if (root) root.CubeIslandData = data;
}(typeof window !== "undefined" ? window : null));
