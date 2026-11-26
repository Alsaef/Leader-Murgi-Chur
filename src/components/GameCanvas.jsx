import { useRef, useEffect } from 'react';
import sound from '../utils/soundEngine';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_Y,
  PHYSICS,
  CHAT_PHRASES,
  POSTERS,
  getLeaderRank,
} from '../utils/constants';

const GameCanvas = ({
  gameState,
  onGameOver,
  onUpdateStats,
  customLeaderImg,
}) => {
  const canvasRef = useRef(null);
  const onGameOverRef = useRef(onGameOver);
  const onUpdateStatsRef = useRef(onUpdateStats);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
    onUpdateStatsRef.current = onUpdateStats;
  }, [onGameOver, onUpdateStats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Load custom or default leader face image
    let leaderImg = new Image();
    leaderImg.src = customLeaderImg || '/assets/leader_face.png';
    let leaderImgLoaded = leaderImg.complete && leaderImg.naturalWidth > 0;
    leaderImg.onload = () => {
      leaderImgLoaded = true;
    };
    leaderImg.onerror = () => {
      if (leaderImg.src !== '/assets/leader_cartoon_face.png') {
        leaderImg.src = '/assets/leader_cartoon_face.png';
      }
    };

    // Game state variables
    let animationFrameId = null;
    let distance = 0;
    let kicksCount = 0;
    let drinksCount = 0;
    let score = 0;
    let isGameOver = false;

    // Player Object
    const player = {
      x: 240,
      y: GROUND_Y,
      vy: 0,
      isGrounded: true,
      isJumping: false,
      jumpsUsed: 0,
      doubleJumpTimer: 0,
      isKicking: false,
      kickTimer: 0,
      kickCooldown: 0,
      isStunned: false,
      stunTimer: 0,
      energy: 100,
      boostTimer: 0,
      bikeTimer: 0,
      runCycle: 0,
      chickenFlap: 0,
      featherTimer: 0,
      footstepTimer: 0,
    };

    // Mob Object (Chasing from behind on the left)
    const mob = {
      baseX: -40,
      currentX: -40,
      targetX: -40,
      surge: 0,
      runCycle: 0,
      shoutTimer: 80, // Early shout ~1.8s into the run!
      currentShout: '',
      shoutX: 0,
    };
    let mobShoutCount = 0;

    // Dynamic Game Entities
    let obstacles = [];
    let blockers = [];
    let pickups = [];
    let sandals = [];
    let particles = [];
    let floaters = [];
    let feathers = [];
    let brawlParticles = [];

    // Spawners timers (tighter pacing for thrilling challenge)
    let obstacleTimer = 110;
    let blockerTimer = 155;
    let pickupTimer = 240; // First drink appears ~4s into run
    let bikeSpawnTimer = 620; // First CNG/Bike Rush appears ~10s into run
    let sandalTimer = 210; // First flying sandal appears ~3.5s into run

    // Milestone trackers for rank-up & dynamic day-sunset-night announcements
    let lastRankTitle = getLeaderRank(0).title;
    let lastDayPhase = 'DAY';

    // Background parallax offsets
    let skyOffset = 0;
    let farOffset = 0;
    let midOffset = 0;
    let roadOffset = 0;

    // Roadside Tong Dokan (Tea stalls) & Posters
    let passingShops = [
      { x: 500, type: 'tong', poster: POSTERS[0] },
      { x: 1100, type: 'tong', poster: POSTERS[1] },
    ];

    // Gono Pituni Brawl Cloud state
    let brawlActive = false;
    let brawlTimer = 0;
    let brawlX = 0;
    let brawlY = 0;

    // Input handlers
    const keysPressed = {};

    const triggerJump = () => {
      if (gameState !== 'PLAYING') return;
      sound.init();
      if (player.isGrounded && !player.isStunned && !brawlActive) {
        player.vy = PHYSICS.JUMP_FORCE;
        player.isGrounded = false;
        player.isJumping = true;
        player.jumpsUsed = 1;
        sound.playJump();
        sound.playCluck();

        // Jump dust burst
        for (let i = 0; i < 7; i++) {
          particles.push({
            x: player.x,
            y: GROUND_Y,
            vx: (Math.random() - 0.7) * 3,
            vy: -Math.random() * 2,
            radius: 3 + Math.random() * 4,
            alpha: 0.8,
            color: '#e2d5c3',
            life: 25,
          });
        }
      } else if (
        !player.isGrounded &&
        player.jumpsUsed < 2 &&
        !player.isStunned &&
        !brawlActive
      ) {
        // Double Jump via frantic Chicken Wing Flap!
        player.vy = PHYSICS.DOUBLE_JUMP_FORCE;
        player.jumpsUsed = 2;
        player.doubleJumpTimer = 24;
        sound.playDoubleJump();
        sound.playCluck();

        floaters.push({
          x: player.x,
          y: player.y - 95,
          text: 'ফড়ফড়! ডাবল লাফ! 🐔',
          color: '#fef08a',
          scale: 1.05,
          vy: -1.6,
          alpha: 1,
          life: 28,
        });

        // Burst of flapping chicken feathers downward
        for (let i = 0; i < 9; i++) {
          feathers.push({
            x: player.x - 6 + (Math.random() - 0.5) * 20,
            y: player.y - 45,
            vx: (Math.random() - 0.5) * 5,
            vy: 1 + Math.random() * 3,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.25,
            color: i % 3 === 0 ? '#fbbf24' : '#ffffff',
            alpha: 1,
            life: 45,
          });
        }
      }
    };

    const kickBlocker = (blocker) => {
      blocker.kicked = true;
      blocker.vx = 8 + Math.random() * 5;
      blocker.vy = -13 - Math.random() * 4;
      blocker.rotSpeed = 0.25;
      kicksCount++;
      score += PHYSICS.KICK_BONUS_SCORE;

      sound.playVillagerFly();
      sound.playCluck();

      // Comic impact burst
      const comicWord =
        CHAT_PHRASES.KICK_FX[
          Math.floor(Math.random() * CHAT_PHRASES.KICK_FX.length)
        ];
      floaters.push({
        x: blocker.x,
        y: blocker.y - 40,
        text: comicWord,
        color: '#f43f5e',
        scale: 1.5,
        vy: -2,
        alpha: 1,
        life: 36,
      });

      floaters.push({
        x: blocker.x,
        y: blocker.y - 15,
        text: '+50',
        color: '#22c55e',
        scale: 1.1,
        vy: -1.8,
        alpha: 1,
        life: 30,
      });

      // Flying slippers / stars
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: blocker.x,
          y: blocker.y - 20,
          vx: (Math.random() - 0.2) * 8,
          vy: -Math.random() * 8,
          radius: 3 + Math.random() * 4,
          alpha: 1,
          color: i % 2 === 0 ? '#fbbf24' : '#ffffff',
          life: 35,
          star: true,
        });
      }
    };

    const triggerKick = () => {
      if (gameState !== 'PLAYING') return;
      sound.init();
      if (player.kickCooldown <= 0 && !player.isStunned && !brawlActive) {
        player.isKicking = true;
        player.kickTimer = PHYSICS.KICK_DURATION;
        player.kickCooldown = PHYSICS.KICK_DURATION + 8;
        sound.playKick();

        // Kick whoosh wave
        floaters.push({
          x: player.x + 40,
          y: player.y - 45,
          text: 'লাত্থি!',
          color: '#fbbf24',
          scale: 1.2,
          vy: -1.5,
          alpha: 1,
          life: 24,
        });

        // Check immediate kick collision with nearby blockers in forward kick zone
        blockers.forEach((b) => {
          if (!b.kicked && b.x >= player.x - 15 && b.x <= player.x + 95) {
            kickBlocker(b);
          }
        });

        // Also check immediate kick deflection against flying sandals
        sandals.forEach((s) => {
          if (
            !s.deflected &&
            !s.hit &&
            s.x >= player.x - 15 &&
            s.x <= player.x + 105 &&
            Math.abs(s.y - (player.y - 48)) < 50
          ) {
            s.deflected = true;
            s.vx = 13;
            s.vy = -10;
            score += PHYSICS.SANDAL_DEFLECT_SCORE;
            sound.playKick();
            floaters.push({
              x: s.x,
              y: s.y - 25,
              text: 'ঠাস! স্যান্ডেল ব্লক! +30',
              color: '#38bdf8',
              scale: 1.25,
              vy: -2,
              alpha: 1,
              life: 32,
            });
          }
        });
      }
    };

    // Keyboard controls
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      keysPressed[e.code] = true;

      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        triggerJump();
      } else if (
        ['KeyD', 'ArrowRight', 'KeyK', 'Enter'].includes(e.code)
      ) {
        e.preventDefault();
        triggerKick();
      }
    };

    const handleKeyUp = (e) => {
      keysPressed[e.code] = false;
    };

    // Direct touch on screen halves (Left half = Jump, Right half = Kick)
    const handlePointerDown = (e) => {
      if (brawlActive || gameState !== 'PLAYING') return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      if (clientX === undefined) return;
      const touchX = clientX - rect.left;
      if (touchX < rect.width * 0.45) {
        triggerJump();
      } else {
        triggerKick();
      }
    };

    const handleJumpEvent = () => triggerJump();
    const handleKickEvent = () => triggerKick();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('game:jump', handleJumpEvent);
    window.addEventListener('game:kick', handleKickEvent);

    // Only start background music when game is actively PLAYING
    if (gameState === 'PLAYING') {
      sound.startBGM();
    } else {
      sound.stopBGM();
    }

    // MAIN GAME LOOP
    const updateAndRender = () => {
      // Canvas clearing
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.save();

      // CURRENT SPEED COMPUTATION
      let currentSpeed = PHYSICS.BASE_SPEED;
      if (gameState === 'PLAYING') {
        if (player.bikeTimer > 0) {
          currentSpeed = PHYSICS.BIKE_SPEED;
        } else if (player.boostTimer > 0) {
          currentSpeed = PHYSICS.BOOST_SPEED;
        } else if (player.energy < PHYSICS.ENERGY_LOW_THRESHOLD) {
          const lowRatio = Math.max(0.25, player.energy / PHYSICS.ENERGY_LOW_THRESHOLD);
          currentSpeed = PHYSICS.BASE_SPEED * (0.4 + 0.6 * lowRatio);
        } else if (player.isStunned) {
          currentSpeed = PHYSICS.BASE_SPEED * 0.35;
        }
        currentSpeed += distance * PHYSICS.SPEED_ACCEL;
      } else {
        currentSpeed = PHYSICS.BASE_SPEED * 0.7; // Gentle background scroll
      }

      // Compute Dynamic Day -> Sunset -> Night (Load-Shedding) Environment
      const timeEnv = getTimeOfDayState(distance);

      // UPDATE PLAYER PHYSICS (Active only when playing)
      if (gameState === 'PLAYING' && !brawlActive) {
        distance += currentSpeed * 0.05;
        score = Math.floor(
          distance * 2 + kicksCount * PHYSICS.KICK_BONUS_SCORE
        );

        // Rank-up celebratory announcement!
        const newRank = getLeaderRank(score);
        if (newRank.title !== lastRankTitle && score >= 500) {
          lastRankTitle = newRank.title;
          floaters.push({
            x: GAME_WIDTH / 2,
            y: 130,
            text: `${newRank.badge} পদোন্নতি: ${newRank.title}!`,
            color: newRank.color,
            scale: 1.35,
            vy: -0.9,
            alpha: 1,
            life: 70,
          });
        }

        // Day / Sunset / Night Load-Shedding transition alert
        if (timeEnv.phase !== lastDayPhase) {
          lastDayPhase = timeEnv.phase;
          if (timeEnv.phase === 'SUNSET') {
            floaters.push({
              x: GAME_WIDTH / 2,
              y: 115,
              text: '🌆 গোধূলি সন্ধ্যা নামছে!',
              color: '#fb923c',
              scale: 1.25,
              vy: -0.7,
              alpha: 1,
              life: 65,
            });
          } else if (timeEnv.phase === 'NIGHT') {
            floaters.push({
              x: GAME_WIDTH / 2,
              y: 115,
              text: '🔦 কারেন্ট নাই! লোডশেডিং + মশাল তাড়া!',
              color: '#fef08a',
              scale: 1.25,
              vy: -0.7,
              alpha: 1,
              life: 75,
            });
          } else if (timeEnv.phase === 'DAY' && distance > 100) {
            floaters.push({
              x: GAME_WIDTH / 2,
              y: 115,
              text: '☀️ ভোর হয়ে গেছে! দৌড় থামিয়ো না!',
              color: '#38bdf8',
              scale: 1.2,
              vy: -0.7,
              alpha: 1,
              life: 60,
            });
          }
        }

        // Energy & Power-up timers
        if (player.bikeTimer > 0) {
          player.bikeTimer--;
          // CNG/Bike exhaust smoke puffs
          if (Math.random() < 0.65) {
            particles.push({
              x: player.x - 42,
              y: player.y - 12,
              vx: -4 - Math.random() * 2,
              vy: -0.6 - Math.random() * 1.2,
              radius: 4 + Math.random() * 4,
              alpha: 0.7,
              color: '#cbd5e1',
              life: 25,
            });
          }
        } else if (player.boostTimer > 0) {
          player.boostTimer--;
        } else {
          player.energy = Math.max(
            0,
            player.energy - PHYSICS.ENERGY_DRAIN_RATE
          );
        }

        if (player.doubleJumpTimer > 0) {
          player.doubleJumpTimer--;
        }

        // Footsteps & chicken flap audio
        player.runCycle += currentSpeed * 0.055;
        player.chickenFlap +=
          player.doubleJumpTimer > 0
            ? 0.9
            : player.bikeTimer > 0 || player.boostTimer > 0
            ? 0.45
            : 0.28;
        player.footstepTimer++;
        if (player.isGrounded && player.bikeTimer <= 0 && player.footstepTimer > 16) {
          sound.playFootstep();
          player.footstepTimer = 0;
        }

        // Random chicken cluck
        if (Math.random() < 0.012) {
          sound.playCluck();
        }

        // Jump physics
        if (!player.isGrounded) {
          player.vy += PHYSICS.GRAVITY;
          player.y += player.vy;
          if (player.y >= GROUND_Y) {
            player.y = GROUND_Y;
            player.vy = 0;
            player.isGrounded = true;
            player.isJumping = false;
            player.jumpsUsed = 0;
          }
        }

        // Kick duration
        if (player.isKicking) {
          player.kickTimer--;
          if (player.kickTimer <= 0) {
            player.isKicking = false;
          }
        }
        if (player.kickCooldown > 0) {
          player.kickCooldown--;
        }

        // Stun timer
        if (player.isStunned) {
          player.stunTimer--;
          if (player.stunTimer <= 0) {
            player.isStunned = false;
          }
        }

        // Feather emitter from held chicken
        player.featherTimer++;
        if (player.featherTimer > (player.boostTimer > 0 || player.bikeTimer > 0 ? 10 : 25)) {
          feathers.push({
            x: player.x - 10,
            y: player.y - 35,
            vx: -3 - Math.random() * 2,
            vy: (Math.random() - 0.5) * 1.5,
            rot: Math.random() * Math.PI,
            rotSpeed: (Math.random() - 0.5) * 0.1,
            color: Math.random() > 0.4 ? '#ffffff' : '#d97706',
            alpha: 1,
            life: 60,
          });
          player.featherTimer = 0;
        }

        // Running dust particles
        if (player.isGrounded && Math.random() < 0.5) {
          particles.push({
            x: player.x - 15,
            y: GROUND_Y - 2,
            vx: -2 - Math.random() * 2,
            vy: -Math.random() * 1.5,
            radius: 2 + Math.random() * 3,
            alpha: 0.6,
            color: '#d6c4a8',
            life: 20,
          });
        }

        // Sweat drops if energy < 30%
        if (player.energy < PHYSICS.ENERGY_LOW_THRESHOLD && Math.random() < 0.25) {
          particles.push({
            x: player.x + (Math.random() - 0.5) * 15,
            y: player.y - 65,
            vx: -1.5 - Math.random() * 1.5,
            vy: -1 + Math.random() * 2,
            radius: 2.5,
            alpha: 0.9,
            color: '#38bdf8',
            life: 22,
          });
        }
      } else if (gameState !== 'PLAYING') {
        // Idle animation for Start screen
        player.runCycle += 0.08;
        player.chickenFlap += 0.2;
      }

      // UPDATE MOB POSITION & SURGE
      if (gameState === 'PLAYING' && !brawlActive) {
        mob.runCycle += 0.35;

        // Base target X is influenced by Player Energy, Bike Rush, Boost & Stun
        let targetX = -40;
        if (player.energy < PHYSICS.ENERGY_LOW_THRESHOLD) {
          const dangerLevel = (PHYSICS.ENERGY_LOW_THRESHOLD - player.energy) / PHYSICS.ENERGY_LOW_THRESHOLD;
          targetX = 60 + dangerLevel * 140; // Mob surges right up to player!
        }
        if (player.isStunned) {
          targetX += 60;
        }
        if (player.bikeTimer > 0) {
          targetX = -110; // CNG leaves mob far behind in the dust!
        } else if (player.boostTimer > 0) {
          targetX = -70; // Driven far back
        }

        // When energy hits zero, mob accelerates to capture
        if (player.energy <= 0) {
          mob.currentX += 8;
        } else {
          mob.currentX += (targetX - mob.currentX) * 0.04;
        }

        // Mob comic visual text shouting
        mob.shoutTimer++;
        const shoutInterval = player.energy < PHYSICS.ENERGY_LOW_THRESHOLD ? 130 : 190;
        if (mob.shoutTimer > shoutInterval) {
          let phrase;
          if (mobShoutCount < 3) {
            phrase = CHAT_PHRASES.MOB_SHOUTS[mobShoutCount];
            mobShoutCount++;
          } else {
            phrase =
              CHAT_PHRASES.MOB_SHOUTS[
                Math.floor(Math.random() * CHAT_PHRASES.MOB_SHOUTS.length)
              ];
          }
          mob.currentShout = phrase;
          mob.shoutX = mob.currentX + 70;
          mob.shoutTimer = 0;
        }

        // CHECK GAME OVER / GONO PITUNI CONDITION!
        if (mob.currentX >= player.x - 35) {
          brawlActive = true;
          brawlX = player.x;
          brawlY = GROUND_Y - 40;
          brawlTimer = 110;
          sound.playGonoPituni();
          sound.playCluck();

          // Spawn initial brawl explosion particles
          for (let i = 0; i < 25; i++) {
            brawlParticles.push({
              x: brawlX,
              y: brawlY,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.6) * 12,
              type: ['star', 'sandal', 'fist', 'feather', 'cloud'][i % 5],
              rot: Math.random() * Math.PI * 2,
              rotSpeed: (Math.random() - 0.5) * 0.3,
              scale: 0.8 + Math.random() * 0.6,
              life: 100,
            });
          }
        }
      }

      // UPDATE PARALLAX BACKGROUND OFFSETS (Positive modulo to prevent tile jumps)
      if (!brawlActive) {
        skyOffset = (skyOffset + currentSpeed * 0.05) % GAME_WIDTH;
        farOffset = (farOffset + currentSpeed * 0.15) % GAME_WIDTH;
        midOffset = (midOffset + currentSpeed * 0.55) % GAME_WIDTH;
        roadOffset = (roadOffset + currentSpeed) % 80;

        // Move passing roadside tea shops
        passingShops.forEach((shop) => {
          shop.x -= currentSpeed * 0.55;
          if (shop.x < -300) {
            shop.x = GAME_WIDTH + 200 + Math.random() * 400;
            shop.poster =
              POSTERS[Math.floor(Math.random() * POSTERS.length)];
          }
        });
      }

      // RENDER PARALLAX BACKGROUND (Dynamic Day -> Sunset -> Night Load-Shedding)
      renderParallax(ctx, skyOffset, farOffset, midOffset, roadOffset, passingShops, timeEnv);

      // SPAWN & UPDATE OBSTACLES (Active only when playing)
      if (gameState === 'PLAYING' && !brawlActive) {
        obstacleTimer--;
        if (obstacleTimer <= 0) {
          // Check no blocker is too close to avoid unfair overlapping spawns
          const blockerNear = blockers.some((b) => b.x > GAME_WIDTH - 180);
          if (blockerNear) {
            obstacleTimer = 40; // Postpone spawn
          } else {
            const types = ['rickshaw_van', 'speed_breaker', 'dog', 'bench', 'mud_puddle'];
            const chosen = types[Math.floor(Math.random() * types.length)];
            obstacles.push({
              x: GAME_WIDTH + 50,
              y: GROUND_Y,
              type: chosen,
              width:
                chosen === 'mud_puddle'
                  ? 76
                  : chosen === 'rickshaw_van'
                  ? 70
                  : chosen === 'bench'
                  ? 55
                  : chosen === 'dog'
                  ? 40
                  : 35,
              height:
                chosen === 'rickshaw_van'
                  ? 50
                  : chosen === 'bench'
                  ? 28
                  : chosen === 'dog'
                  ? 24
                  : chosen === 'mud_puddle'
                  ? 12
                  : 16,
              hit: false,
            });
            obstacleTimer = Math.max(75, 115 - distance * 0.015) + Math.random() * 90;
          }
        }

        // Move obstacles
        obstacles.forEach((obs) => {
          obs.x -= currentSpeed;

          // Collision with Player
          if (
            !obs.hit &&
            Math.abs(obs.x - player.x) < obs.width / 2 + 18 &&
            player.y > GROUND_Y - obs.height + 4
          ) {
            obs.hit = true;
            if (player.bikeTimer > 0 || player.boostTimer > 0) {
              // Invulnerable plow through
              if (obs.type === 'mud_puddle') {
                sound.playMudSplash();
                for (let i = 0; i < 10; i++) {
                  particles.push({
                    x: obs.x,
                    y: GROUND_Y - 4,
                    vx: -3 - Math.random() * 4,
                    vy: -Math.random() * 5,
                    radius: 3 + Math.random() * 3,
                    alpha: 0.9,
                    color: '#78350f',
                    life: 25,
                  });
                }
              } else {
                sound.playKick();
                floaters.push({
                  x: obs.x,
                  y: obs.y - 30,
                  text: player.bikeTimer > 0 ? 'পিঁপ পিঁপ! ধুম!' : 'ধুম!',
                  color: '#eab308',
                  scale: 1.3,
                  vy: -2,
                  alpha: 1,
                  life: 25,
                });
              }
            } else if (obs.type === 'mud_puddle') {
              // Mud Puddle slip!
              player.isStunned = true;
              player.stunTimer = Math.floor(PHYSICS.STUN_DURATION * 0.9);
              player.energy = Math.max(0, player.energy - 13);
              mob.currentX += 48;
              sound.playMudSplash();

              for (let i = 0; i < 14; i++) {
                particles.push({
                  x: player.x,
                  y: GROUND_Y - 4,
                  vx: (Math.random() - 0.5) * 7,
                  vy: -2 - Math.random() * 5,
                  radius: 3 + Math.random() * 4,
                  alpha: 1,
                  color: i % 2 === 0 ? '#713f12' : '#451a03',
                  life: 30,
                });
              }

              floaters.push({
                x: player.x,
                y: player.y - 52,
                text: 'পিছলা কাদা! ছপাৎ!',
                color: '#d97706',
                scale: 1.25,
                vy: -1.6,
                alpha: 1,
                life: 32,
              });
            } else {
              // Stumble & drop energy
              player.isStunned = true;
              player.stunTimer = PHYSICS.STUN_DURATION;
              player.energy = Math.max(0, player.energy - 15);
              mob.currentX += 52; // Mob closes in
              sound.playStumble();

              if (obs.type === 'dog') {
                floaters.push({
                  x: obs.x,
                  y: obs.y - 35,
                  text: 'ঘেউ ঘেউ!',
                  color: '#ef4444',
                  scale: 1.2,
                  vy: -1.8,
                  alpha: 1,
                  life: 30,
                });
              } else {
                floaters.push({
                  x: player.x,
                  y: player.y - 50,
                  text: 'হোঁচট!',
                  color: '#f97316',
                  scale: 1.2,
                  vy: -1.5,
                  alpha: 1,
                  life: 25,
                });
              }
            }
          }
        });
        obstacles = obstacles.filter((obs) => obs.x > -150);

        // SPAWN & UPDATE FLYING SANDALS (উড়ন্ত স্যান্ডেল - jump over OR kick back!)
        sandalTimer--;
        if (sandalTimer <= 0) {
          sandals.push({
            x: GAME_WIDTH + 60,
            y: GROUND_Y - 50,
            vx: -(currentSpeed * 1.45),
            vy: 0,
            rot: 0,
            hit: false,
            deflected: false,
          });
          sandalTimer = Math.max(115, 165 - distance * 0.015) + Math.random() * 125;
        }

        sandals.forEach((s) => {
          if (s.deflected) {
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.45;
            s.rot += 0.45;
          } else {
            s.x += s.vx;
            s.rot -= 0.3;

            // Active Kick Deflection
            if (
              player.isKicking &&
              s.x >= player.x - 15 &&
              s.x <= player.x + 105 &&
              Math.abs(s.y - (player.y - 48)) < 50
            ) {
              s.deflected = true;
              s.vx = 13;
              s.vy = -10;
              score += PHYSICS.SANDAL_DEFLECT_SCORE;
              sound.playKick();
              floaters.push({
                x: s.x,
                y: s.y - 25,
                text: 'ঠাস! স্যান্ডেল ব্লক! +30',
                color: '#38bdf8',
                scale: 1.25,
                vy: -2,
                alpha: 1,
                life: 32,
              });
            } else if (
              !s.hit &&
              Math.abs(s.x - player.x) < 26 &&
              Math.abs(s.y - (player.y - 52)) < 36
            ) {
              if (player.bikeTimer > 0 || player.boostTimer > 0) {
                s.deflected = true;
                s.vx = 11;
                s.vy = -9;
                sound.playKick();
              } else {
                s.hit = true;
                player.isStunned = true;
                player.stunTimer = Math.floor(PHYSICS.STUN_DURATION * 0.9);
                player.energy = Math.max(0, player.energy - 14);
                mob.currentX += 45;
                sound.playStumble();
                floaters.push({
                  x: player.x,
                  y: player.y - 75,
                  text: 'আউচ! উড়ন্ত স্যান্ডেল!',
                  color: '#f43f5e',
                  scale: 1.25,
                  vy: -1.8,
                  alpha: 1,
                  life: 30,
                });
              }
            }
          }
        });
        sandals = sandals.filter(
          (s) => s.x > -100 && s.x < GAME_WIDTH + 180 && s.y < GAME_HEIGHT + 80
        );

        // SPAWN & UPDATE FRONT BLOCKERS (Villagers to kick!)
        blockerTimer--;
        if (blockerTimer <= 0) {
          // Check no obstacle is too close to avoid unfair overlap
          const obstacleNear = obstacles.some((o) => o.x > GAME_WIDTH - 150);
          if (obstacleNear) {
            blockerTimer = 30; // Postpone spawn
          } else {
            blockers.push({
              x: GAME_WIDTH + 60,
              y: GROUND_Y,
              vx: -currentSpeed * 0.58,
              vy: 0,
              rot: 0,
              rotSpeed: 0,
              kicked: false,
              runCycle: Math.random() * Math.PI,
              shout:
                CHAT_PHRASES.BLOCKER_SHOUTS[
                  Math.floor(Math.random() * CHAT_PHRASES.BLOCKER_SHOUTS.length)
                ],
              clothesColor: ['#ef4444', '#3b82f6', '#10b981', '#8b5cf6'][
                Math.floor(Math.random() * 4)
              ],
            });
            blockerTimer = Math.max(100, 145 - distance * 0.015) + Math.random() * 110;
          }
        }

        // Move Blockers
        blockers.forEach((b) => {
          if (b.kicked) {
            b.x += b.vx - currentSpeed * 0.4;
            b.y += b.vy;
            b.vy += PHYSICS.GRAVITY * 0.8;
            b.rot += b.rotSpeed;
          } else {
            b.x += b.vx - currentSpeed * 0.35;
            b.runCycle += 0.25;

            // Check if player is kicking and blocker enters the forward kick range (including flying jump kicks)
            if (
              player.isKicking &&
              b.x >= player.x - 15 &&
              b.x <= player.x + 95 &&
              player.y > GROUND_Y - 110
            ) {
              kickBlocker(b);
            } else if (
              (player.bikeTimer > 0 || player.boostTimer > 0) &&
              Math.abs(b.x - player.x) < 55 &&
              player.y > GROUND_Y - 95
            ) {
              // Super boost / CNG Rush bulldozes through
              kickBlocker(b);
            } else if (
              !player.isStunned &&
              Math.abs(b.x - player.x) < 32 &&
              player.y > GROUND_Y - 50
            ) {
              // Collided without kicking: stun player!
              b.kicked = true;
              b.vx = 4;
              b.vy = -6;
              player.isStunned = true;
              player.stunTimer = PHYSICS.STUN_DURATION;
              player.energy = Math.max(0, player.energy - 18);
              mob.currentX += 62; // Mob surges forward!
              sound.playStumble();

              floaters.push({
                x: player.x,
                y: player.y - 50,
                text: 'আরেহ্!',
                color: '#dc2626',
                scale: 1.3,
                vy: -1.6,
                alpha: 1,
                life: 30,
              });
            }
          }
        });
        blockers = blockers.filter((b) => b.x > -200 && b.y < GAME_HEIGHT + 100);

        // SPAWN & UPDATE ROADSIDE ENERGY DRINKS (Balanced spawn)
        pickupTimer--;
        if (pickupTimer <= 0) {
          const isHigh = Math.random() > 0.5;
          pickups.push({
            type: 'energy',
            x: GAME_WIDTH + 40,
            y: isHigh ? GROUND_Y - 75 : GROUND_Y - 25,
            width: 24,
            height: 38,
            floatPhase: Math.random() * Math.PI,
          });
          pickupTimer = 360 + Math.random() * 160;
        }

        // SPAWN CNG / BIKE RUSH POWER-UP
        bikeSpawnTimer--;
        if (bikeSpawnTimer <= 0) {
          pickups.push({
            type: 'bike_rush',
            x: GAME_WIDTH + 60,
            y: GROUND_Y - 36,
            width: 48,
            height: 36,
            floatPhase: Math.random() * Math.PI,
          });
          bikeSpawnTimer = 650 + Math.random() * 300;
        }

        // Move Pickups
        pickups.forEach((p) => {
          p.x -= currentSpeed;
          p.floatPhase += 0.08;

          // Collect condition
          if (
            Math.abs(p.x - player.x) < 40 &&
            Math.abs(p.y - (player.y - 32)) < 44
          ) {
            p.collected = true;
            if (p.type === 'bike_rush') {
              // CNG / Bike Rush activated!
              player.bikeTimer = PHYSICS.BIKE_DURATION;
              player.energy = Math.min(100, player.energy + 30);
              score += 75;
              sound.playBikeHorn();

              const bikeText =
                CHAT_PHRASES.BIKE_FX[
                  Math.floor(Math.random() * CHAT_PHRASES.BIKE_FX.length)
                ];
              floaters.push({
                x: player.x,
                y: player.y - 80,
                text: bikeText,
                color: '#4ade80',
                scale: 1.45,
                vy: -2,
                alpha: 1,
                life: 45,
              });

              for (let i = 0; i < 18; i++) {
                particles.push({
                  x: player.x,
                  y: player.y - 30,
                  vx: (Math.random() - 0.5) * 9,
                  vy: (Math.random() - 0.5) * 9,
                  radius: 3 + Math.random() * 4,
                  alpha: 1,
                  color: i % 2 === 0 ? '#22c55e' : '#facc15',
                  life: 32,
                  star: true,
                });
              }
            } else {
              // Energy Drink collected!
              drinksCount++;
              player.energy = Math.min(100, player.energy + PHYSICS.BOOST_ENERGY_REFILL);
              player.boostTimer = PHYSICS.BOOST_DURATION;
              score += 25;
              sound.playGulp();

              const fxText =
                CHAT_PHRASES.POWER_FX[
                  Math.floor(Math.random() * CHAT_PHRASES.POWER_FX.length)
                ];
              floaters.push({
                x: player.x,
                y: player.y - 70,
                text: fxText,
                color: '#38bdf8',
                scale: 1.4,
                vy: -2,
                alpha: 1,
                life: 35,
              });

              for (let i = 0; i < 14; i++) {
                particles.push({
                  x: player.x,
                  y: player.y - 30,
                  vx: (Math.random() - 0.5) * 7,
                  vy: (Math.random() - 0.5) * 7,
                  radius: 3 + Math.random() * 3,
                  alpha: 1,
                  color: i % 2 === 0 ? '#38bdf8' : '#fbbf24',
                  life: 30,
                  star: true,
                });
              }
            }
          }
        });
        pickups = pickups.filter((p) => !p.collected && p.x > -60);
      }

      // RENDER OBSTACLES
      renderObstacles(ctx, obstacles);

      // RENDER FLYING SANDALS
      renderSandals(ctx, sandals);

      // RENDER ENERGY DRINKS & BIKE RUSH PICKUPS
      renderPickups(ctx, pickups);

      // RENDER FRONT BLOCKERS
      renderBlockers(ctx, blockers);

      // RENDER CHASING MOB (Left side, with flaming torches at night!)
      if (gameState === 'PLAYING') {
        renderMob(ctx, mob, timeEnv.nightFactor);
      }

      // RENDER PROCEDURAL ANIMATED LEADER WITH HELD CHICKEN (and CNG Bike if active)
      if (!brawlActive) {
        renderLeader(ctx, player, leaderImg, leaderImgLoaded, timeEnv.nightFactor);
      } else {
        // RENDER GONO PITUNI BRAWL CLOUD
        renderBrawlCloud(ctx, brawlX, brawlY, brawlTimer, brawlParticles);
        brawlTimer--;
        if (brawlTimer <= 0 && !isGameOver) {
          isGameOver = true;
          sound.stopBGM();
          sound.playGameOver();
          if (onGameOverRef.current) {
            onGameOverRef.current({
              distance: Math.floor(distance),
              kicks: kicksCount,
              drinks: drinksCount,
              score: score,
            });
          }
        }
      }

      // RENDER FLOATING FEATHERS & CLEAN UP FADED ENTITIES
      renderFeathers(ctx, feathers);
      feathers = feathers.filter((f) => f.alpha > 0.02);

      // RENDER PARTICLES & FLOATERS
      renderParticles(ctx, particles);
      particles = particles.filter((p) => p.alpha > 0.02);
      renderFloaters(ctx, floaters);
      floaters = floaters.filter((f) => f.alpha > 0.02);

      ctx.restore();

      // SEND STATS TO REACT HUD ONLY WHEN PLAYING
      if (gameState === 'PLAYING') {
        if (onUpdateStatsRef.current) {
          onUpdateStatsRef.current({
            distance: Math.floor(distance),
            kicks: kicksCount,
            drinks: drinksCount,
            score: score,
            energy: Math.floor(player.energy),
            isBoosted: player.boostTimer > 0,
            boostPercent: Math.floor((player.boostTimer / PHYSICS.BOOST_DURATION) * 100),
            isBikeRush: player.bikeTimer > 0,
            bikePercent: Math.floor((player.bikeTimer / PHYSICS.BIKE_DURATION) * 100),
          });
        }
      }

      if (!isGameOver) {
        animationFrameId = requestAnimationFrame(updateAndRender);
      }
    };

    animationFrameId = requestAnimationFrame(updateAndRender);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('game:jump', handleJumpEvent);
      window.removeEventListener('game:kick', handleKickEvent);
      sound.stopBGM();
    };
  }, [gameState, customLeaderImg]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="game-canvas-el"
    />
  );
};

