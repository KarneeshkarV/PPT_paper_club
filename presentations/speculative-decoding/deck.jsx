/**
 * The deck is a renderer only. Every word lives in content.js.
 * This file maps a figure id in that file to the component that draws it,
 * and an image id to the imported asset.
 */
import { Deck } from '../../src/deck/Deck.jsx'
import { renderSlides } from '../../src/deck/content.jsx'
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
import content from './content.js'
import figure01 from './assets/figure-01.svg'
import figure02 from './assets/figure-02.svg'
import figureMethods from './assets/figure-method-summary.svg'

const FIGURES = {
  titleArt: () => <TitleArt />,
  baselineLoop: (t) => <BaselineLoop {...t} />,
  round: (t) => <VerifyRound {...t} />,
  weather: (t) => <VerifyRound {...t} />,
  causalMask: (t) => <CausalMask {...t} />,
  onePass: (t) => <OnePassLogits {...t} />,
  acceptSample: (t) => <AcceptSample {...t} />,
  kvCommit: (t) => <KvCommit {...t} />,
  eagle3: (t) => <Eagle3Fuse {...t} />,
  dflash: (t) => <DFlashBlock {...t} />,
  dspark: (t) => <DSparkHead {...t} />,
  seqVsParallel: (t) => <SeqVsParallel {...t} />,
  throughput: (t) => <ThroughputChart {...t} />,
}

const ASSETS = { figure01, figure02, figureMethods }

export default function SpeculativeDecodingDeck() {
  return <Deck>{renderSlides(content, FIGURES, ASSETS)}</Deck>
}
