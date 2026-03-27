// ── Pre-built Program Presets ─────────────────────────────────────────────────

const PRESETS = [
  {
    id: 'volleyball_foundation',
    name: 'Volleyball Foundation',
    description: '5-day programme built around volleyball athleticism — power, shoulder health, lateral movement, rotational strength and landing mechanics.',
    daysPerWeek: 5,
    goal: 'athletic',
    tags: ['Volleyball', 'Power', 'Athletic'],

    // Default schedule: Mon–Fri
    defaultSchedule: { mon: 'vb_day1', tue: 'vb_day2', wed: 'vb_day3', thu: 'vb_day4', fri: 'vb_day5', sat: null, sun: null },

    days: [
      // ── DAY 1 ─────────────────────────────────────────────────────────────
      {
        id: 'vb_day1',
        name: 'Day 1 — Lower Power',
        focus: 'Quads, Glutes, Shoulders, Chest',
        exercises: [
          {
            id: 'front_squat',
            name: 'Front Squat',
            muscleGroup: 'Quads',
            cue: 'Bar on front delts, elbows high. More upright torso than back squat. Greater quad emphasis. Demands thoracic mobility. Clean grip or cross-arm grip.',
            sets: 3, reps: '12', weight: 60,
          },
          {
            id: 'side_lunge',
            name: 'Side Lunge',
            muscleGroup: 'Quads',
            cue: 'Step wide to one side, pushing hips back and down into the lunge. Keep chest up and grounded foot flat. Inner thigh and glute stretch at bottom. Drive through heel to return. Key for lateral athletic movement.',
            sets: 3, reps: '10', weight: 0,
          },
          {
            id: 'barbell_ohp',
            name: 'Shoulder Press',
            muscleGroup: 'Shoulders',
            cue: 'Bar rests on front delts. Brace core and glutes. Press straight up, head shifts back to allow bar path. Lock out fully overhead. Bar returns to chin level.',
            sets: 3, reps: '10', weight: 50,
          },
          {
            id: 'db_bench',
            name: 'DB Chest Press',
            muscleGroup: 'Chest',
            cue: 'Neutral or pronated grip. Let elbows drop to chest level at bottom. Squeeze at top without fully locking out. Greater stretch than barbell.',
            sets: 3, reps: '12', weight: 22,
          },
          {
            id: 'single_leg_tband_pull',
            name: 'Single Leg T-Band Pull',
            muscleGroup: 'Glutes',
            cue: 'Anchor a resistance band at foot height. Stand on one leg, slight knee bend. Pull the band back behind you in a controlled hip extension while maintaining balance. Keep hips level throughout — don\'t rotate.',
            sets: 3, reps: '10', weight: 0,
          },
        ],
      },

      // ── DAY 2 ─────────────────────────────────────────────────────────────
      {
        id: 'vb_day2',
        name: 'Day 2 — Upper Push + Shoulder Health',
        focus: 'Chest, Shoulders, Triceps, Rotator Cuff',
        exercises: [
          {
            id: 'incline_barbell_bench',
            name: 'Incline Barbell Bench Press',
            muscleGroup: 'Chest',
            cue: 'Set bench to 30–45°. Keep elbows at ~60° from torso. Touch upper chest. Upper chest and shoulder strength is key for spiking power.',
            sets: 4, reps: '8', weight: 70,
          },
          {
            id: 'seated_db_press',
            name: 'Seated Dumbbell Press',
            muscleGroup: 'Shoulders',
            cue: 'Sit at 90° back support. Dumbbells at ear level to start. Press overhead without internally rotating at top. Full lockout. Neutral spine. Key pressing strength for spiking arm.',
            sets: 3, reps: '10', weight: 18,
          },
          {
            id: 'lateral_raise_db',
            name: 'Lateral Raise',
            muscleGroup: 'Shoulders',
            cue: 'Lead with elbows, not wrists. Slight forward lean and bend in elbows. Raise to shoulder height only. Slow 3-second eccentric. Shoulder width stability is crucial for blocking.',
            sets: 3, reps: '15', weight: 8,
          },
          {
            id: 'face_pull',
            name: 'Face Pull',
            muscleGroup: 'Rear Delts',
            cue: 'Cable at head height, rope attachment. Pull to face with elbows high and flared. Externally rotate at the end — hands finish above elbows. Non-negotiable for volleyball shoulder health — do these every session.',
            sets: 3, reps: '15', weight: 15,
          },
          {
            id: 'band_pull_apart',
            name: 'Band Pull-Apart',
            muscleGroup: 'Rear Delts',
            cue: 'Hold a resistance band at shoulder width, arms straight in front. Pull the band apart by squeezing shoulder blades together. Slow and controlled — feel the rear delts and rotator cuff engage. Essential prehab for the high shoulder demands of volleyball.',
            sets: 3, reps: '20', weight: 0,
          },
          {
            id: 'cable_pushdown',
            name: 'Cable Tricep Pushdown',
            muscleGroup: 'Triceps',
            cue: 'Elbows pinned at sides. Only lower arm moves. Full extension at bottom. Tricep strength contributes to spiking arm speed and follow-through.',
            sets: 3, reps: '12', weight: 20,
          },
        ],
      },

      // ── DAY 3 ─────────────────────────────────────────────────────────────
      {
        id: 'vb_day3',
        name: 'Day 3 — Power + Plyometrics',
        focus: 'Full Body Power, Explosive Strength',
        exercises: [
          {
            id: 'deadlift',
            name: 'Deadlift',
            muscleGroup: 'Back',
            cue: 'Bar over mid-foot. Hip hinge, neutral spine. Push the floor away. Lock out hips and knees simultaneously. Foundation of total-body power for jumping and landing.',
            sets: 3, reps: '8', weight: 100,
          },
          {
            id: 'power_shrug',
            name: 'Power Shrug',
            muscleGroup: 'Traps',
            cue: 'Explosively extend hips, knees and ankles (triple extension) then shrug hard. Don\'t pull with arms — let momentum carry the bar. Trains the power chain from legs to upper body used in jumping and spiking.',
            sets: 4, reps: '6', weight: 80,
          },
          {
            id: 'barbell_row',
            name: 'Bent Over Row',
            muscleGroup: 'Back',
            cue: 'Hinge to ~45°, chest up, brace core. Pull bar to lower chest. Lead with elbows. Squeeze lats at top. Control descent.',
            sets: 3, reps: '10', weight: 70,
          },
          {
            id: 'box_jump',
            name: 'Box Jump 24"',
            muscleGroup: 'Quads',
            cue: 'Stand arms-length from box. Dip and swing arms, explode upward — land softly with bent knees. Step down (don\'t jump down). Maximum intent every rep. Rest fully between sets — this is power work.',
            sets: 5, reps: '5', weight: 0,
          },
          {
            id: 'squat_jump',
            name: 'Squat Jump',
            muscleGroup: 'Quads',
            cue: 'Quarter-squat then explode upward with maximum intent — arms drive overhead. Land toe-heel with soft knees, absorb and immediately go again. Every rep should be as explosive as the first. Directly trains approach-jump mechanics.',
            sets: 4, reps: '5', weight: 0,
          },
        ],
      },

      // ── DAY 4 ─────────────────────────────────────────────────────────────
      {
        id: 'vb_day4',
        name: 'Day 4 — Lower Accessory + Lateral + Core',
        focus: 'Hamstrings, Glutes, Lateral Power, Core Stability',
        exercises: [
          {
            id: 'bulgarian_split_squat',
            name: 'Bulgarian Split Squat',
            muscleGroup: 'Quads',
            cue: 'Rear foot elevated. Front foot far enough forward that torso stays upright. Lower back knee toward floor. Builds single-leg strength critical for landing safely after jumps.',
            sets: 3, reps: '10', weight: 20,
          },
          {
            id: 'single_leg_rdl',
            name: 'Single Leg Romanian Deadlift',
            muscleGroup: 'Hamstrings',
            cue: 'Hinge forward on one leg, opposite leg extends behind. Keep hips square — don\'t let them rotate open. Feel deep hamstring stretch, squeeze glute to return. Develops the single-leg stability needed for safe landing after blocks and attacks.',
            sets: 3, reps: '10', weight: 16,
          },
          {
            id: 'leg_press',
            name: 'Leg Press',
            muscleGroup: 'Quads',
            cue: 'Feet shoulder-width, mid-height on platform. Full range without locking knees. Volume work to build quad strength that supports jumping capacity.',
            sets: 3, reps: '12', weight: 120,
          },
          {
            id: 'lateral_bound',
            name: 'Lateral Bound',
            muscleGroup: 'Glutes',
            cue: 'Push explosively off one foot to bound sideways, landing on the opposite foot. Stick the landing — absorb, stabilise, then bound back. Mimics lateral push-off and landing mechanics in volleyball defence and approach footwork.',
            sets: 3, reps: '8', weight: 0,
          },
          {
            id: 'pallof_press',
            name: 'Pallof Press',
            muscleGroup: 'Core',
            cue: 'Stand side-on to a cable at chest height. Press straight out, hold 2 seconds, return. The cable wants to rotate you — resist it completely. Trains the anti-rotation core stiffness needed to transfer force from legs to arm in a spike.',
            sets: 3, reps: '12', weight: 12,
          },
          {
            id: 'hanging_leg_raise',
            name: 'Hanging Leg Raise',
            muscleGroup: 'Core',
            cue: 'Dead hang, no swing. Raise legs to 90° or higher. Control the descent. Posterior pelvic tilt at the top. Strong hip flexors and core are essential for jump height and landing control.',
            sets: 3, reps: '12', weight: 0,
          },
        ],
      },

      // ── DAY 5 ─────────────────────────────────────────────────────────────
      {
        id: 'vb_day5',
        name: 'Day 5 — Upper Pull + Rotational Power',
        focus: 'Back, Biceps, Rotational Strength, Shoulder Health',
        exercises: [
          {
            id: 'pullup',
            name: 'Pull-Up',
            muscleGroup: 'Back',
            cue: 'Overhand grip, slightly wider than shoulder width. Pull chest to bar, not chin. Depress and retract scapula before pulling. Full hang at bottom. Vertical pulling strength is essential for blocking reach and overhead stability.',
            sets: 4, reps: '8', weight: 0,
          },
          {
            id: 'lat_pulldown',
            name: 'Lat Pulldown',
            muscleGroup: 'Back',
            cue: 'Slight lean back, chest up. Pull bar to upper chest, leading with elbows. Squeeze lats hard. Slow return — resist on the way up. Builds the lat strength that stabilises the shoulder during spiking deceleration.',
            sets: 3, reps: '10', weight: 60,
          },
          {
            id: 'seated_cable_row',
            name: 'Seated Cable Row',
            muscleGroup: 'Back',
            cue: 'Sit tall, slight lean. Pull to lower sternum, elbows close to body. Squeeze rhomboids at the end. Don\'t rock torso. Horizontal pulling balances the high volume of overhead spiking.',
            sets: 3, reps: '12', weight: 55,
          },
          {
            id: 'landmine_rotation',
            name: 'Landmine Rotation',
            muscleGroup: 'Core',
            cue: 'Fix one end of a barbell in a corner. Hold the other end with both hands at chest height. Rotate side to side, driving from the hips — not just the arms. Trains the rotational power chain used in spiking: hips rotate first, core transfers, shoulder follows.',
            sets: 3, reps: '10', weight: 20,
          },
          {
            id: 'face_pull',
            name: 'Face Pull',
            muscleGroup: 'Rear Delts',
            cue: 'Cable at head height, rope attachment. Pull to face with elbows high and flared. Externally rotate at end — hands finish above elbows. Do these every upper body session without exception.',
            sets: 3, reps: '15', weight: 15,
          },
          {
            id: 'band_pull_apart',
            name: 'Band Pull-Apart',
            muscleGroup: 'Rear Delts',
            cue: 'Hold resistance band at shoulder width, arms straight in front. Pull apart by squeezing shoulder blades together. Slow and controlled. Finishing every upper day with these keeps the rotator cuff resilient across a long season.',
            sets: 3, reps: '20', weight: 0,
          },
        ],
      },
    ],

    progression: {
      week1: 'Foundation — establish movement patterns and baseline loads across all 5 days',
      week2: 'Volume increase — add 1 set to main compounds on Day 1, 3 and 5',
      week3: 'Intensity shift — reduce reps on squats and deadlift (3×8→3×6), increase weight 5–10%',
      week4: 'Peak — heaviest loads on compound lifts. Reduce plyometric volume by 30% to allow CNS recovery',
    },
  },
];
