import { Deck, Slide } from '../../src/deck/Deck.jsx'
import {
  AcceptSample,
  BaselineLoop,
  CausalMask,
  DFlashBlock,
  DSparkHead,
  Eagle3Fuse,
  KvCommit,
  OnePassLogits,
  SeqVsParallel,
  ThroughputChart,
  TitleArt,
  VerifyRound,
} from './figures.jsx'
import figure01 from './assets/figure-01.svg'
import figure02 from './assets/figure-02.svg'
import figureMethods from './assets/figure-method-summary.svg'

export default function SpeculativeDecodingDeck() {
  return (
    <Deck>
      <Slide variant="title">
        <TitleArt />
        <p className="kicker">Paper Club · 12 Sep 2026</p>
        <h1>Speculative Decoding</h1>
        <div className="rule" />
        <h3>presented by Karneeshkar</h3>
      </Slide>

      <Slide>
        <p className="kicker">The bottleneck</p>
        <h2>One committed token, one target-model pass.</h2>
        <BaselineLoop />
        <p>
          Tokens leave the model left to right, one commit per pass. On a long generation this loop,
          not the arithmetic inside it, sets the pace.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">The question</p>
        <blockquote>
          Can we keep the output behaviour of the original model, and stop advancing
          only one token per pass?
        </blockquote>
        <div className="rule" />
        <p>
          Speculative decoding splits <b>proposal</b> from <b>verification</b>. The original model stays
          on as the target and still decides every token. A cheaper draft component sits in front of it.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">Core idea</p>
        <h2>Draft, then verify.</h2>
        <VerifyRound
          prompt="context"
          drafts={['T1', 'T2', 'T3', 'T4']}
          acceptUpTo={2}
          replacement="target token"
          caption="One speculative round"
        />
        <p>
          One target-model pass scores every candidate position. Accepted tokens commit. At the first
          rejection the target model supplies the token itself, and the rest of the proposal goes nowhere.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">The round</p>
        <h2>Draft, verify, commit.</h2>
        <figure className="figure plate">
          <img src={figure01} alt="A draft component proposes candidate tokens, the target model verifies them, accepted tokens are committed." />
        </figure>
        <p className="caption">Draft proposes · target verifies · accepted tokens commit</p>
      </Slide>

      <Slide>
        <p className="kicker">Worked example</p>
        <h2>"The weather today is …"</h2>
        <VerifyRound
          prompt="The weather today is"
          drafts={['sunny', 'and', 'warm', 'outside']}
          acceptUpTo={2}
          replacement="clear"
          caption="Accept / reject"
        />
        <p>
          The target keeps <b>sunny</b> and <b>and</b>. At position 3 the draft says <b>warm</b>, the
          target says <b>clear</b>, and <b>outside</b> never gets a chance. Three tokens, one pass.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">Accept / reject</p>
        <h2>Accept, reject, discard.</h2>
        <figure className="figure plate">
          <img src={figure02} alt="Green draft tokens are accepted, the red box is the first rejected token, the gray box is discarded, and the blue token comes from the target model." />
        </figure>
        <p className="caption">Green accepted · red first rejection · gray discarded · blue from the target model</p>
      </Slide>

      <Slide>
        <p className="kicker">Verification</p>
        <h2>Computationally parallel, logically autoregressive.</h2>
        <CausalMask />
        <p>
          The target model reads all four proposals in one forward pass. The causal mask sets every
          future position to minus infinity, so position 3 reads the context and the two tokens before it, never the fourth.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">Verification</p>
        <h2>One pass gives one distribution per position.</h2>
        <OnePassLogits />
        <p>
          A forward pass does not return one distribution. It returns a hidden state for every input
          position, and the LM head turns each one into logits over the whole vocabulary. For 4 positions
          and a 150k vocabulary that is a 4 x 150000 matrix, and every row becomes a distribution after softmax.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">Verification</p>
        <h2>Greedy: accept while the target agrees.</h2>
        <pre><code>{`context:  The capital of France is

draft:    Paris   and   it      is
target:   Paris   and   the     city
          accept  accept reject  never scored`}</code></pre>
        <p>
          Accept a draft token when it is the token the target itself would have picked. Stop at the first
          mismatch and take the target token there. Three committed tokens for one target pass.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">Verification</p>
        <h2>Sampling: accept with min(1, p/q).</h2>
        <AcceptSample />
        <p>
          Checking the top token would bend the distribution, so sampling uses a coin. On a rejection the
          target samples from max(0, p − q) instead of from p. That correction is why the output
          distribution is the same as sampling from the target directly.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">Verification</p>
        <h2>Accepted tokens are already in the cache.</h2>
        <KvCommit />
        <p>
          While it verifies, the target model does a normal forward pass: hidden states, logits, and K and V
          for every proposed position. Accepted entries stay in the cache, so nothing is recomputed. The
          rest become dead blocks the engine reclaims.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">Why it pays</p>
        <h2>K accepted tokens, K+1 committed.</h2>
        <ul>
          <li>Without speculation, 5 tokens cost 5 target passes. The dependency is real: the tokens do not exist yet.</li>
          <li>The draft supplies them, so the target turns decode steps into one prefill-shaped matrix multiply.</li>
          <li>When all K proposals pass, the same pass also gives the distribution for the next token. That bonus token makes it K+1.</li>
          <li>A rejection at position 3 wastes positions 3 and 4. Their K and V were computed under a prefix that no longer exists.</li>
        </ul>
      </Slide>


      <Slide>
        <p className="kicker">Where methods differ</p>
        <h2>Same loop. Different draft component.</h2>
        <ul>
          <li>What information it takes from the target model.</li>
          <li>How that information enters the drafting process.</li>
          <li>Whether candidates come out sequentially or in parallel.</li>
        </ul>
        <div className="cols">
          <div className="card">
            <h3>Native MTP</h3>
            <p>Built into the target architecture. Model-native auxiliary path. Sequential.</p>
          </div>
          <div className="card">
            <h3>Separate MTP drafter</h3>
            <p>Own checkpoint, paired with one target. Uses target activations and the shared KV cache. Sequential.</p>
          </div>
          <div className="card">
            <h3>Target-conditioned network</h3>
            <p>EAGLE-3, DFlash, DSpark. Trained for one target from its hidden states.</p>
          </div>
        </div>
      </Slide>

      <Slide>
        <p className="kicker">Native MTP</p>
        <h2>An auxiliary head the model already has.</h2>
        <ul>
          <li>Step one takes a target hidden representation and the current token, and predicts draft token 1.</li>
          <li>Every later step takes the previous MTP hidden state and the latest draft token.</li>
          <li>The fusion is model specific. Concatenate on the hidden dimension, project, run the prediction layer.</li>
        </ul>
        <p>
          Physical MTP depth and <code>num_speculative_tokens</code> are separate. vLLM can reuse the MTP
          path for extra passes, so a larger N means more candidates and more sequential drafting.
        </p>
        <p className="caption">Shares weights with the target, so the memory overhead stays modest</p>
      </Slide>

      <Slide>
        <p className="kicker">Gemma 4 MTP</p>
        <h2>A separate checkpoint that still lives inside the target.</h2>
        <ul>
          <li>Own checkpoint, paired with one specific Gemma 4 target.</li>
          <li>Reads target-model activations and <b>shares the target KV cache</b>.</li>
          <li>It never reprocesses the accepted prefix on its own.</li>
          <li>It emits candidates one at a time, like native MTP.</li>
        </ul>
        <p className="caption">You pass it in the model field, but it runs the MTP path</p>
      </Slide>

      <Slide>
        <p className="kicker">EAGLE-3</p>
        <h2>Three target layers, fused into one feature.</h2>
        <Eagle3Fuse />
        <p>
          The fused feature carries the accepted sequence. The token embedding says where drafting starts.
          Later positions have no target hidden state yet, so EAGLE-3 feeds its own output back in.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">DFlash</p>
        <h2>A whole block, in one pass.</h2>
        <DFlashBlock />
        <p>
          EAGLE-3 hands the target context to its draft network once, at the input. DFlash turns the same
          context into extra Key and Value inside every draft layer.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">DSpark</p>
        <h2>Parallel block, light sequential fix.</h2>
        <DSparkHead />
        <ul>
          <li>A Markov head biases each position with the token already selected before it.</li>
          <li>A confidence head can submit a shorter prefix - not active in the vLLM path tested here.</li>
        </ul>
      </Slide>

      <Slide>
        <p className="kicker">The real trade</p>
        <h2>Draft passes against intra-block feedback.</h2>
        <SeqVsParallel />
        <p>
          Sequential drafting buys token-by-token conditioning and pays one draft pass per candidate.
          Parallel drafting pays once and gives that conditioning up. Neither wins on paper. The measurements decide.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">All five</p>
        <h2>Five methods, side by side.</h2>
        <figure className="figure plate">
          <img src={figureMethods} alt="Side-by-side comparison of native MTP, Gemma 4 MTP, EAGLE-3, DFlash and DSpark draft components." />
        </figure>
      </Slide>

      <Slide>
        <p className="kicker">Summary table</p>
        <h2>What each one takes, and how it emits.</h2>
        <table>
          <thead>
            <tr><th>Method</th><th>Target information used</th><th>Generation</th></tr>
          </thead>
          <tbody>
            <tr><td>Native MTP</td><td>Target or previous MTP hidden representation + current draft token</td><td>Sequential, repeated MTP path</td></tr>
            <tr><td>Gemma 4 MTP</td><td>Target activations + shared target KV cache</td><td>Sequential, paired component</td></tr>
            <tr><td>EAGLE-3</td><td>Early, middle and late hidden states fused into one feature</td><td>Sequential, each token feeds the next</td></tr>
            <tr><td>DFlash</td><td>Fused hidden states as extra K/V in every draft layer</td><td>All positions in one parallel pass</td></tr>
            <tr><td>DSpark</td><td>Same as DFlash, plus a Markov head</td><td>One parallel pass, then light sequential adjustment</td></tr>
          </tbody>
        </table>
        <p className="caption">In all five, the target model verifies in one pass and commits left to right</p>
      </Slide>

      <Slide>
        <p className="kicker">Checkpoints</p>
        <h2>Who publishes draft models.</h2>
        <table>
          <thead><tr><th>Publisher</th><th>Methods</th><th>Targets</th></tr></thead>
          <tbody>
            <tr><td>Google</td><td>Gemma 4 MTP</td><td>Gemma 4 E2B, E4B, 12B, 26B-A4B, 31B</td></tr>
            <tr><td>Red Hat AI</td><td>EAGLE-3, DFlash, DSpark</td><td>Llama, Qwen, Gemma, GPT-OSS, GLM, Nemotron, Mistral</td></tr>
            <tr><td>Z-Lab</td><td>DFlash</td><td>Qwen3 / 3.5 / 3.6, Gemma 4, Kimi, MiniMax, GPT-OSS, Llama</td></tr>
            <tr><td>DeepSeek AI</td><td>EAGLE-3, DFlash, DSpark</td><td>DeepSpec: Qwen3 4B / 8B / 14B, Gemma 4 12B</td></tr>
            <tr><td>LightSeek</td><td>EAGLE-3, EAGLE-3.1</td><td>Kimi-K2.5, K2.6, K2.7-Coder</td></tr>
            <tr><td>Inferact</td><td>EAGLE-3, DSpark</td><td>MiniMax-M3, Kimi-K3</td></tr>
          </tbody>
        </table>
      </Slide>

      <Slide>
        <p className="kicker">Measurements</p>
        <h2>Throughput against the non-speculative baseline.</h2>
        <ThroughputChart />
      </Slide>

      <Slide>
        <p className="kicker">What the numbers say</p>
        <h2>It depends on the pair, not on the method.</h2>
        <ul>
          <li>Top of the range: <b>2.87×</b> DFlash on gemma-4-26B-A4B-it (MATH500), <b>2.83×</b> Gemma 4 MTP on the same target, <b>2.68×</b> DFlash on Kimi-K2.5.</li>
          <li>Qwen3-8B stayed between 1.08× and 1.63×, and EAGLE-3 on MATH500 fell <b>below</b> baseline at 0.88×.</li>
          <li>Native MTP beat DFlash on Qwen3.5-27B, 3.5-122B-A10B and 3.6-27B, then lost to it on 3.6-35B-A3B. Same family.</li>
          <li>Best N moved around. Sequential methods plateaued after a few values. DFlash and DSpark were often best at N=7.</li>
        </ul>
        <p className="caption">Every number is tied to its hardware, checkpoint, workload and sweep</p>
      </Slide>

      <Slide>
        <p className="kicker">Tuning</p>
        <h2>Proposal length is a runtime setting, not a constant.</h2>
        <ul>
          <li>Native MTP: start at <code>N=1</code>, confirm stability, then sweep 2-7.</li>
          <li>DFlash: a checkpoint with <code>block_size = 16</code> allows <code>N=15</code> at most, because position 0 is the anchor. Test 3, 7, 11, 15.</li>
          <li>A wider window gives more chances to commit several tokens, but acceptance falls at later positions. When it does, the extra candidates add drafting and verification work for nothing.</li>
        </ul>
        <p>
          Reasoning sets (GSM8K, MATH500) favoured medium to deep proposals. Code sets (HumanEval, MBPP)
          favoured moderate ones. Local structure in code is predictable. Identifiers and formatting are not.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">Observability</p>
        <h2>Watch four signals, decide on one.</h2>
        <table>
          <thead><tr><th>Signal</th><th>What it tells you</th></tr></thead>
          <tbody>
            <tr><td>Throughput</td><td>End-to-end change against the non-speculative baseline</td></tr>
            <tr><td>Mean accepted length</td><td>Tokens committed per speculative round</td></tr>
            <tr><td>Overall acceptance rate</td><td>Share of proposed tokens that survive</td></tr>
            <tr><td>Per-position acceptance</td><td>Whether later positions still earn their cost</td></tr>
          </tbody>
        </table>
        <p>
          A high acceptance rate is not the goal. A cheap drafter can win with lower acceptance, and an
          expensive one can lose with higher. Pick on end-to-end throughput.
        </p>
      </Slide>

      <Slide>
        <p className="kicker">Training your own</p>
        <h2>The speculator must be trained on its target.</h2>
        <ul>
          <li>Use prompts that match the workload, and hold back a separate evaluation set.</li>
          <li>Responses generated by <b>the exact target model</b>. Reusing other responses with the target tokenizer does not make them target specific.</li>
          <li>Hidden states: <b>online</b> (no disk, needs inference and training together), <b>offline</b> (frees GPUs, needs storage), <b>hybrid</b> (cache during epoch 1, reuse after).</li>
          <li>Judge on accepted length, acceptance rate, draft latency, memory and serving throughput - not training loss.</li>
        </ul>
      </Slide>

      <Slide variant="title">
        <p className="kicker">Takeaways</p>
        <h1>Fast proposals, main verifiers.</h1>
        <div className="rule" />
        <ul>
          <li>Cheap proposals, one honest verifier. The target still decides every token, so the output distribution does not move.</li>
          <li>The five methods differ in what they read from the target, and in sequential against parallel drafting.</li>
          <li>Several pairs cleared 2x. One fell below 1x. Measure your own pair before you ship it.</li>
          <li>Work the same way. Draft cheap versions fast, try several, and commit only to the ones that survive a real check.</li>
        </ul>
      </Slide>
    </Deck>
  )
}
