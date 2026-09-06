const nodes = {
  ab12: { x: 29.91, y: 29.12 },
  bc12: { x: 52.33, y: 29.12 },
  cd12: { x: 74.72, y: 29.12 },
  ab23: { x: 29.91, y: 51.19 },
  bc23: { x: 52.33, y: 51.19 },
  cd23: { x: 74.72, y: 51.19 },
  ab34: { x: 29.91, y: 73.81 },
  bc34: { x: 52.33, y: 73.81 },
  cd34: { x: 74.72, y: 73.81 },
  startBus: { x: 90.8, y: 73.81 },
  startHospital: { x: 29.91, y: 88.2 },
  startPark: { x: 17.0, y: 29.12 },
  startGarden: { x: 64.2, y: 29.12 },
  startPlayground: { x: 90.0, y: 29.12 },
  libraryStop: { x: 41.5, y: 29.12 },
  playgroundStop: { x: 86.5, y: 29.12 },
  sportsStop: { x: 86.3, y: 73.81 },
  policeStop: { x: 17.0, y: 73.81 },
  cafeStop: { x: 63.4, y: 73.81 },
};

const challenges = [
  {
    destination: 'Library',
    cue: 'Start near the bus stop.',
    initialHeading: 'west',
    route: ['startBus', 'cd34', 'bc34', 'bc23', 'bc12', 'libraryStop'],
    target: { x: 40.3, y: 16.0 },
  },
  {
    destination: 'Playground',
    cue: 'Start below the hospital.',
    initialHeading: 'north',
    route: [
      'startHospital',
      'ab34',
      'ab23',
      'bc23',
      'cd23',
      'cd12',
      'playgroundStop',
    ],
    target: { x: 86.2, y: 17.0 },
  },
  {
    destination: 'Sports Field',
    cue: 'Start below the park.',
    initialHeading: 'east',
    route: ['startPark', 'ab12', 'ab23', 'bc23', 'cd23', 'cd34', 'sportsStop'],
    target: { x: 88.0, y: 62.8 },
  },
  {
    destination: 'Police Station',
    cue: 'Start near the garden road.',
    initialHeading: 'west',
    route: ['startGarden', 'bc12', 'ab12', 'ab23', 'ab34', 'policeStop'],
    target: { x: 17.2, y: 84.4 },
  },
  {
    destination: 'Cafe',
    cue: 'Start by the playground road.',
    initialHeading: 'west',
    route: [
      'startPlayground',
      'cd12',
      'bc12',
      'bc23',
      'ab23',
      'ab34',
      'bc34',
      'cafeStop',
    ],
    target: { x: 63.5, y: 63.5 },
  },
];

const orderedDirections = ['north', 'east', 'south', 'west'];
const headingDegrees = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
};

const junctionIds = [
  'ab12',
  'bc12',
  'cd12',
  'ab23',
  'bc23',
  'cd23',
  'ab34',
  'bc34',
  'cd34',
];

const elements = {
  celebration: document.querySelector('#celebration'),
  confettiLayer: document.querySelector('#confetti-layer'),
  destinationCount: document.querySelector('#destination-count'),
  directionGrid: document.querySelector('#direction-grid'),
  junctionLayer: document.querySelector('#junction-layer'),
  marker: document.querySelector('#student-marker'),
  markerArrow: document.querySelector('#marker-arrow'),
  message: document.querySelector('#message'),
  missionTitle: document.querySelector('#mission-title'),
  nextButton: document.querySelector('#next-button'),
  progressIndicator: document.querySelector('#progress-indicator'),
  progressRoot: document.querySelector('#progress-root'),
  progressValue: document.querySelector('#progress-value'),
  replayButton: document.querySelector('#replay-button'),
  routeLine: document.querySelector('#route-line'),
  startArrow: document.querySelector('#start-arrow'),
  startBadge: document.querySelector('#start-badge'),
  startCue: document.querySelector('#start-cue'),
  targetName: document.querySelector('#target-name'),
  targetPin: document.querySelector('#target-pin'),
};

const state = {
  challengeIndex: 0,
  stepIndex: 0,
  isMoving: false,
  routeDone: false,
  showCelebration: false,
  timer: null,
};

function setPoint(element, point) {
  element.style.left = `${point.x}%`;
  element.style.top = `${point.y}%`;
}

function getDirection(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'east' : 'west';
  }

  return dy > 0 ? 'south' : 'north';
}

