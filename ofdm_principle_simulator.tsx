import React, { useState, useEffect, useRef } from 'react';

// MathJax動的読み込みとレンダリング用コンポーネント
const MathEquation = ({ math }: { math: string }) => {
  const nodeRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const renderMath = () => {
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise && nodeRef.current) {
        (window as any).MathJax.typesetPromise([nodeRef.current]).catch((err: any) => console.error(err));
      } else {
        setTimeout(() => { if (isMounted) renderMath(); }, 100);
      }
    };
    
    renderMath();
    return () => { isMounted = false; };
  }, [math]);

  return <div ref={nodeRef} className="my-8 overflow-x-auto text-lg md:text-xl font-serif whitespace-nowrap">{`\\[${math}\\]`}</div>;
};

// 折りたたみUI (Accordion) コンポーネント
const Accordion = ({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  return (
    <details className="bg-white my-8 group border-b-2 border-black" open={defaultOpen}>
      <summary className="bg-black text-white p-5 font-bold cursor-pointer list-none flex justify-between items-center hover:bg-gray-800 transition-colors [&::-webkit-details-marker]:hidden">
        <span className="text-lg md:text-xl">{title}</span>
        <span className="text-3xl font-black group-open:hidden">+</span>
        <span className="text-3xl font-black hidden group-open:block">-</span>
      </summary>
      <div className="p-6 md:p-10 bg-white">
        {children}
      </div>
    </details>
  );
};

// 単一シンボル波形描画用
const WaveGraph = ({ width = 600, height = 150, title, fn, referenceFn, fillArea = false, scale = 0.4 }: {
  width?: number;
  height?: number;
  title: string;
  fn: (t: number) => number;
  referenceFn?: (t: number) => number;
  fillArea?: boolean;
  scale?: number;
}) => {
  const points = 300;
  let pathD = "";
  let refPathD = "";
  let integral = 0;

  for (let i = 0; i < points; i++) {
    const t = i / points;
    integral += fn(t) / points; 
  }

  for (let i = 0; i <= points; i++) {
    const t = i / points;
    if (referenceFn) {
      const refY = referenceFn(t);
      const refSvgY = (height / 2) - (refY * (height / 2) * scale);
      refPathD += `${i === 0 ? 'M' : 'L'} ${t * width} ${refSvgY} `;
    }
    const y = fn(t);
    const svgY = (height / 2) - (y * (height / 2) * scale);
    pathD += `${i === 0 ? 'M' : 'L'} ${t * width} ${svgY} `;
  }

  return (
    <div className="bg-white mb-6">
      <div className="bg-gray-200 p-3 font-bold flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <span className="break-all">{title}</span>
        {fillArea && (
          <span className={`px-4 py-1 text-center whitespace-nowrap text-white font-black ${Math.abs(integral) < 0.05 ? 'bg-blue-600' : 'bg-red-600'}`}>
            積分値 (面積) ≈ {Math.abs(integral) < 0.05 ? '0' : integral.toFixed(2)}
          </span>
        )}
      </div>
      <div className="p-4 overflow-x-auto bg-white">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block min-w-[400px]" role="img" aria-label={title}>
          <title>{title}</title>
          {fillArea && (
            <g strokeWidth={Math.ceil(width / points) + 1.0}>
              {Array.from({ length: points + 1 }).map((_, i) => {
                const t = i / points;
                const y = fn(t);
                const svgX = t * width;
                const svgY = (height / 2) - (y * (height / 2) * scale);
                if (Math.abs(y) < 0.01) return null;
                return (
                  <line key={i} x1={svgX} y1={height / 2} x2={svgX} y2={svgY} stroke={y > 0 ? "rgba(37, 99, 235, 0.4)" : "rgba(220, 38, 38, 0.4)"} />
                );
              })}
            </g>
          )}
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 4" />
          {referenceFn && <path d={refPathD} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2" strokeDasharray="6 4" />}
          <path d={pathD} fill="none" stroke="black" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
};

// 連続シンボル波形描画用
const MultiSymbolWaveGraph = ({ width = 800, height = 150, title, fn1, fn2, showGI = false, giRatio = 0.25 }: {
  width?: number;
  height?: number;
  title: string;
  fn1: (t: number) => number;
  fn2: (t: number) => number;
  showGI?: boolean;
  giRatio?: number;
}) => {
  const pointsPerSymbol = 300;
  const totalSymbols = showGI ? 2 + giRatio * 2 : 2;
  const symWidth = width / totalSymbols;
  const giWidth = symWidth * giRatio;

  let pathD = "";
  let baseOffsetX = 0;
  
  if (showGI) {
    const giPoints = Math.round(pointsPerSymbol * giRatio);
    for (let i = 0; i <= giPoints; i++) {
      const t = (1 - giRatio) + (i / giPoints) * giRatio;
      const y = fn1(t);
      const svgY = (height / 2) - (y * (height / 2) * 0.8);
      const svgX = baseOffsetX + (i / giPoints) * giWidth;
      pathD += `${pathD === "" ? 'M' : 'L'} ${svgX} ${svgY} `;
    }
    baseOffsetX += giWidth;
  }

  const s1Start = baseOffsetX;
  for (let i = 0; i <= pointsPerSymbol; i++) {
    const t = i / pointsPerSymbol;
    const y = fn1(t);
    const svgY = (height / 2) - (y * (height / 2) * 0.8);
    const svgX = baseOffsetX + (i / pointsPerSymbol) * symWidth;
    if (!showGI && i === 0) pathD += `M ${svgX} ${svgY} `;
    else pathD += `L ${svgX} ${svgY} `;
  }
  baseOffsetX += symWidth;
  const s1End = baseOffsetX;

  if (showGI) {
    const giPoints = Math.round(pointsPerSymbol * giRatio);
    for (let i = 0; i <= giPoints; i++) {
      const t = (1 - giRatio) + (i / giPoints) * giRatio;
      const y = fn2(t);
      const svgY = (height / 2) - (y * (height / 2) * 0.8);
      const svgX = baseOffsetX + (i / giPoints) * giWidth;
      pathD += `${i === 0 ? 'M' : 'L'} ${svgX} ${svgY} `;
    }
    baseOffsetX += giWidth;
  }

  const s2Start = baseOffsetX;
  for (let i = 0; i <= pointsPerSymbol; i++) {
    const t = i / pointsPerSymbol;
    const y = fn2(t);
    const svgY = (height / 2) - (y * (height / 2) * 0.8);
    const svgX = baseOffsetX + (i / pointsPerSymbol) * symWidth;
    if (!showGI && i === 0) pathD += `M ${svgX} ${svgY} `;
    else pathD += `L ${svgX} ${svgY} `;
  }

  const y1End = (height / 2) - (fn1(1) * (height / 2) * 0.8);
  const y2Start = (height / 2) - (fn2(showGI ? 1 - giRatio : 0) * (height / 2) * 0.8);

  return (
    <div className="bg-white mb-6 border-2 border-gray-300">
      <div className="bg-gray-200 p-3 font-bold">{title}</div>
      <div className="p-4 overflow-x-auto bg-white relative">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block min-w-[600px]" role="img" aria-label={title}>
          <title>{title}</title>
          <rect x={0} y={0} width={s1Start} height={height} fill="rgba(255, 165, 0, 0.2)" />
          <rect x={s1Start} y={0} width={s1End - s1Start} height={height} fill="rgba(0, 0, 0, 0.05)" />
          <rect x={s1End} y={0} width={s2Start - s1End} height={height} fill="rgba(255, 165, 0, 0.2)" />
          <rect x={s2Start} y={0} width={width - s2Start} height={height} fill="rgba(0, 0, 0, 0.05)" />
          
          {showGI && <line x1={s1Start} y1={0} x2={s1Start} y2={height} stroke="black" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />}
          <line x1={s1End} y1={0} x2={s1End} y2={height} stroke="black" strokeWidth="2" opacity="0.8" />
          {showGI && <line x1={s2Start} y1={0} x2={s2Start} y2={height} stroke="black" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />}

          {showGI && <text x={s1Start / 2} y={20} textAnchor="middle" fill="#ea580c" fontSize="13" fontWeight="bold">GI 1</text>}
          <text x={s1Start + (s1End - s1Start) / 2} y={20} textAnchor="middle" fill="#4b5563" fontSize="15" fontWeight="bold">シンボル 1</text>
          {showGI && <text x={s1End + (s2Start - s1End) / 2} y={20} textAnchor="middle" fill="#ea580c" fontSize="13" fontWeight="bold">GI 2</text>}
          <text x={s2Start + (width - s2Start) / 2} y={20} textAnchor="middle" fill="#4b5563" fontSize="15" fontWeight="bold">シンボル 2</text>

          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 4" />
          <path d={pathD} fill="none" stroke="black" strokeWidth="2" />

          <circle cx={s1End} cy={y1End} r="5" fill="red" />
          <circle cx={s1End} cy={y2Start} r="5" fill="red" />
          <line x1={s1End} y1={y1End} x2={s1End} y2={y2Start} stroke="red" strokeWidth="3" strokeDasharray="4 4" />
        </svg>
      </div>
    </div>
  );
};

// IQ平面
const IQGraph = ({ i, q, a, thetaDeg, isComplex = false }: { i: number; q: number; a: number; thetaDeg: number; isComplex?: boolean }) => {
  const size = 300;
  const center = size / 2;
  const scale = 100;
  const x = center + i * scale;
  const y = center - q * scale;
  const arcRadius = 30;
  const rad = thetaDeg * Math.PI / 180;
  const arcX = center + arcRadius * Math.cos(rad);
  const arcY = center - arcRadius * Math.sin(rad);
  const largeArcFlag = thetaDeg > 180 ? 1 : 0;
  const arcPath = thetaDeg > 0 ? `M ${center + arcRadius} ${center} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 0 ${arcX} ${arcY}` : "";

  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center p-6 h-full w-full">
      <h4 className="font-bold mb-6 bg-black text-white px-3 py-1">
        {isComplex ? '複素平面 (虚数軸と実数軸)' : 'IQ平面 (コンスタレーション)'}
      </h4>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white max-w-full" role="img" aria-label={isComplex ? '複素平面のグラフ' : 'IQ平面（コンスタレーション）のグラフ'}>
        <title>{isComplex ? '複素平面のグラフ' : 'IQ平面（コンスタレーション）のグラフ'}</title>
        <line x1={0} y1={center} x2={size} y2={center} stroke="#9ca3af" strokeWidth={1} />
        <line x1={center} y1={0} x2={center} y2={size} stroke="#9ca3af" strokeWidth={1} />
        <text x={size - 45} y={center - 10} className="font-bold text-xs text-gray-500">{isComplex ? '実数 (Re)' : 'I (cos)'}</text>
        <text x={center + 10} y={20} className="font-bold text-xs text-gray-500">{isComplex ? '虚数 (Im)' : 'Q (sin)'}</text>
        <circle cx={center} cy={center} r={scale} fill="none" stroke="#d1d5db" strokeDasharray="4 4" />
        <line x1={center} y1={y} x2={x} y2={y} stroke="#dc2626" strokeWidth={2} strokeDasharray="4 4" />
        <line x1={x} y1={center} x2={x} y2={y} stroke="#2563eb" strokeWidth={2} strokeDasharray="4 4" />
        <line x1={center} y1={center} x2={x} y2={y} stroke="black" strokeWidth={3} />
        <circle cx={x} cy={y} r={6} fill="black" />
        {arcPath && <path d={arcPath} fill="none" stroke="black" strokeWidth="2" />}
      </svg>
      <div className="mt-6 flex gap-6 text-base font-bold w-full justify-center">
        <span className="text-blue-700">{isComplex ? '実部' : 'I成分'} = {i.toFixed(2)}</span>
        <span className="text-red-700">{isComplex ? '虚部' : 'Q成分'} = {q.toFixed(2)}{isComplex && 'j'}</span>
      </div>
    </div>
  );
};

// コンスタレーション全体を描画するグラフ（Section 6用）
const ConstellationGraph = ({ phaseErrorDeg = 0 }: { phaseErrorDeg?: number }) => {
  const size = 300;
  const center = size / 2;
  const scale = 80;

  // QPSKの理想的な4点 (+1/+1, -1/+1, -1/-1, +1/-1)
  const idealPoints = [
    { i: 1, q: 1, label: '00' },
    { i: -1, q: 1, label: '01' },
    { i: -1, q: -1, label: '11' },
    { i: 1, q: -1, label: '10' },
  ];

  // 誤差を加えた点を計算
  const rad = phaseErrorDeg * Math.PI / 180;
  const rxPoints = idealPoints.map(p => {
    // 回転行列による座標変換
    const rxI = p.i * Math.cos(rad) - p.q * Math.sin(rad);
    const rxQ = p.i * Math.sin(rad) + p.q * Math.cos(rad);
    
    // 受信機はどの象限にいるかでデータを判定する
    let detectedLabel = '';
    if (rxI > 0 && rxQ > 0) detectedLabel = '00';
    else if (rxI < 0 && rxQ > 0) detectedLabel = '01';
    else if (rxI < 0 && rxQ < 0) detectedLabel = '11';
    else detectedLabel = '10';

    return { ...p, rxI, rxQ, detectedLabel };
  });

  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center p-6 h-full w-full">
      <h4 className="font-bold mb-4 bg-black text-white px-3 py-1">受信機のIQ平面 (QPSK)</h4>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="bg-white max-w-full" role="img" aria-label="受信機のIQ平面（コンスタレーション）と判定エラーを示すグラフ">
        <title>受信機のIQ平面（コンスタレーション）と判定エラー</title>
        {/* 判定の境界線（十字） */}
        <line x1={0} y1={center} x2={size} y2={center} stroke="red" strokeWidth={2} strokeDasharray="4 4" />
        <line x1={center} y1={0} x2={center} y2={size} stroke="red" strokeWidth={2} strokeDasharray="4 4" />
        
        {/* 理想的な点（薄く表示） */}
        {idealPoints.map((p, idx) => (
          <circle key={`ideal-${idx}`} cx={center + p.i * scale} cy={center - p.q * scale} r={4} fill="none" stroke="#9ca3af" strokeWidth={2} />
        ))}

        {/* 受信した点 */}
        {rxPoints.map((p, idx) => {
          const isError = p.label !== p.detectedLabel;
          return (
            <g key={`rx-${idx}`}>
              <line 
                x1={center + p.i * scale} y1={center - p.q * scale} 
                x2={center + p.rxI * scale} y2={center - p.rxQ * scale} 
                stroke="#d1d5db" strokeWidth={2} 
              />
              <circle 
                cx={center + p.rxI * scale} cy={center - p.rxQ * scale} 
                r={8} fill={isError ? "red" : "black"} 
              />
              <text 
                x={center + p.rxI * scale + 15} y={center - p.rxQ * scale + 5} 
                fontSize="14" fontWeight="bold" fill={isError ? "red" : "black"}
              >
                {p.detectedLabel}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-4 text-sm font-bold text-gray-700 text-center">
        ※ 赤い点線がデータを分ける「境界線」です。<br/>
        点が境界線を越えると<span className="text-red-600">赤色（判定エラー）</span>になります。
      </div>
    </div>
  );
};

// スライディング相関デモ (Section 7用)
const SlidingCorrelationDemo = () => {
  const [offset, setOffset] = useState(0);
  const totalLength = 300;
  const preambleLength = 100;
  const targetOffset = 120; // 実際にプリアンブルが隠れている位置

  // プリアンブル波形（チャープっぽい複雑な波）
  const getPreamble = (i: number) => {
    const t = i / preambleLength;
    // 窓関数をかけて両端を0にする
    return Math.sin(2 * Math.PI * 4 * t + 10 * t * t) * (0.5 - 0.5 * Math.cos(2 * Math.PI * t));
  };
  const preamble = Array.from({length: preambleLength}, (_, i) => getPreamble(i));

  // 受信波形（ノイズ + ターゲット位置のプリアンブル）
  const getNoise = (i: number) => 0.15 * Math.sin(i * 0.13) + 0.1 * Math.sin(i * 0.57);
  const rxData = Array.from({length: totalLength}, (_, i) => {
    let val = getNoise(i);
    if (i >= targetOffset && i < targetOffset + preambleLength) {
      val += preamble[i - targetOffset];
    }
    return val;
  });

  // 相関値の計算
  let maxCorr = 0;
  let currentCorr = 0;
  
  for(let j=0; j<preambleLength; j++) maxCorr += preamble[j] * preamble[j];
  for(let j=0; j<preambleLength; j++) currentCorr += rxData[offset + j] * preamble[j];

  const normalizedCorr = Math.max(0, currentCorr / maxCorr);
  const isPeak = normalizedCorr > 0.8;

  // 描画用パスの生成
  const width = 800;
  const height = 150;
  const dx = width / totalLength;
  
  let rxPath = "";
  for(let i=0; i<totalLength; i++) {
    const x = i * dx;
    const y = (height / 2) - (rxData[i] * (height / 2) * 0.8);
    rxPath += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
  }

  let refPath = "";
  for(let i=0; i<preambleLength; i++) {
    const x = (offset + i) * dx;
    const y = (height / 2) - (preamble[i] * (height / 2) * 0.8);
    refPath += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
  }

  return (
    <div className="bg-white border-2 border-black p-6 md:p-8">
      <h4 className="font-bold mb-6 bg-black text-white px-3 py-1 inline-block">待ち受け処理（スライディング相関）の体験</h4>
      <p className="mb-6 font-bold text-gray-700">
        スライダーを動かして、受信機が持っている「正解の波形（青）」をスライドさせてください。<br/>
        空中から飛んできた波（黒）の中に隠れている波形とピタリと重なる場所を探します。
      </p>
      
      <input 
        type="range" min="0" max={totalLength - preambleLength} 
        value={offset} onChange={(e) => setOffset(Number(e.target.value))} 
        className="w-full accent-blue-600 cursor-pointer mb-8" 
      />
      
      <div className="overflow-x-auto bg-gray-50 border-2 border-gray-300 relative">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block min-w-[600px]" role="img" aria-label="スライディング相関によるプリアンブル検出の波形グラフ">
          <title>スライディング相関によるプリアンブル波形の一致グラフ</title>
          {/* オフセットの背景ハイライト */}
          <rect x={offset * dx} y={0} width={preambleLength * dx} height={height} fill="rgba(37, 99, 235, 0.1)" />
          
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4 4" />
          
          {/* 受信波形（黒） */}
          <path d={rxPath} fill="none" stroke="black" strokeWidth="2" />
          
          {/* 基準波形（青） */}
          <path d={refPath} fill="none" stroke="#2563eb" strokeWidth="3" opacity="0.8" />
        </svg>
      </div>

      <div className="mt-8 bg-gray-100 p-6 border-2 border-black">
        <div className="flex justify-between items-end mb-2">
          <p className="font-black text-lg">相関値（波形の一致度）</p>
          <p className="font-bold text-gray-600">{(normalizedCorr * 100).toFixed(1)} %</p>
        </div>
        
        {/* バーグラフ */}
        <div className="h-10 bg-white border-2 border-black relative w-full overflow-hidden">
           <div 
            className={`h-full transition-all duration-75 ${isPeak ? 'bg-red-500' : 'bg-blue-600'}`} 
            style={{ width: `${normalizedCorr * 100}%` }}
           ></div>
           
           {/* ピークのしきい値線 */}
           <div className="absolute top-0 bottom-0 left-[80%] border-l-2 border-red-500 border-dashed"></div>
        </div>
        
        <div className="h-8 mt-4">
          {isPeak ? (
            <p className="text-red-600 font-black text-xl animate-pulse">🔥 ピーク検出！ここからシンボルの受信を開始します！</p>
          ) : (
            <p className="text-gray-500 font-bold">まだ波が見つかりません（ノイズか別の波です）</p>
          )}
        </div>
      </div>
    </div>
  );
};


export default function App() {
  const [f1, setF1] = useState(1);
  const [f2, setF2] = useState(2);
  const [txA1, setTxA1] = useState(1.0);
  const [txA2, setTxA2] = useState(0.5);
  const [rxFreq, setRxFreq] = useState(1);

  const [demoA, setDemoA] = useState(1.0);
  const [demoTheta, setDemoTheta] = useState(45);
  const demoI = demoA * Math.cos(demoTheta * Math.PI / 180);
  const demoQ = demoA * Math.sin(demoTheta * Math.PI / 180);

  const [qpsk1I, setQpsk1I] = useState(1);
  const [qpsk1Q, setQpsk1Q] = useState(1);
  const [qpsk2I, setQpsk2I] = useState(-1);
  const [qpsk2Q, setQpsk2Q] = useState(1);
  const [rxQpskFreq, setRxQpskFreq] = useState(1);
  const [rxQpskComp, setRxQpskComp] = useState('I');

  const [qamI, setQamI] = useState(3);
  const [qamQ, setQamQ] = useState(1);
  const [rxQamComp, setRxQamComp] = useState('I');

  const [sym1Phase, setSym1Phase] = useState(0);
  const [sym2Phase, setSym2Phase] = useState(180);

  const [syncError, setSyncError] = useState(0);

  const DataToggle = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-100 p-3 gap-3">
      <span className="font-bold">{label}</span>
      <div className="flex w-full sm:w-auto gap-1">
        <button onClick={() => onChange(1)} className={`flex-1 sm:flex-none px-6 py-2 font-bold transition-colors ${value === 1 ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}>+1</button>
        <button onClick={() => onChange(-1)} className={`flex-1 sm:flex-none px-6 py-2 font-bold transition-colors ${value === -1 ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}>-1</button>
      </div>
    </div>
  );

  const QamToggle = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => {
    const levels = [-3, -1, 1, 3];
    return (
      <div className="flex flex-col bg-gray-100 p-3 gap-3">
        <span className="font-bold">{label} (現在: {value > 0 ? `+${value}` : value})</span>
        <div className="flex w-full gap-1">
          {levels.map((lvl) => (
            <button key={lvl} onClick={() => onChange(lvl)} className={`flex-1 py-3 font-bold transition-colors ${value === lvl ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}>
              {lvl > 0 ? `+${lvl}` : lvl}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-0">
      <header className="bg-black text-white p-8 md:p-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-tight">OFDMの原理</h1>
        </div>
      </header>

      <main className="space-y-0">
        
        {/* Section 1〜4 省略せずそのまま */}
        <section className="bg-gray-100 pt-12 pb-20 border-b-4 border-gray-300">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-black mb-8 bg-black text-white inline-block px-5 py-2">
              1. 「直交する」周波数の電波とは？
            </h2>
            <p className="mb-6 leading-relaxed font-bold text-lg">
              数学や通信の世界において、波が「直交している」とは、ある一定の期間において、<br className="hidden md:block"/>
              「2つの波を掛け合わせて積分（面積を足し合わせ）すると、結果が完全にゼロになる」ことを意味します。
            </p>
            <MathEquation math="\int_{0}^{T} \sin(2\pi f_1 t) \times \sin(2\pi f_2 t) \, dt = 0 \quad (f_1 \neq f_2)" />
            <p className="mb-8 p-4 bg-white font-bold border-l-8 border-gray-400">
              以下のグラフで確認しましょう。周波数が異なる波を掛け合わせた波形は、<span className="text-blue-600">中心線より上の面積（青）</span>と<span className="text-red-600">下の面積（赤）</span>がピッタリ同じになり、合計するとゼロになります。
            </p>

            <div className="flex flex-col md:flex-row gap-6 mb-10 p-6 bg-white">
              <div className="flex-1">
                <label className="block font-bold mb-3">波1の周波数: {f1} Hz</label>
                <input type="range" min="1" max="5" value={f1} onChange={(e) => setF1(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
              </div>
              <div className="flex-1">
                <label className="block font-bold mb-3">波2の周波数: {f2} Hz</label>
                <input type="range" min="1" max="5" value={f2} onChange={(e) => setF2(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
              </div>
            </div>

            <WaveGraph title={`波1: sin(2π × ${f1}t)`} fn={(t) => Math.sin(2 * Math.PI * f1 * t)} />
            <WaveGraph title={`波2: sin(2π × ${f2}t)`} fn={(t) => Math.sin(2 * Math.PI * f2 * t)} />
            <div className="mt-12">
              <WaveGraph title={`波1 × 波2 (掛け合わせた波形)`} fn={(t) => Math.sin(2 * Math.PI * f1 * t) * Math.sin(2 * Math.PI * f2 * t)} fillArea={true} height={200} scale={0.8} />
            </div>
          </div>
        </section>

        <section className="bg-blue-50 pt-12 pb-20 border-b-4 border-blue-200">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-black mb-8 bg-black text-white inline-block px-5 py-2">
              2. なぜ受信機で分解できるのか？
            </h2>
            <p className="mb-6 leading-relaxed text-lg">
              OFDMの送信機は、直交する複数の周波数の波<strong>それぞれに別々のデータ（ここでは波の「振幅の大きさ」として表現）を乗せて</strong>、全て<strong>足し合わせて（合成して）</strong>飛ばします。<br/>
              受信機にはぐちゃぐちゃに混ざった波 \( S(t) \) が届きますが、ここから特定の周波数の情報を取り出すには、<strong>受信した波に、取り出したい周波数の波を掛け算して積分</strong>します。
            </p>

            <Accordion title="詳しく見る：なぜ分解できる？ 数式での証明">
              <p className="mb-4 leading-relaxed font-bold">【数式での証明】</p>
              <MathEquation math="\text{受信処理: } \int_{0}^{T} \{ A_1 \sin(2\pi f_1 t) + A_2 \sin(2\pi f_2 t) \} \times \sin(2\pi f_1 t) \, dt" />
              <MathEquation math="= A_1 \int_{0}^{T} \sin^2(2\pi f_1 t) dt + A_2 \underbrace{\int_{0}^{T} \sin(2\pi f_2 t) \sin(2\pi f_1 t) dt}_{\text{直交しているので } 0}" />
              <MathEquation math="= A_1 \times \frac{T}{2} + 0" />
              <div className="p-6 bg-gray-100 font-bold mb-6">
                結論：自分自身以外の周波数は掛け合わせて積分すると「0」になって消えるため、積分値として「元の振幅の半分（\(A_1 / 2\)）」だけが残ります。これを2倍すれば、元の振幅を完璧に逆算できます。
              </div>
            </Accordion>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 mt-10">
              <div className="p-6 md:p-8 bg-white">
                <h4 className="font-bold mb-6 bg-black text-white px-3 py-1 inline-block">送信機（混ぜる）</h4>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">1Hzの振幅 \(A_1\): {txA1.toFixed(1)}</label>
                    <input type="range" min="-1" max="1" step="0.1" value={txA1} onChange={(e) => setTxA1(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">2Hzの振幅 \(A_2\): {txA2.toFixed(1)}</label>
                    <input type="range" min="-1" max="1" step="0.1" value={txA2} onChange={(e) => setTxA2(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-white">
                <h4 className="font-bold mb-6 bg-black text-white px-3 py-1 inline-block">受信機（抽出する）</h4>
                <div>
                  <label className="block font-bold mb-4">調べたい周波数を選択:</label>
                  <div className="flex w-full gap-2">
                    {[1, 2].map(freq => (
                      <button key={freq} onClick={() => setRxFreq(freq)} className={`flex-1 py-4 font-bold transition-colors ${rxFreq === freq ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}>
                        {freq} Hz
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <WaveGraph title="空中を飛ぶ混ざった波 S(t)" fn={(t) => txA1 * Math.sin(2 * Math.PI * 1 * t) + txA2 * Math.sin(2 * Math.PI * 2 * t)} />
            {(() => {
              const rxWave = (t: number) => (txA1 * Math.sin(2 * Math.PI * 1 * t) + txA2 * Math.sin(2 * Math.PI * 2 * t)) * Math.sin(2 * Math.PI * rxFreq * t);
              let rxIntegral = 0;
              for(let i=0; i<300; i++) rxIntegral += rxWave(i/300) / 300;
              const restoredAmp = rxIntegral * 2; 

              return (
                <div className="mt-12">
                  <p className="font-bold mb-4 bg-black text-white inline-block px-4 py-2">
                    受信機での処理：受信した波全体に sin(2π × {rxFreq}t) を掛けて積分
                  </p>
                  <WaveGraph title="掛け合わせた後の波形（この面積の合計を計算します）" fn={rxWave} fillArea={true} height={200} />
                  <div className="mt-8 p-8 md:p-10 bg-yellow-100 flex flex-col items-center">
                    <p className="text-xl md:text-2xl mb-8 text-center border-b-2 border-yellow-300 pb-4 w-full font-bold">
                      面積の合計(積分値) = {rxIntegral.toFixed(2)}
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 text-xl w-full justify-center">
                      <div className="text-center">
                        <span className="text-sm block mb-2 text-gray-700 font-bold">積分値を2倍して元に戻す</span>
                        復元した振幅: <span className="bg-white px-4 py-2 font-black">{restoredAmp.toFixed(1)}</span>
                      </div>
                      <span className="hidden md:block text-3xl font-black">＝</span>
                      <span className="block md:hidden text-xl font-bold">ピタリと一致！</span>
                      <div className="text-center">
                        <span className="text-sm block mb-2 text-gray-700 font-bold">送信機で設定した値 ({rxFreq}Hz)</span>
                        送信した振幅: <span className="bg-black text-white px-4 py-2 font-black">{(rxFreq === 1 ? txA1 : txA2).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        <section className="bg-green-50 pt-12 pb-20 border-b-4 border-green-200">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-black mb-8 bg-black text-white inline-block px-5 py-2">
              3. デジタルデータ(QPSK)を乗せても分解できる理由
            </h2>
            <p className="mb-8 leading-relaxed text-lg">
              実際のOFDMでは、1つの周波数に対して<strong>「I成分（\(\cos\)波）」と「Q成分（\(\sin\)波）」の2つの波をワンセット</strong>として使います。<br/>
              この2つは同じ周波数ですが、タイミングがピッタリ90度ズレており、<strong>同じ周波数であっても互いに直交する</strong>性質を持っています。
            </p>

            <Accordion title="詳しく知りたい方へ：位相と振幅を I/Q に分解する仕組み">
              <p className="mb-6 leading-relaxed font-bold text-lg">🤔 なぜ2つの波を組み合わせるの？ 👉 「位相」をコントロールするため！</p>
              <p className="mb-4 leading-relaxed">
                「送りたい波の振幅（\(A\)）」と「送りたい位相（ズレの角度 \(\theta\)）」が決まっているとき、I成分とQ成分は<strong>三角関数の基本</strong>を使って分解できます。
              </p>
              <MathEquation math="I = A \cos(\theta) \quad , \quad Q = A \sin(\theta)" />
              <div className="p-6 bg-green-100 font-bold mb-10 text-lg">
                つまり、<strong>IとQの振幅を計算して割り当てることは、空を飛ぶ電波の「振幅（A）」と「位相（θ）」の両方を自在にコントロールすることと全く同じ</strong>なのです。
              </div>

              <h3 className="text-2xl font-black mb-6 bg-black text-white inline-block px-4 py-1">体験デモ：振幅・位相と I/Q の関係</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="p-6 md:p-8 bg-white flex flex-col justify-center">
                  <h4 className="font-bold mb-8 bg-black text-white px-3 py-1 inline-block self-start">送りたい波の情報を設定</h4>
                  <div className="mb-8">
                    <label className="block font-bold mb-3">振幅 \(A\): {demoA.toFixed(2)}</label>
                    <input type="range" min="0" max="1.5" step="0.1" value={demoA} onChange={(e) => setDemoA(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                  </div>
                  <div>
                    <label className="block font-bold mb-3">位相 \(\theta\): {demoTheta}° (度のズレ)</label>
                    <input type="range" min="0" max="360" step="15" value={demoTheta} onChange={(e) => setDemoTheta(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                  </div>
                </div>
                <IQGraph i={demoI} q={demoQ} a={demoA} thetaDeg={demoTheta} />
              </div>
              <WaveGraph title={`合成波: ${demoI.toFixed(2)}cos(2πt) + ${demoQ.toFixed(2)}sin(2πt)`} fn={(t) => demoI * Math.cos(2 * Math.PI * 1 * t) + demoQ * Math.sin(2 * Math.PI * 1 * t)} referenceFn={(t) => Math.cos(2 * Math.PI * 1 * t)} scale={0.5} />
            </Accordion>

            <p className="mb-8 leading-relaxed mt-12 text-lg">
              QPSK変調では I と Q に (+1, -1) などを割り当てて、4方向の位相を作り出し、一度に2ビットの情報を送ります。<br/>
              受信機では、届いた波に \(\cos\) を掛けて積分すれば「I成分」だけが、\(\sin\) を掛けて積分すれば「Q成分」だけが綺麗に取り出せます。
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              <div className="p-6 md:p-8 bg-white">
                <h4 className="font-bold mb-6 bg-black text-white px-3 py-1 inline-block">送信機（データ割り当て）</h4>
                <div className="mb-8">
                  <p className="font-bold mb-4 pb-2 border-b-2 border-gray-200">サブキャリア 1 (1Hz)</p>
                  <div className="space-y-4">
                    <DataToggle label="I成分 (cos)" value={qpsk1I} onChange={setQpsk1I} />
                    <DataToggle label="Q成分 (sin)" value={qpsk1Q} onChange={setQpsk1Q} />
                  </div>
                </div>
                <div>
                  <p className="font-bold mb-4 pb-2 border-b-2 border-gray-200">サブキャリア 2 (2Hz)</p>
                  <div className="space-y-4">
                    <DataToggle label="I成分 (cos)" value={qpsk2I} onChange={setQpsk2I} />
                    <DataToggle label="Q成分 (sin)" value={qpsk2Q} onChange={setQpsk2Q} />
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 bg-white flex flex-col">
                <h4 className="font-bold mb-6 bg-black text-white px-3 py-1 inline-block self-start">受信機（復調）</h4>
                <div className="mb-8">
                  <label className="block font-bold mb-4">調べる周波数:</label>
                  <div className="flex w-full gap-2">
                    {[1, 2].map(freq => (
                      <button key={freq} onClick={() => setRxQpskFreq(freq)} className={`flex-1 py-4 font-bold transition-colors ${rxQpskFreq === freq ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}>
                        {freq} Hz
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-bold mb-4">取り出す成分:</label>
                  <div className="flex flex-col sm:flex-row w-full gap-2">
                    <button onClick={() => setRxQpskComp('I')} className={`flex-1 py-4 font-bold transition-colors ${rxQpskComp === 'I' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}>
                      I成分 (cosを掛ける)
                    </button>
                    <button onClick={() => setRxQpskComp('Q')} className={`flex-1 py-4 font-bold transition-colors ${rxQpskComp === 'Q' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}>
                      Q成分 (sinを掛ける)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {(() => {
              const qpskWave = (t: number) => {
                const sc1 = qpsk1I * Math.cos(2 * Math.PI * 1 * t) + qpsk1Q * Math.sin(2 * Math.PI * 1 * t);
                const sc2 = qpsk2I * Math.cos(2 * Math.PI * 2 * t) + qpsk2Q * Math.sin(2 * Math.PI * 2 * t);
                return sc1 + sc2;
              };

              const rxWave = (t: number) => {
                const s = qpskWave(t);
                if (rxQpskComp === 'I') return s * Math.cos(2 * Math.PI * rxQpskFreq * t);
                return s * Math.sin(2 * Math.PI * rxQpskFreq * t);
              };

              let rxIntegral = 0;
              for(let i=0; i<300; i++) rxIntegral += rxWave(i/300) / 300;
              const extractedData = rxIntegral > 0.2 ? '+1' : (rxIntegral < -0.2 ? '-1' : 'エラー');

              return (
                <>
                  <WaveGraph title="空中を飛ぶ波 (4つの波が混ざった状態)" fn={qpskWave} scale={0.3} />
                  <div className="mt-12">
                    <WaveGraph title="受信機で掛け合わせた後の波形（面積の合計がデータになります）" fn={rxWave} fillArea={true} height={200} scale={0.4} />
                    <div className={`mt-6 p-6 md:p-8 font-bold flex flex-col md:flex-row items-center justify-between ${extractedData === '+1' ? 'bg-blue-100' : 'bg-red-100'}`}>
                      <div className="text-xl">面積の合計 : {rxIntegral.toFixed(2)}</div>
                      <div className="text-2xl mt-4 md:mt-0">判定結果 👉 <span className="bg-black text-white px-5 py-2 ml-2">データ {extractedData}</span></div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </section>

        <section className="bg-purple-50 pt-12 pb-20 border-b-4 border-purple-200">
          <div className="max-w-5xl mx-auto px-4">
            <Accordion title="4. 【発展】16QAM等、振幅が大きく変わっても大丈夫？" defaultOpen={false}>
              <p className="mb-6 leading-relaxed font-bold text-lg">
                16QAMは、I成分とQ成分のそれぞれに「4段階の振幅レベル（例えば -3, -1, +1, +3）」を持たせることで、1つの波に一度に4ビットの情報を乗せる通信方式です。<br/>
                振幅がバラバラになっても、OFDMの直交性は機能するのでしょうか？
              </p>
              <p className="mb-8 leading-relaxed">
                答えは<strong>「全く問題なく機能する」</strong>です。<br/>
                掛け合わせて積分した結果の「面積の大きさ」が、送信した振幅のレベルに比例して大きくなったり小さくなったりするだけだからです。受信機は、抽出して計算した「面積の大きさ」が、どのしきい値に近いかを見て元データを判定します。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="p-6 md:p-8 bg-white">
                  <h4 className="font-bold mb-6 bg-black text-white px-3 py-1 inline-block">送信機（1Hz 16QAM）</h4>
                  <div className="space-y-6">
                    <QamToggle label="I成分 (cos) の振幅" value={qamI} onChange={setQamI} />
                    <QamToggle label="Q成分 (sin) の振幅" value={qamQ} onChange={setQamQ} />
                  </div>
                </div>

                <div className="p-6 md:p-8 bg-white">
                  <h4 className="font-bold mb-6 bg-black text-white px-3 py-1 inline-block">受信機（成分の抽出）</h4>
                  <div className="flex flex-col sm:flex-row w-full gap-2 mb-8">
                    <button onClick={() => setRxQamComp('I')} className={`flex-1 py-4 font-bold transition-colors ${rxQamComp === 'I' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}>I成分 (cos)</button>
                    <button onClick={() => setRxQamComp('Q')} className={`flex-1 py-4 font-bold transition-colors ${rxQamComp === 'Q' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`}>Q成分 (sin)</button>
                  </div>
                  <div className="bg-gray-100 p-6 font-bold">
                    <p className="mb-4 pb-2 border-b-2 border-gray-300">受信機の判定基準</p>
                    <ul className="space-y-3 text-sm">
                      <li className="flex justify-between"><span>面積 &gt; 1.0</span> <span className="bg-black text-white px-3 py-1">+3 と判定</span></li>
                      <li className="flex justify-between"><span>0.0 &lt; 面積 &lt; 1.0</span> <span className="bg-black text-white px-3 py-1">+1 と判定</span></li>
                      <li className="flex justify-between"><span>-1.0 &lt; 面積 &lt; 0.0</span> <span className="bg-black text-white px-3 py-1">-1 と判定</span></li>
                      <li className="flex justify-between"><span>面積 &lt; -1.0</span> <span className="bg-black text-white px-3 py-1">-3 と判定</span></li>
                    </ul>
                  </div>
                </div>
              </div>

              {(() => {
                const qamWave = (t: number) => qamI * Math.cos(2 * Math.PI * 1 * t) + qamQ * Math.sin(2 * Math.PI * 1 * t);
                const rxWave = (t: number) => {
                  const s = qamWave(t);
                  return rxQamComp === 'I' ? s * Math.cos(2 * Math.PI * 1 * t) : s * Math.sin(2 * Math.PI * 1 * t);
                };

                let rxIntegral = 0;
                for(let i=0; i<300; i++) rxIntegral += rxWave(i/300) / 300;
                let detected = 'エラー';
                if (rxIntegral > 1.0) detected = '+3';
                else if (rxIntegral > 0.0) detected = '+1';
                else if (rxIntegral > -1.0) detected = '-1';
                else detected = '-3';

                return (
                  <>
                    <WaveGraph title="16QAM変調波 (IとQの振幅が合成された波)" fn={qamWave} scale={0.15} />
                    <div className="mt-12">
                      <WaveGraph title="掛け合わせて積分する波形（振幅が大きいほど面積も大きくなる）" fn={rxWave} fillArea={true} height={200} scale={0.15} />
                      <div className="mt-6 p-6 md:p-8 bg-purple-100 font-bold flex flex-col md:flex-row items-center justify-between">
                        <div className="text-xl">面積の合計 : <span className="text-3xl ml-4 font-black">{rxIntegral.toFixed(2)}</span></div>
                        <div className="text-2xl mt-6 md:mt-0">判定結果 👉 <span className="bg-black text-white px-6 py-3 ml-3">振幅は {detected}</span></div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </Accordion>
          </div>
        </section>

        <section className="bg-orange-50 pt-12 pb-20 border-b-4 border-orange-200">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-black mb-8 bg-black text-white inline-block px-5 py-2">
              5. 連続するシンボルと「不連続性」の問題
            </h2>
            
            <p className="mb-6 leading-relaxed text-lg">
              ここまでは「1つのシンボル（期間 \(T\) の波）」について見てきました。しかし実際の通信では、このシンボルが何個も連続して送られてきます。<br/>
              シンボルごとに送るデータ（位相）が変わるため、<strong>シンボルとシンボルのつなぎ目では、波形がガクッと途切れて「不連続」になります。</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="p-6 md:p-8 bg-white">
                <h4 className="font-bold mb-4 bg-black text-white px-3 py-1 inline-block">シンボル 1 のデータ</h4>
                <div>
                  <label className="block font-bold mb-3">送信する位相: {sym1Phase}°</label>
                  <input type="range" min="0" max="315" step="45" value={sym1Phase} onChange={(e) => setSym1Phase(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                </div>
              </div>
              <div className="p-6 md:p-8 bg-white">
                <h4 className="font-bold mb-4 bg-black text-white px-3 py-1 inline-block">シンボル 2 のデータ</h4>
                <div>
                  <label className="block font-bold mb-3">送信する位相: {sym2Phase}°</label>
                  <input type="range" min="0" max="315" step="45" value={sym2Phase} onChange={(e) => setSym2Phase(Number(e.target.value))} className="w-full accent-black cursor-pointer" />
                </div>
              </div>
            </div>

            <MultiSymbolWaveGraph 
              title="連続して送信される波（赤い点線が不連続点）" 
              fn1={(t) => Math.cos(2 * Math.PI * 1 * t - (sym1Phase * Math.PI / 180))}
              fn2={(t) => Math.cos(2 * Math.PI * 1 * t - (sym2Phase * Math.PI / 180))}
            />

            <Accordion title="この不連続性を解決する「ガードインターバル (GI)」とは？">
              <div className="p-6 bg-red-100 font-bold mb-8">
                🚨 現実の世界では、ビルなどに反射して少し遅れて届く電波（マルチパス）があります。<br/>
                遅れて届いた波と元の波が混ざると、この「不連続な部分」が次のシンボルに食い込んでしまい、直交性が崩れてデータが壊れてしまいます。
              </div>

              <p className="mb-6 leading-relaxed">
                この干渉を防ぐため、OFDMでは各シンボルの<strong>「後ろの方の一部」をコピーして、シンボルの「先頭」にくっつける（ガードインターバル）</strong>という処理を行います。
              </p>

              <MultiSymbolWaveGraph 
                title="ガードインターバルを付加した波形" 
                fn1={(t) => Math.cos(2 * Math.PI * 1 * t - (sym1Phase * Math.PI / 180))}
                fn2={(t) => Math.cos(2 * Math.PI * 1 * t - (sym2Phase * Math.PI / 180))}
                showGI={true}
              />

              <div className="p-6 bg-orange-100 font-bold mt-8">
                💡 単なる空白ではなく「自分自身の波のコピー」をくっつけることで、波が遅れてズレても受信機から見れば「ただ位相が回っただけの連続した美しい波」に見え、直交性が全く崩れないという天才的な仕組みです。
              </div>
            </Accordion>
          </div>
        </section>

        <section className="bg-red-50 pt-12 pb-20 border-b-4 border-red-200">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-black mb-8 bg-black text-white inline-block px-5 py-2">
              6. 【最重要】「同期」がズレるとどうなる？（パイロット信号）
            </h2>
            
            <p className="mb-6 leading-relaxed text-lg font-bold">
              QAMやQPSKにおいて絶対に必要な大前提があります。<br/>
              それは、<span className="text-red-600 bg-red-100 px-2">「送信機と受信機で、波の基準となる位相やタイミングが完璧に同期していること」</span>です。
            </p>

            <p className="mb-8 leading-relaxed">
              受信機の時計がほんの少し狂っていたり、電波が飛んでくる間に波の位相がねじれたりすると、<strong>受信機が計算したIQ平面上の「点」が回転してしまいます。</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="p-6 md:p-8 bg-white flex flex-col justify-center">
                <h4 className="font-bold mb-6 bg-black text-white px-3 py-1 inline-block self-start">受信機の状態</h4>
                <div className="mb-8">
                  <label className="block font-bold mb-3">位相同期の誤差: <span className="text-xl text-red-600">{syncError}°</span></label>
                  <input type="range" min="-90" max="90" step="5" value={syncError} onChange={(e) => setSyncError(Number(e.target.value))} className="w-full accent-red-600 cursor-pointer" />
                </div>
                <div className="p-4 bg-gray-100 font-bold text-sm leading-relaxed">
                  ※現実の通信環境では、端末の移動（ドップラー効果）や発振器のわずかな誤差によって、この「位相の回転」が常に発生しています。
                </div>
              </div>

              <ConstellationGraph phaseErrorDeg={syncError} />
            </div>

            <h3 className="text-xl md:text-2xl font-black mb-6 border-b-2 border-black pb-2">解決策：パイロット信号（目印）による補正</h3>
            <p className="mb-6 leading-relaxed text-lg">
              常に「完全な同期」を維持するのは不可能です。そこでOFDMでは、データを送るサブキャリアの中に所々<strong>「パイロット信号」</strong>という特別な電波を混ぜて送信します。<br/>
              あらかじめ答えが決まっているパイロット信号を受信し、「本来あるべき位置から何度回転しているか」を測定することで、受信した全てのデータを「逆回転」させて元の正しい位置に戻します（等化処理）。
            </p>
          </div>
        </section>

        {/* Section 7: スライディング相関とプリアンブル (新規追加) */}
        <section className="bg-yellow-50 pt-12 pb-24">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-black mb-8 bg-black text-white inline-block px-5 py-2">
              7. 【深掘り】最初の「同期」はどうやって合わせているの？
            </h2>
            
            <div className="p-6 bg-yellow-100 font-bold mb-8 border-l-8 border-yellow-500 text-lg">
              🤔 PTP（Precision Time Protocol）などのネットワークの時刻同期を使っているの？<br/>
              <span className="font-normal block mt-4 text-base">
                いいえ、違います。PTPはパケットをやり取りして「何時何分何秒」というシステムの時計を合わせる技術です。<br/><br/>
                OFDMの電波を受信するときに必要なのは<strong>「この数十マイクロ秒の波（シンボル）が、空間のどこからスタートしているか」</strong>をナノ秒単位で捉える「物理的な波のタイミング同期」です。パケットベースのPTPでは到底間に合いません。
              </span>
            </div>

            <p className="mb-6 leading-relaxed text-lg">
              Wi-FiやLTE/5GなどのOFDM通信では、データ本体を送る前に<strong>「プリアンブル（同期信号）」</strong>と呼ばれる、あらかじめ形が決められた特殊なパターンの波を送信します。
            </p>

            <p className="mb-10 leading-relaxed text-lg font-bold">
              受信機は、アンテナから入ってくる電波に対して、自分が記憶している「プリアンブルの正解の形」を少しずつスライドさせながら掛け算（相関計算）をし続けます。<br/>
              波の形がピタリと一致した瞬間、計算結果（相関値）がドカンと跳ね上がります。ここが<strong>「シンボルの始まりだ！」と物理的に気づく仕組み（スライディング相関）</strong>になっています。
            </p>

            <SlidingCorrelationDemo />

          </div>
        </section>

      </main>
      
      <footer className="bg-black text-white p-8 text-center font-bold text-sm md:text-base">
        OFDM Principle Simulator - Built with React & Tailwind CSS
      </footer>
    </div>
  );
}