/**
 * Every word on this deck. Edit here, not in deck.jsx.
 *
 * Inline markup in any string: **bold** and `code`.
 * A slide renders its fields in this order:
 *   kicker, h1, h2, quote, rule, figure | image | code | table, bullets,
 *   cards, body, caption, sub
 * `figure`, `art` and `image` name a component or asset that deck.jsx maps.
 * `figures` below holds the words inside the animated figures: the caption
 * under the controls, the row labels, and one note per step.
 */
export default {
  slides: [
    {
      variant: 'title',
      art: 'titleArt',
      kicker: 'Paper Club · 12 Sep 2026',
      h1: 'Speculative Decoding',
      rule: true,
      sub: 'presented by Karneeshkar',
    },
    {
      kicker: 'The bottleneck',
      h2: 'One committed token, one target-model pass.',
      figure: 'baselineLoop',
      body: 'Tokens leave the model left to right, one commit per pass. On a long generation this loop, not the arithmetic inside it, sets the pace.',
    },
    {
      kicker: 'The question',
      quote: 'Can we keep the output behaviour of the original model, and stop advancing only one token per pass?',
      rule: true,
      body: 'Speculative decoding splits **proposal** from **verification**. The original model stays on as the target and still decides every token. A cheaper draft component sits in front of it.',
    },
    {
      kicker: 'Core idea',
      h2: 'Draft, then verify.',
      figure: 'round',
      body: 'One target-model pass scores every candidate position. Accepted tokens commit. At the first rejection the target model supplies the token itself, and the rest of the proposal goes nowhere.',
    },
    {
      kicker: 'The round',
      h2: 'Draft, verify, commit.',
      image: 'figure01',
      alt: 'A draft component proposes candidate tokens, the target model verifies them, accepted tokens are committed.',
      caption: 'Draft proposes · target verifies · accepted tokens commit',
    },
    {
      kicker: 'Worked example',
      h2: '"The weather today is …"',
      figure: 'weather',
      body: 'The target keeps **sunny** and **and**. At position 3 the draft says **warm**, the target says **clear**, and **outside** never gets a chance. Three tokens, one pass.',
    },
    {
      kicker: 'Accept / reject',
      h2: 'Accept, reject, discard.',
      image: 'figure02',
      alt: 'Green draft tokens are accepted, the red box is the first rejected token, the gray box is discarded, and the blue token comes from the target model.',
      caption: 'Green accepted · red first rejection · gray discarded · blue from the target model',
    },
    {
      kicker: 'Verification',
      h2: 'Computationally parallel, logically autoregressive.',
      figure: 'causalMask',
      body: 'The target model reads all four proposals in one forward pass. The causal mask sets every future position to minus infinity, so position 3 reads the context and the two tokens before it, never the fourth.',
    },
    {
      kicker: 'Verification',
      h2: 'One pass gives one distribution per position.',
      figure: 'onePass',
      body: 'A forward pass does not return one distribution. It returns a hidden state for every input position, and the LM head turns each one into logits over the whole vocabulary. For 4 positions and a 150k vocabulary that is a 4 x 150000 matrix, and every row becomes a distribution after softmax.',
    },
    {
      kicker: 'Verification',
      h2: 'Greedy: accept while the target agrees.',
      code: `context:  The capital of France is

draft:    Paris   and   it      is
target:   Paris   and   the     city
          accept  accept reject  never scored`,
      body: 'Accept a draft token when it is the token the target itself would have picked. Stop at the first mismatch and take the target token there. Three committed tokens for one target pass.',
    },
    {
      kicker: 'Verification',
      h2: 'Sampling: accept with min(1, p/q).',
      figure: 'acceptSample',
      body: 'Checking the top token would bend the distribution, so sampling uses a coin. On a rejection the target samples from max(0, p − q) instead of from p. That correction is why the output distribution is the same as sampling from the target directly.',
    },
    {
      kicker: 'Verification',
      h2: 'Accepted tokens are already in the cache.',
      figure: 'kvCommit',
      body: 'While it verifies, the target model does a normal forward pass: hidden states, logits, and K and V for every proposed position. Accepted entries stay in the cache, so nothing is recomputed. The rest become dead blocks the engine reclaims.',
    },
    {
      kicker: 'Why it pays',
      h2: 'K accepted tokens, K+1 committed.',
      bullets: [
        'Without speculation, 5 tokens cost 5 target passes. The dependency is real: the tokens do not exist yet.',
        'The draft supplies them, so the target turns decode steps into one prefill-shaped matrix multiply.',
        'When all K proposals pass, the same pass also gives the distribution for the next token. That bonus token makes it K+1.',
        'A rejection at position 3 wastes positions 3 and 4. Their K and V were computed under a prefix that no longer exists.',
      ],
    },
    {
      kicker: 'Where methods differ',
      h2: 'Same loop. Different draft component.',
      bullets: [
        'What information it takes from the target model.',
        'How that information enters the drafting process.',
        'Whether candidates come out sequentially or in parallel.',
      ],
      cards: [
        { h3: 'Native MTP', p: 'Built into the target architecture. Model-native auxiliary path. Sequential.' },
        { h3: 'Separate MTP drafter', p: 'Own checkpoint, paired with one target. Uses target activations and the shared KV cache. Sequential.' },
        { h3: 'Target-conditioned network', p: 'EAGLE-3, DFlash, DSpark. Trained for one target from its hidden states.' },
      ],
    },
    {
      kicker: 'Native MTP',
      h2: 'An auxiliary head the model already has.',
      bullets: [
        'Step one takes a target hidden representation and the current token, and predicts draft token 1.',
        'Every later step takes the previous MTP hidden state and the latest draft token.',
        'The fusion is model specific. Concatenate on the hidden dimension, project, run the prediction layer.',
      ],
      body: 'Physical MTP depth and `num_speculative_tokens` are separate. vLLM can reuse the MTP path for extra passes, so a larger N means more candidates and more sequential drafting.',
      caption: 'Shares weights with the target, so the memory overhead stays modest',
    },
    {
      kicker: 'Gemma 4 MTP',
      h2: 'A separate checkpoint that still lives inside the target.',
      bullets: [
        'Own checkpoint, paired with one specific Gemma 4 target.',
        'Reads target-model activations and **shares the target KV cache**.',
        'It never reprocesses the accepted prefix on its own.',
        'It emits candidates one at a time, like native MTP.',
      ],
      caption: 'You pass it in the model field, but it runs the MTP path',
    },
    {
      kicker: 'EAGLE-3',
      h2: 'Three target layers, fused into one feature.',
      figure: 'eagle3',
      body: 'The fused feature carries the accepted sequence. The token embedding says where drafting starts. Later positions have no target hidden state yet, so EAGLE-3 feeds its own output back in.',
    },
    {
      kicker: 'DFlash',
      h2: 'A whole block, in one pass.',
      figure: 'dflash',
      body: 'EAGLE-3 hands the target context to its draft network once, at the input. DFlash turns the same context into extra Key and Value inside every draft layer.',
    },
    {
      kicker: 'DSpark',
      h2: 'Parallel block, light sequential fix.',
      figure: 'dspark',
      bullets: [
        'A Markov head biases each position with the token already selected before it.',
        'A confidence head can submit a shorter prefix - not active in the vLLM path tested here.',
      ],
    },
    {
      kicker: 'The real trade',
      h2: 'Draft passes against intra-block feedback.',
      figure: 'seqVsParallel',
      body: 'Sequential drafting buys token-by-token conditioning and pays one draft pass per candidate. Parallel drafting pays once and gives that conditioning up. Neither wins on paper. The measurements decide.',
    },
    {
      kicker: 'All five',
      h2: 'Five methods, side by side.',
      image: 'figureMethods',
      alt: 'Side-by-side comparison of native MTP, Gemma 4 MTP, EAGLE-3, DFlash and DSpark draft components.',
    },
    {
      kicker: 'Summary table',
      h2: 'What each one takes, and how it emits.',
      table: {
        head: ['Method', 'Target information used', 'Generation'],
        rows: [
          ['Native MTP', 'Target or previous MTP hidden representation + current draft token', 'Sequential, repeated MTP path'],
          ['Gemma 4 MTP', 'Target activations + shared target KV cache', 'Sequential, paired component'],
          ['EAGLE-3', 'Early, middle and late hidden states fused into one feature', 'Sequential, each token feeds the next'],
          ['DFlash', 'Fused hidden states as extra K/V in every draft layer', 'All positions in one parallel pass'],
          ['DSpark', 'Same as DFlash, plus a Markov head', 'One parallel pass, then light sequential adjustment'],
        ],
      },
      caption: 'In all five, the target model verifies in one pass and commits left to right',
    },
    {
      kicker: 'Checkpoints',
      h2: 'Who publishes draft models.',
      table: {
        head: ['Publisher', 'Methods', 'Targets'],
        rows: [
          ['Google', 'Gemma 4 MTP', 'Gemma 4 E2B, E4B, 12B, 26B-A4B, 31B'],
          ['Red Hat AI', 'EAGLE-3, DFlash, DSpark', 'Llama, Qwen, Gemma, GPT-OSS, GLM, Nemotron, Mistral'],
          ['Z-Lab', 'DFlash', 'Qwen3 / 3.5 / 3.6, Gemma 4, Kimi, MiniMax, GPT-OSS, Llama'],
          ['DeepSeek AI', 'EAGLE-3, DFlash, DSpark', 'DeepSpec: Qwen3 4B / 8B / 14B, Gemma 4 12B'],
          ['LightSeek', 'EAGLE-3, EAGLE-3.1', 'Kimi-K2.5, K2.6, K2.7-Coder'],
          ['Inferact', 'EAGLE-3, DSpark', 'MiniMax-M3, Kimi-K3'],
        ],
      },
    },
    {
      kicker: 'Measurements',
      h2: 'Throughput against the non-speculative baseline.',
      figure: 'throughput',
    },
    {
      kicker: 'What the numbers say',
      h2: 'It depends on the pair, not on the method.',
      bullets: [
        'Top of the range: **2.87×** DFlash on gemma-4-26B-A4B-it (MATH500), **2.83×** Gemma 4 MTP on the same target, **2.68×** DFlash on Kimi-K2.5.',
        'Qwen3-8B stayed between 1.08× and 1.63×, and EAGLE-3 on MATH500 fell **below** baseline at 0.88×.',
        'Native MTP beat DFlash on Qwen3.5-27B, 3.5-122B-A10B and 3.6-27B, then lost to it on 3.6-35B-A3B. Same family.',
        'Best N moved around. Sequential methods plateaued after a few values. DFlash and DSpark were often best at N=7.',
      ],
      caption: 'Every number is tied to its hardware, checkpoint, workload and sweep',
    },
    {
      kicker: 'Tuning',
      h2: 'Proposal length is a runtime setting, not a constant.',
      bullets: [
        'Native MTP: start at `N=1`, confirm stability, then sweep 2-7.',
        'DFlash: a checkpoint with `block_size = 16` allows `N=15` at most, because position 0 is the anchor. Test 3, 7, 11, 15.',
        'A wider window gives more chances to commit several tokens, but acceptance falls at later positions. When it does, the extra candidates add drafting and verification work for nothing.',
      ],
      body: 'Reasoning sets (GSM8K, MATH500) favoured medium to deep proposals. Code sets (HumanEval, MBPP) favoured moderate ones. Local structure in code is predictable. Identifiers and formatting are not.',
    },
    {
      kicker: 'Observability',
      h2: 'Watch four signals, decide on one.',
      table: {
        head: ['Signal', 'What it tells you'],
        rows: [
          ['Throughput', 'End-to-end change against the non-speculative baseline'],
          ['Mean accepted length', 'Tokens committed per speculative round'],
          ['Overall acceptance rate', 'Share of proposed tokens that survive'],
          ['Per-position acceptance', 'Whether later positions still earn their cost'],
        ],
      },
      body: 'A high acceptance rate is not the goal. A cheap drafter can win with lower acceptance, and an expensive one can lose with higher. Pick on end-to-end throughput.',
    },
    {
      kicker: 'Training your own',
      h2: 'The speculator must be trained on its target.',
      bullets: [
        'Use prompts that match the workload, and hold back a separate evaluation set.',
        'Responses generated by **the exact target model**. Reusing other responses with the target tokenizer does not make them target specific.',
        'Hidden states: **online** (no disk, needs inference and training together), **offline** (frees GPUs, needs storage), **hybrid** (cache during epoch 1, reuse after).',
        'Judge on accepted length, acceptance rate, draft latency, memory and serving throughput - not training loss.',
      ],
    },
    {
      variant: 'title',
      kicker: 'Takeaways',
      h1: 'Fast proposals, main verifiers.',
      rule: true,
      bullets: [
        'Cheap proposals, one honest verifier. The target still decides every token, so the output distribution does not move.',
        'The five methods differ in what they read from the target, and in sequential against parallel drafting.',
        'Several pairs cleared 2x. One fell below 1x. Measure your own pair before you ship it.',
        'Work the same way. Draft cheap versions fast, try several, and commit only to the ones that survive a real check.',
      ],
    },
  ],

  figures: {
    baselineLoop: {
      caption: 'Autoregressive decoding',
      labels: { sequence: 'sequence', passes: 'target passes' },
      notes: [
        '1 committed token · **1 target-model pass** · one pass per token, always',
        '2 committed tokens · **2 target-model passes** · one pass per token, always',
        '3 committed tokens · **3 target-model passes** · one pass per token, always',
        '4 committed tokens · **4 target-model passes** · one pass per token, always',
      ],
    },
    round: {
      caption: 'One speculative round',
      prompt: 'context',
      drafts: ['T1', 'T2', 'T3', 'T4'],
      acceptUpTo: 2,
      replacement: 'target token',
      labels: { prompt: 'prompt', propose: 'draft proposes', verify: 'target verifies', commit: 'commit' },
      words: { accept: 'accept', reject: 'reject', discard: 'discard' },
      notes: [
        'The target model has just committed a token.',
        'The draft component proposes several future tokens. Nothing is committed yet.',
        'One target-model pass scores every candidate position at once.',
        'Verification runs left to right and stops at the first rejection.',
        'Accepted tokens commit. The target token replaces the first rejection, and the rest go nowhere.',
      ],
    },
    weather: {
      caption: 'Accept / reject',
      prompt: 'The weather today is',
      drafts: ['sunny', 'and', 'warm', 'outside'],
      acceptUpTo: 2,
      replacement: 'clear',
      labels: { prompt: 'prompt', propose: 'draft proposes', verify: 'target verifies', commit: 'commit' },
      words: { accept: 'accept', reject: 'reject', discard: 'discard' },
      notes: [
        'The target model has just committed a token.',
        'The draft component proposes several future tokens. Nothing is committed yet.',
        'One target-model pass scores every candidate position at once.',
        'Verification runs left to right and stops at the first rejection.',
        'Accepted tokens commit. The target token replaces the first rejection, and the rest go nowhere.',
      ],
    },
    causalMask: {
      caption: 'Causal mask',
      labels: { pass: 'one pass', context: 'context', tokens: ['Paris', 'and', 'it', 'is'] },
      notes: [
        'Four proposed tokens enter the target model together.',
        'Position 1 reads the context only.',
        'Position 2 adds Paris.',
        'Position 3 adds and. It still cannot see is.',
        'Row by row the mask rebuilds the autoregressive order inside one pass.',
      ],
    },
    onePass: {
      caption: 'One pass, four distributions',
      labels: {
        input: 'input',
        hidden: 'hidden state',
        head: 'lm head',
        logits: 'logits',
        softmax: 'softmax',
        inputs: ['is', 'Paris', 'and', 'it'],
        predicts: ['Paris', 'and', 'it', 'is'],
      },
      notes: [
        'The last context token and the first three proposals go in.',
        'The transformer emits a hidden state at every position.',
        'The same LM head turns each hidden state into vocabulary logits.',
        'Softmax gives four distributions, each one shifted. The probability of a token comes from the position before it.',
      ],
    },
    acceptSample: {
      caption: 'Accept, or resample',
      labels: { proposes: 'draft proposes', acceptWith: 'accept with', rule: 'min(1, p/q)', residual: 'residual' },
      notes: [
        'The draft gives q, the target gives p, for the same proposed token.',
        'Accept with probability min(1, p / q). Here 0.30 / 0.40 = 0.75.',
        'If the target likes the token at least as much as the draft did, acceptance is certain.',
        'On a rejection the target samples from max(0, p − q), normalised. A is already spent, so B and C split the mass.',
      ],
    },
    kvCommit: {
      caption: 'Commit and roll back',
      labels: {
        cache: 'kv cache',
        verification: 'verification',
        cached: ['The', 'capital', 'of', 'France', 'is'],
        proposed: ['Paris', 'and', 'it', 'is'],
        correction: 'the',
      },
      notes: [
        'The cache holds the accepted prefix, one K and V pair per layer per token.',
        'The verification pass computes K and V for all four proposals at the same time.',
        'Verification reads left to right and stops at the first rejection.',
        'Paris and and are already processed by the target model, so their cache entries stay.',
        'it and is are dropped. The engine moves the valid sequence length back instead of copying tensors.',
      ],
    },
    eagle3: {
      caption: 'EAGLE-3 drafting',
      labels: {
        layers: 'target layers',
        stages: ['early hidden', 'middle hidden', 'late hidden'],
        fuse: 'fuse',
        concat: 'concat + projection',
        feature: 'fused target feature',
        embedding: 'sampled-token embedding',
        decoder: 'draft decoder',
        draft: 'draft',
      },
      notes: [
        'EAGLE-3 concatenates hidden states from three stages of the target forward pass into one feature.',
        'EAGLE-3 concatenates hidden states from three stages of the target forward pass into one feature.',
        'The fused feature and the sampled-token embedding give the first draft token.',
        'Later positions have no target hidden state yet, so each one feeds the previous draft output back in.',
      ],
    },
    dflash: {
      caption: 'DFlash draft block',
      labels: {
        position: 'position',
        input: 'input',
        pass: 'one forward pass',
        anchor: 'anchor',
        mask: 'mask',
        draft: 'draft',
        kv: 'target K/V',
        layers: ['target K/V + layer 1', 'target K/V + layer 2', 'target K/V + layer 3', 'target K/V + layer N'],
      },
      notes: [
        'Position 0 is a token the target model already confirmed. The rest are masked.',
        'One draft-network pass fills every masked position together.',
        'The fused target context enters every draft layer as extra Key and Value, not only at the input.',
      ],
    },
    dspark: {
      caption: 'DSpark sequential correction',
      labels: { backbone: 'parallel backbone', base: 'base logits', markov: 'markov head', picks: ['of', 'course', ',', 'sure'] },
      notes: [
        'A fully parallel block can mix two good continuations into one bad one. "of course" and "no problem" become "of problem".',
        'One backbone pass gives every position its base logits. The lightweight head then biases each position with the token already selected before it.',
      ],
    },
    seqVsParallel: {
      caption: 'Sequential vs parallel drafting',
      labels: {
        sequential: 'sequential',
        parallel: 'parallel',
        clock: 'draft clock',
        seqCost: 'MTP · EAGLE-3 -',
        parCost: 'DFlash · DSpark -',
        passes: 'draft passes',
        pass: 'draft pass',
      },
      notes: [
        'Both proposals reach the same verification pass. Parallel drafting gets there in one forward pass, but a later position never sees the token picked at an earlier one.',
      ],
    },
    throughput: {
      baseline: 'Baseline',
      note: 'Output throughput, tok/s, against the non-speculative baseline. MI300X and MI355X, ROCm. Pick a target model.',
    },
    titleArt: {},
  },
}