function getMoveAction(current, next) {
  const currentIndex = orderedDirections.indexOf(current);
  const nextIndex = orderedDirections.indexOf(next);
  const turn = (nextIndex - currentIndex + orderedDirections.length) % 4;

  if (turn === 0) {
    return 'straight';
  }

  if (turn === 1) {
    return 'right';
  }

  if (turn === 3) {
    return 'left';
  }

  return 'back';
}

function getChallenge() {
  return challenges[state.challengeIndex];
}

function getHeading(challenge, stepIndex) {
  if (stepIndex === 0) {
    return challenge.initialHeading;
  }

  const previousPoint = nodes[challenge.route[stepIndex - 1]];
  const currentPoint = nodes[challenge.route[stepIndex]];

  return getDirection(previousPoint, currentPoint);
}

function getNeededAction(challenge, stepIndex) {
  const currentPoint = nodes[challenge.route[stepIndex]];
  const nextPoint = nodes[challenge.route[stepIndex + 1]];
  const currentHeading = getHeading(challenge, stepIndex);
  const nextHeading = getDirection(currentPoint, nextPoint);

  return getMoveAction(currentHeading, nextHeading);
}

function setMessage(text, tone) {
  elements.message.textContent = text;
  elements.message.className = `message message-${tone}`;
}

function setButtonsDisabled(disabled) {
  elements.directionGrid
    .querySelectorAll('button')
    .forEach((button) => {
      button.disabled = disabled;
    });
}

function updateProgress() {
  const completed = state.routeDone || state.showCelebration ? 1 : 0;
  const value = Math.round(
    ((state.challengeIndex + completed) / challenges.length) * 100,
  );

  elements.progressIndicator.style.width = `${value}%`;
  elements.progressRoot.setAttribute('aria-valuenow', String(value));
  elements.progressValue.textContent = `${value}%`;
}

function drawJunctions() {
  elements.junctionLayer.replaceChildren();

  junctionIds.forEach((nodeId) => {
    const dot = document.createElement('span');
    dot.className = 'junction-dot';
    setPoint(dot, nodes[nodeId]);
    elements.junctionLayer.append(dot);
  });
}

function updateView() {
  const challenge = getChallenge();
  const currentPoint = nodes[challenge.route[state.stepIndex]];
  const startPoint = nodes[challenge.route[0]];
  const currentHeading = getHeading(challenge, state.stepIndex);
  const traveledPoints = challenge.route
    .slice(0, state.stepIndex + 1)
    .map((nodeId) => nodes[nodeId]);

  elements.destinationCount.textContent = `Destination ${
    state.challengeIndex + 1
  } of ${challenges.length}`;
  elements.startCue.textContent = challenge.cue;
  elements.missionTitle.textContent = `Go to the ${challenge.destination}`;
  elements.targetName.textContent = challenge.destination;
  elements.targetPin.setAttribute(
    'aria-label',
    `Destination: ${challenge.destination}`,
  );

  setPoint(elements.startBadge, startPoint);
  setPoint(elements.startArrow, startPoint);
  setPoint(elements.targetPin, challenge.target);
  setPoint(elements.marker, currentPoint);

  elements.startArrow.style.transform = `translate(-50%, -215%) rotate(${
    headingDegrees[challenge.initialHeading]
  }deg)`;
  elements.markerArrow.style.transform = `rotate(${
    headingDegrees[currentHeading]
  }deg)`;
  elements.routeLine.setAttribute(
    'points',
    traveledPoints.map((point) => `${point.x},${point.y}`).join(' '),
  );

  elements.directionGrid.classList.toggle(
    'hidden',
    state.routeDone || state.showCelebration,
  );
  elements.nextButton.classList.toggle(
    'hidden',
    !state.routeDone || state.showCelebration,
  );
  elements.celebration.classList.toggle('hidden', !state.showCelebration);

  updateProgress();
}

function clearMoveTimer() {
  if (state.timer) {
    window.clearTimeout(state.timer);
    state.timer = null;
  }
}

