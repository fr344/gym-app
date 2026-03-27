// ── Claude API Integration ────────────────────────────────────────────────────

const AI = {
  async generateProgram(params) {
    const apiKey = await DB.getApiKey();
    if (!apiKey) throw new Error('NO_API_KEY');

    const {
      daysPerWeek,    // number: 3-5
      equipment,      // array: ['barbell', 'dumbbell', 'cables', 'machines', 'bodyweight']
      goal,           // string: 'strength' | 'hypertrophy' | 'athletic'
      programName,    // string: user-provided name
    } = params;

    const prompt = `You are an expert strength and conditioning coach. Generate a ${daysPerWeek}-day per week gym program for an ADVANCED lifter.

Goals: ${goal}
Available equipment: ${equipment.join(', ')}
Session length: ~1 hour
Program duration: 4 weeks

Rules:
- Advanced lifter: use compound movements, meaningful intensity
- Include progressive overload week to week (increase sets or weight by week 3-4)
- Each session: 5-7 exercises max (respect the 1hr target)
- Mix of compound and isolation work
- Weights in kg, realistic for an advanced male lifter
- Reps as a string like "6-8" or "10-12" or "5"
- Include brief coaching notes per exercise

Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:

{
  "name": "${programName || goal + ' Program'}",
  "daysPerWeek": ${daysPerWeek},
  "goal": "${goal}",
  "days": [
    {
      "id": "day1",
      "name": "Push",
      "focus": "Chest, Shoulders, Triceps",
      "exercises": [
        {
          "id": "ex1",
          "name": "Barbell Bench Press",
          "muscleGroup": "Chest",
          "sets": 4,
          "reps": "6-8",
          "weight": 80,
          "notes": "Control the eccentric, pause at chest"
        }
      ]
    }
  ],
  "progression": {
    "week1": "Establish baseline, moderate intensity",
    "week2": "Add 1 set to main compounds",
    "week3": "Increase weight 2.5-5kg on compounds",
    "week4": "Deload: reduce volume by 40%, maintain intensity"
  }
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const text = data.content[0].text.trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON if model added any surrounding text
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Invalid response from AI');
      parsed = JSON.parse(match[0]);
    }

    // Attach metadata
    parsed.id = DB.generateId();
    parsed.createdAt = new Date().toISOString();
    parsed.isActive = true;

    return parsed;
  },
};
