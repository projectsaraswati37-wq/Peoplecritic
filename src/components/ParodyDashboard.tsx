import React, { useState } from 'react';
import type { HumanAnalysis } from '../types/analysis';
import { getHackathonIdea, getParodyStats, getRoast, getUselessness } from '../utils/parody';

interface ParodyDashboardProps {
  analysis: HumanAnalysis;
}

const ROAST_LEVELS = ['🙂 സാവധാനം', '😏 ചെറിയ കുത്ത്', '🔥 നല്ല roast', '💀 എന്തിനാ ചോദിച്ചത്?'];

function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div className="parody-meter" aria-label={`${value}%`}>
      <div className="parody-meter-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

const ParodyDashboard: React.FC<ParodyDashboardProps> = ({ analysis }) => {
  const stats = getParodyStats(analysis);
  const uselessness = getUselessness(analysis);
  const [selectedStat, setSelectedStat] = useState(0);
  const [roastLevel, setRoastLevel] = useState(1);
  const [roastIndex, setRoastIndex] = useState(0);
  const [ideaIndex, setIdeaIndex] = useState(0);
  const selected = stats[selectedStat];
  const idea = getHackathonIdea(ideaIndex);

  return (
    <section className="parody-dashboard" aria-label="Malayalam parody analysis">
      <div className="parody-section-heading">
        <div>
          <span className="parody-kicker">PARODY ENGINE / 04</span>
          <h2>AI കണക്കാക്കിയ കാര്യങ്ങൾ</h2>
        </div>
        <span className="parody-disclaimer">വെറുതെ പറഞ്ഞതാണ്</span>
      </div>

      <div className="parody-grid">
        <div className="parody-panel parody-stats-panel">
          <div className="parody-panel-title"><span>01</span> തമാശയുടെ statistics</div>
          <div className="parody-stat-list">
            {stats.map((stat, index) => (
              <button
                key={stat.label}
                className={`parody-stat ${selectedStat === index ? 'is-selected' : ''}`}
                onClick={() => setSelectedStat(index)}
                aria-pressed={selectedStat === index}
              >
                <span className="parody-stat-copy">
                  <strong>{stat.label}</strong>
                  <small>{selectedStat === index ? 'അടിസ്ഥാനമില്ലാത്ത confidence' : 'കൂടുതൽ അറിയാം ↗'}</small>
                </span>
                <span className="parody-stat-number" style={{ color: stat.color }}>{stat.value}%</span>
                <Meter value={stat.value} color={stat.color} />
              </button>
            ))}
          </div>
          <div className="parody-stat-detail" role="status">
            <span>AI പറയുന്നത്:</span>
            <p>“{selected.explanation}”</p>
          </div>
        </div>

        <div className="parody-panel confidence-panel">
          <div className="parody-panel-title"><span>02</span> confidence report</div>
          <div className="confidence-row">
            <div><strong>AI CONFIDENCE</strong><small>കാര്യം ഉറപ്പാണ് എന്ന് നടിക്കുന്നു</small></div>
            <b>99.8%</b>
          </div>
          <Meter value={99.8} color="#ccf27d" />
          <div className="confidence-row">
            <div><strong>AI ACCURACY</strong><small>ഒന്നും തെളിയിച്ചിട്ടില്ല</small></div>
            <b>11.2%</b>
          </div>
          <Meter value={11.2} color="#ff6688" />
          <div className="uselessness-block">
            <span>USELESSNESS INDEX</span>
            <strong>{uselessness}%</strong>
            <Meter value={uselessness} color="#7ee7e4" />
            <p>ഇത്രയും analysis ചെയ്തിട്ടും<br />കാര്യമൊന്നുമില്ല.</p>
          </div>
        </div>
      </div>

      <div className="parody-panel roast-panel">
        <div className="parody-panel-title"><span>03</span> AI പറയുന്നത്...</div>
        <div className="roast-terminal" aria-live="polite">
          <div>&gt; ANALYSIS STARTED</div>
          <div>&gt; കുറച്ച് നോക്കി... വീണ്ടും നോക്കി...</div>
          <div>&gt; എന്താണ് പറയേണ്ടതെന്ന് അറിയില്ല.</div>
          <div className="roast-answer">“{getRoast(roastIndex)}”</div>
        </div>
        <div className="roast-controls">
          <div className="roast-levels" role="group" aria-label="Roast level">
            {ROAST_LEVELS.map((level, index) => (
              <button key={level} className={roastLevel === index ? 'active' : ''} onClick={() => setRoastLevel(index)}>{level}</button>
            ))}
          </div>
          <button className="parody-action" onClick={() => setRoastIndex((index) => index + 1)}>🔥 കുറച്ച് കൂടി പറയട്ടെ</button>
        </div>
        <div className="prove-row">
          <span>ഈ verdict എന്തിന്റെ അടിസ്ഥാനത്തിൽ?</span>
          <b>സത്യത്തിൽ ഒന്നിന്റെയും അടിസ്ഥാനത്തിൽ അല്ല.</b>
        </div>
      </div>

      <div className="parody-panel idea-panel">
        <div className="idea-copy">
          <span className="parody-kicker">USELESS HACKATHON GENERATOR</span>
          <h2>ഇനി ഒരു പൊട്ടൻ idea</h2>
          <p>പ്രയോജനം കുറവ്. Hackathon potential അതിരില്ല.</p>
          <button className="parody-action" onClick={() => setIdeaIndex((index) => index + 1)}>↻ ഒരു useless idea ഉണ്ടാക്കൂ</button>
        </div>
        <div className="idea-card">
          <div className="idea-card-top"><span>PROJECT / {String(ideaIndex + 1).padStart(2, '0')}</span><b>{idea.name}</b></div>
          <div className="idea-line"><span>പ്രശ്നം</span><p>{idea.problem}</p></div>
          <div className="idea-line"><span>പരിഹാരം</span><p>{idea.solution}</p></div>
          <div className="idea-meters">
            <div><span>USEFULNESS</span><b>{idea.usefulness}%</b><Meter value={idea.usefulness} color="#ff6688" /></div>
            <div><span>HACKATHON POTENTIAL</span><b>{idea.potential}%</b><Meter value={idea.potential} color="#ccf27d" /></div>
          </div>
          <div className="idea-reaction">Investor: “Interesting.” &nbsp; Jury: “Why?” &nbsp; AI: “എനിക്കും അറിയില്ല.”</div>
        </div>
      </div>
    </section>
  );
};

export default ParodyDashboard;