function attemptMove(action) {
  if (state.isMoving || state.routeDone || state.showCelebration) {
    return Promise.resolve({
      moved: false,
      message: 'Wait for the next turn.',
    });
  }

  const challenge = getChallenge();
  const neededAction = getNeededAction(challenge, state.stepIndex);

  if (action !== neededAction) {
    setMessage('Try again!', 'try');
    return Promise.resolve({
      moved: false,
      message: 'Try again!',
      currentDestination: challenge.destination,
    });
  }

  const nextStep = state.stepIndex + 1;
  const hasArrived = nextStep === challenge.route.length - 1;

  state.stepIndex = nextStep;
  state.isMoving = true;
  setButtonsDisabled(true);
  elements.marker.classList.add('student-marker-moving');
  setMessage(hasArrived ? 'You found it!' : 'Good choice!', 'good');
  updateView();
  clearMoveTimer();

  return new Promise((resolve) => {
    state.timer = window.setTimeout(() => {
      state.isMoving = false;
      elements.marker.classList.remove('student-marker-moving');
      setButtonsDisabled(false);

      if (hasArrived) {
        state.routeDone = true;

        if (state.challengeIndex === challenges.length - 1) {
          state.showCelebration = true;
        }
      } else {
        setMessage('What should you do next?', 'ready');
      }

      updateView();
      resolve({
        moved: true,
        message: hasArrived ? 'You found it!' : 'Good choice!',
        currentDestination: challenge.destination,
        routeComplete: hasArrived,
        gameComplete:
          hasArrived && state.challengeIndex === challenges.length - 1,
      });
    }, 680);
  });
}

function goToNextChallenge() {
  clearMoveTimer();
  state.challengeIndex += 1;
  state.stepIndex = 0;
  state.routeDone = false;
  state.showCelebration = false;
  state.isMoving = false;
  elements.marker.classList.remove('student-marker-moving');
  setButtonsDisabled(false);
  setMessage('Tap the best way to go.', 'ready');
  updateView();
}

function restartGame() {
  clearMoveTimer();
  state.challengeIndex = 0;
  state.stepIndex = 0;
  state.routeDone = false;
  state.showCelebration = false;
  state.isMoving = false;
  elements.marker.classList.remove('student-marker-moving');
  setButtonsDisabled(false);
  setMessage('Tap the best way to go.', 'ready');
  updateView();
}

function addConfetti() {
  const colors = ['#ffcf3f', '#ff715b', '#33c7a7', '#4f8cff', '#b86bff'];

  for (let index = 0; index < 28; index += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = `${6 + ((index * 13) % 88)}%`;
    piece.style.animationDelay = `${(index % 8) * 0.12}s`;
    piece.style.backgroundColor = colors[index % colors.length];
    elements.confettiLayer.append(piece);
  }
}

function parseMoveAction(input) {
  if (
    typeof input === 'object' &&
    input !== null &&
    typeof input.direction === 'string' &&
    ['straight', 'left', 'right', 'back'].includes(input.direction)
  ) {
    return input.direction;
  }

  throw new Error('Choose straight, left, right, or back.');
}

function registerWebMCPTools() {
  const context = document.modelContext;

  if (!context || typeof context.registerTool !== 'function') {
    return;
  }

  const lifecycle = new AbortController();
  const register = (tool) => {
    try {
      Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => undefined);
    } catch {
      // Unsupported WebMCP hosts can safely ignore these optional tools.
    }
  };

  register({
    name: 'read_map_game_state',
    title: 'Read map game state',
    description:
      'Read the current destination, marker direction, route step, and available buttons.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute() {
      const challenge = getChallenge();
      const currentHeading = getHeading(challenge, state.stepIndex);

      return {
        destinationNumber: state.challengeIndex + 1,
        totalDestinations: challenges.length,
        currentDestination: challenge.destination,
        currentHeading,
        step: state.stepIndex + 1,
        totalSteps: challenge.route.length,
        routeComplete: state.routeDone,
        gameComplete: state.showCelebration,
        availableDirections: state.routeDone
          ? []
          : ['straight', 'left', 'right', 'back'],
      };
    },
  });

  register({
    name: 'choose_map_direction',
    title: 'Choose map direction',
    description:
      'Choose one direction button for the current map challenge and update the visible marker.',
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['straight', 'left', 'right', 'back'],
        },
      },
      required: ['direction'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      return attemptMove(parseMoveAction(input));
    },
  });

  register({
    name: 'start_next_destination',
    title: 'Start next destination',
    description:
      'Start the next destination after the current route has been completed.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      if (!state.routeDone || state.showCelebration) {
        return { started: false, message: 'Finish this destination first.' };
      }

      goToNextChallenge();
      return {
        started: true,
        destinationNumber: state.challengeIndex + 1,
        totalDestinations: challenges.length,
      };
    },
  });

  register({
    name: 'restart_map_game',
    title: 'Restart map game',
    description: 'Restart the map navigation game from destination 1.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      restartGame();
      return { restarted: true };
    },
  });
}

elements.directionGrid.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');

  if (!button) {
    return;
  }

  attemptMove(button.dataset.action);
});

elements.nextButton.addEventListener('click', goToNextChallenge);
elements.replayButton.addEventListener('click', restartGame);

drawJunctions();
addConfetti();
updateView();
registerWebMCPTools();