// ==========================================
// RENDERING HELPER FUNCTIONS
// ==========================================

// Color interpolation helper for smooth Day -> Sunset -> Night transitions
function lerpColor(hex1, hex2, t) {
  const clampT = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
  const r1 = parseInt(hex1.slice(1, 3), 16) || 0;
  const g1 = parseInt(hex1.slice(3, 5), 16) || 0;
  const b1 = parseInt(hex1.slice(5, 7), 16) || 0;
  const r2 = parseInt(hex2.slice(1, 3), 16) || 0;
  const g2 = parseInt(hex2.slice(3, 5), 16) || 0;
  const b2 = parseInt(hex2.slice(5, 7), 16) || 0;
  const r = Math.round(r1 + (r2 - r1) * clampT);
  const g = Math.round(g1 + (g2 - g1) * clampT);
  const b = Math.round(b1 + (b2 - b1) * clampT);
  return `rgb(${r}, ${g}, ${b})`;
}

// Compute smooth Day -> Sunset -> Night (Load-Shedding) state from distance (900m cycle)
function getTimeOfDayState(distance) {
  const safeDist = Number.isFinite(distance) && distance >= 0 ? distance : 0;
  const cycle = safeDist % 900;
  let sunsetFactor = 0;
  let nightFactor = 0;
  let phase;
  let mixColors;

  if (cycle < 220) {
    phase = 'DAY';
    mixColors = (dayHex) => dayHex;
  } else if (cycle < 310) {
    const t = (cycle - 220) / 90;
    sunsetFactor = t;
    phase = 'SUNSET';
    mixColors = (dayHex, sunsetHex) => lerpColor(dayHex, sunsetHex, t);
  } else if (cycle < 470) {
    sunsetFactor = 1;
    phase = 'SUNSET';
    mixColors = (_, sunsetHex) => sunsetHex;
  } else if (cycle < 560) {
    const t = (cycle - 470) / 90;
    sunsetFactor = 1 - t;
    nightFactor = t;
    phase = 'NIGHT';
    mixColors = (_, sunsetHex, nightHex) => lerpColor(sunsetHex, nightHex, t);
  } else if (cycle < 810) {
    nightFactor = 1;
    phase = 'NIGHT';
    mixColors = (_, _s, nightHex) => nightHex;
  } else {
    const t = (cycle - 810) / 90;
    nightFactor = 1 - t;
    phase = 'DAY';
    mixColors = (dayHex, _s, nightHex) => lerpColor(nightHex, dayHex, t);
  }

  return {
    phase,
    sunsetFactor,
    nightFactor,
    skyTop: mixColors('#0284c7', '#ea580c', '#020617'),
    skyMid: mixColors('#7dd3fc', '#fb923c', '#0f172a'),
    skyLow: mixColors('#fef9c3', '#fde047', '#1e1b4b'),
    skyGround: mixColors('#dcfce7', '#fef08a', '#0f172a'),
    hillColor: mixColors('#65a30d', '#4d7c0f', '#14532d'),
    treeColor: mixColors('#4d7c0f', '#3f6212', '#064e3b'),
    roadTop: mixColors('#a16207', '#92400e', '#334155'),
    roadMid: mixColors('#78350f', '#78350f', '#1e293b'),
    roadBot: mixColors('#451a03', '#451a03', '#0f172a'),
    sunY: 85 + sunsetFactor * 125 + nightFactor * 260,
  };
}

// 1. MULTI-LAYER PARALLAX BACKGROUND (Positive modulo guarantees no glitching tiles)
function renderParallax(ctx, skyOffset, farOffset, midOffset, roadOffset, shops, timeEnv) {
  const { nightFactor, sunsetFactor } = timeEnv;

  // Layer 0: Dynamic Sky Gradient (Day -> Sunset -> Load-Shedding Night)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, timeEnv.skyTop);
  skyGrad.addColorStop(0.45, timeEnv.skyMid);
  skyGrad.addColorStop(0.85, timeEnv.skyLow);
  skyGrad.addColorStop(1, timeEnv.skyGround);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, GAME_WIDTH, GROUND_Y);

  // Twinkling Stars & Crescent Moon during Night Load-Shedding
  if (nightFactor > 0.15) {
    ctx.save();
    for (let i = 0; i < 28; i++) {
      const sx = ((i * 173 - skyOffset * 0.2) % GAME_WIDTH + GAME_WIDTH) % GAME_WIDTH;
      const sy = 24 + ((i * 67) % 190);
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(Date.now() * 0.003 + i));
      ctx.fillStyle = `rgba(255, 255, 255, ${nightFactor * twinkle})`;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 4 === 0 ? 2 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing Crescent Moon
    ctx.globalAlpha = Math.min(1, nightFactor * 1.2);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(760, 82, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = timeEnv.skyTop;
    ctx.beginPath();
    ctx.arc(772, 74, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Radiant Sun (visible during Day & Sunset, dips below horizon at night)
  if (nightFactor < 0.85) {
    ctx.save();
    ctx.globalAlpha = 1 - nightFactor;
    ctx.fillStyle = sunsetFactor > 0.4 ? 'rgba(255, 237, 213, 0.92)' : 'rgba(254, 249, 195, 0.95)';
    ctx.beginPath();
    ctx.arc(750, timeEnv.sunY, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = sunsetFactor > 0.4 ? 'rgba(251, 146, 60, 0.35)' : 'rgba(253, 224, 71, 0.3)';
    ctx.beginPath();
    ctx.arc(750, timeEnv.sunY, 76, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Distant clouds
  ctx.fillStyle = `rgba(255, 255, 255, ${0.55 - nightFactor * 0.4})`;
  for (let i = 0; i < 4; i++) {
    const rawX = i * 320 - skyOffset * 0.4;
    const cx = (((rawX % (GAME_WIDTH + 200)) + (GAME_WIDTH + 200)) % (GAME_WIDTH + 200)) - 100;
    const cy = 60 + (i % 2) * 45;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.arc(cx + 25, cy - 8, 32, 0, Math.PI * 2);
    ctx.arc(cx + 52, cy, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 1: Far Background (Paddy fields, coconut trees)
  ctx.save();
  ctx.fillStyle = timeEnv.hillColor;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y - 50);
  for (let x = 0; x <= GAME_WIDTH; x += 40) {
    const treeH = 30 + Math.sin((x + farOffset) * 0.02) * 15;
    ctx.lineTo(x, GROUND_Y - treeH);
  }
  ctx.lineTo(GAME_WIDTH, GROUND_Y);
  ctx.lineTo(0, GROUND_Y);
  ctx.fill();

  // Coconut & Betel nut trees (নারকেল ও সুপারি গাছ)
  ctx.fillStyle = timeEnv.treeColor;
  ctx.strokeStyle = nightFactor > 0.5 ? '#1e293b' : '#78350f';
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    const rawTX = i * 200 - farOffset;
    const tx = (((rawTX % (GAME_WIDTH + 150)) + (GAME_WIDTH + 150)) % (GAME_WIDTH + 150)) - 50;
    const ty = GROUND_Y - 35;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + 8, ty - 60, tx + 4, ty - 110);
    ctx.stroke();
    for (let a = 0; a < 6; a++) {
      const angle = (a * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(tx + 4, ty - 110);
      ctx.lineTo(
        tx + 4 + Math.cos(angle) * 32,
        ty - 110 + Math.sin(angle) * 18
      );
      ctx.stroke();
    }
  }
  ctx.restore();

  // Layer 2: Midground Roadside Tong Dokan (চায়ের দোকান) & Posters (with night kerosene lamp!)
  shops.forEach((shop) => {
    renderTongDokan(ctx, shop.x, GROUND_Y, shop.poster, nightFactor);
  });

  // Layer 3: Foreground Road
  const roadGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
  roadGrad.addColorStop(0, timeEnv.roadTop);
  roadGrad.addColorStop(0.3, timeEnv.roadMid);
  roadGrad.addColorStop(1, timeEnv.roadBot);
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

  // Grass tufts along roadside
  ctx.fillStyle = timeEnv.treeColor;
  for (let x = 0; x < GAME_WIDTH; x += 30) {
    const rawGX = x - roadOffset * 0.7;
    const gx = ((rawGX % GAME_WIDTH) + GAME_WIDTH) % GAME_WIDTH;
    ctx.fillRect(gx, GROUND_Y - 4, 14, 5);
  }

  // Road markings / pebbles
  ctx.fillStyle = nightFactor > 0.5 ? '#94a3b8' : '#fbbf24';
  ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 3);

  ctx.fillStyle = nightFactor > 0.5 ? '#475569' : '#b45309';
  for (let i = 0; i < 8; i++) {
    const rawRX = i * 130 - roadOffset * 1.5;
    const rx = ((rawRX % GAME_WIDTH) + GAME_WIDTH) % GAME_WIDTH;
    ctx.fillRect(rx, GROUND_Y + 22, 45, 6);
  }
}

// Draw authentic Bangladeshi Tong Dokan (চায়ের দোকান)
function renderTongDokan(ctx, x, y, posterText, nightFactor = 0) {
  ctx.save();
  ctx.translate(x, y);

  // Wooden stilts / shop frame
  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, -110, 10, 110);
  ctx.fillRect(150, -110, 10, 110);

  // Corrugated tin roof (টিনের চালা)
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(-15, -110);
  ctx.lineTo(175, -110);
  ctx.lineTo(190, -90);
  ctx.lineTo(-25, -90);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tea stall wooden counter table
  ctx.fillStyle = '#b45309';
  ctx.fillRect(5, -45, 150, 45);

  // Hanging bunch of yellow bananas (কলার ছড়ি)
  ctx.fillStyle = '#eab308';
  for (let b = 0; b < 6; b++) {
    ctx.beginPath();
    ctx.ellipse(30 + (b % 3) * 8, -85 + Math.floor(b / 3) * 12, 4, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Steaming Kettle (কেটলি)
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(130, -56, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(124, -72, 12, 6); // lid
  // Steam puff
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(135, -80, 5, 0, Math.PI * 2);
  ctx.fill();

  // Warm Kerosene Lamp / Candle Glow inside Tong Dokan during Night Load-Shedding!
  if (nightFactor > 0.25) {
    ctx.save();
    const lampGrad = ctx.createRadialGradient(80, -78, 4, 80, -78, 85);
    lampGrad.addColorStop(0, `rgba(253, 224, 71, ${0.75 * nightFactor})`);
    lampGrad.addColorStop(0.5, `rgba(251, 146, 60, ${0.3 * nightFactor})`);
    lampGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = lampGrad;
    ctx.beginPath();
    ctx.arc(80, -78, 85, 0, Math.PI * 2);
    ctx.fill();

    // Hanging glowing Kupi / Hurricane bulb
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(80, -82, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Bengali satirical wall poster!
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(20, -40, 105, 30);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, -40, 105, 30);

  ctx.fillStyle = '#991b1b';
  ctx.font = 'bold 9px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(posterText, 72, -22);

  ctx.restore();
}

// Helper to draw an image centered and aspect-ratio-covered inside a bounding box
function drawImageCover(ctx, img, dx, dy, dw, dh) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  let sx, sy, sw, sh;
  if (ih > iw * 1.25) {
    // Tall portrait or full-body illustration (like 768x1024)
    // Focus cleanly on the head, face, and cap in the upper 35%
    sw = iw * 0.72;
    sh = sw;
    sx = (iw - sw) / 2;
    sy = Math.max(0, ih * 0.015);
  } else {
    // Standard square face photo / crop
    const size = Math.min(iw, ih);
    sx = (iw - size) / 2;
    sy = Math.max(0, (ih - size) * 0.1);
    sw = size;
    sh = size;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// 2. PROCEDURAL ARTICULATED LEADER WITH CUSTOM IMAGE RIG, FLAPPING CHICKEN & CNG BIKE
function renderLeader(ctx, player, leaderImg, leaderImgLoaded, nightFactor = 0) {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Running or Bike engine vibration bounce
  const bounce =
    player.bikeTimer > 0
      ? Math.sin(player.runCycle * 4) * 1.5
      : player.isGrounded
      ? Math.sin(player.runCycle * 2) * 2.5
      : 0;
  ctx.translate(0, bounce);

  // CNG / BIKE RUSH MODE RENDERING!
  if (player.bikeTimer > 0) {
    if (!player.isGrounded) {
      ctx.rotate(-0.08); // Cool wheelie tilt in air!
    }

    // Night Headlight Beam (bright yellow cone lighting the road ahead!)
    const beamGrad = ctx.createLinearGradient(34, -36, 260, -10);
    beamGrad.addColorStop(0, `rgba(254, 240, 138, ${0.55 + nightFactor * 0.35})`);
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(34, -36);
    ctx.lineTo(260, -75);
    ctx.lineTo(260, 8);
    ctx.closePath();
    ctx.fill();

    // Speed Boost Aura behind CNG
    ctx.save();
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-55, -24);
    ctx.lineTo(-85, -24);
    ctx.moveTo(-50, -40);
    ctx.lineTo(-78, -40);
    ctx.stroke();
    ctx.restore();

    // Rear & Front Spinning Wheels
    [-26, 26].forEach((wx) => {
      ctx.save();
      ctx.translate(wx, -13);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      // Rotating wheel spoke
      ctx.rotate(player.runCycle * 2);
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(6, 0);
      ctx.moveTo(0, -6);
      ctx.lineTo(0, 6);
      ctx.stroke();
      ctx.restore();
    });

    // Classic Bangladeshi Green & Yellow CNG / Scooter Body
    ctx.fillStyle = '#16a34a'; // Dhaka CNG Emerald Green
    ctx.beginPath();
    ctx.roundRect(-38, -42, 68, 22, 8);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Yellow CNG accent stripe & front shield
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-34, -29, 60, 5);
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.roundRect(14, -56, 20, 32, 6);
    ctx.fill();

    // Glowing Yellow Headlight
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(34, -36, 6, 0, Math.PI * 2);
    ctx.fill();

    // Leader sitting leaning forward on Bike/CNG
    ctx.save();
    ctx.translate(-4, 6);
    ctx.rotate(0.18);

    // Seated Leg resting on footrest
    drawLeg(ctx, 2, -48, 0.95, 1.3, 22, 20, '#1e3a8a');

    // Torso
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(-14, -88, 30, 40, 6);
    ctx.fill();

    // Head
    ctx.save();
    ctx.translate(2, -88);
    if (leaderImgLoaded && leaderImg && leaderImg.complete && leaderImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, -25, 22, 26, 0, 0, Math.PI * 2);
      ctx.clip();
      drawImageCover(ctx, leaderImg, -24, -53, 48, 56);
      ctx.restore();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -25, 22, 26, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(0, -20, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Right arm gripping handlebar
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, -76);
    ctx.lineTo(26, -60);
    ctx.stroke();

    // Panicked Chicken perched right on the CNG front hood!
    drawChicken(ctx, 24, -66, player.chickenFlap);

    ctx.restore();
    ctx.restore();
    return;
  }

  // Flying Kick Body Rotation
  if (player.isKicking) {
    ctx.rotate(-0.22); // Lean back dramatically during flying kick
  } else if (!player.isGrounded) {
    ctx.rotate(0.08); // Jump forward tilt
  } else {
    ctx.rotate(0.12); // Forward sprint lean
  }

  // Double-Jump Chicken Wing Flap Halo!
  if (player.doubleJumpTimer > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(-6, -64, 30, 18, Math.sin(player.chickenFlap) * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Super Boost Glow Aura ("লিডার পাওয়ার!")
  if (player.boostTimer > 0) {
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, -50, 38, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // KINEMATICS FOR ARTICULATED LEGS (Feet touch road at y=0, no sinking!)
  const hipX = 0;
  const hipY = -48;
  const thighLen = 25;
  const shinLen = 24;

  let hipAngle1, kneeAngle1, hipAngle2, kneeAngle2;

  if (player.isKicking) {
    // FLYING KICK POSE: Lead leg locked straight forward, back leg tucked
    hipAngle1 = 1.35; // Shoots straight forward horizontally!
    kneeAngle1 = 0.03; // Locked straight
    hipAngle2 = -0.85; // Back leg tucked
    kneeAngle2 = 1.6;
  } else if (!player.isGrounded) {
    // JUMP POSE: Tucked knees
    hipAngle1 = -0.75;
    kneeAngle1 = 1.45;
    hipAngle2 = -0.45;
    kneeAngle2 = 1.3;
  } else {
    // RUNNING CYCLE KINEMATICS
    hipAngle1 = Math.sin(player.runCycle) * 0.85;
    kneeAngle1 = Math.max(0, -Math.cos(player.runCycle) * 1.25);
    hipAngle2 = Math.sin(player.runCycle + Math.PI) * 0.85;
    kneeAngle2 = Math.max(0, -Math.cos(player.runCycle + Math.PI) * 1.25);
  }

  // Draw Back Leg (Left)
  drawLeg(ctx, hipX - 5, hipY, hipAngle2, kneeAngle2, thighLen, shinLen, '#1e3a8a');

  // Draw Torso (Stylish Denim Jacket matching Leader's photo)
  ctx.save();
  ctx.fillStyle = '#2563eb'; // Blue denim jacket
  ctx.beginPath();
  ctx.roundRect(-16, -90, 32, 42, 6);
  ctx.fill();
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Jacket collar & inner striped shirt
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-6, -90, 12, 18);
  ctx.fillStyle = '#1e293b';
  for (let s = -4; s <= 4; s += 3) {
    ctx.fillRect(s, -90, 1.5, 18); // Stripes
  }
  // Denim jacket collar flaps
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(-16, -90);
  ctx.lineTo(-6, -74);
  ctx.lineTo(-6, -90);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(16, -90);
  ctx.lineTo(6, -74);
  ctx.lineTo(6, -90);
  ctx.fill();
  ctx.restore();

  // Draw Head (Mapped from custom uploaded image with clean oval framing)
  ctx.save();
  const headBob = Math.sin(player.runCycle * 2) * 1.8;
  ctx.translate(0, -90 + headBob);

  if (leaderImgLoaded && leaderImg && leaderImg.complete && leaderImg.naturalWidth > 0) {
    ctx.save();
    // Smooth oval clip so the user's face is cleanly framed
    ctx.beginPath();
    ctx.ellipse(0, -25, 22, 26, 0, 0, Math.PI * 2);
    ctx.clip();

    // Draw the full head image filling the oval area clearly without distortion
    drawImageCover(ctx, leaderImg, -24, -53, 48, 56);
    ctx.restore();

    // Comic white outline around the face
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, -25, 22, 26, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // High-quality procedural fallback head with stylish black cap
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(0, -20, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -24, 17, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(2, -26, 18, 5);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(6, -19, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // DRAW PANICKED LIVE CHICKEN (Tucked under Left Arm)
  drawChicken(ctx, -8, -66, player.chickenFlap);

  // Draw Front Leg (Right)
  drawLeg(ctx, hipX + 4, hipY, hipAngle1, kneeAngle1, thighLen, shinLen, '#1d4ed8');

  // Draw Right Arm (Swinging or punch forward in kick)
  ctx.save();
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  if (player.isKicking) {
    // Arm pulled forward in karate guard
    ctx.beginPath();
    ctx.moveTo(8, -78);
    ctx.lineTo(-8, -70);
    ctx.lineTo(12, -60);
    ctx.stroke();
  } else {
    // Arm swinging opposite to lead leg
    const armAngle = -hipAngle1 * 0.7;
    ctx.beginPath();
    ctx.moveTo(8, -78);
    ctx.lineTo(8 + Math.sin(armAngle) * 22, -78 + Math.cos(armAngle) * 22);
    ctx.stroke();
  }
  ctx.restore();

  // Flying Kick Comic Energy Slash on Foot Tip
  if (player.isKicking) {
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(48, -38, 18, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(52, -38, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// Draw articulated leg with Thigh, Calf, and Sneaker
function drawLeg(ctx, hx, hy, hipAngle, kneeAngle, thighLen, shinLen, pantsColor) {
  const kneeX = hx + Math.sin(hipAngle) * thighLen;
  const kneeY = hy + Math.cos(hipAngle) * thighLen;

  const totalAngle = hipAngle + kneeAngle;
  const footX = kneeX + Math.sin(totalAngle) * shinLen;
  const footY = kneeY + Math.cos(totalAngle) * shinLen;

  ctx.save();
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.strokeStyle = pantsColor;

  // Thigh
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(kneeX, kneeY);
  ctx.stroke();

  // Calf / Shin
  ctx.beginPath();
  ctx.moveTo(kneeX, kneeY);
  ctx.lineTo(footX, footY);
  ctx.stroke();

  // Sneaker (White with red racing stripe)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(footX + 4, footY + 2, 9, 5, totalAngle, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(footX - 2, footY, 6, 3);
  ctx.restore();
}

// Draw panicked live Desi chicken under arm
function drawChicken(ctx, cx, cy, flapPhase) {
  ctx.save();
  ctx.translate(cx, cy);

  // Plump chicken body (Golden brown / white Desi fowl)
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 12, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Tail feathers pointing backward
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(-14, -2);
  ctx.lineTo(-24, -10);
  ctx.lineTo(-20, 2);
  ctx.closePath();
  ctx.fill();

  // Animated Flapping Wing!
  const wingAngle = Math.sin(flapPhase) * 0.75;
  ctx.save();
  ctx.translate(2, -4);
  ctx.rotate(wingAngle);
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.ellipse(0, -6, 10, 6, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Chicken Head & Red Comb (ঝুঁটি)
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(14, -6, 8, 0, Math.PI * 2);
  ctx.fill();

  // Red Comb
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(14, -14, 4, 0, Math.PI * 2);
  ctx.arc(18, -12, 3, 0, Math.PI * 2);
  ctx.fill();

  // Wide Panicked Googly Eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(15, -7, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  const pupilShake = (Math.random() - 0.5) * 1.5;
  ctx.arc(16 + pupilShake, -7 + pupilShake, 2, 0, Math.PI * 2);
  ctx.fill();

  // Open yellow beak screaming
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(19, -8);
  ctx.lineTo(27, -5);
  ctx.lineTo(19, -3);
  ctx.closePath();
  ctx.fill();

  // Dangling yellow claws
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 10);
  ctx.lineTo(-8, 18);
  ctx.moveTo(4, 10);
  ctx.lineTo(0, 18);
  ctx.stroke();

  ctx.restore();
}

// 3. RENDER CHASING MOB (Left side angry villagers with lathi, jharu, flaming torches at night!)
function renderMob(ctx, mob, nightFactor = 0) {
  ctx.save();
  ctx.translate(mob.currentX, GROUND_Y);

  // Night Load-Shedding Sweeping Flashlight Cone & Torch Aura!
  if (nightFactor > 0.2) {
    ctx.save();
    const beamGrad = ctx.createLinearGradient(10, -55, 290, -25);
    beamGrad.addColorStop(0, `rgba(254, 240, 138, ${0.5 * nightFactor})`);
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(8, -55);
    ctx.lineTo(290, -105);
    ctx.lineTo(290, 15);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Dynamic dust cloud behind the mob
  ctx.fillStyle = nightFactor > 0.5 ? 'rgba(71, 85, 105, 0.5)' : 'rgba(214, 196, 168, 0.55)';
  for (let i = 0; i < 4; i++) {
    const cx = -60 + i * 25 + Math.sin(mob.runCycle + i) * 6;
    const cy = -30 + (i % 2) * 15;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  // Villager 1: Village Elder / Matbor (Waving Bamboo Lathi or Torch at night!)
  drawMobMember(
    ctx,
    0,
    0,
    mob.runCycle,
    '#f8fafc',
    '#334155',
    nightFactor > 0.35 ? 'torch' : 'lathi',
    'elder',
    nightFactor
  );

  // Villager 2: Furious Youth in rolled green lungi waving Broom (ঝাড়ু)
  drawMobMember(
    ctx,
    -35,
    0,
    mob.runCycle + 1.2,
    '#15803d',
    '#1e293b',
    'jharu',
    'youth',
    nightFactor
  );

  // Villager 3: Angry Aunty in red saree brandishing a Sandal high
  drawMobMember(
    ctx,
    -70,
    0,
    mob.runCycle + 2.4,
    '#dc2626',
    '#fef08a',
    nightFactor > 0.35 ? 'torch' : 'sandal',
    'aunty',
    nightFactor
  );

  // Villager 4: Chacha with orange gamchha carrying Hurricane lantern (হারিকেন)
  drawMobMember(
    ctx,
    -105,
    0,
    mob.runCycle + 3.6,
    '#ea580c',
    '#475569',
    'hurricane',
    'chacha',
    nightFactor
  );

  // Speech bubble above mob!
  if (mob.currentShout) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, -115, 95, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mob.currentShout, 57, -98);
    ctx.restore();
  }

  ctx.restore();
}

// Draw individual mob member with weapon (supports flaming torch at night!)
function drawMobMember(ctx, ox, oy, phase, shirtColor, lungiColor, weapon, type, nightFactor = 0) {
  ctx.save();
  ctx.translate(ox, oy);

  // Running legs
  const leg1 = Math.sin(phase) * 0.7;
  const leg2 = Math.sin(phase + Math.PI) * 0.7;

  ctx.strokeStyle = '#ca8a04'; // Skin tone
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-4, -18);
  ctx.lineTo(-4 + Math.sin(leg1) * 20, Math.cos(leg1) * 18);
  ctx.moveTo(4, -18);
  ctx.lineTo(4 + Math.sin(leg2) * 20, Math.cos(leg2) * 18);
  ctx.stroke();

  // Lungi / Saree
  ctx.fillStyle = lungiColor;
  ctx.fillRect(-10, -28, 20, 16);

  // Shirt / Kurta
  ctx.fillStyle = shirtColor;
  ctx.fillRect(-12, -54, 24, 28);

  // Head
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.arc(0, -62, 11, 0, Math.PI * 2);
  ctx.fill();

  if (type === 'elder') {
    // White beard
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(3, -58, 6, 0, Math.PI);
    ctx.fill();
  } else if (type === 'chacha') {
    // Orange gamchha around head
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-10, -70, 20, 6);
  }

  // Angry eye
  ctx.fillStyle = '#000000';
  ctx.fillRect(2, -64, 3, 3);

  // Brandished Weapon (Waving furiously)
  const weaponWave = Math.sin(phase * 1.5) * 0.4;
  ctx.save();
  ctx.translate(6, -45);
  ctx.rotate(-0.8 + weaponWave);

  if (weapon === 'torch') {
    // Flaming Bamboo Torch (মশাল!) with flickering flame & halo
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(20, -28);
    ctx.stroke();

    const flicker = Math.sin(phase * 3) * 2.5;
    const glow = ctx.createRadialGradient(22, -34, 2, 22, -34, 38);
    glow.addColorStop(0, 'rgba(253, 224, 71, 0.95)');
    glow.addColorStop(0.45, 'rgba(249, 115, 22, 0.5)');
    glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(22, -34, 38, 0, Math.PI * 2);
    ctx.fill();

    // Flame teardrop
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(22, -34, 7, 12 + flicker * 0.4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(22, -32, 4, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (weapon === 'lathi') {
    // Bamboo stick (লাঠি)
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(24, -32);
    ctx.stroke();
  } else if (weapon === 'jharu') {
    // Broom (ঝাড়ু)
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(22, -26);
    ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(24, -30, 8, 12, 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (weapon === 'sandal') {
    // Flying slipper (স্যান্ডেল)
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(8, -25, 14, 7);
  } else if (weapon === 'hurricane') {
    // Hurricane lamp (extra bright at night)
    if (nightFactor > 0.2) {
      const hGlow = ctx.createRadialGradient(13, -18, 2, 13, -18, 30);
      hGlow.addColorStop(0, `rgba(254, 240, 138, ${0.8 * nightFactor})`);
      hGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = hGlow;
      ctx.beginPath();
      ctx.arc(13, -18, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#64748b';
    ctx.fillRect(6, -24, 10, 14);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(8, -22, 6, 8); // glowing flame
  }
  ctx.restore();

  ctx.restore();
}

// 4. RENDER OBSTACLES (Rickshaw Van, Speed Breaker, Dog, Bench)
function renderObstacles(ctx, obstacles) {
  obstacles.forEach((obs) => {
    ctx.save();
    ctx.translate(obs.x, obs.y);

    if (obs.type === 'rickshaw_van') {
      // Traditional Bangladeshi Three-Wheeled Van (টমটম / ভ্যানগাড়ি)
      // Wheels
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-22, -14, 14, 0, Math.PI * 2);
      ctx.arc(22, -14, 14, 0, Math.PI * 2);
      ctx.stroke();

      // Wooden flatbed planks
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-35, -28, 70, 12);
      // Red & Green paint accent
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-35, -34, 70, 6);

      // Vegetable / jute sack payload
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(-10, -42, 16, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(14, -40, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (obs.type === 'bench') {
      // Tea stall wooden bench
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-26, -22, 52, 8); // Bench top
      ctx.fillRect(-22, -14, 6, 14); // Left leg
      ctx.fillRect(16, -14, 6, 14); // Right leg
    } else if (obs.type === 'dog') {
      // Sleeping Desi Street Dog (ঘুমন্ত দেশি লাল কুত্তা)
      ctx.fillStyle = '#c2410c'; // Reddish-brown coat
      ctx.beginPath();
      ctx.ellipse(0, -10, 18, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Sleeping head
      ctx.beginPath();
      ctx.arc(14, -8, 7, 0, Math.PI * 2);
      ctx.fill();
      // Curled tail
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-16, -12, 6, 0, Math.PI);
      ctx.stroke();
      // "Zzz" sleeping letters
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('zZ', 10, -20);
    } else if (obs.type === 'mud_puddle') {
      // Glossy Brown Mud / Cow Dung Puddle (পিছলা কাদা!)
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(0, 2, 38, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#713f12';
      ctx.beginPath();
      ctx.ellipse(-6, 1, 24, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glossy mud highlight & tiny puddle bubbles
      ctx.fillStyle = '#a16207';
      ctx.beginPath();
      ctx.ellipse(10, 0, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Speed Breaker
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 12, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Black hazard stripes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-10, -10, 6, 10);
      ctx.fillRect(4, -10, 6, 10);
    }

    ctx.restore();
  });
}

// 4B. RENDER FLYING SANDALS (উড়ন্ত স্যান্ডেল)
function renderSandals(ctx, sandals) {
  sandals.forEach((s) => {
    ctx.save();
    ctx.translate(s.x, s.y);

    // Speed trail lines behind flying sandal
    if (!s.deflected) {
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, -4);
      ctx.lineTo(36, -4);
      ctx.moveTo(18, 4);
      ctx.lineTo(32, 4);
      ctx.stroke();
    }

    ctx.rotate(s.rot);
    // Classic Blue & White Bata Sponge Sandal
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(-15, -7, 30, 14, 5);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Sandal V-strap
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, -5);
    ctx.lineTo(6, 0);
    ctx.lineTo(-6, 5);
    ctx.stroke();

    ctx.restore();
  });
}

// 5. RENDER ROADSIDE ENERGY DRINKS & CNG/BIKE RUSH PICKUPS
function renderPickups(ctx, pickups) {
  pickups.forEach((p) => {
    ctx.save();
    const bob = Math.sin(p.floatPhase) * 6;
    ctx.translate(p.x, p.y + bob);

    if (p.type === 'bike_rush') {
      // Glowing Emerald & Gold CNG / Bike Rush Pickup!
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 18;

      // Circular power emblem background
      ctx.fillStyle = 'rgba(20, 83, 45, 0.85)';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Mini CNG Scooter icon
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.roundRect(-14, -8, 26, 12, 4);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-10, -2, 18, 3);
      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-8, 6, 5, 0, Math.PI * 2);
      ctx.arc(8, 6, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 10px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('সিএনজি!', 0, -28);
    } else {
      // Glowing Neon Aura
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;

      // Glass bottle / Energy Drink Can
      const canGrad = ctx.createLinearGradient(-10, -20, 10, 20);
      canGrad.addColorStop(0, '#0284c7');
      canGrad.addColorStop(0.5, '#38bdf8');
      canGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = canGrad;
      ctx.beginPath();
      ctx.roundRect(-10, -18, 20, 36, 4);
      ctx.fill();

      // Golden lightning bolt symbol ⚡
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(1, -10);
      ctx.lineTo(-4, 0);
      ctx.lineTo(2, 0);
      ctx.lineTo(-2, 10);
      ctx.lineTo(5, -1);
      ctx.lineTo(-1, -1);
      ctx.closePath();
      ctx.fill();

      // Bottle cap
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-6, -23, 12, 5);
    }

    ctx.restore();
  });
}

// 6. RENDER FRONT BLOCKERS (Angry villagers trying to tackle the Leader)
function renderBlockers(ctx, blockers) {
  blockers.forEach((b) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    if (b.kicked) {
      ctx.rotate(b.rot);
    }

    // Running legs
    const leg1 = Math.sin(b.runCycle) * 0.7;
    const leg2 = Math.sin(b.runCycle + Math.PI) * 0.7;
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-4, -16);
    ctx.lineTo(-4 + Math.sin(leg1) * 18, Math.cos(leg1) * 16);
    ctx.moveTo(4, -16);
    ctx.lineTo(4 + Math.sin(leg2) * 18, Math.cos(leg2) * 16);
    ctx.stroke();

    // Shirt & Pants
    ctx.fillStyle = b.clothesColor;
    ctx.fillRect(-12, -48, 24, 26);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-10, -22, 20, 12);

    // Head
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.arc(0, -56, 11, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(-4, -58, 3, 3);

    // Arms outstretched to tackle
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, -42);
    ctx.lineTo(-24, -40); // reaching forward
    ctx.stroke();

    // Speech bubble
    if (!b.kicked) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-30, -90, 60, 22, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 11px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.shout, 0, -75);
    }

    ctx.restore();
  });
}

// 7. RENDER GONO PITUNI BRAWL CLOUD ANIMATION
function renderBrawlCloud(ctx, bx, by, timer, particles) {
  ctx.save();
  ctx.translate(bx, by);

  // Rotating Puffy Dust Cloud
  const cloudCount = 8;
  for (let i = 0; i < cloudCount; i++) {
    const angle = (i * Math.PI * 2) / cloudCount + timer * 0.1;
    const r = 50 + Math.sin(timer * 0.3 + i) * 15;
    const cx = Math.cos(angle) * r;
    const cy = Math.sin(angle) * r;

    ctx.fillStyle = i % 2 === 0 ? 'rgba(241, 245, 249, 0.95)' : 'rgba(203, 213, 225, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  // Comic Title Banner in center: "গণপিটুনি!"
  ctx.save();
  ctx.rotate(Math.sin(timer * 0.2) * 0.1);
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.font = '900 32px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeText('গণপিটুনি!', 0, 10);
  ctx.fillText('গণপিটুনি!', 0, 10);
  ctx.restore();

  // Tumbling particles (Flying slippers, fists, feathers, stars)
  particles.forEach((p) => {
    p.x += p.vx * 0.2;
    p.y += p.vy * 0.2;
    p.rot += p.rotSpeed;

    ctx.save();
    ctx.translate(p.x - bx, p.y - by);
    ctx.rotate(p.rot);
    ctx.scale(p.scale, p.scale);

    if (p.type === 'sandal') {
      // Flying Bata Sandal
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect(-12, -6, 24, 12, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, -6, 8, 3);
    } else if (p.type === 'fist') {
      // Cartoon punching fist
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'feather') {
      // White chicken feather
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Comic star
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  ctx.restore();
}

// 8. RENDER DRIFTING FEATHERS
function renderFeathers(ctx, feathers) {
  feathers.forEach((f) => {
    f.x += f.vx;
    f.y += f.vy;
    f.rot += f.rotSpeed;
    f.alpha -= 0.015;

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rot);
    ctx.fillStyle = f.color;
    ctx.globalAlpha = Math.max(0, f.alpha);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// 9. RENDER GENERAL PARTICLES
function renderParticles(ctx, particles) {
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.035;

    ctx.save();
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// 10. RENDER FLOATING COMIC TEXTS
function renderFloaters(ctx, floaters) {
  floaters.forEach((f) => {
    f.y += f.vy;
    f.alpha -= f.life > 45 ? 0.012 : 0.025;

    ctx.save();
    ctx.globalAlpha = Math.max(0, f.alpha);
    ctx.fillStyle = f.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.font = `900 ${Math.round(20 * f.scale)}px "Hind Siliguri", sans-serif`;
    ctx.textAlign = 'center';
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  });
}

export default GameCanvas;
